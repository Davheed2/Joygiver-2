import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wishlist_template_items', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name', 255).notNullable();
		table.string('imageUrl');
		table.decimal('price', 12, 2).notNullable();
		table.uuid('wishlistTemplateId').notNullable().references('id').inTable('wishlist_templates').onDelete('CASCADE');
		table.uuid('curatedItemId').nullable().references('id').inTable('curated_items').onDelete('SET NULL');
		table.uuid('categoryId').nullable().references('id').inTable('categories').onDelete('SET NULL');
		table.timestamps(true, true);

		table.index('wishlistTemplateId');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wishlist_template_items');
}
