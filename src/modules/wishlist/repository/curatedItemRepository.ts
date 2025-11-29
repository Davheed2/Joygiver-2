import { knexDb } from '@/common/config';
import { Gender } from '@/common/constants';
import { ICuratedItem } from '@/common/interfaces';
import { DateTime } from 'luxon';

interface PaginatedResult {
	items: ICuratedItem[];
	total: number;
}

class CuratedItemRepository {
	create = async (payload: Partial<ICuratedItem>) => {
		return await knexDb.table('curated_items').insert(payload).returning('*');
	};

	findByCategoriesAndGender = async (
		categoryIds: string[],
		gender: Gender,
		budgetMin?: number,
		budgetMax?: number
	): Promise<ICuratedItem[]> => {
		let query = knexDb
			.table('curated_items')
			.whereIn('categoryId', categoryIds)
			.where('gender', gender)
			.where('isActive', true)
			.orderBy('popularity', 'desc');

		if (budgetMin) {
			query = query.where('price', '>=', budgetMin);
		}
		if (budgetMax) {
			query = query.where('price', '<=', budgetMax);
		}

		return await query;
	};

	// for the categoryIds instead of passing undefined i want it to be 'all' so that we can fetch all categories
	findByCategoriesAndGenderPaginated = async (
		categoryIds: string[] | 'all',
		gender: Gender,
		budgetMin?: number,
		budgetMax?: number,
		page: number = 1,
		limit: number = 20
	): Promise<PaginatedResult> => {
		let resolvedCategoryIds: string[] | undefined;
		if (categoryIds === 'all') {
			const allCategories = (await knexDb.table('categories').select('id').where('isActive', true)) as { id: string }[];
			resolvedCategoryIds = allCategories.map((cat) => cat.id);
		} else {
			resolvedCategoryIds = categoryIds.length > 0 ? categoryIds : undefined;
		}

		let query = knexDb
			.table('curated_items')
			.where('gender', gender)
			.orWhere('gender', 'prefer_not_to_say')
			.where('isActive', true)
			.where('isPublic', true);

		// Only apply category filter if categoryIds is provided
		if (resolvedCategoryIds && resolvedCategoryIds.length > 0) {
			query = query.whereIn('categoryId', resolvedCategoryIds);
		}

		if (budgetMin !== undefined) {
			query = query.where('price', '>=', budgetMin);
		}
		if (budgetMax !== undefined) {
			query = query.where('price', '<=', budgetMax);
		}

		// Get total count
		const countResult = await query.clone().count<{ count: string }[]>('* as count');
		const total = parseInt(countResult[0].count, 10);

		const offset = (page - 1) * limit;
		const items = await query
			.select('id', 'name', 'imageUrl', 'price', 'categoryId', 'gender', 'popularity')
			.orderBy('popularity', 'desc')
			.limit(limit)
			.offset(offset);

		return { items, total };
	};

	findByCategoriesAllGenders = async (
		categoryIds: string[] | 'all',
		budgetMin?: number,
		budgetMax?: number,
		page: number = 1,
		limit: number = 20
	): Promise<PaginatedResult> => {
		let resolvedCategoryIds: string[] | undefined;
		if (categoryIds === 'all') {
			const allCategories = (await knexDb.table('categories').select('id').where('isActive', true)) as { id: string }[];
			resolvedCategoryIds = allCategories.map((cat) => cat.id);
		} else {
			resolvedCategoryIds = categoryIds.length > 0 ? categoryIds : undefined;
		}

		let query = knexDb
			.table('curated_items')
			.whereIn('gender', [Gender.MALE, Gender.FEMALE, Gender.PREFER_NOT_TO_SAY])
			.where('isActive', true)
			.where('isPublic', true);

		// Only apply category filter if categoryIds is provided
		if (resolvedCategoryIds && resolvedCategoryIds.length > 0) {
			query = query.whereIn('categoryId', resolvedCategoryIds);
		}

		if (budgetMin !== undefined) {
			query = query.where('price', '>=', budgetMin);
		}
		if (budgetMax !== undefined) {
			query = query.where('price', '<=', budgetMax);
		}

		// Get total count
		const countResult = await query.clone().count<{ count: string }[]>('* as count');
		const total = parseInt(countResult[0]?.count ?? '0', 10);

		// Get paginated items
		const offset = (page - 1) * limit;
		const items = await query
			.select('id', 'name', 'imageUrl', 'price', 'categoryId', 'gender', 'popularity')
			.orderBy('popularity', 'desc')
			.limit(limit)
			.offset(offset);

		return { items, total };
	};

	findByIds = async (ids: string[]): Promise<ICuratedItem[]> => {
		return await knexDb.table('curated_items').whereIn('id', ids);
	};

	findById = async (id: string): Promise<ICuratedItem | null> => {
		return await knexDb.table('curated_items').where({ id }).first();
	};

	update = async (id: string, payload: Partial<ICuratedItem>): Promise<ICuratedItem[]> => {
		return await knexDb('curated_items')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	delete = async (id: string): Promise<number> => {
		return await knexDb('curated_items').where({ id }).del();
	};

	countUsage = async (curatedItemId: string): Promise<number> => {
		const result = await knexDb('wishlist_items').where({ curatedItemId }).count('* as count').first();
		return Number(result?.count || 0);
	};

	findByCreator = async (userId: string) => {
		return await knexDb('curated_items').where({ createdBy: userId, isActive: true }).orderBy('created_at', 'desc');
	};
}

export const curatedItemRepository = new CuratedItemRepository();
