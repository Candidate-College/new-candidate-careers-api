import type { Knex } from 'knex';
import { PasswordUtils } from '../../utils/password';
import { generateUUIDs } from '../../utils/uuid';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Default secure password for all users (should be changed on first login)
  const defaultPassword = 'SecurePass123!';
  const hashedPassword = await PasswordUtils.hashPassword(defaultPassword);

  // Generate UUIDs for all users
  const userUUIDs = generateUUIDs(10);

  // Inserts seed entries
  await knex('users').insert([
    {
      uuid: userUUIDs[0],
      email: 'admin@ccp.com',
      password: hashedPassword,
      name: 'Admin User',
      role_id: 1, // super_admin
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[1],
      email: 'head.hr@ccp.com',
      password: hashedPassword,
      name: 'Budi Santoso',
      role_id: 2, // head_of_hr
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[2],
      email: 'siti.nurhaliza@ccp.com',
      password: hashedPassword,
      name: 'Siti Nurhaliza',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[3],
      email: 'agus.wijaya@ccp.com',
      password: hashedPassword,
      name: 'Agus Wijaya',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[4],
      email: 'dewi.lestari@ccp.com',
      password: hashedPassword,
      name: 'Dewi Lestari',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[5],
      email: 'eko.prasetyo@ccp.com',
      password: hashedPassword,
      name: 'Eko Prasetyo',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[6],
      email: 'fitri.rahmawati@ccp.com',
      password: hashedPassword,
      name: 'Fitri Rahmawati',
      role_id: 3, // hr_staff
      status: 'inactive',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[7],
      email: 'gunawan.amir@ccp.com',
      password: hashedPassword,
      name: 'Gunawan Amir',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[8],
      email: 'herman.syah@ccp.com',
      password: hashedPassword,
      name: 'Herman Syah',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: userUUIDs[9],
      email: 'indah.sari@ccp.com',
      password: hashedPassword,
      name: 'Indah Sari',
      role_id: 3, // hr_staff
      status: 'active',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
