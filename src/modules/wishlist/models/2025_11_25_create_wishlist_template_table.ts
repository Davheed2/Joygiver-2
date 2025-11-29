import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wishlist_templates', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name', 255).notNullable();
		table.text('description').nullable();
		table.string('emoji', 255).nullable();
		table.string('colorTheme', 255).nullable();

		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.timestamps(true, true);

		table.index('userId');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wishlist_templates');
}
