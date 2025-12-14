import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wallet_transactions', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.uuid('walletId').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
		table.enum('type', ['contribution', 'withdrawal', 'refund', 'fee']).notNullable();
		table.decimal('amount', 15, 2).notNullable();
		table.decimal('balanceBefore', 15, 2).notNullable();
		table.decimal('balanceAfter', 15, 2).notNullable();
		table.string('reference').notNullable();
		table.text('description').nullable();
		table.jsonb('metadata').nullable();
		table.timestamps(true, true);

		table.index(['userId']);
		table.index(['walletId']);
		table.index(['type']);
		table.index(['reference']);
		table.index(['created_at']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wallet_transactions');
}
