import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.string('name', 255).notNullable();
    table
      .bigInteger('role_id')
      .unsigned()
      .references('id')
      .inTable('roles')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table.enum('status', ['active', 'inactive', 'suspended']).defaultTo('active');
    table.timestamp('email_verified_at').nullable();
    table.timestamp('last_login_at').nullable();

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index(['email'], 'idx_users_email');
    table.index(['uuid'], 'idx_users_uuid');
    table.index(['role_id'], 'idx_users_role_id');
    table.index(['status'], 'idx_users_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
