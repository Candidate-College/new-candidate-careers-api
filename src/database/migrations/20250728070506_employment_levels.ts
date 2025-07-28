import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('employment_levels', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();

    table.timestamps(true, true);

    // Indexes
    table.index(['name'], 'idx_employment_levels_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('employment_levels');
}
