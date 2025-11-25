import { knexDb } from '@/common/config';
import { IReferralCode } from '@/common/interfaces';
import { generateRandomCode } from '@/common/utils';
import { DateTime } from 'luxon';

class ReferralRepository {
	create = async (payload: Partial<IReferralCode>) => {
		return await knexDb.table('referral_code').insert(payload).returning('*');
	};

	generateReferralCodes = async (userId: string, count: number = 5) => {
		const codes: string[] = [];
		const codesToInsert: Array<{ userId: string; referralCode: string }> = [];

		for (let i = 0; i < count; i++) {
			let referralCode: string;
			let isUnique = false;

			while (!isUnique) {
				const randomPart = generateRandomCode(5);
				referralCode = `JOY-${randomPart}`;

				const existing = await knexDb.table('referral_code').where({ referralCode }).first();

				if (!existing) {
					isUnique = true;
					codes.push(referralCode);
					codesToInsert.push({
						userId,
						referralCode,
					});
				}
			}
		}

		await knexDb.table('referral_code').insert(codesToInsert);

		return codes;
	};

	update = async (id: string, payload: Partial<IReferralCode>): Promise<IReferralCode[]> => {
		return await knexDb('referral_code')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	getUserReferralCodes = async (userId: string): Promise<IReferralCode[]> => {
		return await knexDb
			.table('referral_code')
			.where({ userId })
			.andWhere({ isUsed: false })
			.orderBy('created_at', 'desc');
	};

    findByCode = async (referralCode: string): Promise<IReferralCode | null> => {
        const code = await knexDb.table('referral_code').where({ referralCode }).first();
        return code || null;
    }

	getReferralStats = async (
		userId: string
	): Promise<{ totalCodes: number; usedCodes: number; unusedCodes: number }> => {
		const stats = await knexDb('referral_code')
			.where({ userId })
			.select(knexDb.raw('COUNT(*) as total'), knexDb.raw('SUM(CASE WHEN "isUsed" = true THEN 1 ELSE 0 END) as used'))
			.first();

		return {
			totalCodes: parseInt(stats.total) || 0,
			usedCodes: parseInt(stats.used) || 0,
			unusedCodes: (parseInt(stats.total) || 0) - (parseInt(stats.used) || 0),
		};
	};
}

export const referralRepository = new ReferralRepository();
