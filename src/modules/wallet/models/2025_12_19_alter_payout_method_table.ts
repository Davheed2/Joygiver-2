import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.table('payout_methods', (table) => {
		table.boolean('isNormalTransfer').defaultTo(false).notNullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.table('payout_methods', (table) => {
		table.dropColumn('isNormalTransfer');
	});
}
