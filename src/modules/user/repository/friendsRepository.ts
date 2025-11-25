import { knexDb } from '@/common/config';
import { IFriendship, IFriendWishlist, IWishlist } from '@/common/interfaces';
import { AppError } from '@/common/utils';
import { DateTime } from 'luxon';
import { userRepository } from './userRepository';
import { wishlistRepository } from '@/modules/wishlist/repository';
import { referralRepository } from './referralRepository';

class FriendsRepository {
	create = async (payload: Partial<IFriendship>) => {
		return await knexDb.table('friendships').insert(payload).returning('*');
	};

	createFriendship = async (userId: string, friendId: string, source = 'referral') => {
		const friendships = await knexDb.transaction(async (trx) => {
			// User -> Friend
			const [friendship1] = await trx('friendships')
				.insert({
					userId,
					friendId,
					status: 'accepted',
					source,
				})
				.returning('*');

			// Friend -> User (reciprocal)
			const [friendship2] = await trx('friendships')
				.insert({
					userId: friendId,
					friendId: userId,
					status: 'accepted',
					source,
				})
				.returning('*');

			return [friendship1, friendship2];
		});

		return friendships;
	};

	findById = async (id: string): Promise<IFriendship | null> => {
		return await knexDb.table('friendships').where({ id }).first();
	};

