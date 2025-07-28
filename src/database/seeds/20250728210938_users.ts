import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('users').insert([
    {
      id: 1,
      uuid: 'uuid-user-001',
      email: 'admin@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Admin User',
      role_id: 1, // super_admin
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      uuid: 'uuid-user-002',
      email: 'head.hr@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Budi Santoso',
      role_id: 2, // head_of_hr
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      uuid: 'uuid-user-003',
      email: 'siti.nurhaliza@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Siti Nurhaliza',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      uuid: 'uuid-user-004',
      email: 'agus.wijaya@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Agus Wijaya',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      uuid: 'uuid-user-005',
      email: 'dewi.lestari@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Dewi Lestari',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      uuid: 'uuid-user-006',
      email: 'eko.prasetyo@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Eko Prasetyo',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 7,
      uuid: 'uuid-user-007',
      email: 'fitri.rahmawati@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Fitri Rahmawati',
      role_id: 3, // hr_staff
      status: 'inactive',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 8,
      uuid: 'uuid-user-008',
      email: 'gunawan.amir@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Gunawan Amir',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 9,
      uuid: 'uuid-user-009',
      email: 'herman.syah@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Herman Syah',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 10,
      uuid: 'uuid-user-010',
      email: 'ida.ayu@ccp.com',
      password: '$2y$10$...', // Placeholder for hashed password
      name: 'Ida Ayu',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
