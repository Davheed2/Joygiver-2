import { ContributionStatus } from '../../../common/constants';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('contributions', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('wishlistId').notNullable().references('id').inTable('wishlists').onDelete('CASCADE');
		table.uuid('wishlistItemId').references('id').inTable('wishlist_items').onDelete('SET NULL');
		table.uuid('userId').nullable().references('id').inTable('users').onDelete('SET NULL');
		// Contributor details (for guests or users)
		table.string('contributorName', 255).notNullable();
		table.string('contributorEmail').notNullable();
		table.string('contributorPhone', 20).nullable();
		table.text('message').nullable();
		table.boolean('isAnonymous').defaultTo(false);
		// Payment details
		table.decimal('amount', 15, 2).notNullable();
		table.enum('status', Object.values(ContributionStatus)).defaultTo(ContributionStatus.PENDING);
		table.string('paymentReference', 255).notNullable().unique();
		table.string('paymentMethod', 50).notNullable();
		table.string('paystackReference').nullable();
		// Reply from wishlist owner
		table.text('ownerReply').nullable();
		table.timestamp('repliedAt').nullable();
		// Metadata
		table.jsonb('metadata').nullable();
		table.timestamp('paidAt').nullable();
		table.timestamps(true, true);

		table.uuid('receiverId').notNullable().references('id').inTable('users').onDelete('CASCADE');

		table.index('wishlistId');
		table.index('wishlistItemId');
		table.index('paymentReference');
		table.index(['wishlistId', 'status']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('contributions');
}
