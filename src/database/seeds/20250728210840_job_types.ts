import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('job_types').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('job_types').insert([
    {
      id: 1,
      name: 'Internship',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'Staff',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'Freelance',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      name: 'Contract',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
