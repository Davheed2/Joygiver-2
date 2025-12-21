import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('item_withdrawals', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('wishlistItemId').notNullable().references('id').inTable('wishlist_items').onDelete('CASCADE');
		table.uuid('wishlistId').notNullable().references('id').inTable('wishlists').onDelete('CASCADE');
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.uuid('walletId').notNullable().references('id').inTable('wallets').onDelete('CASCADE');

		table.decimal('amount', 15, 2).notNullable();
		table.enum('status', ['pending', 'completed', 'failed']).notNullable().defaultTo('pending');
		table.string('reference').unique().notNullable();
		table.text('note').nullable();

		table.timestamp('processedAt').nullable();
		table.timestamps(true, true);

		table.index(['wishlistItemId']);
		table.index(['userId']);
		table.index(['status']);
		table.index(['created_at']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('item_withdrawals');
}
