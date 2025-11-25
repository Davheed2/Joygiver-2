import { ENVIRONMENT } from '@/common/config';
import type { IUser } from '@/common/interfaces';
import jwt from 'jsonwebtoken';
import AppError from './appError';
import {
	cacheTokenFamily,
	cacheUsedToken,
	generateAccessToken,
	generateRefreshToken,
	generateTokenFamily,
	getCachedUsedToken,
	getTokenFamily,
	hashToken,
	invalidateTokenFamily,
	verifyToken,
} from './helper';
import { EnhancedAuthenticateResult, RefreshTokenPayload } from '../types';
import { tokenFamilyRepository, userRepository } from '@/modules/user/repository';
import { DateTime } from 'luxon';

export const generateTokenPair = async (userId: string, existingFamilyId?: string, version: number = 1) => {
	const accessToken = generateAccessToken(userId);

	let tokenFamily = existingFamilyId;

	if (!tokenFamily) {
		tokenFamily = generateTokenFamily();

		try {
			// Invalidate all existing token families for this user (single session per user)
			//await invalidateUserTokenFamilies(userId);

			// Create new token family
			const [family] = await tokenFamilyRepository.create({ userId, familyId: tokenFamily });
			await cacheTokenFamily(family);
		} catch (error) {
			console.error('Error creating token family:', error);
			// Continue with in-memory approach if DB fails
		}
	}

	const refreshTokenPayload = {
		id: userId,
		tokenFamily,
		version,
	};

	const refreshToken = generateRefreshToken(
		refreshTokenPayload.id,
		refreshTokenPayload.tokenFamily,
		refreshTokenPayload.version
	);

	return { accessToken, refreshToken, tokenFamily };
};

