import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('password_reset_tokens').del();

  // Inserts seed entries
  await knex('password_reset_tokens').insert([
    {
      email: 'fitri.rahmawati@ccp.com',
      token: 'reset_token_fitri_123456',
      created_at: new Date('2025-07-28T15:00:00.000Z'),
    },
    {
      email: 'agus.wijaya@ccp.com',
      token: 'reset_token_agus_789012',
      created_at: new Date('2025-07-28T16:30:00.000Z'),
    },
    {
      email: 'dewi.lestari@ccp.com',
      token: 'reset_token_dewi_345678',
      created_at: new Date('2025-07-28T17:45:00.000Z'),
    },
  ]);
}
