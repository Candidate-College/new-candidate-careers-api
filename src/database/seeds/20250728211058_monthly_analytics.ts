import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('monthly_analytics').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('monthly_analytics').insert([
    {
      year: 2025,
      month: 6, // June 2025
      total_job_postings: 8,
      total_applications: 15,
      total_approved_applications: 3,
      total_rejected_applications: 2,
      total_job_views: 125,
      avg_applications_per_job: 1.88,
      top_department_id: 1, // Engineering
      top_job_category_id: 1, // Technology
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      year: 2025,
      month: 7, // July 2025
      total_job_postings: 10,
      total_applications: 10,
      total_approved_applications: 2,
      total_rejected_applications: 1,
      total_job_views: 89,
      avg_applications_per_job: 1.0,
      top_department_id: 1, // Engineering
      top_job_category_id: 1, // Technology
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
