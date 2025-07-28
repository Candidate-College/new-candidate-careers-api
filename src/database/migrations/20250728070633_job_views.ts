import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('job_views', table => {
    table.increments('id').primary();
    table.bigInteger('job_posting_id').unsigned().notNullable();
    table.string('ip_address', 45).notNullable();
    table.text('user_agent').nullable();
    table.string('referrer', 1000).nullable();
    table.string('session_id', 255).nullable();
    table.timestamp('viewed_at').notNullable();

    // Foreign key constraint to job_postings table
    table
      .foreign('job_posting_id')
      .references('id')
      .inTable('job_postings')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['job_posting_id'], 'idx_job_views_job_posting_id');
    table.index(['ip_address'], 'idx_job_views_ip_address');
    table.index(['viewed_at'], 'idx_job_views_viewed_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('job_views');
}
