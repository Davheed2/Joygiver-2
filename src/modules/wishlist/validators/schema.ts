import { z } from 'zod';
import { uuidZ } from '@/schemas/common';
import { PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export const wishlistModuleSchema = z
	.object({
		// ==================== WISHLIST FIELDS ====================
		celebrationEvent: z
			.string()
			.min(1, 'Celebration event is required')
			.max(100, 'Celebration event must be less than 100 characters')
			.optional(),
		celebrationDate: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (!val) return true;
					const regex = /^\d{4}-\d{2}-\d{2}$/;
					if (!regex.test(val)) return false;

					const date = new Date(val);
					return !isNaN(date.getTime());
				},
				{
					message: 'Invalid date format. Use YYYY-MM-DD',
				}
			),
		budget: z.number().positive().optional(),
		budgetMin: z.number().positive().optional(),
		budgetMax: z.number().positive().optional(),
		categoryIds: z.array(uuidZ).optional(),
		description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
		coverImage: z.string().url('Cover image must be a valid URL').optional(),
		status: z.enum(['draft', 'active', 'completed', 'expired']).optional(),
		isPublic: z.boolean().optional(),
		wishlistId: uuidZ.optional(),
		wishlistTemplateId: uuidZ.optional(),
		uniqueLink: z.string().optional(),
		emoji: z.string().optional(),
		colorTheme: z.string().optional(),

		// ==================== WISHLIST ITEM FIELDS ====================
		items: z
			.array(
				z.object({
					curatedItemId: uuidZ.optional(),
				})
			)
			.optional(),
		//itemId: uuidZ.optional(),
		curatedItemId: uuidZ.optional(),
		name: z.string().min(1).max(255).optional(),
		imageUrl: z.string().url().optional(),
		price: z.number().positive().optional(),
		categoryId: uuidZ.optional(),
		payoutMethodId: uuidZ.optional(),
		accountName: z.string().min(1).max(255).optional(),
		accountNumber: z
			.string()
			.regex(/^\d{10}$/, 'Account number must be 10 digits')
			.optional(),
		bankName: z.string().min(1).max(255).optional(),
		bankCode: z.string().optional(),

		// ==================== CONTRIBUTION FIELDS ====================
		contributionId: uuidZ.optional(),
		wishlistItemId: uuidZ.optional(),
		contributorName: z
			.string()
			.min(2, 'Name must be at least 2 characters')
			.max(255, 'Name must be less than 255 characters')
			.optional(),
		contributorEmail: z
			.string()
			.email('Invalid email address')
			.optional()
			.transform((s) => s?.toLowerCase()),
		contributorPhone: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (!val) return true;
					try {
						const number = phoneUtil.parseAndKeepRawInput(val, 'NG');
						return phoneUtil.isValidNumber(number);
					} catch {
						return false;
					}
				},
				{
					message: 'Invalid phone number',
				}
			),
		// ==================== OWNER REPLY ====================
		ownerReply: z.string().max(1000, 'Reply must be less than 1000 characters').optional(),
		// ==================== VIEW TRACKING ====================
		ipAddress: z.string().optional(),
		userAgent: z.string().optional(),
		referrer: z.string().url().optional(),
		// ==================== SHARE TRACKING ====================
		platform: z.enum(['whatsapp', 'facebook', 'twitter', 'instagram', 'email', 'copy_link', 'other']).optional(),
		message: z.string().max(500, 'Message must be less than 500 characters').optional(),
		isAnonymous: z.boolean().optional(),
		amount: z.number().positive('Amount must be positive').optional(),
		paymentMethod: z.enum(['paystack', 'flutterwave', 'bank_transfer', 'card']).optional(),
		paymentReference: z.string().optional(),
		iconUrl: z.string().url().optional(),

		// ==================== QUERY PARAMS ====================
		page: z.number().int().positive().optional(),
		limit: z.number().int().positive().optional(),
		sortBy: z
			.enum(['created_at', 'celebration_date', 'views_count', 'total_contributed', 'amount', 'contributor_name'])
			.optional(),
		sortOrder: z.enum(['asc', 'desc']).optional(),
		gender: z.enum(['male', 'female', 'prefer_not_to_say']).optional(),
		minPrice: z.number().positive().optional(),
		maxPrice: z.number().positive().optional(),
		includeAnonymous: z.boolean().optional(),

		// ==================== CURATED ITEM FIELDS (ADMIN) ====================
		curatedItemName: z.string().min(1).max(255).optional(),
		popularity: z.number().int().min(0).optional(),
		isActive: z.boolean().optional(),
	})
	.strict();

export type WishlistModuleInput = z.infer<typeof wishlistModuleSchema>;
export default wishlistModuleSchema;
