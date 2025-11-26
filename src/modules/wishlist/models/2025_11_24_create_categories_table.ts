import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('categories', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name', 100).notNullable();
		table.boolean('isActive').defaultTo(true);
		table.timestamps(true, true);

		table.unique(['name']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('categories');
}
