import { ContributionStatus, WishlistStatus } from '../constants';

export interface IWishlist {
	id: string;
	name: string;
	description?: string;
	emoji?: string;
	colorTheme?: string;
	status: WishlistStatus;
	uniqueLink: string;

	totalContributed: number;
	contributorsCount: number;

	viewsCount: number;
	isPublic: boolean;

	userId: string;

	celebrationEvent: string;
	celebrationDate: Date;
	expiresAt?: Date;

	createdAt: Date;
	updatedAt: Date;
}

export interface ICuratedItem {
	id: string;
	name: string;
	imageUrl: string;
	price: number;
	categoryId: string;
	popularity: number;
	createdBy?: string;
	isActive: boolean;
	created_at?: Date;
	updated_at?: Date;
}

export interface ICategory {
	id: string;
	name: string;
	isActive: boolean;
	created_at?: Date;
	updated_at?: Date;
}

export interface IWishlistTemplate {
	id: string;
	name: string;
	description?: string;
	userId: string;
	created_at?: Date;
	updated_at?: Date;
}

export interface IWishlistItem {
	id: string;
	name: string;
	imageUrl?: string;
	price: number;
	quantity: number;
	quantityFulfilled: number;
	amountContributed: number;
	priority: number;
	wishlistId: string;
	curatedItemId?: string;
	totalContributed: number;
	uniqueLink: string;
	contributorsCount: number;
	availableBalance: number; // NEW - Ready to withdraw
	pendingBalance: number; // NEW - Payment processing
	withdrawnAmount: number; // NEW - Already withdrawn
	isWithdrawable: boolean; // NEW - Can owner withdraw?
	lastWithdrawal?: Date; // NEW - Timestamp of last withdrawal
	isFunded: boolean;
	fundedAt?: Date;
	viewsCount: number;
	sharesCount: number;
	categoryId: string;
	created_at?: Date;
	updated_at?: Date;
}

export interface IWishlistTemplateItem {
	id: string;
	name: string;
	imageUrl?: string;
	price: number;
	quantity: number;
	wishlistTemplateId: string;
	created_at?: Date;
	updated_at?: Date;
}

export interface IWishlistView {
	id: string;
	wishlistId: string;
	ipAddress: string;
	userAgent: string;
	referrer?: string;
	viewedAt: Date;
}

export interface IWishlistShare {
	id: string;
	wishlistId: string;
	wishlistItemId?: string;
	platform: 'whatsapp' | 'facebook' | 'twitter' | 'instagram' | 'email' | 'copy_link' | 'other';
	ipAddress?: string;
	created_at: Date;
	updated_at: Date;
}

export interface IWishlistItemView {
	id: string;
	wishlistId: string;
	ipAddress: string;
	userAgent: string;
	referrer?: string;
	viewedAt: Date;
}

export interface IContribution {
	id: string;
	wishlistId: string;
	wishlistItemId: string;
	userId?: string;
	contributorName: string;
	contributorEmail: string;
	contributorPhone?: string;
	message?: string;
	isAnonymous: boolean;
	amount: number;
	status: ContributionStatus;
	paymentMethod: 'paystack' | 'flutterwave' | 'bank_transfer';
	paymentReference: string;
	paystackReference?: string;
	ownerReply?: string;
	repliedAt?: Date;
	metadata?: Record<string, unknown>;
	paidAt?: Date;
	created_at: Date;
	updated_at: Date;
}

export interface IContributorStats {
	rank: number;
	contributorName: string;
	contributorInitials: string;
	totalAmount: number;
	contributionCount: number;
	lastContribution: Date;
}

export interface IWishlistStats {
	totalContributed: number;
	contributorsCount: number;
	viewsCount: number;
	sharesCount: number;
	itemsCount: number;
	fundedItemsCount: number;
	completionPercentage: number;
	topContributors: IContributorStats[];
}

export interface IFriendWishlist {
	friendId: string;
	friendName: string;
	friendInitials: string;
	friendAvatar?: string;
	isOnline: boolean;
	lastActive: Date;
	wishlist: {
		id: string;
		celebrationEvent: string;
		celebrationDate?: Date;
		itemsCount: number;
		totalValue: number;
		topItems: Array<{
			id: string;
			name: string;
			imageUrl?: string;
			emoji?: string;
		}>;
		uniqueLink: string;
	};
}

export interface IItemWithdrawal {
	id: string;
	wishlistItemId: string;
	wishlistId: string;
	userId: string;
	walletId: string;
	amount: number;
	status: 'pending' | 'completed' | 'failed';
	reference: string;
	note?: string;
	processedAt?: Date;
	created_at: Date;
	updated_at: Date;
}

export interface IContributeAllRequest {
	wishlistId: string;
	contributorName: string;
	contributorEmail: string;
	contributorPhone?: string;
	totalAmount: number;
	message?: string;
	reference?: string;
	itemsCount: number;
	isAnonymous?: boolean;
	itemAllocations: Array<{
		wishlistItemId: string;
		amount: number;
	}>;
}
