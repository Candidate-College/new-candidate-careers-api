import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('applications').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('applications').insert([
    {
      uuid: '550e8400-e29b-41d4-a716-446655440001',
      job_posting_id: 1, // Senior Backend Engineer
      candidate_id: 1, // Ahmad Fauzi
      application_number: 'APP-2025-001',
      status_id: 2, // Under Review
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440002',
      job_posting_id: 1, // Senior Backend Engineer
      candidate_id: 2, // Riri Aprilia
      application_number: 'APP-2025-002',
      status_id: 2, // Under Review
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440003',
      job_posting_id: 6, // DevOps Engineer
      candidate_id: 1, // Ahmad Fauzi
      application_number: 'APP-2025-003',
      status_id: 3, // Approved
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440004',
      job_posting_id: 4, // UI/UX Designer
      candidate_id: 3, // Chandra Putra
      application_number: 'APP-2025-004',
      status_id: 4, // Rejected
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440005',
      job_posting_id: 3, // Digital Marketing Intern
      candidate_id: 4, // Diana Sari
      application_number: 'APP-2025-005',
      status_id: 1, // Pending
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440006',
      job_posting_id: 3, // Digital Marketing Intern
      candidate_id: 5, // Farhan Malik
      application_number: 'APP-2025-006',
      status_id: 1, // Pending
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440007',
      job_posting_id: 5, // HR Generalist
      candidate_id: 8, // Indah Permatasari
      application_number: 'APP-2025-007',
      status_id: 2, // Under Review
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440008',
      job_posting_id: 9, // Financial Analyst
      candidate_id: 6, // Grace Natalia
      application_number: 'APP-2025-008',
      status_id: 3, // Approved
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440009',
      job_posting_id: 2, // Product Manager
      candidate_id: 7, // Hadi Pranata
      application_number: 'APP-2025-009',
      status_id: 1, // Pending
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: '550e8400-e29b-41d4-a716-446655440010',
      job_posting_id: 10, // Lead Mobile Developer (iOS)
      candidate_id: 2, // Riri Aprilia
      application_number: 'APP-2025-010',
      status_id: 2, // Under Review
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
