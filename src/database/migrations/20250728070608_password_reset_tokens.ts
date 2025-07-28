import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('password_reset_tokens', table => {
    table.string('email', 255).primary();
    table.string('token', 255).notNullable();
    table.timestamp('created_at').notNullable();

    // Foreign key constraint to users table
    table
      .foreign('email')
      .references('email')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['token'], 'idx_password_reset_tokens_token');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('password_reset_tokens');
}
