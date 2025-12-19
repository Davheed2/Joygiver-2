import { knexDb } from '@/common/config';
import { IPayoutMethod } from '@/common/interfaces';
import AppError from '@/common/utils/appError';
import { DateTime } from 'luxon';
import { paystackService } from '../services';

class PayoutMethodRepository {
	create = async (payload: Partial<IPayoutMethod>) => {
		return await knexDb.table('payout_methods').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IPayoutMethod | null> => {
		return await knexDb.table('payout_methods').where({ id }).first();
	};

	findByUserId = async (userId: string): Promise<IPayoutMethod[]> => {
		return await knexDb
			.table('payout_methods')
			.where({ userId, isNormalTransfer: false })
			.orderBy('created_at', 'desc');
	};

	findPrimaryByUserId = async (userId: string): Promise<IPayoutMethod | null> => {
		return await knexDb.table('payout_methods').where({ userId, isPrimary: true, isNormalTransfer: false }).first();
	};

	findByAccountNumber = async (
		userId: string,
		accountNumber: string,
		bankCode: string
	): Promise<IPayoutMethod | null> => {
		return await knexDb.table('payout_methods').where({ userId, accountNumber, bankCode }).first();
	};

	update = async (id: string, payload: Partial<IPayoutMethod>): Promise<IPayoutMethod[]> => {
		return await knexDb('payout_methods')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	unsetPrimaryForUser = async (userId: string): Promise<void> => {
		await knexDb('payout_methods')
			.where({ userId })
			.update({ isPrimary: false, updated_at: DateTime.now().toJSDate() });
	};

	delete = async (id: string): Promise<void> => {
		await knexDb('payout_methods').where({ id }).delete();
	};

	addPayoutMethod = async (userId: string, accountNumber: string, bankCode: string, isPrimary = false) => {
		const verification = await paystackService.verifyAccountNumber(accountNumber, bankCode);
		if (!verification) {
			throw new AppError('Account verification failed', 400);
		}

		const existing = await this.findByAccountNumber(userId, accountNumber, bankCode);
		if (existing) {
			throw new AppError('This payout method already exists', 400);
		}

		const recipient = await paystackService.createTransferRecipient(accountNumber, verification.account_name, bankCode);
		if (isPrimary) {
			await this.unsetPrimaryForUser(userId);
		}

		const banks = await paystackService.getBanks();
		const bank = banks.find((b) => b.code === bankCode);

		const [payoutMethod] = await this.create({
			userId,
			accountName: verification.account_name,
			accountNumber,
			bankName: bank?.name || 'Unknown Bank',
			bankCode,
			recipientCode: recipient.recipient_code,
			isVerified: true,
			isPrimary,
		});

		return payoutMethod;
	};

	getPayoutMethods = async (userId: string) => {
		const methods = await this.findByUserId(userId);
		return methods;
	};

	setPrimaryPayoutMethod = async (userId: string, payoutMethodId: string) => {
		const payoutMethod = await payoutMethodRepository.findById(payoutMethodId);
		if (!payoutMethod) {
			throw new AppError('Payout method not found', 404);
		}

		if (payoutMethod.userId !== userId) {
			throw new AppError('Unauthorized', 403);
		}

		await this.unsetPrimaryForUser(userId);
		const [updated] = await this.update(payoutMethodId, { isPrimary: true });
		return updated;
	};

	deletePayoutMethod = async (userId: string, payoutMethodId: string) => {
		const payoutMethod = await payoutMethodRepository.findById(payoutMethodId);
		if (!payoutMethod) {
			throw new AppError('Payout method not found', 404);
		}

		if (payoutMethod.userId !== userId) {
			throw new AppError('Unauthorized', 403);
		}

		// Check if there are pending withdrawals using this method
		const pendingWithdrawals = await knexDb('withdrawal_requests')
			.where({ payoutMethodId, status: 'pending' })
			.orWhere({ payoutMethodId, status: 'processing' });

		if (pendingWithdrawals.length > 0) {
			throw new AppError('Cannot delete payout method with pending withdrawals', 400);
		}

		await this.delete(payoutMethodId);
	};
}

export const payoutMethodRepository = new PayoutMethodRepository();
