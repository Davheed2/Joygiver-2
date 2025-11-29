import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('curated_items', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name', 255).notNullable();
		table.string('imageUrl').nullable();
		table.decimal('price', 12, 2).notNullable();
		table.integer('popularity').defaultTo(0);
		table.boolean('isActive').defaultTo(true);
		table.enum('itemType', ['global', 'custom']).notNullable();
		table.enum('gender', ['male', 'female', 'prefer_not_to_say']).nullable();
		table.boolean('isPublic').defaultTo(false);
		table.uuid('categoryId').notNullable().references('id').inTable('categories').onDelete('CASCADE');
		table.uuid('createdBy').nullable().references('id').inTable('users').onDelete('SET NULL');
		table.timestamps(true, true);

		table.index('categoryId');
		table.index('isActive');
		table.index('popularity');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('curated_items');
}
