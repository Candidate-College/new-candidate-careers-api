import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('job_postings', table => {
    table.increments('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.bigInteger('department_id').unsigned().nullable();
    table.bigInteger('job_category_id').unsigned().nullable();
    table.bigInteger('job_type_id').unsigned().notNullable();
    table.bigInteger('employment_level_id').unsigned().notNullable();
    table.bigInteger('status_id').unsigned().notNullable().defaultTo(1);
    table.enum('priority_level', ['normal', 'urgent']).defaultTo('normal');
    table.text('description').notNullable();
    table.text('requirements').notNullable();
    table.text('responsibilities').notNullable();
    table.text('benefits').nullable();
    table.text('team_info').nullable();
    table.decimal('salary_min', 15, 2).nullable();
    table.decimal('salary_max', 15, 2).nullable();
    table.boolean('is_salary_negotiable').defaultTo(false);
    table.string('location', 255).nullable();
    table.boolean('is_remote').defaultTo(false);
    table.date('application_deadline').nullable();
    table.integer('max_applications').nullable();
    table.integer('views_count').defaultTo(0);
    table.integer('applications_count').defaultTo(0);
    table.timestamp('published_at').nullable();
    table.timestamp('closed_at').nullable();
    table.bigInteger('created_by').unsigned().notNullable();
    table.bigInteger('updated_by').unsigned().nullable();

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Foreign key constraints
    table
      .foreign('department_id')
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table
      .foreign('job_category_id')
      .references('id')
      .inTable('job_categories')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table
      .foreign('job_type_id')
      .references('id')
      .inTable('job_types')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('employment_level_id')
      .references('id')
      .inTable('employment_levels')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('status_id')
      .references('id')
      .inTable('job_posting_statuses')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('updated_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['uuid'], 'idx_job_postings_uuid');
    table.index(['slug'], 'idx_job_postings_slug');
    table.index(['department_id'], 'idx_job_postings_department_id');
    table.index(['job_category_id'], 'idx_job_postings_job_category_id');
    table.index(['job_type_id'], 'idx_job_postings_job_type_id');
    table.index(['employment_level_id'], 'idx_job_postings_employment_level_id');
    table.index(['status_id'], 'idx_job_postings_status_id');
    table.index(['published_at'], 'idx_job_postings_published_at');
    table.index(['created_by'], 'idx_job_postings_created_by');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('job_postings');
}
