export interface IReferralCode {
	id: string;
    userId: string;
    referralCode: string;
    isUsed: boolean;
    usedByUserId?: string | null;
    usedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}