export const authenticate = async ({
	accessToken,
	refreshToken,
	isMobileDevice,
}: {
	accessToken?: string;
	refreshToken?: string;
	isMobileDevice: string;
}): Promise<EnhancedAuthenticateResult> => {
	if (!refreshToken) {
		throw new AppError('Authentication required', 401);
	}

	const handleUserVerification = async (decoded: jwt.JwtPayload): Promise<IUser> => {
		const currentUser = await userRepository.findById(decoded.id);

		if (!currentUser) throw new AppError('User not found', 404);
		if (currentUser.isSuspended) throw new AppError('Your account is currently suspended', 401);
		if (currentUser.isDeleted) throw new AppError('Your account has been deleted', 404);

		// check if user has changed password after the token was issued
		// if so, invalidate the token
		if (
			currentUser.passwordChangedAt &&
			DateTime.fromISO(currentUser.passwordChangedAt.toISOString()).toMillis() >
				DateTime.fromMillis((decoded.iat ?? 0) * 1000).toMillis()
		) {
			throw new AppError('Password changed since last login. Please log in again!', 401);
		}

		try {
			await userRepository.update(currentUser.id, { lastActive: new Date() });
			//console.log('✅ Updated lastActive for user:', test);
		} catch (updateError) {
			console.error('❌ Error updating lastActive:', updateError);
			// Don't throw - continue with authentication even if update fails
		}
		// csrf protection
		// browser client fingerprinting
		return currentUser;
	};

	const handleTokenRefresh = async (): Promise<EnhancedAuthenticateResult> => {
		try {
			const decodeRefreshToken = (await verifyToken(
				refreshToken,
				ENVIRONMENT.JWT.REFRESH_SECRET!
			)) as RefreshTokenPayload;
			if (decodeRefreshToken.type !== 'refresh' || !decodeRefreshToken.tokenFamily) {
				throw new AppError('Invalid refresh token format', 401);
			}

			return await processValidRefreshToken(decodeRefreshToken);
		} catch (error) {
			// Handle expired tokens with grace period
			if (error instanceof jwt.TokenExpiredError) {
				console.log('Refresh token expired, checking grace period for mobile devices alone...');
				// You may need to pass the request object to isMobile, e.g., isMobile(req) === 'mobile'
				if (isMobileDevice === 'mobile') {
					return await handleExpiredTokenWithGrace(refreshToken);
				}

				return await handleExpiredTokenWithGrace(refreshToken);
			}
			if (error instanceof jwt.JsonWebTokenError) {
				throw new AppError('Invalid refresh token, please log in again', 401);
			}

			if (error instanceof AppError) {
				throw error;
			}

			console.error('Unexpected refresh token error:', error);
			throw new AppError('Session expired, please log in again', 401);
		}
	};

	// Handle expired tokens with grace period
	const handleExpiredTokenWithGrace = async (expiredToken: string): Promise<EnhancedAuthenticateResult> => {
		try {
			const decoded = jwt.decode(expiredToken) as RefreshTokenPayload;

			if (!decoded || !decoded.exp || !decoded.id || !decoded.tokenFamily) {
				throw new AppError('Invalid token format', 401);
			}

			// Check if token family is still valid
			const tokenFamily = await getTokenFamily(decoded.tokenFamily);
			if (!tokenFamily) {
				throw new AppError('Session has been revoked, please log in again', 401);
			}

			const now = Math.floor(Date.now() / 1000);
			const expiredAt = decoded.exp;
			// console.log(`Token expired at ${new Date(expiredAt * 1000).toISOString()}`);
			const gracePeriodDays = 30;
			const gracePeriodSeconds = gracePeriodDays * 24 * 60 * 60;

			const isWithinGracePeriod = now - expiredAt <= gracePeriodSeconds;

			if (!isWithinGracePeriod) {
				// console.log(`Token expired ${Math.floor((now - expiredAt) / (24 * 60 * 60))} days ago, beyond grace period`);

				await invalidateTokenFamily(decoded.tokenFamily);
				throw new AppError('Session expired too long ago, please log in again', 401);
			}

			//console.log('Token within grace period, renewing session...');

			const currentUser = await userRepository.findById(decoded.id);
			if (!currentUser) throw new AppError('User not found', 404);
			if (currentUser.isSuspended) throw new AppError('Your account is currently suspended', 401);
			if (currentUser.isDeleted) throw new AppError('Your account has been deleted', 404);

			const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokenPair(
				currentUser.id,
				undefined,
				1
			);

			// Cache for network failure handling
			const tokenHash = hashToken(expiredToken);
			await cacheUsedToken(tokenHash, newRefreshToken, currentUser.id);

			return {
				accessToken: newAccessToken,
				newRefreshToken,
				currentUser,
				tokenRotated: true,
			};
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}
			console.error('Grace period handling error:', error);
			throw new AppError('Session expired, please log in again', 401);
		}
	};

	const processValidRefreshToken = async (
		decodeRefreshToken: RefreshTokenPayload
	): Promise<EnhancedAuthenticateResult> => {
		const tokenFamily = await getTokenFamily(decodeRefreshToken.tokenFamily);
		if (!tokenFamily) {
			throw new AppError('Session has been revoked, please log in again', 401);
		}

		// Check if this token was already used (network failure handling)
		const tokenHash = hashToken(refreshToken);
		const cachedResult = await getCachedUsedToken(tokenHash);
		if (cachedResult) {
			// console.log('Returning cached token for network retry');
			const currentUser = await userRepository.findById(cachedResult.userId);
			if (!currentUser) throw new AppError('User not found', 404);

			return {
				accessToken: generateAccessToken(currentUser.id),
				newRefreshToken: cachedResult.newToken,
				currentUser,
				tokenRotated: true,
			};
		}

		// Verify user exists and is valid
		const currentUser = await userRepository.findById(decodeRefreshToken.id);
		if (!currentUser) throw new AppError('User not found', 404);
		if (currentUser.isSuspended) throw new AppError('Your account is currently suspended', 401);
		if (currentUser.isDeleted) throw new AppError('Your account has been deleted', 404);

		console.log('⏰ Updating lastActive for user (refresh flow):', currentUser.id);
		try {
			await userRepository.update(currentUser.id, { lastActive: new Date() });
			console.log('✅ Updated lastActive (refresh flow)');
		} catch (updateError) {
			console.error('❌ Error updating lastActive:', updateError);
		}

		const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokenPair(
			currentUser.id,
			decodeRefreshToken.tokenFamily,
			decodeRefreshToken.version + 1
		);

		await cacheUsedToken(tokenHash, newRefreshToken, currentUser.id);

		return {
			accessToken: newAccessToken,
			newRefreshToken,
			currentUser,
			tokenRotated: true,
		};
	};

	try {
		if (!accessToken) return await handleTokenRefresh();

		const decodeAccessToken = await verifyToken(accessToken, ENVIRONMENT.JWT.ACCESS_SECRET!);
		const currentUser = await handleUserVerification(decodeAccessToken);

		return { currentUser, tokenRotated: false };
	} catch (error) {
		if ((error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) && refreshToken) {
			try {
				return await handleTokenRefresh();
			} catch (refreshError) {
				console.log('Refresh error:', refreshError);

				// Provide more specific error messages
				if (refreshError instanceof AppError) {
					throw refreshError;
				}

				throw new AppError('Session expired, please log in again', 401);
			}
		}

		if (error instanceof AppError) {
			throw error;
		}

		throw new AppError('An error occurred, please log in again', 401);
	}
};
