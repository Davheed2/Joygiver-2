import { knexDb } from '@/common/config';
import { IWishlistTemplate } from '@/common/interfaces';
import { DateTime } from 'luxon';

class WishlistTemplateRepository {
	create = async (payload: Partial<IWishlistTemplate>) => {
		return await knexDb.table('wishlist_templates').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IWishlistTemplate | null> => {
		return await knexDb.table('wishlist_templates').where({ id }).first();
	};

	findByUniqueLink = async (uniqueLink: string): Promise<IWishlistTemplate | null> => {
		return await knexDb.table('wishlist_templates').where({ uniqueLink }).first();
	};

	findByUserId = async (userId: string): Promise<IWishlistTemplate[]> => {
		return await knexDb.table('wishlist_templates').where({ userId }).orderBy('created_at', 'desc');
	};

	update = async (id: string, payload: Partial<IWishlistTemplate>): Promise<IWishlistTemplate[]> => {
		return await knexDb('wishlist_templates')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findAll = async (): Promise<IWishlistTemplate[]> => {
		return await knexDb.table('wishlist_templates').orderBy('created_at', 'desc');
	};
}

export const wishlistTemplateRepository = new WishlistTemplateRepository();
