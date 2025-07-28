import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('activity_logs', table => {
    table.increments('id').primary();
    table.bigInteger('user_id').unsigned().nullable();
    table.string('action', 100).notNullable();
    table.string('subject_type', 100).notNullable();
    table.bigInteger('subject_id').notNullable();
    table.text('description').notNullable();
    table.json('old_values').nullable();
    table.json('new_values').nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.timestamp('created_at').notNullable();

    // Foreign key constraint to users table
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['user_id'], 'idx_activity_logs_user_id');
    table.index(['action'], 'idx_activity_logs_action');
    table.index(['subject_type', 'subject_id'], 'idx_activity_logs_subject');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('activity_logs');
}
