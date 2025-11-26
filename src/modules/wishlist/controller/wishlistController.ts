import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { Gender, WishlistStatus } from '@/common/constants';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { knexDb } from '@/common/config';
import {
	categoryRepository,
	curatedItemRepository,
	itemWithdrawalRepository,
	wishlistItemRepository,
	wishlistRepository,
	wishlistViewRepository,
} from '../repository';
import { ICategory, IWishlistItem } from '@/common/interfaces';

export class WishlistController {
	// Wishlist functions
	createWishlist = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { celebrationEvent, celebrationDate, items } = req.body;

		if (!user) {
			throw new AppError('Please log in to create a wishlist', 401);
		}
		if (!celebrationEvent || !celebrationDate) {
			throw new AppError('Celebration event and date are required', 400);
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

				const wishlistItems = items.map((item: { curatedItemId: string }, index: number) => {
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
						priority: index + 1,
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

	getUserWishlist = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('User not found', 404);
		}

		const [wishlists] = await wishlistRepository.findByUserId(user.id);
		if (!wishlists) {
			throw new AppError('No wishlists found for this user', 404);
		}

		if (!wishlists.isPublic && wishlists.status !== WishlistStatus.ACTIVE) {
			throw new AppError('This wishlist is not available', 403);
		}

		const items = await wishlistItemRepository.findByWishlistId(wishlists.id);
		if (!items) {
			throw new AppError('No items found in this wishlist', 404);
		}

		return AppResponse(
			res,
			200,
			[{ wishlist: toJSON(wishlists), items: toJSON(items) }],
			'Wishlists fetched successfully'
		);
	});

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

	seedData = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in to seed data', 401);
		}
		if (user.role !== 'admin') {
			throw new AppError('Only admins can seed data', 403);
		}

		// Define categories with relevant icons
		const categories = [
			{ name: 'Electronics', iconUrl: '🔌' },
			{ name: 'Fashion & Apparel', iconUrl: '👔' },
			{ name: 'Beauty & Personal Care', iconUrl: '💄' },
			{ name: 'Sports & Fitness', iconUrl: '⚽' },
			{ name: 'Books & Stationery', iconUrl: '📚' },
		];

		// Create categories
		const createdCategories: ICategory[] = [];
		for (const category of categories) {
			const [created] = await categoryRepository.create(category);
			createdCategories.push(created);
		}

		// Define curated items for each category and gender
		const curatedItemsData = [
			// Electronics
			{
				category: 'Electronics',
				items: [
					{
						name: 'Wireless Earbuds Pro',
						price: 89.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Smart Watch Series 5',
						price: 249.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Bluetooth Speaker',
						price: 59.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Portable Charger 20000mAh',
						price: 34.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Laptop Stand Adjustable',
						price: 45.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Rose Gold Wireless Earbuds',
						price: 79.99,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Fitness Tracker Watch',
						price: 129.99,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Portable Phone Ring Light',
						price: 24.99,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Compact Hair Straightener',
						price: 49.99,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Mini Bluetooth Keyboard',
						price: 39.99,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
				],
			},
			// Fashion & Apparel
			{
				category: 'Fashion & Apparel',
				items: [
					{
						name: 'Classic Leather Wallet',
						price: 45.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Designer Sunglasses',
						price: 120.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Casual Denim Jacket',
						price: 85.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Premium Leather Belt',
						price: 55.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Sports Sneakers',
						price: 95.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Elegant Handbag',
						price: 150.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Floral Summer Dress',
						price: 68.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Designer Scarf',
						price: 42.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'High Heel Pumps',
						price: 89.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Statement Jewelry Set',
						price: 75.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
				],
			},
			// Beauty & Personal Care
			{
				category: 'Beauty & Personal Care',
				items: [
					{
						name: 'Premium Beard Oil Kit',
						price: 28.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Electric Shaver Pro',
						price: 89.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Cologne Gift Set',
						price: 65.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Grooming Kit Deluxe',
						price: 45.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Face Moisturizer SPF',
						price: 32.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Luxury Makeup Palette',
						price: 58.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Skincare Routine Set',
						price: 95.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Hair Care Bundle',
						price: 48.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Perfume Gift Set',
						price: 78.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Nail Polish Collection',
						price: 35.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
				],
			},
			// Sports & Fitness
			{
				category: 'Sports & Fitness',
				items: [
					{
						name: 'Adjustable Dumbbell Set',
						price: 120.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Protein Shaker Bottle',
						price: 15.99,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Gym Bag with Compartments',
						price: 45.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Resistance Bands Set',
						price: 28.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Running Shoes Pro',
						price: 110.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Yoga Mat Premium',
						price: 38.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Workout Leggings',
						price: 52.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Sports Water Bottle',
						price: 22.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Fitness Resistance Loop Bands',
						price: 18.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Athletic Running Shoes',
						price: 95.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
				],
			},
			// Books & Stationery
			{
				category: 'Books & Stationery',
				items: [
					{
						name: 'Business Strategy Book',
						price: 25.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Leather Journal Notebook',
						price: 35.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Executive Pen Set',
						price: 48.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Desk Organizer Wooden',
						price: 42.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Finance & Investing Guide',
						price: 30.0,
						gender: Gender.MALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Romantic Novel Collection',
						price: 28.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Floral Bullet Journal',
						price: 22.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Calligraphy Pen Set',
						price: 38.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Planner & Organizer',
						price: 32.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
					{
						name: 'Self-Help Bestseller',
						price: 24.0,
						gender: Gender.FEMALE,
						imageUrl:
							'https://i.guim.co.uk/img/media/18badfc0b64b09f917fd14bbe47d73fd92feeb27/189_335_5080_3048/master/5080.jpg?width=1200&height=1200&quality=85&auto=format&fit=crop&s=1562112c7a64da36ae0a5e75075a0d12',
					},
				],
			},
		];

		// Create curated items
		let totalItemsCreated = 0;
		for (const categoryData of curatedItemsData) {
			const category = createdCategories.find((c) => c.name === categoryData.category);
			if (!category) continue;

			for (const item of categoryData.items) {
				await curatedItemRepository.create({
					name: item.name,
					price: item.price,
					categoryId: category.id,
					imageUrl: item.imageUrl,
					popularity: Math.floor(Math.random() * 1000), // Random popularity score
					isActive: true,
				});
				totalItemsCreated++;
			}
		}

		return AppResponse(
			res,
			201,
			{
				categoriesCreated: createdCategories.length,
				itemsCreated: totalItemsCreated,
			},
			'Database seeded successfully'
		);
	});
}

export const wishlistController = new WishlistController();
