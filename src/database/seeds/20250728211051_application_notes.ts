import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('application_notes').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('application_notes').insert([
    {
      application_id: 1, // Ahmad Fauzi - Senior Backend Engineer
      user_id: 3, // Siti Nurhaliza
      note: 'Strong technical skills in Go and Python. Good fit for the team.',
      is_internal: true,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 2, // Riri Aprilia - Senior Backend Engineer
      user_id: 3, // Siti Nurhaliza
      note: 'Excellent portfolio. Lacks experience with our specific tech stack, but a fast learner.',
      is_internal: true,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 4, // Chandra Putra - UI/UX Designer
      user_id: 4, // Agus Wijaya
      note: 'Portfolio is outstanding, but communication skills during initial screening were weak. Rejecting for now.',
      is_internal: true,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 7, // Indah Permatasari - HR Generalist
      user_id: 2, // Budi Santoso
      note: 'Candidate has been approved for another role (DevOps). This application can be closed.',
      is_internal: false,
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
