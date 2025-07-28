import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('candidates', table => {
    table.increments('id').primary();
    table.string('uuid', 36).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('full_name', 255).notNullable();
    table.string('domicile', 255).nullable();
    table.string('university', 255).nullable();
    table.string('major', 255).nullable();
    table.string('semester', 10).nullable();
    table.string('instagram_url', 500).nullable();
    table.string('whatsapp_number', 20).nullable().unique();

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index(['uuid'], 'idx_candidates_uuid');
    table.index(['email'], 'idx_candidates_email');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('candidates');
}
