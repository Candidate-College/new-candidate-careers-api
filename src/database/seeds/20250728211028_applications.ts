import type { Knex } from 'knex';
import { generateUUIDs } from '../../utils/uuid';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('applications').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Generate UUIDs for all applications
  const applicationUUIDs = generateUUIDs(10);

  // Inserts seed entries
  await knex('applications').insert([
    {
      id: 1,
      uuid: applicationUUIDs[0],
      job_posting_id: 1, // Senior Backend Engineer
      candidate_id: 1, // Ahmad Fauzi
      application_number: 'CC-2025-0001',
      status_id: 2, // Under Review
      reviewed_by: 3, // Siti Nurhaliza
      reviewed_at: new Date('2025-07-28T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      uuid: applicationUUIDs[1],
      job_posting_id: 1, // Senior Backend Engineer
      candidate_id: 2, // Riri Aprilia
      application_number: 'CC-2025-0002',
      status_id: 2, // Under Review
      reviewed_by: 3, // Siti Nurhaliza
      reviewed_at: new Date('2025-07-28T10:05:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      uuid: applicationUUIDs[2],
      job_posting_id: 6, // DevOps Engineer
      candidate_id: 1, // Ahmad Fauzi
      application_number: 'CC-2025-0003',
      status_id: 3, // Approved
      reviewed_by: 2, // Budi Santoso
      reviewed_at: new Date('2025-07-28T11:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      uuid: applicationUUIDs[3],
      job_posting_id: 4, // UI/UX Designer
      candidate_id: 3, // Chandra Putra
      application_number: 'CC-2025-0004',
      status_id: 4, // Rejected
      reviewed_by: 4, // Agus Wijaya
      reviewed_at: new Date('2025-07-27T15:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      uuid: applicationUUIDs[4],
      job_posting_id: 3, // Digital Marketing Intern
      candidate_id: 4, // Diana Sari
      application_number: 'CC-2025-0005',
      status_id: 1, // Pending
      reviewed_by: null,
      reviewed_at: null,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      uuid: applicationUUIDs[5],
      job_posting_id: 3, // Digital Marketing Intern
      candidate_id: 5, // Farhan Malik
      application_number: 'CC-2025-0006',
      status_id: 1, // Pending
      reviewed_by: null,
      reviewed_at: null,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 7,
      uuid: applicationUUIDs[6],
      job_posting_id: 5, // HR Generalist
      candidate_id: 8, // Indah Permatasari
      application_number: 'CC-2025-0007',
      status_id: 2, // Under Review
      reviewed_by: 3, // Siti Nurhaliza
      reviewed_at: new Date('2025-07-28T14:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 8,
      uuid: applicationUUIDs[7],
      job_posting_id: 9, // Financial Analyst
      candidate_id: 6, // Grace Natalia
      application_number: 'CC-2025-0008',
      status_id: 3, // Approved
      reviewed_by: 2, // Budi Santoso
      reviewed_at: new Date('2025-07-28T16:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 9,
      uuid: applicationUUIDs[8],
      job_posting_id: 2, // Product Manager
      candidate_id: 7, // Hadi Pranata
      application_number: 'CC-2025-0009',
      status_id: 1, // Pending
      reviewed_by: null,
      reviewed_at: null,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 10,
      uuid: applicationUUIDs[9],
      job_posting_id: 10, // Lead Mobile Developer (iOS)
      candidate_id: 2, // Riri Aprilia
      application_number: 'CC-2025-0010',
      status_id: 2, // Under Review
      reviewed_by: 4, // Agus Wijaya
      reviewed_at: new Date('2025-07-28T17:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
