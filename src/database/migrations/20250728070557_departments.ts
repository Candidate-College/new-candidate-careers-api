import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('departments', table => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.enum('status', ['active', 'inactive']).defaultTo('active');
    table.bigInteger('created_by').unsigned().notNullable();

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Foreign key constraint to users table
    table
      .foreign('created_by')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['name'], 'idx_departments_name');
    table.index(['status'], 'idx_departments_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('departments');
}
