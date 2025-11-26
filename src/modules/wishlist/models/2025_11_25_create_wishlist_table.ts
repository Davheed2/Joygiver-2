import { WishlistStatus } from '../../../common/constants';
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('wishlists', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('name', 255).notNullable();
		table.text('description').nullable();
		table.string('uniqueLink', 255).notNullable().unique();
		table.string('emoji', 255).nullable();
		table.string('colorTheme', 255).nullable();
		table.enum('status', Object.values(WishlistStatus)).defaultTo(WishlistStatus.ACTIVE);


        

		table.decimal('totalContributed', 12, 2).defaultTo(0);
		table.integer('contributorsCount').defaultTo(0);


		table.integer('viewsCount').defaultTo(0);
		table.boolean('isPublic').defaultTo(true);


		table.string('celebrationEvent', 100).notNullable();
		table.date('celebrationDate').notNullable();
		table.timestamp('expiresAt');


		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.timestamps(true, true);

		table.index('userId');
		table.index('uniqueLink');
		table.index('status');
		table.index('celebrationDate');
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('wishlists');
}
