import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('system_settings').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('system_settings').insert([
    {
      key: 'site_name',
      value: 'Candidate Careers Platform',
      type: 'string',
      description: 'The public name of the website.',
      is_public: true,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      key: 'site_logo_url',
      value: '/path/to/logo.png',
      type: 'string',
      description: 'URL for the main site logo.',
      is_public: true,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      description: 'Puts the site in maintenance mode.',
      is_public: false,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      key: 'max_applications_per_user',
      value: '3',
      type: 'integer',
      description: 'Maximum active applications a candidate can have.',
      is_public: false,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      key: 'allow_new_registrations',
      value: 'true',
      type: 'boolean',
      description: 'Allow new users to register.',
      is_public: false,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
