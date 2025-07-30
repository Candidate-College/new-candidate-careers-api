import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('email_verification_tokens').del();

  // Base timestamp for July 30, 2025
  const baseTimestamp = new Date('2025-07-30T10:51:56.000Z');

  // Inserts seed entries
  await knex('email_verification_tokens').insert([
    {
      user_id: 1, // admin@ccp.com
      token: 'verification-token-admin-123',
      type: 'email_verification',
      is_used: false,
      expires_at: new Date('2025-08-30T10:51:56.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      user_id: 2, // head.hr@ccp.com
      token: 'verification-token-headhr-456',
      type: 'email_verification',
      is_used: false,
      expires_at: new Date('2025-08-30T10:51:56.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      user_id: 3, // siti.nurhaliza@ccp.com
      token: 'verification-token-siti-789',
      type: 'email_verification',
      is_used: false,
      expires_at: new Date('2025-08-30T10:51:56.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      user_id: 4, // agus.wijaya@ccp.com
      token: 'verification-token-agus-012',
      type: 'email_verification',
      is_used: false,
      expires_at: new Date('2025-08-30T10:51:56.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      user_id: 5, // dewi.lestari@ccp.com
      token: 'verification-token-dewi-345',
      type: 'email_verification',
      is_used: false,
      expires_at: new Date('2025-08-30T10:51:56.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
