import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('payout_methods', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.string('accountName', 255).notNullable();
		table.string('accountNumber', 10).notNullable();
		table.string('bankName', 255).notNullable();
		table.string('bankCode', 10).notNullable();
		table.string('bvn', 11).nullable();
		table.string('recipientCode').nullable();
		table.boolean('isVerified').defaultTo(false);
		table.boolean('isPrimary').defaultTo(false);
		table.timestamps(true, true);

		table.index(['userId']);
		table.index(['accountNumber', 'bankCode']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('payout_methods');
}
