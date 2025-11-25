import cron from 'node-cron';
import { deviceTokenRepository } from '@/modules/notification/repository';
import { notificationService } from '@/services/notification';
import { knexDb } from '@/common/config';

// Clean up old inactive device tokens every day at 2 AM
export const startDeviceTokenCleanupCron = () => {
	cron.schedule('0 2 * * *', async () => {
		try {
			console.log('Starting token cleanup job...');
			const deleted = await deviceTokenRepository.cleanupInactiveTokens(30);
			console.log(`Token cleanup completed. Deleted ${deleted} tokens.`);
		} catch (error) {
			console.error('Error in token cleanup job:', error);
		}
	});
};

export const notifyInactiveUsersCron = () => {
	// Run every minute:
	// cron.schedule('* * * * *', async () => {
	// For testing (every 30 seconds), uncomment the following and comment out the line above:
	// cron.schedule('*/30 * * * * *', async () => {
	cron.schedule('0 3 * * *', async () => {
		try {
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const inactiveUsers = await knexDb('users').where('lastActive', '<', sevenDaysAgo).select('id');

			const userIds = inactiveUsers.map((u) => u.id);

			if (userIds.length === 0) {
				console.log('No inactive users found');
				return;
			}

			const result = await notificationService.notifyMultipleUsers(
				userIds,
				{
					title: 'We Miss You! 👋',
					body: "It's been a while since we last saw you! Come back to Joygiver and explore new curated gifts and create your wishlist today!",
				},
				{
					type: 'engagement',
					action: 'open_app',
				}
			);

			console.log(`Sent notifications to ${result.successCount} users`);
		} catch (error) {
			console.error('Error notifying inactive users:', error);
		}
	});
};

export const startAllDeviceTokenCrons = () => {
	startDeviceTokenCleanupCron();
	notifyInactiveUsersCron();
};
