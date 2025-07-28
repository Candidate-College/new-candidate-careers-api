import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('role_permissions', table => {
    table.bigInteger('role_id').unsigned().notNullable();
    table.bigInteger('permission_id').unsigned().notNullable();

    // Composite primary key
    table.primary(['role_id', 'permission_id']);

    // Foreign key constraints
    table
      .foreign('role_id')
      .references('id')
      .inTable('roles')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .foreign('permission_id')
      .references('id')
      .inTable('permissions')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['role_id'], 'idx_role_permissions_role_id');
    table.index(['permission_id'], 'idx_role_permissions_permission_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('role_permissions');
}
