import { knexDb } from '@/common/config';
import { IWishlistTemplateItem } from '@/common/interfaces';
import { DateTime } from 'luxon';

class WishlistTemplateItemRepository {
	create = async (payload: Partial<IWishlistTemplateItem>) => {
		return await knexDb.table('wishlist_template_items').insert(payload).returning('*');
	};

	createMany = async (payloads: Partial<IWishlistTemplateItem>[]) => {
		return await knexDb.table('wishlist_template_items').insert(payloads).returning('*');
	};

	findById = async (id: string): Promise<IWishlistTemplateItem | null> => {
		return await knexDb.table('wishlist_template_items').where({ id }).first();
	};

	findByWishlistTemplateId = async (wishlistTemplateId: string): Promise<IWishlistTemplateItem[]> => {
		return await knexDb.table('wishlist_template_items').where({ wishlistTemplateId }).orderBy('created_at', 'desc');
	};

	findBywishlistTemplateIds = async (wishlistTemplateIds: string[]): Promise<IWishlistTemplateItem[]> => {
		return await knexDb
			.table('wishlist_template_items')
			.whereIn('wishlistTemplateId', wishlistTemplateIds)
			.orderBy('created_at', 'desc');
	};

	update = async (id: string, payload: Partial<IWishlistTemplateItem>): Promise<IWishlistTemplateItem[]> => {
		return await knexDb('wishlist_template_items')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findByUniqueLink = async (uniqueLink: string): Promise<IWishlistTemplateItem | null> => {
		return await knexDb.table('wishlist_template_items').where({ uniqueLink }).first();
	};
}

export const wishlistTemplateItemRepository = new WishlistTemplateItemRepository();
