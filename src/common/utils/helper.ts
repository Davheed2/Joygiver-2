import bcrypt from 'bcryptjs';
import { randomBytes, randomInt, createHash } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { encode } from 'hi-base32';
import { ENVIRONMENT } from '../config';
import { ForgotPasswordData, IHashData, ISmsResult, ITokenFamily, LoginEmailData, OtpEmailData, ResetPasswordData, WelcomeEmailData } from '../interfaces';
import type { Response, Request } from 'express';
import { promisify } from 'util';
import otpGenerator from 'otp-generator';
import { addEmailToQueue, redisConnection } from '@/queues';
import AppError from './appError';
import { tokenFamilyRepository } from '@/modules/user/repository';
import { RefreshTokenPayload } from '../types';
import { smsService } from '@/services';

const generateRandomString = () => {
	return randomBytes(32).toString('hex');
};

const hashPassword = async (password: string) => {
	return await bcrypt.hash(password, 12);
};

const comparePassword = async (password: string, hashedPassword: string) => {
	return await bcrypt.compare(password, hashedPassword);
};

const generateRandomBase32 = () => {
	const buffer = randomBytes(15);
	return encode(buffer).replace(/=/g, '').substring(0, 24);
};

const generateRandom6DigitKey = () => {
	let randomNum = randomInt(0, 999999);

	// Ensure the number is within the valid range (000000 to 999999)
	while (randomNum < 100000) {
		randomNum = randomInt(0, 999999);
	}
	// Convert the random number to a string and pad it with leading zeros if necessary
	return randomNum.toString().padStart(6, '0');
};

const toJSON = <T extends object>(obj: T | T[], excludeFields: (keyof T)[] = []): Partial<T> | Partial<T>[] => {
	// Helper function to sanitize a single object
	const sanitizeObject = (item: T): Partial<T> => {
		const sanitized: Partial<T> = JSON.parse(JSON.stringify(item));
		finalExclusions.forEach((field) => delete sanitized[field]);
		return sanitized;
	};

	// Default fields to exclude
	const defaultExclusions: (keyof T)[] = [
		'loginRetries',
		'lastLogin',
		'password',
		'updated_at',
		'ipAddress',
		'otpRetries',
		'otp',
		'passwordResetToken',
		'passwordResetExpires',
		'passwordChangedAt',
		'passwordResetRetries',
		'ownerId',
		'otpExpires',
	] as (keyof T)[];

	// Use provided exclusions or default ones
	const finalExclusions = excludeFields.length > 0 ? excludeFields : defaultExclusions;

	// Handle array or single object
	if (Array.isArray(obj)) {
		return obj.map(sanitizeObject);
	} else {
		return sanitizeObject(obj);
	}
};

const parseTokenDuration = (duration: string): number => {
	const match = duration.match(/(\d+)([smhd])/);
	if (!match) return 0;

	const value = parseInt(match[1]);
	const unit = match[2];

	switch (unit) {
		case 's':
			return value * 1000;
		case 'm':
			return value * 60 * 1000;
		case 'h':
			return value * 60 * 60 * 1000;
		case 'd':
			return value * 24 * 60 * 60 * 1000;
		default:
			return 0;
	}
};

const parseTokenDurationToSeconds = (duration: string): number => {
	const match = duration.match(/(\d+)([smhd])/);
	if (!match) return 0;
	const value = parseInt(match[1]);
	const unit = match[2];
	switch (unit) {
		case 's':
			return value;
		case 'm':
			return value * 60;
		case 'h':
			return value * 3600;
		case 'd':
			return value * 86400;
		default:
			return 0;
	}
};

const isMobile = (req: Request): 'mobile' | 'browser' => {
	const customHeader = req.headers['joygiver'];
	if (customHeader) {
		return 'mobile';
	}

	return 'browser';
};

const setCookie = (
	req: Request,
	res: Response,
	name: string,
	value: string,
	//options: CookieOptions = {},
	maxAge: number
) => {
	const clientType = isMobile(req);
	if (clientType === 'mobile') {
		if (name === 'accessToken') res.locals.newAccessToken = value;
		if (name === 'refreshToken') res.locals.newRefreshToken = value;
	} else {
		res.cookie(name, value, {
			httpOnly: true,
			secure: ENVIRONMENT.APP.ENV === 'production',
			path: '/',
			sameSite: ENVIRONMENT.APP.ENV === 'production' ? 'none' : 'lax',
			partitioned: ENVIRONMENT.APP.ENV === 'production',
			maxAge,
		});
	}
};

const dateFromString = async (value: string) => {
	const date = new Date(value);

	if (isNaN(date?.getTime())) {
		return false;
	}

	return date;
};

