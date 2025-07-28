import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('permissions', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.text('description').nullable();

    table.timestamps(true, true);

    // Indexes
    table.index(['name'], 'idx_permissions_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('permissions');
}
