import type { Knex } from 'knex';
import { PasswordUtils } from '../../utils/password';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Default secure password for all users (should be changed on first login)
  const defaultPassword = 'SecurePass123!';
  const hashedPassword = await PasswordUtils.hashPassword(defaultPassword);

  // Inserts seed entries
  await knex('users').insert([
    {
      id: 1,
      uuid: 'uuid-user-001',
      email: 'admin@ccp.com',
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
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
      password: hashedPassword,
      name: 'Ida Ayu',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
