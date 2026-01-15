import { Request, Response } from 'express';
import { AppError, AppResponse, toJSON } from '@/common/utils';
import { catchAsync } from '@/middlewares';
import { contributionRepository, wishlistRepository, wishlistViewRepository } from '../repository';
import { IContribution } from '@/common/interfaces';

export class ContributionController {
	initiateContribution = catchAsync(async (req: Request, res: Response) => {
		const { wishlistItemId, contributorName, contributorEmail, contributorPhone, amount, message, isAnonymous } =
			req.body;

		if (!wishlistItemId || !contributorName || !contributorEmail || !amount) {
			throw new AppError('Missing required fields', 400);
		}

		const result = await contributionRepository.initiateContribution({
			wishlistItemId,
			contributorName,
			contributorEmail,
			contributorPhone,
			amount: Number(amount),
			message,
			isAnonymous: isAnonymous || false,
		});

		return AppResponse(res, 200, toJSON([result]), 'Contribution initialized successfully. Please complete payment');
	});

	contributeToAll = catchAsync(async (req: Request, res: Response) => {
		const {
			wishlistId,
			contributorName,
			contributorEmail,
			contributorPhone,
			amount,
			message,
			isAnonymous,
			allocationStrategy = 'priority', // equal, proportional, priority
		} = req.body;

		if (!wishlistId || !contributorName || !contributorEmail || !amount) {
			throw new AppError('Missing required fields', 400);
		}

		if (amount < 100) {
			throw new AppError('Minimum contribution amount is ₦100', 400);
		}

		const result = await contributionRepository.contributeToAll({
			wishlistId,
			contributorName,
			contributorEmail,
			contributorPhone,
			totalAmount: Number(amount),
			message,
			isAnonymous: isAnonymous || false,
			allocationStrategy,
		});

		return AppResponse(
			res,
			200,
			toJSON([result]),
			// 	`Contributing ₦${amount.toLocaleString()} to ${result.contribution.itemsCount} items`
			// );
			`Contributing ₦${result.contribution.netAmount.toLocaleString()} (₦${result.contribution.platformFee.toLocaleString()} fee) to ${result.contribution.itemsCount} items`
		);
	});

	getAllContributionsPerUser = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { page = 1, limit = 20 } = req.query;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		const pageNum = parseInt(page as string, 10);
		const limitNum = parseInt(limit as string, 10);

		const contributions = await contributionRepository.getAllContributionsPerUser(user.id, pageNum, limitNum);

		return AppResponse(res, 200, toJSON(contributions), 'Contributions retrieved successfully');
	});

	getWishlistContributions = catchAsync(async (req: Request, res: Response) => {
		const { page = 1, limit = 20, wishlistId } = req.query;

		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 400);
		}

		const pageNum = parseInt(page as string, 10);
		const limitNum = parseInt(limit as string, 10);

		const contributions = await contributionRepository.getWishlistContributions(
			wishlistId as string,
			pageNum,
			limitNum
		);

		// Filter out anonymous contributors for public view
		const publicContributions = contributions.data.filter((c) => !c.isAnonymous);

		return AppResponse(
			res,
			200,
			toJSON({
				...contributions,
				data: publicContributions,
			}),
			'Contributions retrieved successfully'
		);
	});

	getItemContributions = catchAsync(async (req: Request, res: Response) => {
		const { page = 1, limit = 20, wishlistItemId } = req.query;

		if (!wishlistItemId) {
			throw new AppError('Wishlist item ID is required', 401);
		}

		const pageNum = parseInt(page as string, 10);
		const limitNum = parseInt(limit as string, 10);

		const contributions = await contributionRepository.getItemContributions(
			wishlistItemId as string,
			pageNum,
			limitNum
		);

		// Filter out anonymous for public view
		const publicContributions = contributions.data.filter((c) => !c.isAnonymous);

		return AppResponse(
			res,
			200,
			toJSON({
				...contributions,
				data: publicContributions,
			}),
			'Item contributions retrieved successfully'
		);
	});

	getTopContributors = catchAsync(async (req: Request, res: Response) => {
		const { limit = 10, wishlistId } = req.query;

		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 401);
		}

		const limitNum = parseInt(limit as string, 10);

		const topContributors = await contributionRepository.getTopContributors(wishlistId as string, limitNum);

		return AppResponse(res, 200, toJSON(topContributors), 'Top contributors retrieved successfully');
	});

	trackView = catchAsync(async (req: Request, res: Response) => {
		const { wishlistId, referrer } = req.body;

		if (!wishlistId) {
			throw new AppError('Wishlist ID is required', 400);
		}

		const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
		const userAgent = req.headers['user-agent'];

		await wishlistViewRepository.trackView(wishlistId, {
			ipAddress,
			userAgent,
			referrer,
		});

		return AppResponse(res, 200, null, 'View tracked successfully');
	});

	// ==================== OWNER ENDPOINTS (AUTH REQUIRED) ====================
	replyToContributor = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { ownerReply, contributionId } = req.body;

		if (!user) {
			throw new AppError('Please log in', 401);
		}
		if (!ownerReply) {
			throw new AppError('ownerReply message is required', 400);
		}

		await contributionRepository.replyToContributor(contributionId, user.id, ownerReply);

		return AppResponse(res, 200, null, 'Reply sent successfully');
	});

	getMyWishlistsContributions = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { page = 1, limit = 20 } = req.query;

		if (!user) {
			throw new AppError('Please log in', 401);
		}

		const wishlists = await wishlistRepository.findByUserId(user.id);

		const allContributions: IContribution[] = [];
		for (const wishlist of wishlists) {
			const contributions = await contributionRepository.getWishlistContributions(wishlist.id, 1, 1000);
			allContributions.push(...contributions.data);
		}

		allContributions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

		const start = (Number(page) - 1) * Number(limit);
		const end = start + Number(limit);
		const paginatedData = allContributions.slice(start, end);

		return AppResponse(
			res,
			200,
			toJSON({
				data: paginatedData,
				pagination: {
					page: Number(page),
					limit: Number(limit),
					total: allContributions.length,
					totalPages: Math.ceil(allContributions.length / Number(limit)),
				},
			}),
			'Contributions retrieved successfully'
		);
	});

	// ==================== ADMIN ENDPOINTS ====================
	refundContribution = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { reason, contributionId } = req.body;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}

		if (!reason) {
			throw new AppError('Refund reason is required', 400);
		}

		await contributionRepository.refundContribution(contributionId, reason);

		return AppResponse(res, 200, null, 'Contribution refunded successfully');
	});

	verifyPayment = catchAsync(async (req: Request, res: Response) => {
		const { user } = req;
		const { reference } = req.query;

		if (!user || user.role !== 'admin') {
			throw new AppError('Unauthorized', 403);
		}

		if (!reference) {
			throw new AppError('reference not found', 404);
		}

		const contribution = await contributionRepository.getByReference(reference as string);

		if (!contribution) {
			throw new AppError('Contribution not found', 404);
		}

		return AppResponse(
			res,
			200,
			toJSON({
				status: contribution.status,
				amount: contribution.amount,
				contributorName: contribution.contributorName,
				paidAt: contribution.paidAt,
			}),
			'Payment status retrieved successfully'
		);
	});
}

export const contributionController = new ContributionController();
