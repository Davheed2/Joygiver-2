import { knexDb } from '@/common/config';
import { IWishlist } from '@/common/interfaces';
import { AppError } from '@/common/utils';
import { DateTime } from 'luxon';
import { wishlistItemRepository } from './wishlistItemRepository';
import { contributionRepository } from './contributionRepository';

class WishlistRepository {
	create = async (payload: Partial<IWishlist>) => {
		return await knexDb.table('wishlists').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IWishlist | null> => {
		return await knexDb.table('wishlists').where({ id }).first();
	};

	findByUniqueLink = async (uniqueLink: string): Promise<IWishlist | null> => {
		return await knexDb.table('wishlists').where({ uniqueLink }).first();
	};

	findByUserId = async (userId: string): Promise<IWishlist[]> => {
		return await knexDb
			.table('wishlists')
			.where({ userId })
			.where({ isPublic: true })
			.where({ status: 'active' })
			.orderBy('created_at', 'desc');
	};

	update = async (id: string, payload: Partial<IWishlist>): Promise<IWishlist[]> => {
		return await knexDb('wishlists')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	incrementViewCount = async (id: string): Promise<IWishlist[]> => {
		return await knexDb('wishlists').where({ id }).increment('viewsCount', 1).returning('*');
	};

	updateContributionStats = async (id: string, amount: number): Promise<IWishlist[]> => {
		return await knexDb('wishlists')
			.where({ id })
			.increment('totalContributed', amount)
			.increment('contributorsCount', 1)
			.returning('*');
	};

	getWishlistStats = async (wishlistId: string) => {
		const wishlist = await this.findById(wishlistId);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}

		const items = await wishlistItemRepository.findByWishlistId(wishlistId);
		const topContributors = await contributionRepository.getTopContributors(wishlistId, 3);

		const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
		const fundedItems = items.filter((item) => item.isFunded).length;
		const completionPercentage = totalPrice > 0 ? (wishlist.totalContributed / totalPrice) * 100 : 0;

		return {
			totalContributed: wishlist.totalContributed,
			contributorsCount: wishlist.contributorsCount,
			viewsCount: wishlist.viewsCount,
			itemsCount: items.length,
			fundedItemsCount: fundedItems,
			completionPercentage: Math.min(100, Math.round(completionPercentage)),
			topContributors,
		};
	};
}

export const wishlistRepository = new WishlistRepository();
