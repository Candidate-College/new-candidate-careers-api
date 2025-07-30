import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('email_verification_tokens', table => {
    table.increments('id').primary();
    table.string('token', 255).notNullable().unique();
    table
      .bigInteger('user_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.enum('type', ['email_verification', 'password_reset']).defaultTo('email_verification');
    table.boolean('is_used').defaultTo(false);
    table.timestamp('expires_at').notNullable();
    table.timestamp('used_at').nullable();
    table.string('ip_address', 45).nullable(); // IPv6 support
    table.string('user_agent', 500).nullable();

    table.timestamps(true, true);

    // Indexes for performance and security
    table.index(['token'], 'idx_email_verification_tokens_token');
    table.index(['user_id'], 'idx_email_verification_tokens_user_id');
    table.index(['type'], 'idx_email_verification_tokens_type');
    table.index(['expires_at'], 'idx_email_verification_tokens_expires_at');
    table.index(['is_used'], 'idx_email_verification_tokens_is_used');
    table.index(['created_at'], 'idx_email_verification_tokens_created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('email_verification_tokens');
}
