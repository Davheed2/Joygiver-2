import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import {
	curatedItemRepository,
	itemWithdrawalRepository,
	wishlistItemRepository,
	wishlistItemViewRepository,
	wishlistRepository,
} from '../repository';
import { IWishlistItem } from '@/common/interfaces';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { withdrawalRequestRepository } from '@/modules/wallet/repository';

export class WishlistItemController {
	addItemsToWishlist = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { items, wishlistId } = req.body;

		if (!user) {
			throw new AppError('Please log in to add items to a wishlist', 401);
		}
		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 400);
		}
		if (!items || !Array.isArray(items) || items.length === 0) {
			throw new AppError('Items array is required', 400);
		}

		const wishlist = await wishlistRepository.findById(wishlistId);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}
		if (wishlist.userId !== user.id) {
			throw new AppError('Unauthorized to modify this wishlist', 403);
		}

		for (const item of items) {
			if (!item.curatedItemId) {
				throw new AppError('Each item must have a curatedItemId', 400);
			}
		}

		const fetchedItems = await curatedItemRepository.findByIds(
			items
				.filter((item: IWishlistItem) => item.curatedItemId)
				.map((item: IWishlistItem) => item.curatedItemId as string)
		);
		const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.id, item]));
		for (const item of items) {
			if (item.curatedItemId && !fetchedItemsMap.has(item.curatedItemId)) {
				throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 400);
			}
		}

		const wishlistItems: Partial<IWishlistItem>[] = [];
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const curated = fetchedItemsMap.get(item.curatedItemId);
			if (!curated) {
				throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 400);
			}
			const existingItem = await wishlistItemRepository
				.findByWishlistId(wishlist.id)
				.then((items) => items.find((i) => i.curatedItemId === item.curatedItemId));
			if (existingItem) {
				throw new AppError(`${curated.name} already exists in the wishlist`, 400);
			}

			const uniqueId = nanoid(10);
			const uniqueLink = `https://joygiver.co/${slugify(curated.name || 'wishlist-item', {
				lower: true,
				strict: true,
			})}-${uniqueId}`;

			wishlistItems.push({
				wishlistId: wishlist.id,
				curatedItemId: curated.id,
				name: curated.name,
				imageUrl: curated.imageUrl,
				price: curated.price,
				categoryId: curated.categoryId,
				uniqueLink,
			});
		}

		const addedItems = await wishlistItemRepository.createMany(wishlistItems);
		if (!addedItems) {
			throw new AppError('Failed to add items to wishlist', 500);
		}

		return AppResponse(res, 201, toJSON(addedItems), 'Items added to wishlist successfully');
	});

	getItemByLink = catchAsync(async (req: Request, res: Response) => {
		const { uniqueLink } = req.query;

		if (!uniqueLink) {
			throw new AppError('Unique link is required', 400);
		}

		const appendLink = `https://joygiver.co/${uniqueLink}`;
		const wishlistItem = await wishlistItemRepository.findByUniqueLink(appendLink);
		if (!wishlistItem) {
			throw new AppError('Wishlist not found', 404);
		}

		await wishlistItemViewRepository.trackView(wishlistItem.id, {
			ipAddress: req.ip,
			userAgent: req.get('user-agent') || '',
			referrer: req.get('referer'),
		});

		return AppResponse(res, 200, toJSON([wishlistItem]), 'Wishlist item retrieved successfully');
	});

	/// document these 3
	getWishlistItemStats = catchAsync(async (req: Request, res: Response) => {
		const { wishlistItemId } = req.query;

		if (!wishlistItemId) {
			throw new AppError('Wishlist item ID is required', 401);
		}

		const stats = await wishlistItemRepository.getWishlistItemStats(wishlistItemId as string);

		return AppResponse(res, 200, toJSON(stats), 'Wishlist stats retrieved successfully');
	});

	withdrawFromItem = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { amount, wishlistItemId, payoutMethodId, accountNumber, bankCode } = req.body;

		if (!user) {
			throw new AppError('Please log in', 401);
		}
		if (!wishlistItemId) {
			throw new AppError('Wishlist item ID is required', 400);
		}
		if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
			throw new AppError('Amount must be a positive number', 400);
		}

		await itemWithdrawalRepository.withdrawFromItem(user.id, wishlistItemId, amount ? Number(amount) : undefined);

		const withdrawalRequst = await withdrawalRequestRepository.createWithdrawalRequest(
			user.id,
			Number(amount),
			payoutMethodId,
			accountNumber,
			bankCode
		);

		const withdrawRequest = await withdrawalRequestRepository.processWithdrawal(withdrawalRequst.id);
		console.log('Withdrawal request processed:', withdrawRequest);

		return AppResponse(res, 200, toJSON([withdrawalRequst]), 'Funds withdrawn successfully');
	});

	getItemBalance = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { wishlistItemId } = req.query;

		if (!user) {
			throw new AppError('Please log in', 401);
		}
		if (!wishlistItemId) {
			throw new AppError('Wishlist Item ID is required', 400);
		}

		const balance = await itemWithdrawalRepository.getItemBalanceSummary(wishlistItemId as string);

		return AppResponse(res, 200, toJSON([balance]), 'Item balance retrieved successfully');
	});

	// getItemWithdrawals = catchAsync(async (req: Request, res: Response) => {
	// 	const { itemId } = req.params;

	// 	const withdrawals = await itemWithdrawalService.getItemWithdrawals(itemId);

	// 	return AppResponse(res, 200, toJSON(withdrawals), 'Withdrawal history retrieved successfully');
	// });

	// getMyItemWithdrawals = catchAsync(async (req: Request, res: Response) => {
	// 	const { user } = req;
	// 	const { page = 1, limit = 20 } = req.query;

	// 	if (!user) {
	// 		throw new AppError('Please log in', 401);
	// 	}

	// 	const history = await itemWithdrawalService.getUserItemWithdrawals(
	// 		user.id,
	// 		Number(page),
	// 		Number(limit)
	// 	);

	// 	return AppResponse(res, 200, toJSON(history), 'Withdrawal history retrieved successfully');
	// });
}

export const wishlistItemController = new WishlistItemController();