const createToken = (data: IHashData, options?: SignOptions, secret?: string) => {
	return jwt.sign({ ...data }, secret ? secret : ENVIRONMENT.JWT.AUTH_SECRET, {
		algorithm: 'HS256',
		expiresIn: options?.expiresIn,
	});
};

const verifyToken = async (token: string, secret?: string) => {
	const verifyAsync: (arg1: string, arg2: string) => jwt.JwtPayload = promisify(jwt.verify);

	const verify = verifyAsync(token, secret ? secret : ENVIRONMENT.JWT.AUTH_SECRET!);
	return verify;
};

const generateAccessToken = (userId: string): string => {
	return createToken(
		{ id: userId, type: 'access' },
		{ expiresIn: parseTokenDurationToSeconds(ENVIRONMENT.JWT_EXPIRES_IN.ACCESS) },
		ENVIRONMENT.JWT.ACCESS_SECRET
	);
};

const generateRefreshToken = (userId: string, tokenFamily?: string, version: number = 1): string => {
	return createToken(
		{ id: userId, type: 'refresh', tokenFamily, version },
		{ expiresIn: parseTokenDurationToSeconds(ENVIRONMENT.JWT_EXPIRES_IN.REFRESH) },
		ENVIRONMENT.JWT.REFRESH_SECRET
	);
};

const generateTokenFamily = (): string => {
	return `${Date.now()}_${Math.random().toString(36).substring(2)}`;
};

// Redis keys
const getTokenFamilyKey = (familyId: string) => `token_family:${familyId}`;
const getUsedTokenKey = (tokenHash: string) => `used_token:${tokenHash}`;
const getUserFamiliesKey = (userId: string) => `user_families:${userId}`;

const hashToken = (token: string): string => {
	return createHash('sha256').update(token).digest('hex');
};

// New helper to extract token info without verification (for debugging)
export const decodeTokenWithoutVerification = (token: string): jwt.JwtPayload | null => {
	try {
		return jwt.decode(token) as jwt.JwtPayload;
	} catch {
		return null;
	}
};

// Helper to check if token is about to expire
export const isTokenNearExpiry = (token: string, bufferMinutes: number = 2): boolean => {
	try {
		const decoded = jwt.decode(token) as jwt.JwtPayload;
		if (!decoded || !decoded.exp) return true;

		const now = Math.floor(Date.now() / 1000);
		const expiryBuffer = decoded.exp - bufferMinutes * 60;

		return now >= expiryBuffer;
	} catch {
		return true;
	}
};

