import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { curatedItemRepository, wishlistTemplateItemRepository, wishlistTemplateRepository } from '../repository';
import { IWishlistTemplateItem } from '@/common/interfaces';

export class WishlistTemplateItemController {
	addItemsToWishlistTemplate = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { items, wishlistTemplateId } = req.body;

		if (!user) {
			throw new AppError('Please log in to add items to a wishlist', 401);
		}
		if (!wishlistTemplateId) {
			throw new AppError('Wishlist Template ID is required', 400);
		}
		if (!items || !Array.isArray(items) || items.length === 0) {
			throw new AppError('Items array is required', 400);
		}

		const wishlistTemplate = await wishlistTemplateRepository.findById(wishlistTemplateId);
		if (!wishlistTemplate) {
			throw new AppError('Wishlist Template not found', 404);
		}

		for (const item of items) {
			if (!item.curatedItemId) {
				throw new AppError('Each item must have a curatedItemId', 400);
			}
		}

		const fetchedItems = await curatedItemRepository.findByIds(
			items
				.filter((item: IWishlistTemplateItem) => item.curatedItemId)
				.map((item: IWishlistTemplateItem) => item.curatedItemId as string)
		);
		const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.id, item]));
		for (const item of items) {
			if (item.curatedItemId && !fetchedItemsMap.has(item.curatedItemId)) {
				throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 400);
			}
		}

		const wishlistItems: Partial<IWishlistTemplateItem>[] = [];
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const curated = fetchedItemsMap.get(item.curatedItemId);
			if (!curated) {
				throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 400);
			}
			const existingItem = await wishlistTemplateItemRepository
				.findByWishlistTemplateId(wishlistTemplate.id)
				.then((items) => items.find((i) => i.curatedItemId === item.curatedItemId));
			if (existingItem) {
				throw new AppError(`${curated.name} already exists in the wishlist template`, 400);
			}

			wishlistItems.push({
				wishlistTemplateId: wishlistTemplate.id,
				curatedItemId: curated.id,
				name: curated.name,
				imageUrl: curated.imageUrl,
				price: curated.price,
				categoryId: curated.categoryId,
			});
		}

		const addedItems = await wishlistTemplateItemRepository.createMany(wishlistItems);
		if (!addedItems) {
			throw new AppError('Failed to add items to wishlist', 500);
		}

		return AppResponse(res, 201, toJSON(addedItems), 'Items added to wishlist successfully');
	});
}

export const wishlistTemplateItemController = new WishlistTemplateItemController();
