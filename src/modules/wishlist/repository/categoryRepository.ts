import { knexDb } from '@/common/config';
import { ICategory } from '@/common/interfaces';
import { DateTime } from 'luxon';

class CategoryRepository {
	create = async (payload: Partial<ICategory>) => {
		return await knexDb.table('categories').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<ICategory | null> => {
		return await knexDb.table('categories').where({ id }).first();
	};

	findByName = async (name: string): Promise<ICategory | null> => {
		return await knexDb.table('categories').where({ name }).first();
	};

	update = async (id: string, payload: Partial<ICategory>): Promise<ICategory[]> => {
		return await knexDb('categories')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findAll = async () => {
		return await knexDb.table('categories').where({ isActive: true }).orderBy('created_at', 'desc');
	};

	// findByNames = async (partialName: string) => {
	// 	return await knexDb.table('categories').where('name', 'ILIKE', `%${partialName}%`).first();
	// };

	findByNames = async (names: string[]) => {
		if (!names || names.length === 0) return [];
		let query = knexDb.table('categories');

		names.forEach((name, index) => {
			if (index === 0) {
				query = query.where('name', 'ILIKE', `%${name}%`);
			} else {
				query = query.orWhere('name', 'ILIKE', `%${name}%`);
			}
		});

		return await query;
	};

	findByIsActive = async (isActive: boolean) => {
		return await knexDb.table('categories').where({ isActive });
	};

	delete = async (id: string): Promise<number> => {
		return await knexDb('categories').where({ id }).del();
	};
}

export const categoryRepository = new CategoryRepository();
