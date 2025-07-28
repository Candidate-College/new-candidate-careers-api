import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('application_documents', table => {
    table.increments('id').primary();
    table.bigInteger('application_id').unsigned().notNullable();
    table.string('document_type', 100).notNullable();
    table.string('url', 1000).notNullable();
    table.string('filename', 255).notNullable();

    table.timestamps(true, true);

    // Foreign key constraint to applications table
    table
      .foreign('application_id')
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['application_id'], 'idx_application_documents_application_id');
    table.index(['document_type'], 'idx_application_documents_document_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('application_documents');
}
