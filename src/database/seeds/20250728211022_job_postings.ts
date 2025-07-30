import type { Knex } from 'knex';
import { generateUUIDs } from '../../utils/uuid';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('job_postings').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Generate UUIDs for all job postings
  const jobPostingUUIDs = generateUUIDs(10);

  // Inserts seed entries
  await knex('job_postings').insert([
    {
      uuid: jobPostingUUIDs[0],
      title: 'Senior Backend Engineer',
      slug: 'senior-backend-engineer',
      description:
        'We are looking for a Senior Backend Engineer to join our team. You will be responsible for designing and implementing scalable backend services.',
      requirements:
        '5+ years of experience with Node.js, TypeScript, PostgreSQL. Experience with microservices architecture.',
      responsibilities:
        'Design and implement backend services, write clean and maintainable code, collaborate with frontend team.',
      salary_min: 15000000,
      salary_max: 25000000,
      location: 'Jakarta, Indonesia',
      is_remote: false,
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[1],
      title: 'Product Manager',
      slug: 'product-manager',
      description:
        'We are seeking a Product Manager to lead product strategy and development. You will work closely with engineering and design teams.',
      requirements:
        '3+ years of product management experience, strong analytical skills, experience with agile methodologies.',
      responsibilities:
        'Define product strategy, create product roadmaps, work with cross-functional teams.',
      salary_min: 20000000,
      salary_max: 35000000,
      location: 'Jakarta, Indonesia',
      is_remote: true,
      department_id: 2, // Product
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[2],
      title: 'Digital Marketing Intern',
      slug: 'digital-marketing-intern',
      description:
        'We are looking for a Digital Marketing Intern to support our marketing team. This is a great opportunity to learn about digital marketing.',
      requirements:
        'Currently pursuing a degree in Marketing or related field, basic knowledge of social media platforms.',
      responsibilities:
        'Assist with social media management, support marketing campaigns, analyze marketing data.',
      salary_min: 3000000,
      salary_max: 5000000,
      location: 'Jakarta, Indonesia',
      is_remote: false,
      department_id: 3, // Marketing & Sales
      job_category_id: 2, // Marketing
      job_type_id: 1, // Internship
      employment_level_id: 1, // Entry
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[3],
      title: 'UI/UX Designer',
      slug: 'ui-ux-designer',
      description:
        'We are seeking a UI/UX Designer to create beautiful and functional user interfaces. You will work on both web and mobile applications.',
      requirements: '3+ years of UI/UX design experience, proficiency in Figma, strong portfolio.',
      responsibilities:
        'Design user interfaces, create wireframes and prototypes, conduct user research.',
      salary_min: 12000000,
      salary_max: 20000000,
      location: 'Jakarta, Indonesia',
      is_remote: true,
      department_id: 2, // Product
      job_category_id: 5, // Design
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[4],
      title: 'HR Generalist',
      slug: 'hr-generalist',
      description:
        'We are looking for an HR Generalist to support our human resources team. You will handle various HR functions.',
      requirements:
        '2+ years of HR experience, knowledge of Indonesian labor law, strong communication skills.',
      responsibilities:
        'Handle recruitment, employee relations, HR administration, support HR initiatives.',
      salary_min: 8000000,
      salary_max: 15000000,
      location: 'Jakarta, Indonesia',
      is_remote: false,
      department_id: 4, // People Operations
      job_category_id: 3, // Human Resources
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[5],
      title: 'DevOps Engineer',
      slug: 'devops-engineer',
      description:
        'We are seeking a DevOps Engineer to manage our infrastructure and deployment processes. You will work on CI/CD pipelines.',
      requirements: '3+ years of DevOps experience, knowledge of Docker, Kubernetes, AWS.',
      responsibilities:
        'Manage cloud infrastructure, implement CI/CD pipelines, monitor system performance.',
      salary_min: 15000000,
      salary_max: 25000000,
      location: 'Jakarta, Indonesia',
      is_remote: true,
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[6],
      title: 'Frontend Developer',
      slug: 'frontend-developer',
      description:
        'We are looking for a Frontend Developer to build responsive web applications. You will work with React and modern JavaScript.',
      requirements:
        '2+ years of frontend development experience, proficiency in React, TypeScript, CSS.',
      responsibilities:
        'Build responsive web applications, collaborate with backend team, optimize performance.',
      salary_min: 10000000,
      salary_max: 18000000,
      location: 'Jakarta, Indonesia',
      is_remote: false,
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 2, // Junior
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[7],
      title: 'Marketing Specialist',
      slug: 'marketing-specialist',
      description:
        'We are seeking a Marketing Specialist to help us grow our brand and reach. You will work on various marketing campaigns.',
      requirements:
        '2+ years of marketing experience, knowledge of digital marketing tools, creative thinking.',
      responsibilities:
        'Create marketing campaigns, manage social media, analyze marketing performance.',
      salary_min: 8000000,
      salary_max: 15000000,
      location: 'Jakarta, Indonesia',
      is_remote: false,
      department_id: 3, // Marketing & Sales
      job_category_id: 2, // Marketing
      job_type_id: 2, // Staff
      employment_level_id: 2, // Junior
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[8],
      title: 'Recruitment Specialist',
      slug: 'recruitment-specialist',
      description:
        'We are looking for a Recruitment Specialist to help us find and hire top talent. You will manage the full recruitment cycle.',
      requirements:
        '3+ years of recruitment experience, strong communication skills, knowledge of recruitment tools.',
      responsibilities:
        'Source candidates, conduct interviews, manage recruitment process, build talent pipeline.',
      salary_min: 12000000,
      salary_max: 20000000,
      location: 'Jakarta, Indonesia',
      is_remote: false,
      department_id: 4, // People Operations
      job_category_id: 3, // Human Resources
      job_type_id: 2, // Staff
      employment_level_id: 3, // Mid
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      uuid: jobPostingUUIDs[9],
      title: 'Lead Mobile Developer (iOS)',
      slug: 'lead-mobile-developer-ios',
      description:
        'We are seeking a Lead Mobile Developer to lead our iOS development team. You will be responsible for iOS app development.',
      requirements:
        '5+ years of iOS development experience, proficiency in Swift, experience leading teams.',
      responsibilities:
        'Lead iOS development team, architect mobile applications, mentor junior developers.',
      salary_min: 20000000,
      salary_max: 35000000,
      location: 'Jakarta, Indonesia',
      is_remote: true,
      department_id: 1, // Engineering
      job_category_id: 1, // Technology
      job_type_id: 2, // Staff
      employment_level_id: 4, // Senior
      status_id: 2, // Published
      created_by: 1, // Admin User
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
