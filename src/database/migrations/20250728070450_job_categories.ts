import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('job_categories', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.text('description').nullable();
    table.enum('status', ['active', 'inactive']).defaultTo('active');

    table.timestamps(true, true);

    // Indexes
    table.index(['slug'], 'idx_job_categories_slug');
    table.index(['status'], 'idx_job_categories_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('job_categories');
}