const isValidFileNameAwsUpload = (fileName: string): boolean => {
	const regex = /^([a-zA-Z0-9\s\-+_!@#$%^&*(),./]+)(?:\.(mp4|mov|webm|avi))$/i;
	return regex.test(fileName);
};

const isValidPhotoNameAwsUpload = (fileName: string) => {
	const regex = /^([a-zA-Z0-9\s\-+_!@#$%^&*(),./]+)(?:\.(jpg|png|jpeg))$/i;
	return regex.test(fileName);
};

const getDomainReferer = (req: Request) => {
	try {
		const referer = req.get('x-referer');

		if (!referer) {
			return `${ENVIRONMENT.FRONTEND_URL}`;
		}

		return referer;
	} catch (error) {
		console.log(error);
		return null;
	}
};

const generateRandomCode = (length: number = 5): string => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

const formatTimeSpent = (totalSeconds: number): string => {
	if (totalSeconds < 0) {
		throw new Error('Time cannot be negative');
	}

	const days = Math.floor(totalSeconds / (24 * 60 * 60));
	const remainingSeconds = totalSeconds % (24 * 60 * 60);
	const hours = Math.floor(remainingSeconds / (60 * 60));
	const remainingMinutes = Math.floor(remainingSeconds / 60) % 60;
	const seconds = remainingSeconds % 60;

	let formattedTime = '';

	if (days > 0) {
		formattedTime += `${days}day`;
		if (days > 1) formattedTime += 's';
		if (hours > 0 || remainingMinutes > 0 || seconds > 0) formattedTime += ':';
	}

	if (hours > 0) {
		formattedTime += `${hours}hr`;
		if (hours > 1) formattedTime += 's';
		if (remainingMinutes > 0 || seconds > 0) formattedTime += ':';
	}

	if (remainingMinutes > 0) {
		formattedTime += `${remainingMinutes}min`;
		if (remainingMinutes > 1) formattedTime += 's';
		if (seconds > 0) formattedTime += ':';
	}

	if (seconds > 0) {
		formattedTime += `${seconds}sec`;
		if (seconds > 1) formattedTime += 's';
	}

	if (formattedTime === '') {
		formattedTime = '0sec';
	}

	return formattedTime;
};

const parseTimeSpent = (timeStr: string): number => {
	if (!timeStr || timeStr === '0sec') return 0;

	let totalSeconds = 0;
	const parts = timeStr.split(':');

	parts.forEach((part) => {
		if (part.includes('day')) {
			const days = parseInt(part, 10);
			totalSeconds += days * 24 * 60 * 60;
		} else if (part.includes('hr')) {
			const hours = parseInt(part, 10);
			totalSeconds += hours * 60 * 60;
		} else if (part.includes('min')) {
			const minutes = parseInt(part, 10);
			totalSeconds += minutes * 60;
		} else if (part.includes('sec')) {
			const seconds = parseInt(part, 10);
			totalSeconds += seconds;
		}
	});

	return totalSeconds;
};

const formatDuration = (seconds: number): string => {
	if (seconds < 0) {
		throw new Error('Duration cannot be negative');
	}

	const hours = Math.floor(seconds / 3600); // Convert to hours
	const remainingSeconds = seconds % 3600;
	const minutes = Math.floor(remainingSeconds / 60); // Convert remaining to minutes
	const secs = Math.floor(remainingSeconds % 60); // Remaining seconds

	if (hours > 0) {
		// Format as HH:MM:SS (e.g., 01:20:08)
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	} else if (minutes > 0) {
		// Format as MM:SS (e.g., 20:20)
		return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	} else {
		// Format as SS (e.g., 00:30, but ensure at least MM:SS for consistency)
		return `00:${String(secs).padStart(2, '0')}`;
	}
};

const generateOtp = () => {
	return otpGenerator.generate(6, {
		digits: true,
		upperCaseAlphabets: false,
		specialChars: false,
		lowerCaseAlphabets: false,
	});
};

// Cache token family in Redis
const cacheTokenFamily = async (family: ITokenFamily): Promise<void> => {
	const key = getTokenFamilyKey(family.familyId);
	await redisConnection.setex(key, 3600, JSON.stringify(family)); // 1 hour cache
};

// Get token family from cache or DB
const getTokenFamily = async (familyId: string): Promise<ITokenFamily | null> => {
	try {
		const cached = await redisConnection.get(getTokenFamilyKey(familyId));
		if (cached) {
			return JSON.parse(cached);
		}

		const family = await tokenFamilyRepository.findActiveFamily(familyId);
		if (family) {
			await cacheTokenFamily(family);
		}
		return family;
	} catch (error) {
		console.error('Error getting token family:', error);
		return await tokenFamilyRepository.findActiveFamily(familyId);
	}
};

// Cache used token for grace period handling
const cacheUsedToken = async (tokenHash: string, newToken: string, userId: string): Promise<void> => {
	const key = getUsedTokenKey(tokenHash);
	const data = JSON.stringify({
		timestamp: Date.now(),
		newToken,
		userId,
	});
	await redisConnection.setex(key, 300, data); // 5 minutes cache
};

// Get cached used token data
const getCachedUsedToken = async (
	tokenHash: string
): Promise<{ timestamp: number; newToken: string; userId: string } | null> => {
	try {
		const cached = await redisConnection.get(getUsedTokenKey(tokenHash));
		return cached ? JSON.parse(cached) : null;
	} catch (error) {
		console.error('Error getting cached used token:', error);
		return null;
	}
};

// Invalidate token family in both cache and DB
const invalidateTokenFamily = async (familyId: string): Promise<void> => {
	try {
		await redisConnection.del(getTokenFamilyKey(familyId));

		await tokenFamilyRepository.invalidateFamily(familyId);
	} catch (error) {
		console.error('Error invalidating token family:', error);
		throw new AppError('Failed to invalidate session', 500);
	}
};

// Invalidate all user token families
const invalidateUserTokenFamilies = async (userId: string): Promise<void> => {
	try {
		// Remove user families cache
		await redisConnection.del(getUserFamiliesKey(userId));

		// This is expensive but necessary for security
		// In a high-traffic app, consider a more efficient approach
		const keys = await redisConnection.keys(`token_family:*`);
		const pipeline = redisConnection.pipeline();

		for (const key of keys) {
			const cached = await redisConnection.get(key);
			if (cached) {
				const family: ITokenFamily = JSON.parse(cached);
				if (family.userId === userId) {
					pipeline.del(key);
				}
			}
		}
		await pipeline.exec();

		// Update database
		await tokenFamilyRepository.invalidateUserFamilies(userId);
	} catch (error) {
		console.error('Error invalidating user token families:', error);
		throw new AppError('Failed to invalidate user sessions', 500);
	}
};

const extractTokenFamily = (refreshToken: string): string | null => {
	try {
		// Decode without verification (we just need the payload data)
		const decoded = jwt.decode(refreshToken) as RefreshTokenPayload;
		return decoded?.tokenFamily || null;
	} catch (error) {
		console.error('Error extracting token family:', error);
		return null;
	}
};

const getRefreshTokenFromRequest = (req: Request): string | null => {
	return req.cookies?.refreshToken || req.headers['x-refresh-token'] || null;
};

const calculateFee = (amount: number) => {
	const BASE_FEE = 10; // ₦10
	const PERCENTAGE = 0.005; // 0.5%
	const CAP = 50; // Maximum ₦50

	const percentageFee = amount * PERCENTAGE;
	const totalFee = Math.min(BASE_FEE + percentageFee, CAP);

	return Math.round(totalFee * 100) / 100;
};

const sendOtpEmail = async (email: string, name: string, otp: string): Promise<void> => {
	const emailData: OtpEmailData = {
		to: email,
		priority: 'high',
		name,
		otp,
	};

	addEmailToQueue({
		type: 'otpEmail',
		data: emailData,
	});
};

const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
	const emailData: WelcomeEmailData = {
		to: email,
		priority: 'high',
		name,
	};

	addEmailToQueue({
		type: 'welcomeEmail',
		data: emailData,
	});
};

const sendLoginEmail = async (email: string, name: string, time: string): Promise<void> => {
	const emailData: LoginEmailData = {
		to: email,
		priority: 'high',
		name,
		time,
	};

	addEmailToQueue({
		type: 'loginEmail',
		data: emailData,
	});
};

const sendForgotPasswordEmail = async (email: string, name: string, resetLink: string): Promise<void> => {
	const emailData: ForgotPasswordData = {
		to: email,
		priority: 'high',
		name,
		resetLink,
	};

	addEmailToQueue({
		type: 'forgotPassword',
		data: emailData,
	});
};

const sendResetPasswordEmail = async (email: string, name: string): Promise<void> => {
	const emailData: ResetPasswordData = {
		to: email,
		priority: 'high',
		name,
	};

	addEmailToQueue({
		type: 'resetPassword',
		data: emailData,
	});
};

const sendOtpSms = async (
	phone: string,
	otp: string,
	channel: 'generic' | 'dnd' | 'whatsapp' = 'dnd'
): Promise<ISmsResult> => {
	try {
		const result = await smsService.sendOtpSms({
			phone,
			otp,
			channel,
		});

		if (!result.success) {
			console.error(`Failed to send OTP to ${phone}:`, result.error);
		}

		return result;
	} catch (error) {
		console.error('Error sending OTP SMS:', error);
		return {
			success: false,
			error: 'Failed to send OTP',
		};
	}
};

/**
 * Send transaction alert SMS
 */
const sendTransactionAlertSms = async (
	phone: string,
	amount: number,
	type: 'credit' | 'debit',
	balance: number,
	currency: string = 'NGN'
): Promise<ISmsResult> => {
	try {
		const result = await smsService.sendTransactionAlert(phone, amount, type, balance, currency);

		if (!result.success) {
			console.error(`Failed to send transaction alert to ${phone}:`, result.error);
		}

		return result;
	} catch (error) {
		console.error('Error sending transaction alert:', error);
		return {
			success: false,
			error: 'Failed to send transaction alert',
		};
	}
};

/**
 * Validate and format phone number
 */
const validateAndFormatPhone = (
	phone: string
): {
	isValid: boolean;
	formatted: string;
	error?: string;
} => {
	if (!phone) {
		return {
			isValid: false,
			formatted: '',
			error: 'Phone number is required',
		};
	}

	const isValid = smsService.validatePhone(phone);

	if (!isValid) {
		return {
			isValid: false,
			formatted: '',
			error: 'Invalid Nigerian phone number format',
		};
	}

	const formatted = smsService.formatPhone(phone);

	return {
		isValid: true,
		formatted,
	};
};


export {
	dateFromString,
	generateRandom6DigitKey,
	generateRandomBase32,
	generateRandomString,
	hashPassword,
	comparePassword,
	toJSON,
	parseTokenDuration,
	parseTokenDurationToSeconds,
	isMobile,
	setCookie,
	createToken,
	verifyToken,
	isValidFileNameAwsUpload,
	isValidPhotoNameAwsUpload,
	generateAccessToken,
	generateRefreshToken,
	generateTokenFamily,
	getDomainReferer,
	generateRandomCode,
	formatTimeSpent,
	parseTimeSpent,
	formatDuration,
	generateOtp,
	sendOtpEmail,
	sendLoginEmail,
	sendWelcomeEmail,
	sendForgotPasswordEmail,
	sendResetPasswordEmail,
	getTokenFamilyKey,
	getUsedTokenKey,
	getUserFamiliesKey,
	hashToken,
	cacheTokenFamily,
	getTokenFamily,
	cacheUsedToken,
	getCachedUsedToken,
	invalidateTokenFamily,
	invalidateUserTokenFamilies,
	extractTokenFamily,
	getRefreshTokenFromRequest,
	calculateFee,
	sendOtpSms,
	sendTransactionAlertSms,
	validateAndFormatPhone,
};
