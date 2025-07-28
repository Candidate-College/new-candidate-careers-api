import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('email_notifications', table => {
    table.increments('id').primary();
    table.string('recipient_email', 255).notNullable();
    table.string('subject', 500).notNullable();
    table.text('body').notNullable();
    table.string('related_type', 100).nullable();
    table.bigInteger('related_id').nullable();
    table.enum('status', ['pending', 'sent', 'failed', 'bounced']).defaultTo('pending');
    table.timestamp('sent_at').nullable();
    table.text('failed_reason').nullable();
    table.integer('attempts').defaultTo(0);

    table.timestamps(true, true);

    // Indexes
    table.index(['recipient_email'], 'idx_email_notifications_recipient');
    table.index(['status'], 'idx_email_notifications_status');
    table.index(['related_type', 'related_id'], 'idx_email_notifications_related');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('email_notifications');
}
