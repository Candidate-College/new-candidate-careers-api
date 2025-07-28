import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('job_postings').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('job_postings').insert([
    {
      id: 1,
      uuid: 'uuid-job-001',
      title: 'Senior Backend Engineer',
      slug: 'senior-backend-engineer',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      description: 'Description for Senior Backend Engineer...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-20T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      uuid: 'uuid-job-002',
      title: 'Product Manager',
      slug: 'product-manager',
      department_id: 2, // Product
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      description: 'Description for Product Manager...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-21T11:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      uuid: 'uuid-job-003',
      title: 'Digital Marketing Intern',
      slug: 'digital-marketing-intern',
      department_id: 3, // Marketing & Sales
      job_category_id: 2, // Marketing
      job_type_id: 1, // Internship
      employment_level_id: 1, // Entry
      status_id: 2, // Published
      description: 'Description for Digital Marketing Intern...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 3, // Siti Nurhaliza
      published_at: new Date('2025-07-22T09:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      uuid: 'uuid-job-004',
      title: 'UI/UX Designer',
      slug: 'ui-ux-designer',
      department_id: 2, // Product
      job_category_id: 5, // Design
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      description: 'Description for UI/UX Designer...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 4, // Agus Wijaya
      published_at: new Date('2025-07-23T14:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      uuid: 'uuid-job-005',
      title: 'HR Generalist',
      slug: 'hr-generalist',
      department_id: 4, // People Operations
      job_category_id: 3, // Human Resources
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      description: 'Description for HR Generalist...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-24T16:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      uuid: 'uuid-job-006',
      title: 'DevOps Engineer',
      slug: 'devops-engineer',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      description: 'Description for DevOps Engineer...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-25T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 7,
      uuid: 'uuid-job-007',
      title: 'Junior Frontend Developer',
      slug: 'junior-frontend-developer',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 2, // Junior
      status_id: 3, // Closed
      description: 'Description for Junior Frontend Developer...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 3, // Siti Nurhaliza
      published_at: new Date('2025-07-15T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 8,
      uuid: 'uuid-job-008',
      title: 'Content Writer',
      slug: 'content-writer',
      department_id: 3, // Marketing & Sales
      job_category_id: 2, // Marketing
      job_type_id: 4, // Contract
      employment_level_id: 3, // Mid
      status_id: 1, // Draft
      description: 'Description for Content Writer...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 4, // Agus Wijaya
      published_at: null, // Draft status
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 9,
      uuid: 'uuid-job-009',
      title: 'Financial Analyst',
      slug: 'financial-analyst',
      department_id: 4, // People Operations
      job_category_id: 4, // Finance
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      description: 'Description for Financial Analyst...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-26T11:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 10,
      uuid: 'uuid-job-010',
      title: 'Lead Mobile Developer (iOS)',
      slug: 'lead-mobile-developer-ios',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 5, // Lead
      status_id: 2, // Published
      description: 'Description for Lead Mobile Developer...',
      requirements: 'Requirements...',
      responsibilities: 'Responsibilities...',
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-27T12:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
