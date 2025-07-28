import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sessions', table => {
    table.string('id', 255).primary();
    table.bigInteger('user_id').unsigned().nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.text('payload').notNullable();
    table.integer('last_activity').notNullable();

    // Foreign key constraint to users table
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['user_id'], 'idx_sessions_user_id');
    table.index(['last_activity'], 'idx_sessions_last_activity');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sessions');
}
