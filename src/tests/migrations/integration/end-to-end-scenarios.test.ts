import knex from 'knex';
import config from '../../../config/knexfile';

describe('End-to-End Migration Scenarios', () => {
  let db: knex.Knex;

  beforeAll(async () => {
    const testConfig = config.test;
    if (!testConfig) {
      throw new Error('Test database configuration not found');
    }
    db = knex(testConfig);
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    const tablesToDrop = [
      'monthly_analytics',
      'application_notes',
      'application_documents',
      'job_views',
      'applications',
      'job_postings',
      'departments',
      'activity_logs',
      'sessions',
      'password_reset_tokens',
      'role_permissions',
      'users',
      'email_notifications',
      'candidates',
      'application_statuses',
      'job_posting_statuses',
      'employment_levels',
      'job_types',
      'system_settings',
      'job_categories',
      'permissions',
      'roles',
    ];
    for (const table of tablesToDrop) {
      await db.schema.dropTableIfExists(table);
    }
  });

  describe('Complete Application Workflow', () => {
    it('should support complete job posting and application workflow', async () => {
      // Import all necessary migrations
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );
      const employmentLevelsMigration = await import(
        '../../../database/migrations/20250728070506_employment_levels'
      );
      const jobPostingStatusesMigration = await import(
        '../../../database/migrations/20250728070512_job_posting_statuses'
      );
      const applicationStatusesMigration = await import(
        '../../../database/migrations/20250728070521_application_statuses'
      );
      const candidatesMigration = await import(
        '../../../database/migrations/20250728070526_candidates'
      );
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );
      const jobPostingsMigration = await import(
        '../../../database/migrations/20250728070623_job_postings'
      );
      const applicationsMigration = await import(
        '../../../database/migrations/20250728070628_applications'
      );
      const jobViewsMigration = await import(
        '../../../database/migrations/20250728070633_job_views'
      );
      const applicationDocumentsMigration = await import(
        '../../../database/migrations/20250728070643_application_documents'
      );
      const applicationNotesMigration = await import(
        '../../../database/migrations/20250728070649_application_notes'
      );

      // Run all migrations in sequence
      await rolesMigration.up(db);
      await permissionsMigration.up(db);
      await jobCategoriesMigration.up(db);
      await jobTypesMigration.up(db);
      await employmentLevelsMigration.up(db);
      await jobPostingStatusesMigration.up(db);
      await applicationStatusesMigration.up(db);
      await candidatesMigration.up(db);
      await usersMigration.up(db);
      await departmentsMigration.up(db);
      await jobPostingsMigration.up(db);
      await applicationsMigration.up(db);
      await jobViewsMigration.up(db);
      await applicationDocumentsMigration.up(db);
      await applicationNotesMigration.up(db);

      // Insert test data for complete workflow
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
        { name: 'hr_manager', display_name: 'HR Manager', description: 'HR Manager role' },
      ]);

      await db('users').insert([
        {
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@company.com',
          password: 'hashed_password',
          name: 'Admin User',
          role_id: 1,
        },
        {
          uuid: '123e4567-e89b-12d3-a456-426614174001',
          email: 'hr@company.com',
          password: 'hashed_password',
          name: 'HR Manager',
          role_id: 2,
        },
      ]);

      await db('departments').insert([
        { name: 'Engineering', description: 'Engineering department', created_by: 1 },
        { name: 'Marketing', description: 'Marketing department', created_by: 1 },
      ]);

      await db('job_categories').insert([
        {
          name: 'Software Development',
          slug: 'software-development',
          description: 'Software development jobs',
        },
        {
          name: 'Digital Marketing',
          slug: 'digital-marketing',
          description: 'Digital marketing jobs',
        },
      ]);

      await db('job_types').insert([{ name: 'Full-time' }, { name: 'Part-time' }]);

      await db('employment_levels').insert([
        { name: 'Entry Level' },
        { name: 'Mid Level' },
        { name: 'Senior Level' },
      ]);

      await db('job_posting_statuses').insert([
        { name: 'Draft' },
        { name: 'Published' },
        { name: 'Closed' },
      ]);

      await db('application_statuses').insert([
        { name: 'Pending' },
        { name: 'Under Review' },
        { name: 'Approved' },
        { name: 'Rejected' },
      ]);

      await db('candidates').insert([
        {
          uuid: '123e4567-e89b-12d3-a456-426614174002',
          email: 'john.doe@email.com',
          full_name: 'John Doe',
          domicile: 'Jakarta',
          university: 'University of Indonesia',
          major: 'Computer Science',
          semester: '8',
        },
        {
          uuid: '123e4567-e89b-12d3-a456-426614174003',
          email: 'jane.smith@email.com',
          full_name: 'Jane Smith',
          domicile: 'Bandung',
          university: 'Institut Teknologi Bandung',
          major: 'Information Technology',
          semester: '6',
        },
      ]);

      await db('job_postings').insert([
        {
          uuid: '123e4567-e89b-12d3-a456-426614174004',
          title: 'Senior Software Engineer',
          slug: 'senior-software-engineer',
          department_id: 1,
          job_category_id: 1,
          job_type_id: 1,
          employment_level_id: 3,
          status_id: 2,
          description: 'We are looking for a senior software engineer',
          requirements: '5+ years experience, Bachelor degree in Computer Science',
          responsibilities: 'Lead development team, architect solutions',
          created_by: 1,
        },
        {
          uuid: '123e4567-e89b-12d3-a456-426614174005',
          title: 'Digital Marketing Specialist',
          slug: 'digital-marketing-specialist',
          department_id: 2,
          job_category_id: 2,
          job_type_id: 1,
          employment_level_id: 2,
          status_id: 2,
          description: 'We are looking for a digital marketing specialist',
          requirements: '3+ years experience, Bachelor degree in Marketing',
          responsibilities: 'Manage digital campaigns, analyze performance',
          created_by: 1,
        },
      ]);

      await db('applications').insert([
        {
          uuid: '123e4567-e89b-12d3-a456-426614174006',
          job_posting_id: 1,
          candidate_id: 1,
          application_number: 'APP-001',
          status_id: 2,
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0',
          source: 'website',
        },
        {
          uuid: '123e4567-e89b-12d3-a456-426614174007',
          job_posting_id: 2,
          candidate_id: 2,
          application_number: 'APP-002',
          status_id: 1,
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0',
          source: 'website',
        },
      ]);

      await db('job_views').insert([
        {
          job_posting_id: 1,
          ip_address: '192.168.1.200',
          user_agent: 'Mozilla/5.0',
          viewed_at: new Date(),
        },
        {
          job_posting_id: 1,
          ip_address: '192.168.1.201',
          user_agent: 'Mozilla/5.0',
          viewed_at: new Date(),
        },
        {
          job_posting_id: 2,
          ip_address: '192.168.1.202',
          user_agent: 'Mozilla/5.0',
          viewed_at: new Date(),
        },
      ]);

      await db('application_documents').insert([
        {
          application_id: 1,
          document_type: 'resume',
          url: 'https://example.com/resume1.pdf',
          filename: 'john_doe_resume.pdf',
        },
        {
          application_id: 1,
          document_type: 'cover_letter',
          url: 'https://example.com/cover1.pdf',
          filename: 'john_doe_cover.pdf',
        },
        {
          application_id: 2,
          document_type: 'resume',
          url: 'https://example.com/resume2.pdf',
          filename: 'jane_smith_resume.pdf',
        },
      ]);

      await db('application_notes').insert([
        {
          application_id: 1,
          user_id: 2,
          note: 'Strong technical background, good fit for the role',
          is_internal: true,
        },
        {
          application_id: 2,
          user_id: 2,
          note: 'Good communication skills, needs to be reviewed further',
          is_internal: true,
        },
      ]);

      // Verify complete workflow data integrity
      const applicationWithFullDetails = await db('applications')
        .join('job_postings', 'applications.job_posting_id', 'job_postings.id')
        .join('candidates', 'applications.candidate_id', 'candidates.id')
        .join('application_statuses', 'applications.status_id', 'application_statuses.id')
        .join('departments', 'job_postings.department_id', 'departments.id')
        .select(
          'applications.application_number',
          'candidates.full_name as candidate_name',
          'job_postings.title as job_title',
          'departments.name as department_name',
          'application_statuses.name as status_name'
        )
        .orderBy('applications.id');

      expect(applicationWithFullDetails.length).toBe(2);
      expect(applicationWithFullDetails[0].application_number).toBe('APP-001');
      expect(applicationWithFullDetails[0].candidate_name).toBe('John Doe');
      expect(applicationWithFullDetails[0].job_title).toBe('Senior Software Engineer');
      expect(applicationWithFullDetails[0].department_name).toBe('Engineering');
      expect(applicationWithFullDetails[0].status_name).toBe('Under Review');

      // Verify job views
      const jobViews = await db('job_views')
        .join('job_postings', 'job_views.job_posting_id', 'job_postings.id')
        .select('job_postings.title', 'job_views.ip_address')
        .orderBy('job_views.id');

      expect(jobViews.length).toBe(3);
      expect(jobViews[0].title).toBe('Senior Software Engineer');

      // Verify application documents
      const applicationDocuments = await db('application_documents')
        .join('applications', 'application_documents.application_id', 'applications.id')
        .select(
          'applications.application_number',
          'application_documents.document_type',
          'application_documents.filename'
        )
        .orderBy('application_documents.id');

      expect(applicationDocuments.length).toBe(3);
      expect(applicationDocuments[0].application_number).toBe('APP-001');
      expect(applicationDocuments[0].document_type).toBe('resume');

      // Verify application notes
      const applicationNotes = await db('application_notes')
        .join('applications', 'application_notes.application_id', 'applications.id')
        .join('users', 'application_notes.user_id', 'users.id')
        .select(
          'applications.application_number',
          'users.name as reviewer_name',
          'application_notes.note'
        )
        .orderBy('application_notes.id');

      expect(applicationNotes.length).toBe(2);
      expect(applicationNotes[0].application_number).toBe('APP-001');
      expect(applicationNotes[0].reviewer_name).toBe('HR Manager');

      // Clean up
      await applicationNotesMigration.down(db);
      await applicationDocumentsMigration.down(db);
      await jobViewsMigration.down(db);
      await applicationsMigration.down(db);
      await jobPostingsMigration.down(db);
      await departmentsMigration.down(db);
      await usersMigration.down(db);
      await candidatesMigration.down(db);
      await applicationStatusesMigration.down(db);
      await jobPostingStatusesMigration.down(db);
      await employmentLevelsMigration.down(db);
      await jobTypesMigration.down(db);
      await jobCategoriesMigration.down(db);
      await permissionsMigration.down(db);
      await rolesMigration.down(db);
    });
  });

  describe('Migration Performance', () => {
    it('should handle large dataset migrations efficiently', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const usersMigration = await import('../../../database/migrations/20250728070538_users');

      // Run migrations
      await rolesMigration.up(db);
      await usersMigration.up(db);

      // Insert large dataset
      const roles: any[] = [];
      const users: any[] = [];

      for (let i = 1; i <= 10; i++) {
        roles.push({
          name: `role_${i}`,
          display_name: `Role ${i}`,
          description: `Description for role ${i}`,
        });
      }

      await db('roles').insert(roles);

      for (let i = 1; i <= 100; i++) {
        users.push({
          uuid: `123e4567-e89b-12d3-a456-426614174${i.toString().padStart(3, '0')}`,
          email: `user${i}@example.com`,
          password: 'hashed_password',
          name: `User ${i}`,
          role_id: Math.floor(Math.random() * 10) + 1,
        });
      }

      const startTime = Date.now();
      await db('users').insert(users);
      const endTime = Date.now();

      // Verify data integrity
      const userCount = await db('users').count('* as count');
      expect(parseInt((userCount[0]?.count as string) || '0')).toBe(100);

      const roleCount = await db('roles').count('* as count');
      expect(parseInt((roleCount[0]?.count as string) || '0')).toBe(10);

      // Verify performance with configurable threshold
      const executionTime = endTime - startTime;

      // Use environment variable for performance threshold with stricter default
      const performanceThreshold = parseInt(process.env.TEST_PERFORMANCE_THRESHOLD_MS || '2000'); // Default 2 seconds instead of 5
      expect(executionTime).toBeLessThan(performanceThreshold);

      // Clean up
      await usersMigration.down(db);
      await rolesMigration.down(db);
    });
  });
});
