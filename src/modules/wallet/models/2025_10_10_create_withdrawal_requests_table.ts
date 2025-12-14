import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('withdrawal_requests', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.uuid('walletId').notNullable().references('id').inTable('wallets').onDelete('CASCADE');
		table.uuid('payoutMethodId').notNullable().references('id').inTable('payout_methods').onDelete('RESTRICT');
		table.decimal('amount', 15, 2).notNullable();
		table.decimal('fee', 15, 2).notNullable().defaultTo(0);
		table.decimal('netAmount', 15, 2).notNullable();
		table
			.enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])
			.notNullable()
			.defaultTo('pending');
		table.string('paymentReference').unique();
		table.string('transferCode').nullable();
		table.text('failureReason').nullable();
		table.timestamp('processedAt').nullable();
		table.timestamps(true, true);

		table.index(['userId']);
		table.index(['walletId']);
		table.index(['status']);
		table.index(['created_at']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('withdrawal_requests');
}
