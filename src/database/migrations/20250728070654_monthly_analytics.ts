import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('monthly_analytics', table => {
    table.increments('id').primary();
    table.integer('year').notNullable();
    table.integer('month').notNullable();
    table.integer('total_job_postings').defaultTo(0);
    table.integer('total_applications').defaultTo(0);
    table.integer('total_approved_applications').defaultTo(0);
    table.integer('total_rejected_applications').defaultTo(0);
    table.integer('total_job_views').defaultTo(0);
    table.decimal('avg_applications_per_job', 8, 2).defaultTo(0);
    table.bigInteger('top_department_id').unsigned().nullable();
    table.bigInteger('top_job_category_id').unsigned().nullable();

    table.timestamps(true, true);

    // Foreign key constraints
    table
      .foreign('top_department_id')
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table
      .foreign('top_job_category_id')
      .references('id')
      .inTable('job_categories')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Unique constraint for year-month combination
    table.unique(['year', 'month'], 'idx_monthly_analytics_year_month_unique');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('monthly_analytics');
}
