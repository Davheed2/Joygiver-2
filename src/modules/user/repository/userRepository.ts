import { knexDb } from '@/common/config';
import { IUser } from '@/common/interfaces';
import { DateTime } from 'luxon';

class UserRepository {
	create = async (payload: Partial<IUser>) => {
		return await knexDb.table('users').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ id }).first();
	};

	findByEmail = async (email: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ email }).first();
	};

	findByPhone = async (phone: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ phone }).first();
	};

	findByUsername = async (username: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ username }).first();
	};

	partialFindByUsernameOrEmail = async (usernameOrEmail: string): Promise<IUser[] | null> => {
		const pattern = `%${usernameOrEmail}%`;
		return await knexDb
			.table('users')
			.where('username', 'ilike', pattern)
			.orWhere('email', 'ilike', pattern)
			.orderBy('created_at', 'desc');
	};

	findByEmailOrPhone = async (email: string, phone: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ email }).orWhere({ phone }).first();
	};

	update = async (id: string, payload: Partial<IUser>): Promise<IUser[]> => {
		return await knexDb('users')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	findAll = async () => {
		return await knexDb.table('users').orderBy('created_at', 'desc');
	};

	findByRole = async (role: string) => {
		return await knexDb.table('users').where({ role });
	};

	findByIsSuspended = async (isSuspended: boolean) => {
		return await knexDb.table('users').where({ isSuspended });
	};

	findByIsDeleted = async (isDeleted: boolean) => {
		return await knexDb.table('users').where({ isDeleted });
	};

	findByReferralCode = async (referralCode: string): Promise<IUser | null> => {
		return await knexDb.table('users').where({ referralCode }).first();
	};

	findReferredUsers = async (userId: string): Promise<IUser[]> => {
		return await knexDb.table('users').where({ referredBy: userId }).orderBy('created_at', 'desc');
	};

	incrementReferralCount = async (userId: string): Promise<void> => {
		await knexDb('users')
			.where({ id: userId })
			.increment('referralCount', 1)
			.update({ updated_at: DateTime.now().toJSDate() });
	};

	findByPasswordResetToken = async (passwordResetToken: string): Promise<IUser | null> => {
		return await knexDb
			.table('users')
			.where({ passwordResetToken })
			.where('passwordResetExpires', '>', DateTime.now().toJSDate())
			.where({ isSuspended: false })
			.first();
	};
}

export const userRepository = new UserRepository();
