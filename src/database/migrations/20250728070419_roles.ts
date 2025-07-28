import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('roles', table => {
    table.increments('id').primary();
    table.string('name', 100).notNullable().unique();
    table.string('display_name', 100).notNullable();
    table.text('description').nullable();

    table.timestamps(true, true);

    // Indexes
    table.index(['name'], 'idx_roles_name');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('roles');
}
