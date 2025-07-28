import type { Knex } from 'knex';
import { generateUUIDs } from '../../utils/uuid';
import { faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('job_postings').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Generate UUIDs for all job postings
  const jobUUIDs = generateUUIDs(10);

  // Helper function to generate realistic job descriptions
  const generateJobContent = (role: string, level: string) => {
    const description = faker.lorem.paragraphs(3, '\n\n');
    const requirements = [
      `Minimum ${level.toLowerCase()} experience in ${role.toLowerCase()} role`,
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
    ].join('\n• ');

    const responsibilities = [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
    ].join('\n• ');

    return {
      description: `We are seeking a talented ${role} to join our dynamic team. ${description}`,
      requirements: `• ${requirements}`,
      responsibilities: `• ${responsibilities}`,
    };
  };

  // Inserts seed entries
  await knex('job_postings').insert([
    {
      id: 1,
      uuid: jobUUIDs[0],
      title: 'Senior Backend Engineer',
      slug: 'senior-backend-engineer',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      ...generateJobContent('Backend Engineer', 'Senior'),
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-20T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      uuid: jobUUIDs[1],
      title: 'Product Manager',
      slug: 'product-manager',
      department_id: 2, // Product
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      ...generateJobContent('Product Manager', 'Senior'),
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-21T11:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      uuid: jobUUIDs[2],
      title: 'Digital Marketing Intern',
      slug: 'digital-marketing-intern',
      department_id: 3, // Marketing & Sales
      job_category_id: 2, // Marketing
      job_type_id: 1, // Internship
      employment_level_id: 1, // Entry
      status_id: 2, // Published
      ...generateJobContent('Digital Marketing', 'Entry'),
      created_by: 3, // Siti Nurhaliza
      published_at: new Date('2025-07-22T09:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      uuid: jobUUIDs[3],
      title: 'UI/UX Designer',
      slug: 'ui-ux-designer',
      department_id: 2, // Product
      job_category_id: 5, // Design
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      ...generateJobContent('UI/UX Designer', 'Mid'),
      created_by: 4, // Agus Wijaya
      published_at: new Date('2025-07-23T14:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      uuid: jobUUIDs[4],
      title: 'HR Generalist',
      slug: 'hr-generalist',
      department_id: 4, // People Operations
      job_category_id: 3, // Human Resources
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      ...generateJobContent('HR Generalist', 'Mid'),
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-24T16:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      uuid: jobUUIDs[5],
      title: 'DevOps Engineer',
      slug: 'devops-engineer',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      ...generateJobContent('DevOps Engineer', 'Senior'),
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-25T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 7,
      uuid: jobUUIDs[6],
      title: 'Junior Frontend Developer',
      slug: 'junior-frontend-developer',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 2, // Junior
      status_id: 3, // Closed
      ...generateJobContent('Frontend Developer', 'Junior'),
      created_by: 3, // Siti Nurhaliza
      published_at: new Date('2025-07-15T10:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 8,
      uuid: jobUUIDs[7],
      title: 'Content Writer',
      slug: 'content-writer',
      department_id: 3, // Marketing & Sales
      job_category_id: 2, // Marketing
      job_type_id: 4, // Contract
      employment_level_id: 3, // Mid
      status_id: 1, // Draft
      ...generateJobContent('Content Writer', 'Mid'),
      created_by: 4, // Agus Wijaya
      published_at: null, // Draft status
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 9,
      uuid: jobUUIDs[8],
      title: 'Financial Analyst',
      slug: 'financial-analyst',
      department_id: 4, // People Operations
      job_category_id: 4, // Finance
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      ...generateJobContent('Financial Analyst', 'Mid'),
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-26T11:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 10,
      uuid: jobUUIDs[9],
      title: 'Lead Mobile Developer (iOS)',
      slug: 'lead-mobile-developer-ios',
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 5, // Lead
      status_id: 2, // Published
      ...generateJobContent('Mobile Developer', 'Lead'),
      created_by: 2, // Budi Santoso
      published_at: new Date('2025-07-27T12:00:00.000Z'),
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
