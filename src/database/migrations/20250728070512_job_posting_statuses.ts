import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('job_posting_statuses', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();

    table.timestamps(true, true);

    // Indexes
    table.index(['name'], 'idx_job_posting_statuses_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('job_posting_statuses');
}
