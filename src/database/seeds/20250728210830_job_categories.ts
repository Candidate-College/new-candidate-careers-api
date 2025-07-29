import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('job_categories').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('job_categories').insert([
    {
      id: 1,
      name: 'Technology',
      slug: 'technology',
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'Marketing',
      slug: 'marketing',
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'Human Resources',
      slug: 'human-resources',
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      name: 'Finance',
      slug: 'finance',
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      name: 'Design',
      slug: 'design',
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
