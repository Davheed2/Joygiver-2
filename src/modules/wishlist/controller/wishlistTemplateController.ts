import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { curatedItemRepository, wishlistTemplateItemRepository, wishlistTemplateRepository } from '../repository';
import { IWishlistTemplateItem } from '@/common/interfaces';
import { knexDb } from '@/common/config';

export class WishlistTemplateController {
	createWishlistTemplate = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { name, emoji, colorTheme, items } = req.body;

		if (!user) {
			throw new AppError('Please log in to create a wishlist template', 401);
		}
		if (user.role !== 'admin') {
			throw new AppError('Only admins can create wishlist templates', 403);
		}
		if (!name) {
			throw new AppError('Name is required', 400);
		}
		if (!emoji) {
			throw new AppError('Emoji is required', 400);
		}
		if (!colorTheme) {
			throw new AppError('Color theme is required', 400);
		}
		if (items && (!Array.isArray(items) || items.length === 0)) {
			throw new AppError('Items must be a non-empty array', 400);
		}
		if (items) {
			for (const item of items) {
				if (!item.curatedItemId) {
					throw new AppError('Each item must have curatedItemId', 400);
				}
			}
		}

		if (items && items.length > 0) {
			const curatedItemIds = items
				.filter((item: IWishlistTemplateItem) => item.curatedItemId)
				.map((item: IWishlistTemplateItem) => item.curatedItemId as string);

			const fetchedItems = await curatedItemRepository.findByIds(curatedItemIds);
			const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.id, item]));

			for (const item of items) {
				if (item.curatedItemId && !fetchedItemsMap.has(item.curatedItemId)) {
					throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 404);
				}
			}
		}

		const result = await knexDb.transaction(async () => {
			const [wishlistTemplate] = await wishlistTemplateRepository.create({
				userId: user.id,
				name,
				emoji,
				colorTheme,
			});
			if (!wishlistTemplate) {
				throw new AppError('Failed to create wishlist template', 500);
			}

			let createdItems: IWishlistTemplateItem[] = [];
			if (items && items.length > 0) {
				const curatedItemIds = items
					.filter((item: IWishlistTemplateItem) => item.curatedItemId)
					.map((item: IWishlistTemplateItem) => item.curatedItemId as string);
				const fetchedItems = await curatedItemRepository.findByIds(curatedItemIds);
				const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.id, item]));

				const wishlistItems = items.map((item: { curatedItemId: string }, index: number) => {
					const curated = fetchedItemsMap.get(item.curatedItemId);
					if (!curated) {
						throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 404);
					}

					return {
						wishlistTemplateId: wishlistTemplate.id,
						curatedItemId: curated.id,
						name: curated.name,
						imageUrl: curated.imageUrl,
						price: curated.price,
						categoryId: curated.categoryId,
						priority: index + 1,
					};
				});

				createdItems = await wishlistTemplateItemRepository.createMany(wishlistItems);
			}

			return { wishlistTemplate, items: createdItems };
		});

		return AppResponse(
			res,
			201,
			toJSON([result.wishlistTemplate, ...result.items]),
			items && items.length > 0
				? 'Wishlist template created successfully with items'
				: 'Wishlist template created successfully. Add items to continue.'
		);
	});

	getWishlistTemplates = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please login to view your wishlist templates', 404);
		}

		const wishlistTemplates = await wishlistTemplateRepository.findAll();
		if (!wishlistTemplates) {
			throw new AppError('No wishlist templates found for this user', 404);
		}

		// i need to get items for all wishlist templates, so i will get all items where wishlistTemplateId in wishlistTemplates ids
		const wishlistTemplateIds = wishlistTemplates.map((template) => template.id);
		const items = await wishlistTemplateItemRepository.findBywishlistTemplateIds(wishlistTemplateIds);
		if (!items) {
			throw new AppError('No items found in these wishlist templates', 404);
		}

		// i need to map items to their respective wishlist templates
		const itemsMap = new Map<string, IWishlistTemplateItem[]>();
		items.forEach((item) => {
			if (!itemsMap.has(item.wishlistTemplateId)) {
				itemsMap.set(item.wishlistTemplateId, []);
			}
			itemsMap.get(item.wishlistTemplateId)!.push(item);
		});

		const wishlistTemplatesWithItems = wishlistTemplates.map((template) => ({
			wishlistTemplate: template,
			items: itemsMap.get(template.id) || [],
		}));

		return AppResponse(res, 200, toJSON(wishlistTemplatesWithItems), 'Wishlist templates fetched successfully');
	});
}

export const wishlistTemplateController = new WishlistTemplateController();
