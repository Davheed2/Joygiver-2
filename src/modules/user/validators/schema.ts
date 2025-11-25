import { z } from 'zod';
import { nameZ, passwordZ, uuidZ } from '@/schemas/common';
import { PhoneNumberUtil } from 'google-libphonenumber';

const phoneUtil = PhoneNumberUtil.getInstance();

export const userModuleSchema = z
	.object({
		firstName: nameZ.optional(),
		lastName: nameZ.optional(),
		username: z.string().optional(),
		email: z
			.string()
			.email()
			.optional()
			.transform((s) => s?.toLowerCase()),
		gender: z.enum(['male', 'female', 'prefer not to say']).optional(),
		phone: z
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
					message: 'Invalid phone number. Please provide a valid international format (e.g., +2348012345678)',
				}
			),
		dob: z
			.string()
			.optional()
			.refine(
				(val) => {
					if (!val) return true;
					// ✅ enforce YYYY-MM-DD format
					const regex = /^\d{4}-\d{2}-\d{2}$/;
					if (!regex.test(val)) return false;

					const date = new Date(val);
					return !isNaN(date.getTime());
				},
				{
					message: 'Invalid date of birth. Use format YYYY-MM-DD',
				}
			),
		password: passwordZ.optional(),
		confirmPassword: passwordZ.optional(),
		oldPassword: passwordZ.optional(),
		newPassword: passwordZ.optional(),
		userId: uuidZ.optional(),
		otp: z.string().optional(),
		token: z.string().optional(),
		method: z.enum(['email', 'sms']).optional(),
		code: z.string().optional(),
		referralCode: z.string().optional(),
		identifier: z.string().optional(),
		friendId: uuidZ.optional(),
	})
	.strict();

export type UserModuleInput = z.infer<typeof userModuleSchema>;
export default userModuleSchema;
