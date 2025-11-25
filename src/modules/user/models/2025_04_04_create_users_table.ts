import { Knex } from 'knex';
import { Role } from '../../../common/constants';

export async function up(knex: Knex): Promise<void> {
	return knex.schema.createTable('users', (table) => {
		table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
		table.string('email').nullable().unique();
		table.string('firstName').nullable();
		table.string('lastName').nullable();
		table.string('username').notNullable().defaultTo('');
		table.string('password').notNullable().defaultTo('');
		table.timestamp('lastActive').nullable();
		table.string('photo').nullable();
		table.enum('role', Object.values(Role)).defaultTo(Role.User);
		table.string('ipAddress').nullable();
		table.string('gender').notNullable().defaultTo('');
		table.string('dob').notNullable().defaultTo('');
		table.string('phone').notNullable().defaultTo('');
		table.boolean('isRegistrationComplete').defaultTo(false);
		table.integer('loginRetries').defaultTo(0);
		table.string('otp').nullable();
		table.timestamp('otpExpires').nullable();
		table.integer('otpRetries').defaultTo(0);
		table.integer('passwordResetRetries').defaultTo(0);
		table.string('passwordResetToken');
		table.timestamp('passwordResetExpires');
		table.timestamp('passwordChangedAt');
		table.boolean('isSuspended').defaultTo(false);
		table.boolean('isDeleted').defaultTo(false);
		table.timestamp('lastLogin').defaultTo(knex.fn.now());
		table.uuid('referredBy').nullable().references('id').inTable('users').onDelete('SET NULL');
		table.integer('referralCount').notNullable().defaultTo(0);
		table.timestamps(true, true);
	});
}

export async function down(knex: Knex): Promise<void> {
	return knex.schema.dropTable('users');
}
