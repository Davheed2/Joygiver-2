import { knexDb } from '@/common/config';
import { IPayoutMethod, IWallet, IWithdrawalRequest } from '@/common/interfaces';
import { AppError } from '@/common/utils';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { payoutMethodRepository } from './payoutMethodRepository';
import { WITHDRAWAL_LIMITS } from '@/common/constants';
import { walletRepository } from './walletRepository';
import { paystackService } from '../services';
import { notificationService } from '@/services/notification';

class WithdrawalRequestRepository {
	create = async (payload: Partial<IWithdrawalRequest>) => {
		return await knexDb.table('withdrawal_requests').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IWithdrawalRequest | null> => {
		return await knexDb.table('withdrawal_requests').where({ id }).first();
	};

	findByReference = async (reference: string): Promise<IWithdrawalRequest | null> => {
		return await knexDb.table('withdrawal_requests').where({ paymentReference: reference }).first();
	};

	findByUserId = async (userId: string, page = 1, limit = 20): Promise<IWithdrawalRequest[]> => {
		const offset = (page - 1) * limit;
		return await knexDb
			.table('withdrawal_requests')
			.where({ userId })
			.orderBy('created_at', 'desc')
			.limit(limit)
			.offset(offset);
	};

	findPending = async (): Promise<IWithdrawalRequest[]> => {
		return await knexDb.table('withdrawal_requests').where({ status: 'pending' }).orderBy('created_at', 'asc');
	};

	findByStatus = async (status: string): Promise<IWithdrawalRequest[]> => {
		return await knexDb.table('withdrawal_requests').where({ status }).orderBy('created_at', 'asc');
	};

	update = async (id: string, payload: Partial<IWithdrawalRequest>): Promise<IWithdrawalRequest[]> => {
		return await knexDb('withdrawal_requests')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	countByUserId = async (userId: string): Promise<number> => {
		const result = await knexDb('withdrawal_requests')
			.where({ userId })
			.count<{ count: string }[]>('* as count')
			.first();

		return Number(result?.count ?? 0);
	};

	createWithdrawalRequest = async (
		userId: string,
		amount: number,
		payoutMethodId?: string,
		accountNumber?: string,
		bankCode?: string
	) => {
		let wallet: IWallet | null;
		wallet = await walletRepository.findByUserId(userId);
		if (!wallet) {
			[wallet] = await walletRepository.create({
				userId,
				availableBalance: 0,
				pendingBalance: 0,
				totalReceived: 0,
				totalWithdrawn: 0,
			});
		}
		if (!wallet) {
			throw new AppError('Wallet not found', 404);
		}

		console.log(typeof amount, amount);
		console.log(typeof WITHDRAWAL_LIMITS.MIN, WITHDRAWAL_LIMITS.MIN);

		// Validation
		if (amount < WITHDRAWAL_LIMITS.MIN) {
			throw new AppError(`Minimum withdrawal amount is ₦${WITHDRAWAL_LIMITS.MIN.toLocaleString()}`, 400);
		}

		if (amount > wallet.availableBalance) {
			throw new AppError('Insufficient balance', 400);
		}

		// Get payout method
		// let payoutMethod: IPayoutMethod | null;
		// if (payoutMethodId) {
		// 	payoutMethod = await payoutMethodRepository.findById(payoutMethodId);
		// 	if (!payoutMethod || payoutMethod.userId !== userId) {
		// 		throw new AppError('Invalid payout method', 400);
		// 	}
		// } else {
		// 	payoutMethod = await payoutMethodRepository.findPrimaryByUserId(userId);
		// 	if (!payoutMethod) {
		// 		throw new AppError('No payout method found. Please add a payout method first', 400);
		// 	}
		// }

		let payoutMethod: IPayoutMethod | null;
		// If accountNumber and bankCode are provided, create a temporary payout method
		if (accountNumber && bankCode) {
			const banks = await paystackService.getBanks();
			const bank = banks.find((b) => b.code === bankCode);

			const accountDetails = await paystackService.verifyAccountNumber(accountNumber, bankCode);
			if (!accountDetails) {
				throw new AppError('Could not verify account details', 400);
			}

			const recipient = await paystackService.createTransferRecipient(
				accountNumber,
				accountDetails.account_name,
				bankCode
			);

			const [createdPayoutMethod] = await payoutMethodRepository.create({
				userId,
				accountName: accountDetails.account_name,
				accountNumber,
				bankName: bank?.name || 'Unknown Bank',
				bankCode,
				recipientCode: recipient.recipient_code,
				isVerified: true,
				isPrimary: false,
				isNormalTransfer: true, 
			});

			payoutMethod = createdPayoutMethod;
		} else if (payoutMethodId) {
			payoutMethod = await payoutMethodRepository.findById(payoutMethodId);
			if (!payoutMethod || payoutMethod.userId !== userId) {
				throw new AppError('Invalid payout method', 400);
			}
		} else {
			payoutMethod = await payoutMethodRepository.findPrimaryByUserId(userId);
			if (!payoutMethod) {
				throw new AppError('No payout method found. Please add a payout method first', 400);
			}
		}

		if (!payoutMethod || !payoutMethod.isVerified) {
			throw new AppError('Payout method is not verified', 400);
		}

		// Calculate fees
		const fee = paystackService.calculateWithdrawalFee(amount);
		const netAmount = amount - fee;

		// Generate reference
		const reference = `WTH-${nanoid(16)}`;

		// Create withdrawal request in transaction
		let withdrawalRequest: IWithdrawalRequest;
		await knexDb.transaction(async (trx) => {
			// Lock wallet balance
			await trx('wallets')
				.where({ id: wallet.id })
				.decrement('availableBalance', amount)
				.increment('pendingBalance', amount)
				.update({ updated_at: new Date() });

			// Create withdrawal request
			const [request] = await trx('withdrawal_requests')
				.insert({
					userId,
					walletId: wallet.id,
					payoutMethodId: payoutMethod.id,
					amount,
					fee,
					netAmount,
					status: 'pending',
					paymentReference: reference,
				})
				.returning('*');

			withdrawalRequest = request;

			// Create transaction record
			await trx('wallet_transactions').insert({
				userId,
				walletId: wallet.id,
				type: 'withdrawal',
				amount: -amount,
				balanceBefore: wallet.availableBalance,
				balanceAfter: wallet.availableBalance - amount,
				reference,
				description: 'Withdrawal request',
				metadata: { withdrawalRequestId: request.id },
			});

			// Create fee transaction
			await trx('wallet_transactions').insert({
				userId,
				walletId: wallet.id,
				type: 'fee',
				amount: -fee,
				balanceBefore: wallet.availableBalance - amount,
				balanceAfter: wallet.availableBalance - amount,
				reference: `${reference}-FEE`,
				description: 'Withdrawal fee',
				metadata: { withdrawalRequestId: request.id },
			});

			await notificationService.notifyPendingTransaction(userId, 'withdrawal', amount, 'NGN');
		});

		return withdrawalRequest!;
	};

	processWithdrawal = async (withdrawalId: string) => {
		const withdrawal = await this.findById(withdrawalId);
		if (!withdrawal) {
			throw new AppError('Withdrawal request not found', 404);
		}

		if (withdrawal.status !== 'pending') {
			throw new AppError('Withdrawal request is not pending', 400);
		}

		const payoutMethod = await payoutMethodRepository.findById(withdrawal.payoutMethodId);
		if (!payoutMethod) {
			throw new AppError('Payout method not found', 404);
		}

		try {
			// Update status to processing
			await withdrawalRequestRepository.update(withdrawalId, { status: 'processing' });

			// Initiate transfer on Paystack
			const transfer = await paystackService.initiateTransfer(
				payoutMethod.recipientCode!,
				withdrawal.netAmount,
				withdrawal.paymentReference
			);

			//console.

			// Update with transfer code
			await withdrawalRequestRepository.update(withdrawalId, {
				transferCode: transfer.transfer_code,
			});
		} catch (error: unknown) {
			// Revert balance if transfer fails
			await this.failWithdrawal(withdrawalId, (error as Error).message);
			throw error;
		}
	};

	completeWithdrawal = async (withdrawalId: string) => {
		const withdrawal = await withdrawalRequestRepository.findById(withdrawalId);
		if (!withdrawal) {
			throw new AppError('Withdrawal request not found', 404);
		}

		if (withdrawal.status !== 'processing') {
			throw new AppError('Withdrawal is not in processing state', 400);
		}

		await knexDb.transaction(async (trx) => {
			// Update withdrawal status
			await trx('withdrawal_requests').where({ id: withdrawalId }).update({
				status: 'completed',
				processedAt: new Date(),
				updated_at: new Date(),
			});

			// Remove from pending balance and add to total withdrawn
			await trx('wallets')
				.where({ id: withdrawal.walletId })
				.decrement('pendingBalance', withdrawal.amount)
				.increment('totalWithdrawn', withdrawal.amount)
				.update({ updated_at: new Date() });

			await notificationService.notifyWithdrawalSuccess(withdrawal.userId, withdrawal.amount, 'NGN');
		});
	};

	failWithdrawal = async (withdrawalId: string, reason: string) => {
		const withdrawal = await withdrawalRequestRepository.findById(withdrawalId);
		if (!withdrawal) {
			throw new AppError('Withdrawal request not found', 404);
		}

		let currentBalance: IWallet | null;
		currentBalance = await walletRepository.findByUserId(withdrawal.userId);
		if (!currentBalance) {
			[currentBalance] = await walletRepository.create({
				userId: withdrawal.userId,
				availableBalance: 0,
				pendingBalance: 0,
				totalReceived: 0,
				totalWithdrawn: 0,
			});
		}
		if (!currentBalance) {
			throw new AppError('Balance fetch failed', 404);
		}

		const availableBalance = Number(currentBalance.availableBalance);
		const amount = Number(withdrawal.amount);
		const balanceAfter = availableBalance + amount;

		await knexDb.transaction(async (trx) => {
			await trx('withdrawal_requests').where({ id: withdrawalId }).update({
				status: 'failed',
				failureReason: reason,
				processedAt: new Date(),
				updated_at: new Date(),
			});

			// Revert balance - move from pending back to available
			await trx('wallets')
				.where({ id: withdrawal.walletId })
				.decrement('pendingBalance', withdrawal.amount)
				.increment('availableBalance', withdrawal.amount)
				.update({ updated_at: new Date() });

			// Create refund transaction
			await trx('wallet_transactions').insert({
				userId: withdrawal.userId,
				walletId: withdrawal.walletId,
				type: 'refund',
				amount,
				balanceBefore: availableBalance,
				balanceAfter,
				reference: `${withdrawal.paymentReference}-REFUND`,
				description: `Withdrawal failed: ${reason}`,
				metadata: { withdrawalRequestId: withdrawal.id },
			});

			await notificationService.notifyWithdrawalFailed(withdrawal.userId, withdrawal.amount, 'NGN', reason);
		});
	};

	getWithdrawalHistory = async (userId: string, page = 1, limit = 20) => {
		const withdrawals = await withdrawalRequestRepository.findByUserId(userId, page, limit);
		const total = await withdrawalRequestRepository.countByUserId(userId);

		return {
			withdrawals,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	};
}

export const withdrawalRequestRepository = new WithdrawalRequestRepository();
