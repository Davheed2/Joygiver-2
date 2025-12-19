export interface IWallet {
	id: string;
	userId: string;
	availableBalance: number;
	pendingBalance: number;
	totalReceived: number;
	totalWithdrawn: number;
	created_at: Date;
	updated_at: Date;
}

export interface IPayoutMethod {
	id: string;
	userId: string;
	accountName: string;
	accountNumber: string;
	bankName: string;
	bankCode: string;
	bvn?: string;
	recipientCode?: string;
	isVerified: boolean;
	isPrimary: boolean;
	isNormalTransfer: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface IWithdrawalRequest {
	id: string;
	userId: string;
	walletId: string;
	payoutMethodId: string;
	amount: number;
	fee: number;
	netAmount: number;
	status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
	paymentReference: string;
	transferCode?: string;
	failureReason?: string;
	processedAt?: Date;
	created_at: Date;
	updated_at: Date;
}

export interface IWalletTransaction {
	id: string;
	userId: string;
	walletId: string;
	type: 'contribution' | 'withdrawal' | 'refund' | 'fee';
	amount: number;
	balanceBefore: number;
	balanceAfter: number;
	reference: string;
	description?: string;
	metadata?: Record<string, unknown>;
	created_at: Date;
	updated_at: Date;
}

export interface IPaystackBank {
	name: string;
	code: string;
	active: boolean;
}

export interface IPaystackAccountVerification {
	account_number: string;
	account_name: string;
	bank_code: string;
}

export interface IPaystackTransferRecipient {
	recipient_code: string;
	type: string;
	name: string;
	details: {
		account_number: string;
		account_name: string;
		bank_code: string;
		bank_name: string;
	};
}

export interface IPaystackTransfer {
	transfer_code: string;
	id?: number;
	status?: string;
	reference?: string;
	amount?: number;
	recipient?: string;
	currency?: string;
	reason?: string;
	createdAt?: string;
}

export interface IPaystackVerifyTransfer {
	status: 'pending' | 'success' | 'failed' | 'reversed' | string;
	message?: string;
	id?: string;
	transfer_code?: string;
	reference?: string;
	amount?: number;
	recipient?: string;
}

export interface PaystackResponse<T> {
	status: boolean;
	message: string;
	data: T;
}


export interface PaystackWebhookPayload<T> {
	event: string;
	data: T;
}

export interface PaystackTransferData {
	reference: string;
	transfer_code: string;
	amount: number;
	message?: string;
	recipient?: {
		active: boolean;
		name: string;
		domain: string;
		details: {
			account_number: string;
			bank_code: string;
			bank_name: string;
		};
	};
}

export interface PaystackChargeData {
	reference: string;
	amount: number;
	currency: string;
	status: string;
	customer: {
		email: string;
		customer_code: string;
	};
	metadata?: Record<string, unknown>;
}