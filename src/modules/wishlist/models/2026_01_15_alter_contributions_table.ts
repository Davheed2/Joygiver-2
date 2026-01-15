import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.alterTable('contributions', (table) => {
		table.decimal('platformFee', 15, 2).notNullable().defaultTo(0);
		table.decimal('grossAmount', 15, 2).notNullable().defaultTo(0);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable('contributions', (table) => {
		table.dropColumn('platformFee');
		table.dropColumn('grossAmount');
	});
}
