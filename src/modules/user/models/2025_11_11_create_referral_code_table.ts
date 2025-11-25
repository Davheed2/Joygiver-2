import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('referral_code', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.uuid('userId').notNullable().references('id').inTable('users').onDelete('CASCADE');
		table.string('referralCode').notNullable().unique();
		table.boolean('isUsed').notNullable().defaultTo(false);
		table.uuid('usedByUserId').nullable().references('id').inTable('users').onDelete('SET NULL');
		table.timestamp('usedAt').nullable();
		table.timestamps(true, true);

		// Index for faster lookups
		table.index(['referralCode']);
		table.index(['userId', 'isUsed']);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('referral_code');
}
