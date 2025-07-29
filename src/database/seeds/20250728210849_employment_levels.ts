import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('employment_levels').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('employment_levels').insert([
    {
      id: 1,
      name: 'Entry',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'Junior',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'Mid',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      name: 'Senior',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      name: 'Lead',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      name: 'Head',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
