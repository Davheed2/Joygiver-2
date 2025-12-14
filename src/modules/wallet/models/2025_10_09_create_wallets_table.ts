import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wallets', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.decimal('availableBalance', 15, 2).notNullable().defaultTo(0);
		table.decimal('pendingBalance', 15, 2).notNullable().defaultTo(0);
		table.decimal('totalReceived', 15, 2).notNullable().defaultTo(0);
		table.decimal('totalWithdrawn', 15, 2).notNullable().defaultTo(0);
		table.timestamps(true, true);

		table.unique(['userId']);
		table.index(['userId']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wallets');
}