	update = async (id: string, payload: Partial<IFriendship>): Promise<IFriendship[]> => {
		return await knexDb('friendships')
			.where({ id })
			.update({ ...payload, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};
	findFriendship = async (userId: string, friendId: string): Promise<IFriendship | null> => {
		return await knexDb('friendships').where({ userId, friendId }).first();
	};

	areFriends = async (userId: string, friendId: string): Promise<boolean> => {
		const friendship = await knexDb('friendships').where({ userId, friendId, status: 'accepted' }).first();
		return !!friendship;
	};

	// Get all friends for a user
	getFriends = async (userId: string, page = 1, limit = 50) => {
		const offset = (page - 1) * limit;

		return await knexDb('friendships as f')
			.select(
				'u.id',
				'u.firstName',
				'u.lastName',
				'u.email',
				'u.referralCode',
				'f.created_at as friendSince',
				'f.source'
			)
			.join('users as u', 'f.friendId', 'u.id')
			.where('f.userId', userId)
			.where('f.status', 'accepted')
			.orderBy('f.created_at', 'desc')
			.limit(limit)
			.offset(offset);
	};

	countFriends = async (userId: string): Promise<number> => {
		const result = await knexDb('friendships').where({ userId, status: 'accepted' }).count('* as count').first();
		return Number(result?.count || 0);
	};

	getFriendsWithWishlists = async (userId: string) => {
		return await knexDb('friendships as f')
			.select(
				'u.id as friendId',
				'u.firstName',
				'u.lastName',
				'u.email',
				'w.id as wishlistId',
				'w.celebrationEvent',
				'w.celebrationDate',
				'w.uniqueLink',
				'w.status as wishlistStatus',
				'w.totalContributed',
				'w.contributorsCount',
				'w.viewsCount',
				knexDb.raw('COUNT(wi.id) as itemsCount'),
				knexDb.raw('SUM(wi.price) as totalValue')
			)
			.join('users as u', 'f.friendId', 'u.id')
			.join('wishlists as w', 'u.id', 'w.userId')
			.leftJoin('wishlist_items as wi', 'w.id', 'wi.wishlistId')
			.where('f.userId', userId)
			.where('f.status', 'accepted')
			.where('w.status', 'active')
			.groupBy(
				'u.id',
				'u.firstName',
				'u.lastName',
				'u.email',
				'w.id',
				'w.celebrationEvent',
				'w.celebrationDate',
				'w.uniqueLink',
				'w.status',
				'w.totalContributed',
				'w.contributorsCount',
				'w.viewsCount'
			)
			.orderBy('w.celebrationDate', 'asc');
	};

	getTopWishlistItems = async (wishlistId: string, limit = 3) => {
		return await knexDb('wishlist_items')
			.select('id', 'name', 'imageUrl', 'price')
			.where({ wishlistId })
			.orderBy('priority', 'asc')
			.limit(limit);
	};

	removeFriendship = async (userId: string, friendId: string) => {
		await knexDb.transaction(async (trx) => {
			await trx('friendships').where({ userId, friendId }).delete();

			await trx('friendships').where({ userId: friendId, friendId: userId }).delete();
		});
	};

	updateStatus = async (userId: string, friendId: string, status: 'accepted' | 'blocked') => {
		return await knexDb('friendships')
			.where({ userId, friendId })
			.update({ status, updated_at: DateTime.now().toJSDate() })
			.returning('*');
	};

	addFriendViaReferral = async (newUserId: string, referralCode: string): Promise<void> => {
		const referrer = await referralRepository.findByCode(referralCode);
		if (!referrer) {
			throw new AppError('Invalid referral code', 400);
		}
		if (referrer.userId === newUserId) {
			return;
		}

		const existingFriendship = await this.findFriendship(newUserId, referrer.userId);
		if (existingFriendship) {
			return;
		}

		await this.createFriendship(newUserId, referrer.userId, 'referral');

		await userRepository.incrementReferralCount(referrer.userId);

		// await userRepository.update(newUserId, {
		// 	referredBy: referrer.userId,
		// });

		console.log(`✅ Friendship created: ${newUserId} ↔ ${referrer.userId} (via referral)`);
	};

	getFriendsList = async (userId: string, page = 1, limit = 50) => {
		const friends = await this.getFriends(userId, page, limit);
		const total = await this.countFriends(userId);

		// Get wishlist count for each friend
		const friendsWithWishlistCount = await Promise.all(
			friends.map(async (friend) => {
				const wishlists = await wishlistRepository.findByUserId(friend.id);
				const activeWishlists = wishlists.filter((w: IWishlist) => w.status === 'active');

				return {
					id: friend.id,
					name: `${friend.firstName} ${friend.lastName}`,
					email: friend.email,
					initials: `${friend.firstName[0]}${friend.lastName[0]}`.toUpperCase(),
					hasActiveWishlist: activeWishlists.length > 0,
					wishlistCount: wishlists.length,
					friendSince: friend.friendSince,
				};
			})
		);

		return {
			totalFriends: total,
			friends: friendsWithWishlistCount,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	};

	getFriendsWishlists = async (userId: string): Promise<IFriendWishlist[]> => {
		const friendsWishlists = await this.getFriendsWithWishlists(userId);

		const result: IFriendWishlist[] = [];

		for (const fw of friendsWishlists) {
			// Get top 3 items for preview
			const topItems = await this.getTopWishlistItems(fw.wishlistId, 3);

			// Check if user is online (mock for now - can integrate with real presence system)
			const isOnline = false; // TODO: Implement real presence tracking
			const lastActive = new Date(); // TODO: Get from user activity tracking

			result.push({
				friendId: fw.friendId,
				friendName: `${fw.firstName} ${fw.lastName}`,
				friendInitials: `${fw.firstName[0]}${fw.lastName[0]}`.toUpperCase(),
				isOnline,
				lastActive,
				wishlist: {
					id: fw.wishlistId,
					celebrationEvent: fw.celebrationEvent,
					celebrationDate: fw.celebrationDate,
					itemsCount: Number(fw.itemsCount),
					totalValue: Number(fw.totalValue || 0),
					topItems: topItems.map((item) => ({
						id: item.id,
						name: item.name,
						imageUrl: item.imageUrl,
						//emoji: this.getItemEmoji(item.name),
					})),
					uniqueLink: fw.uniqueLink,
				},
			});
		}

		// Sort by celebration date (upcoming first)
		result.sort((a, b) => {
			if (!a.wishlist.celebrationDate) return 1;
			if (!b.wishlist.celebrationDate) return -1;
			return new Date(a.wishlist.celebrationDate).getTime() - new Date(b.wishlist.celebrationDate).getTime();
		});

		return result;
	};

	removeFriend = async (userId: string, friendId: string): Promise<void> => {
		const friendship = await this.findFriendship(userId, friendId);

		if (!friendship) {
			throw new AppError('Friendship not found', 404);
		}

		await this.removeFriendship(userId, friendId);
	};

	// Add friend manually (by email or referral code)
	addFriend = async (userId: string, identifier: string): Promise<void> => {
		let friendId: string;

		if (identifier.includes('@')) {
			const friend = await userRepository.findByEmail(identifier);
			if (!friend) {
				throw new AppError('User not found', 404);
			}
			friendId = friend.id;
		} else {
			const friend = await userRepository.findByReferralCode(identifier);
			if (!friend) {
				throw new AppError('Invalid referral code', 404);
			}
			friendId = friend.id;
		}

		if (friendId === userId) {
			throw new AppError('Cannot add yourself as a friend', 400);
		}

		const existingFriendship = await this.findFriendship(userId, friendId);
		if (existingFriendship) {
			throw new AppError('Already friends', 400);
		}

		await this.createFriendship(userId, friendId, 'manual');

		await userRepository.update(friendId, {
			referredBy: userId,
		});
	};

	getReferralStats = async (userId: string) => {
		const user = await userRepository.findById(userId);
		if (!user) {
			throw new AppError('User not found', 404);
		}

		const referredUsers = await userRepository.findReferredUsers(userId);

		return {
			totalReferrals: user.referralCount,
			referredUsers: referredUsers.map((u) => ({
				name: `${u.firstName} ${u.lastName}`,
				email: u.email,
				joinedAt: u.created_at,
			})),
		};
	};
}

export const friendsRepository = new FriendsRepository();
