import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('departments').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('departments').insert([
    {
      id: 1,
      name: 'Engineering',
      description: 'Handles all software development and infrastructure.',
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'Product',
      description: 'Manages product strategy, roadmap, and design.',
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'Marketing & Sales',
      description: 'Drives growth, branding, and revenue.',
      created_by: 2, // Budi Santoso (Head of HR)
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      name: 'People Operations',
      description: 'Manages HR, recruitment, and company culture.',
      created_by: 2, // Budi Santoso (Head of HR)
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
