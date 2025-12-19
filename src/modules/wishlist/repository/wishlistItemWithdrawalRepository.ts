import { knexDb } from '@/common/config';
import { IItemWithdrawal } from '@/common/interfaces';
import { AppError } from '@/common/utils';
import { walletRepository } from '@/modules/wallet/repository';
import { DateTime } from 'luxon';
import { nanoid } from 'nanoid';
import { wishlistRepository } from './wishlistRepository';
import { wishlistItemRepository } from './wishlistItemRepository';

class ItemWithdrawalRepository {
	create = async (payload: Partial<IItemWithdrawal>) => {
		return await knexDb.table('item_withdrawals').insert(payload).returning('*');
	};

	findById = async (id: string): Promise<IItemWithdrawal | null> => {
		return await knexDb.table('item_withdrawals').where({ id }).first();
	};

	findByReference = async (reference: string): Promise<IItemWithdrawal | null> => {
		return await knexDb.table('item_withdrawals').where({ reference }).first();
	};

	findByUserId = async (userId: string, page = 1, limit = 20): Promise<IItemWithdrawal[]> => {
		const offset = (page - 1) * limit;
		return await knexDb
			.table('item_withdrawals')
			.where({ userId })
			.orderBy('created_at', 'desc')
			.limit(limit)
			.offset(offset);
	};

	findByItemId = async (wishlistItemId: string): Promise<IItemWithdrawal[]> => {
		return await knexDb.table('item_withdrawals').where({ wishlistItemId }).orderBy('created_at', 'desc');
	};

	update = async (id: string, payload: Partial<IItemWithdrawal>): Promise<IItemWithdrawal[]> => {
		return await knexDb('item_withdrawals')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	countByUserId = async (userId: string): Promise<number> => {
		const result = await knexDb
			.table('item_withdrawals')
			.where({ userId })
			.count<{ count: string }[]>('* as count')
			.first();
		return Number(result?.count || 0);
	};

	getTotalWithdrawn = async (wishlistItemId: string): Promise<number> => {
		const result = await knexDb('item_withdrawals')
			.where({ wishlistItemId, status: 'completed' })
			.sum('amount as total')
			.first();
		return Number(result?.total || 0);
	};

	withdrawFromItem = async (userId: string, wishlistItemId: string, amount?: number): Promise<IItemWithdrawal> => {
		const item = await wishlistItemRepository.findById(wishlistItemId);
		if (!item) {
			throw new AppError('Wishlist item not found', 404);
		}

		const wishlist = await wishlistRepository.findById(item.wishlistId);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}
		if (wishlist.userId !== userId) {
			throw new AppError('Unauthorized - you do not own this wishlist', 403);
		}
		if (!item.isWithdrawable) {
			throw new AppError('This item is not withdrawable', 400);
		}
		if (item.availableBalance <= 0) {
			throw new AppError('No funds available to withdraw', 400);
		}

		const withdrawAmount = Number(amount) || Number(item.availableBalance);
		if (withdrawAmount > Number(item.availableBalance)) {
			throw new AppError(`Insufficient balance. Available: ₦${item.availableBalance}`, 400);
		}

		// if (withdrawAmount < 100) {
		// 	throw new AppError('Minimum withdrawal amount is ₦100', 400);
		// }

		const wallet = await walletRepository.findByUserId(userId);
		if (!wallet) {
			throw new AppError('Wallet not found', 404);
		}

		const reference = `ITWH-${nanoid(16)}`;
		// Create withdrawal record and transfer funds
		const withdrawal = await knexDb.transaction(async (trx) => {
			await trx('wishlist_items')
				.where({ id: wishlistItemId })
				.decrement('availableBalance', withdrawAmount)
				.increment('withdrawnAmount', withdrawAmount)
				.update({
					lastWithdrawal: new Date(),
					updated_at: new Date(),
				});

			await trx('wallets')
				.where({ id: wallet.id })
				.increment('availableBalance', withdrawAmount)
				.increment('totalReceived', withdrawAmount)
				.update({ updated_at: new Date() });

			// Create withdrawal record
			const [withdrawalRecord] = await trx('item_withdrawals')
				.insert({
					wishlistItemId,
					wishlistId: item.wishlistId,
					userId,
					walletId: wallet.id,
					amount: withdrawAmount,
					status: 'completed',
					reference,
					processedAt: new Date(),
				})
				.returning('*');

			// Create wallet transaction
			await trx('wallet_transactions').insert({
				userId,
				walletId: wallet.id,
				type: 'contribution', // Same type as contributions
				amount: withdrawAmount,
				balanceBefore: Number(wallet.availableBalance),
				balanceAfter: Number(wallet.availableBalance) + Number(withdrawAmount),
				reference,
				description: `Withdrawal from ${item.name}`,
				metadata: {
					wishlistItemId,
					withdrawalId: withdrawalRecord.id,
				},
			});

			return withdrawalRecord;
		});

		return withdrawal;
	};

	withdrawAllFromWishlist = async (
		userId: string,
		wishlistId: string,
	): Promise<{
		totalWithdrawn: number;
		itemsWithdrawn: number;
		withdrawals: IItemWithdrawal[];
	}> => {
		const wishlist = await wishlistRepository.findById(wishlistId);
		if (!wishlist) {
			throw new AppError('Wishlist not found', 404);
		}

		if (wishlist.userId !== userId) {
			throw new AppError('Unauthorized', 403);
		}

		// Get all items with available balance
		const items = await knexDb('wishlist_items')
			.where({ wishlistId })
			.where('availableBalance', '>', 0)
			.where('isWithdrawable', true);

		if (items.length === 0) {
			throw new AppError('No funds available to withdraw', 400);
		}

		// Withdraw from each item
		const withdrawals: IItemWithdrawal[] = [];
		for (const item of items) {
			try {
				const withdrawal = await this.withdrawFromItem(userId, item.id);
				withdrawals.push(withdrawal);
			} catch (error: unknown) {
				console.error(
					`Failed to withdraw from item ${item.id}:`,
					error instanceof Error ? error.message : 'Unknown error'
				);
			}
		}

		return {
			totalWithdrawn: withdrawals.reduce(
				(sum, w) => sum + (w.amount === undefined || w.amount === null ? 0 : Number(w.amount)),
				0
			),
			itemsWithdrawn: withdrawals.length,
			withdrawals,
		};
	};

	// Get withdrawal history for an item
	// async getItemWithdrawals(wishlistItemId: string) {
	// 	return await itemWithdrawalRepository.findByItemId(wishlistItemId);
	// }

	// // Get user's item withdrawal history
	// async getUserItemWithdrawals(userId: string, page = 1, limit = 20) {
	// 	const withdrawals = await itemWithdrawalRepository.findByUserId(userId, page, limit);
	// 	const total = await itemWithdrawalRepository.countByUserId(userId);

	// 	return {
	// 		data: withdrawals,
	// 		pagination: {
	// 			page,
	// 			limit,
	// 			total,
	// 			totalPages: Math.ceil(total / limit),
	// 		},
	// 	};
	// }

	getItemBalanceSummary = async (wishlistItemId: string) => {
		const item = await wishlistItemRepository.findById(wishlistItemId);
		if (!item) {
			throw new AppError('Wishlist item not found', 404);
		}

		return {
			totalContributed: item.totalContributed,
			availableBalance: item.availableBalance,
			pendingBalance: item.pendingBalance,
			withdrawnAmount: item.withdrawnAmount,
			isWithdrawable: item.isWithdrawable,
			lastWithdrawal: item.lastWithdrawal,
		};
	};
}

export const itemWithdrawalRepository = new ItemWithdrawalRepository();
