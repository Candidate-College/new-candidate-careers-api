import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('application_statuses').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('application_statuses').insert([
    {
      id: 1,
      name: 'Pending',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'Under Review',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'Approved',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      name: 'Rejected',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
