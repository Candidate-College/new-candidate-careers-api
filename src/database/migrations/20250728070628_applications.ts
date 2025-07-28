import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('applications', table => {
    table.increments('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.bigInteger('job_posting_id').unsigned().notNullable();
    table.bigInteger('candidate_id').unsigned().notNullable();
    table.string('application_number', 50).notNullable().unique();
    table.bigInteger('status_id').unsigned().notNullable().defaultTo(1);
    table.text('rejection_reason').nullable();
    table.timestamp('approved_at').nullable();
    table.timestamp('rejected_at').nullable();
    table.bigInteger('reviewed_by').unsigned().nullable();
    table.timestamp('reviewed_at').nullable();
    table.boolean('approval_email_sent').defaultTo(false);
    table.timestamp('approval_email_sent_at').nullable();
    table.string('ip_address', 45).nullable();
    table.text('user_agent').nullable();
    table.string('source', 100).defaultTo('website');

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Foreign key constraints
    table
      .foreign('job_posting_id')
      .references('id')
      .inTable('job_postings')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('candidate_id')
      .references('id')
      .inTable('candidates')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('status_id')
      .references('id')
      .inTable('application_statuses')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');
    table
      .foreign('reviewed_by')
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['uuid'], 'idx_applications_uuid');
    table.index(['application_number'], 'idx_applications_application_number');
    table.index(['job_posting_id'], 'idx_applications_job_posting_id');
    table.index(['candidate_id'], 'idx_applications_candidate_id');
    table.index(['status_id'], 'idx_applications_status_id');
    table.index(['reviewed_by'], 'idx_applications_reviewed_by');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('applications');
}
