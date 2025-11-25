import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { friendsRepository, referralRepository } from '../repository';

export class FriendsController {
	getFriendsWishlists = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		const friendsWishlists = await friendsRepository.getFriendsWishlists(user.id);

		return AppResponse(res, 200, toJSON(friendsWishlists), 'Friends wishlists retrieved successfully');
	});

	getFriendsList = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { page = 1, limit = 50 } = req.query;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		const pageNum = parseInt(page as string, 10);
		const limitNum = parseInt(limit as string, 10);

		const friendsList = await friendsRepository.getFriendsList(user.id, pageNum, limitNum);

		return AppResponse(res, 200, toJSON([friendsList]), 'Friends list retrieved successfully');
	});

	addFriend = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { identifier } = req.body;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		if (!identifier) {
			throw new AppError('Email or referral code is required', 400);
		}

		await friendsRepository.addFriend(user.id, identifier);

		return AppResponse(res, 201, null, 'Friend added successfully');
	});

	removeFriend = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { friendId } = req.body;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		if (!friendId) {
			throw new AppError('Friend ID is required', 400);
		}

		await friendsRepository.removeFriend(user.id, friendId);

		return AppResponse(res, 200, null, 'Friend removed successfully');
	});

	getReferralStats = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		const stats = await friendsRepository.getReferralStats(user.id);

		return AppResponse(res, 200, toJSON([stats]), 'Referral stats retrieved successfully');
	});

	getMyReferralCode = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		const referralCode = await referralRepository.getUserReferralCodes(user.id);
		if (!referralCode || referralCode.length === 0) {
			throw new AppError('No referral code found', 404);
		}

		return AppResponse(res, 200, toJSON(referralCode), 'Referral codes retrieved successfully');
	});
}

export const friendsController = new FriendsController();
