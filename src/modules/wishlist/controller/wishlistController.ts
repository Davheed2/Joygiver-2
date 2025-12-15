import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { WishlistStatus } from '@/common/constants';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { knexDb } from '@/common/config';
import {
	curatedItemRepository,
	itemWithdrawalRepository,
	wishlistItemRepository,
	wishlistRepository,
	wishlistViewRepository,
} from '../repository';
import { IWishlistItem } from '@/common/interfaces';

export class WishlistController {
	createWishlist = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { name, description, emoji, colorTheme, celebrationEvent, celebrationDate, items } = req.body;

		if (!user) {
			throw new AppError('Please log in to create a wishlist', 401);
		}

		if (!name) {
			throw new AppError('Name is required', 400);
		}
		if (!celebrationEvent || !celebrationDate) {
			throw new AppError('Celebration event and date are required', 400);
		}
		if (!description) {
			throw new AppError('Description is required', 400);
		}
		if (!emoji) {
			throw new AppError('Emoji is required', 400);
		}
		if (!colorTheme) {
			throw new AppError('Color theme is required', 400);
		}

		const celebrationDateObj = new Date(celebrationDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		if (celebrationDateObj < today) {
			throw new AppError('Celebration date cannot be in the past', 400);
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
				.filter((item: IWishlistItem) => item.curatedItemId)
				.map((item: IWishlistItem) => item.curatedItemId as string);

			const fetchedItems = await curatedItemRepository.findByIds(curatedItemIds);
			const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.id, item]));

			for (const item of items) {
				if (item.curatedItemId && !fetchedItemsMap.has(item.curatedItemId)) {
					throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 404);
				}
			}
		}

		const uniqueId = nanoid(6);
		const uniqueLink = `https://joygiver.co/${slugify(celebrationEvent, { lower: true, strict: true })}-${uniqueId}`;

		const expiresAt = new Date(celebrationDateObj);
		expiresAt.setDate(expiresAt.getDate() + 7);

		const result = await knexDb.transaction(async () => {
			const [wishlist] = await wishlistRepository.create({
				userId: user.id,
				name,
				description,
				emoji,
				colorTheme,
				celebrationEvent,
				celebrationDate: celebrationDateObj,
				uniqueLink,
				status: WishlistStatus.ACTIVE,
				expiresAt,
			});

			if (!wishlist) {
				throw new AppError('Failed to create wishlist', 500);
			}

			let createdItems: IWishlistItem[] = [];
			if (items && items.length > 0) {
				const curatedItemIds = items
					.filter((item: IWishlistItem) => item.curatedItemId)
					.map((item: IWishlistItem) => item.curatedItemId as string);

				const fetchedItems = await curatedItemRepository.findByIds(curatedItemIds);
				const fetchedItemsMap = new Map(fetchedItems.map((item) => [item.id, item]));

				const wishlistItems = items.map((item: { curatedItemId: string }) => {
					const curated = fetchedItemsMap.get(item.curatedItemId);
					if (!curated) {
						throw new AppError(`Curated item with ID ${item.curatedItemId} not found`, 404);
					}

					const uniqueId = nanoid(10);
					const uniqueLink = `https://joygiver.co/${slugify(curated.name || 'wishlist-item', {
						lower: true,
						strict: true,
					})}-${uniqueId}`;

					return {
						wishlistId: wishlist.id,
						curatedItemId: curated.id,
						name: curated.name,
						imageUrl: curated.imageUrl,
						price: curated.price,
						categoryId: curated.categoryId,
						uniqueLink,
					};
				});

				createdItems = await wishlistItemRepository.createMany(wishlistItems);
			}

			return { wishlist, items: createdItems };
		});

		return AppResponse(
			res,
			201,
			toJSON([result.wishlist]),
			items && items.length > 0
				? 'Wishlist created successfully with items'
				: 'Wishlist created successfully. Add items to continue.'
		);
	});

	getWishlistByLink = catchAsync(async (req: Request, res: Response) => {
		const { uniqueLink } = req.query;

		if (!uniqueLink) {
			throw new AppError('Unique link is required', 400);
		}

		const appendLink = `https://joygiver.co/${uniqueLink}`;
		const wishlist = await wishlistRepository.findByUniqueLink(appendLink);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}
		if (!wishlist.isPublic && wishlist.status !== WishlistStatus.ACTIVE) {
			throw new AppError('This wishlist is not available', 403);
		}

		const items = await wishlistItemRepository.findByWishlistId(wishlist.id);
		if (!items) {
			throw new AppError('No items found in this wishlist', 404);
		}

		await wishlistViewRepository.trackView(wishlist.id, {
			ipAddress: req.ip,
			userAgent: req.get('user-agent') || '',
			referrer: req.get('referer'),
		});

		return AppResponse(
			res,
			200,
			[{ wishlist: toJSON(wishlist), items: toJSON(items) }],
			'Wishlist fetched successfully'
		);
	});

	getWishlistById = catchAsync(async (req: Request, res: Response) => {
		const { wishlistId } = req.query;

		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 400);
		}

		const wishlist = await wishlistRepository.findById(wishlistId as string);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}
		if (!wishlist.isPublic && wishlist.status !== WishlistStatus.ACTIVE) {
			throw new AppError('This wishlist is not available', 403);
		}

		const items = await wishlistItemRepository.findByWishlistId(wishlist.id);
		if (!items) {
			throw new AppError('No items found in this wishlist', 404);
		}

		await wishlistViewRepository.trackView(wishlist.id, {
			ipAddress: req.ip,
			userAgent: req.get('user-agent') || '',
			referrer: req.get('referer'),
		});

		return AppResponse(
			res,
			200,
			[{ wishlist: toJSON(wishlist), items: toJSON(items) }],
			'Wishlist fetched successfully'
		);
	});

	getUserWishlist = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please login to view your wishlists', 404);
		}

		const wishlists = await wishlistRepository.findByUserId(user.id);
		if (!wishlists || wishlists.length === 0) {
			return AppResponse(res, 200, [], 'No wishlists found for this user');
		}

		const mappedData = await Promise.all(
			wishlists.map(async (wishlist) => {
				const wishlistItems = await wishlistItemRepository.findByWishlistId(wishlist.id);
				return { wishlist: toJSON(wishlist), items: toJSON(wishlistItems || []) };
			})
		);

		return AppResponse(
			res,
			200,
			mappedData,
			'Wishlists fetched successfully'
		);
	});

	

	/// document these 2
	getWishlistStats = catchAsync(async (req: Request, res: Response) => {
		const { wishlistId } = req.query;

		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 401);
		}

		const stats = await wishlistRepository.getWishlistStats(wishlistId as string);

		return AppResponse(res, 200, toJSON(stats), 'Wishlist stats retrieved successfully');
	});

	withdrawAllFromWishlist = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { wishlistId } = req.body;

		if (!user) {
			throw new AppError('Please log in', 401);
		}
		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 400);
		}

		const result = await itemWithdrawalRepository.withdrawAllFromWishlist(user.id, wishlistId);

		return AppResponse(
			res,
			200,
			toJSON([result]),
			`Withdrawn ₦${result.totalWithdrawn.toLocaleString()} from ${result.itemsWithdrawn} items`
		);
	});
}

export const wishlistController = new WishlistController();
