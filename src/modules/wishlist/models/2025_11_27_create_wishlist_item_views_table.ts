import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wishlist_item_views', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('wishlistId').notNullable().references('id').inTable('wishlists').onDelete('CASCADE');
        table.uuid('wishlistItemId').notNullable().references('id').inTable('wishlist_items').onDelete('CASCADE');
		table.string('ipAddress', 45);
		table.text('userAgent');
		table.text('referrer');
		table.timestamp('viewedAt').defaultTo(knex.fn.now());

		table.index('wishlistId');
        table.index('wishlistItemId');
		table.index('viewedAt');
		table.index(['wishlistId', 'ipAddress']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wishlist_item_views');
}
