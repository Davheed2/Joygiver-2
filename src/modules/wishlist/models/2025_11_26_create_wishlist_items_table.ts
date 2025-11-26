import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wishlist_items', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name', 255).notNullable();
		table.string('imageUrl');
		table.decimal('price', 12, 2).notNullable();

		table.integer('quantity').defaultTo(1);

		table.decimal('amountContributed', 12, 2).defaultTo(0);
		// table.integer('priority').defaultTo(999);

		table.decimal('totalContributed', 15, 2).notNullable().defaultTo(0);
		table.integer('contributorsCount').notNullable().defaultTo(0);
		table.integer('viewsCount').defaultTo(0);
		table.boolean('isFunded').defaultTo(false); // true when totalContributed >= price
		table.timestamp('fundedAt').nullable();
		table.string('uniqueLink', 250).notNullable();

		table.decimal('availableBalance', 15, 2).notNullable().defaultTo(0);
		table.decimal('pendingBalance', 15, 2).notNullable().defaultTo(0);
		table.decimal('withdrawnAmount', 15, 2).notNullable().defaultTo(0);
		table.boolean('isWithdrawable').defaultTo(true);
		table.timestamp('lastWithdrawal').nullable();

		table.uuid('wishlistId').notNullable().references('id').inTable('wishlists').onDelete('CASCADE');
		table.uuid('curatedItemId').nullable().references('id').inTable('curated_items').onDelete('SET NULL');
		table.uuid('categoryId').nullable().references('id').inTable('categories').onDelete('SET NULL');
		table.timestamps(true, true);

		table.index('wishlistId');
		table.index('curatedItemId');
		table.index('priority');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wishlist_items');
}
