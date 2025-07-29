import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('email_notifications').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('email_notifications').insert([
    {
      recipient_email: 'ahmad.fauzi@email.com',
      subject: 'Application Received - Senior Backend Engineer',
      body: 'Thank you for your application to the Senior Backend Engineer position. We have received your application and will review it shortly.',
      related_type: 'application',
      related_id: 1,
      status: 'sent',
      sent_at: new Date('2025-07-28T09:00:00.000Z'),
      attempts: 1,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      recipient_email: 'riri.aprilia@email.com',
      subject: 'Application Under Review - Senior Backend Engineer',
      body: 'Your application for the Senior Backend Engineer position is currently under review. We will contact you soon with an update.',
      related_type: 'application',
      related_id: 2,
      status: 'sent',
      sent_at: new Date('2025-07-28T10:30:00.000Z'),
      attempts: 1,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      recipient_email: 'chandra.putra@email.com',
      subject: 'Application Status Update - UI/UX Designer',
      body: 'Thank you for your application. After careful review, we regret to inform you that we will not be moving forward with your application at this time.',
      related_type: 'application',
      related_id: 4,
      status: 'sent',
      sent_at: new Date('2025-07-27T16:00:00.000Z'),
      attempts: 1,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
