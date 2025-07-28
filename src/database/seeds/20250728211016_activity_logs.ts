import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('activity_logs').del();

  // Inserts seed entries
  await knex('activity_logs').insert([
    {
      user_id: 2, // Budi Santoso
      action: 'job_posting.created',
      subject_type: 'job_posting',
      subject_id: 1,
      description: 'Created new job posting: Senior Backend Engineer',
      old_values: null,
      new_values: '{"title": "Senior Backend Engineer", "department_id": 1}',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      created_at: new Date('2025-07-20T10:00:00.000Z'),
    },
    {
      user_id: 3, // Siti Nurhaliza
      action: 'application.reviewed',
      subject_type: 'application',
      subject_id: 1,
      description: 'Reviewed application CC-2025-0001',
      old_values: '{"status_id": 1}',
      new_values: '{"status_id": 2}',
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: new Date('2025-07-28T10:00:00.000Z'),
    },
    {
      user_id: 2, // Budi Santoso
      action: 'application.approved',
      subject_type: 'application',
      subject_id: 3,
      description: 'Approved application CC-2025-0003 for DevOps Engineer',
      old_values: '{"status_id": 2}',
      new_values: '{"status_id": 3}',
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      created_at: new Date('2025-07-28T11:00:00.000Z'),
    },
  ]);
}
