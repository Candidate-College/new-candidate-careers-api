import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('sessions').del();

  // Inserts seed entries
  await knex('sessions').insert([
    {
      id: 'session_admin_001',
      user_id: 1, // Admin User
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      payload: '{"user_id": 1, "role": "super_admin"}',
      last_activity: Math.floor(Date.now() / 1000),
    },
    {
      id: 'session_hr_head_001',
      user_id: 2, // Budi Santoso
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      payload: '{"user_id": 2, "role": "head_of_hr"}',
      last_activity: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    },
    {
      id: 'session_hr_staff_001',
      user_id: 3, // Siti Nurhaliza
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      payload: '{"user_id": 3, "role": "hr_staff"}',
      last_activity: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    },
  ]);
}
