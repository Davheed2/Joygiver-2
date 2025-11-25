import { Role } from '../constants';

export interface IUser {
	id: string;
	firstName: string;
	username: string;
	lastName: string;
	email: string;
	password: string;
	ipAddress: string;
	photo: string;
	phone: string;
	gender: string;
	referredBy?: string;
	referralCount: number;
	dob: string;
	role: Role;
	lastLogin: Date;
	lastActive: Date;
	isSuspended: boolean;
	isRegistrationComplete: boolean;
	passwordResetRetries: number;
	passwordResetToken: string;
	passwordResetExpires: Date;
	passwordChangedAt: Date;
	loginRetries: number;
	otp: string;
	otpExpires: Date;
	otpRetries: number;
	isDeleted: boolean;
	created_at?: Date;
	updated_at?: Date;
}
