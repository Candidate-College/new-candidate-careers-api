import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('application_notes', table => {
    table.increments('id').primary();
    table.bigInteger('application_id').unsigned().notNullable();
    table.bigInteger('user_id').unsigned().notNullable();
    table.text('note').notNullable();
    table.boolean('is_internal').defaultTo(true);

    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Foreign key constraints
    table
      .foreign('application_id')
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .foreign('user_id')
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    // Indexes
    table.index(['application_id'], 'idx_application_notes_application_id');
    table.index(['user_id'], 'idx_application_notes_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('application_notes');
}
