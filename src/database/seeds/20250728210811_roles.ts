import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('roles').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('roles').insert([
    {
      id: 1,
      name: 'super_admin',
      display_name: 'Super Admin',
      description: 'Full system access and control',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'head_of_hr',
      display_name: 'Head of HR',
      description: 'Strategic HR oversight and team management',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'hr_staff',
      display_name: 'HR Staff',
      description: 'Day-to-day recruitment operations',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
