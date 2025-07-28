import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('system_settings', table => {
    table.increments('id').primary();
    table.string('key', 100).notNullable().unique();
    table.text('value').nullable();
    table.enum('type', ['string', 'integer', 'boolean', 'json', 'text']).defaultTo('string');
    table.text('description').nullable();
    table.boolean('is_public').defaultTo(false);

    table.timestamps(true, true);

    // Indexes
    table.index(['key'], 'idx_system_settings_key');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('system_settings');
}
