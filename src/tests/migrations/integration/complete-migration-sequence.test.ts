import knex from 'knex';
import config from '../../../config/knexfile';

describe('Complete Migration Sequence', () => {
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

  describe('Full Migration Sequence', () => {
    it('should run complete migration sequence in correct order', async () => {
      // Import all migrations in order
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      const systemSettingsMigration = await import(
        '../../../database/migrations/20250728070454_system_settings'
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
      const emailNotificationsMigration = await import(
        '../../../database/migrations/20250728070533_email_notifications'
      );
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );
      const passwordResetTokensMigration = await import(
        '../../../database/migrations/20250728070608_password_reset_tokens'
      );
      const sessionsMigration = await import(
        '../../../database/migrations/20250728070612_sessions'
      );
      const activityLogsMigration = await import(
        '../../../database/migrations/20250728070616_activity_logs'
      );
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
      const monthlyAnalyticsMigration = await import(
        '../../../database/migrations/20250728070654_monthly_analytics'
      );

      // Run all migrations in sequence
      await rolesMigration.up(db);
      await permissionsMigration.up(db);
      await jobCategoriesMigration.up(db);
      await systemSettingsMigration.up(db);
      await jobTypesMigration.up(db);
      await employmentLevelsMigration.up(db);
      await jobPostingStatusesMigration.up(db);
      await applicationStatusesMigration.up(db);
      await candidatesMigration.up(db);
      await emailNotificationsMigration.up(db);
      await usersMigration.up(db);
      await rolePermissionsMigration.up(db);
      await passwordResetTokensMigration.up(db);
      await sessionsMigration.up(db);
      await activityLogsMigration.up(db);
      await departmentsMigration.up(db);
      await jobPostingsMigration.up(db);
      await applicationsMigration.up(db);
      await jobViewsMigration.up(db);
      await applicationDocumentsMigration.up(db);
      await applicationNotesMigration.up(db);
      await monthlyAnalyticsMigration.up(db);

      // Verify all tables exist
      const expectedTables = [
        'roles',
        'permissions',
        'job_categories',
        'system_settings',
        'job_types',
        'employment_levels',
        'job_posting_statuses',
        'application_statuses',
        'candidates',
        'email_notifications',
        'users',
        'role_permissions',
        'password_reset_tokens',
        'sessions',
        'activity_logs',
        'departments',
        'job_postings',
        'applications',
        'job_views',
        'application_documents',
        'application_notes',
        'monthly_analytics',
      ];

      for (const tableName of expectedTables) {
        const hasTable = await db.schema.hasTable(tableName);
        expect(hasTable).toBe(true);
      }

      // Verify total table count
      const allTables = await db.raw(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name NOT LIKE 'knex_%'
        ORDER BY table_name
      `);
      expect(allTables.rows.length).toBe(expectedTables.length);
    });

    it('should handle complete rollback sequence in reverse order', async () => {
      // Import all migrations in order
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      const systemSettingsMigration = await import(
        '../../../database/migrations/20250728070454_system_settings'
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
      const emailNotificationsMigration = await import(
        '../../../database/migrations/20250728070533_email_notifications'
      );
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );
      const passwordResetTokensMigration = await import(
        '../../../database/migrations/20250728070608_password_reset_tokens'
      );
      const sessionsMigration = await import(
        '../../../database/migrations/20250728070612_sessions'
      );
      const activityLogsMigration = await import(
        '../../../database/migrations/20250728070616_activity_logs'
      );
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
      const monthlyAnalyticsMigration = await import(
        '../../../database/migrations/20250728070654_monthly_analytics'
      );

      // Run all migrations up
      await rolesMigration.up(db);
      await permissionsMigration.up(db);
      await jobCategoriesMigration.up(db);
      await systemSettingsMigration.up(db);
      await jobTypesMigration.up(db);
      await employmentLevelsMigration.up(db);
      await jobPostingStatusesMigration.up(db);
      await applicationStatusesMigration.up(db);
      await candidatesMigration.up(db);
      await emailNotificationsMigration.up(db);
      await usersMigration.up(db);
      await rolePermissionsMigration.up(db);
      await passwordResetTokensMigration.up(db);
      await sessionsMigration.up(db);
      await activityLogsMigration.up(db);
      await departmentsMigration.up(db);
      await jobPostingsMigration.up(db);
      await applicationsMigration.up(db);
      await jobViewsMigration.up(db);
      await applicationDocumentsMigration.up(db);
      await applicationNotesMigration.up(db);
      await monthlyAnalyticsMigration.up(db);

      // Verify all tables exist initially
      const expectedTables = [
        'roles',
        'permissions',
        'job_categories',
        'system_settings',
        'job_types',
        'employment_levels',
        'job_posting_statuses',
        'application_statuses',
        'candidates',
        'email_notifications',
        'users',
        'role_permissions',
        'password_reset_tokens',
        'sessions',
        'activity_logs',
        'departments',
        'job_postings',
        'applications',
        'job_views',
        'application_documents',
        'application_notes',
        'monthly_analytics',
      ];

      for (const tableName of expectedTables) {
        const hasTable = await db.schema.hasTable(tableName);
        expect(hasTable).toBe(true);
      }

      // Rollback all migrations in reverse order
      await monthlyAnalyticsMigration.down(db);
      await applicationNotesMigration.down(db);
      await applicationDocumentsMigration.down(db);
      await jobViewsMigration.down(db);
      await applicationsMigration.down(db);
      await jobPostingsMigration.down(db);
      await departmentsMigration.down(db);
      await activityLogsMigration.down(db);
      await sessionsMigration.down(db);
      await passwordResetTokensMigration.down(db);
      await rolePermissionsMigration.down(db);
      await usersMigration.down(db);
      await emailNotificationsMigration.down(db);
      await candidatesMigration.down(db);
      await applicationStatusesMigration.down(db);
      await jobPostingStatusesMigration.down(db);
      await employmentLevelsMigration.down(db);
      await jobTypesMigration.down(db);
      await systemSettingsMigration.down(db);
      await jobCategoriesMigration.down(db);
      await permissionsMigration.down(db);
      await rolesMigration.down(db);

      // Verify all tables are dropped
      for (const tableName of expectedTables) {
        const hasTable = await db.schema.hasTable(tableName);
        expect(hasTable).toBe(false);
      }
    });
  });

  describe('Migration Integration Tests', () => {
    it('should maintain referential integrity across all tables', async () => {
      // Run core migrations
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );
      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
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
      const jobPostingsMigration = await import(
        '../../../database/migrations/20250728070623_job_postings'
      );

      // Run migrations in dependency order
      await rolesMigration.up(db);
      await permissionsMigration.up(db);
      await usersMigration.up(db);
      await rolePermissionsMigration.up(db);
      await departmentsMigration.up(db);
      await jobCategoriesMigration.up(db);
      await jobTypesMigration.up(db);
      await employmentLevelsMigration.up(db);
      await jobPostingStatusesMigration.up(db);
      await jobPostingsMigration.up(db);

      // Insert test data to verify relationships
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
        { name: 'user', display_name: 'User', description: 'Regular user' },
      ]);

      await db('permissions').insert([
        { name: 'read_posts', description: 'Read posts' },
        { name: 'write_posts', description: 'Write posts' },
      ]);

      await db('users').insert([
        {
          uuid: '123e4567-e89b-12d3-a456-426614174000',
          email: 'admin@example.com',
          password: 'hashed_password',
          name: 'Admin User',
          role_id: 1,
        },
      ]);

      await db('role_permissions').insert([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
      ]);

      await db('departments').insert([
        { name: 'Engineering', description: 'Engineering department', created_by: 1 },
      ]);

      await db('job_categories').insert([
        {
          name: 'Software Development',
          slug: 'software-development',
          description: 'Software development jobs',
        },
      ]);

      await db('job_types').insert([{ name: 'Full-time' }]);

      await db('employment_levels').insert([{ name: 'Entry Level' }]);

      await db('job_posting_statuses').insert([{ name: 'Draft' }, { name: 'Published' }]);

      await db('job_postings').insert([
        {
          uuid: '123e4567-e89b-12d3-a456-426614174001',
          title: 'Software Engineer',
          slug: 'software-engineer',
          department_id: 1,
          job_category_id: 1,
          job_type_id: 1,
          employment_level_id: 1,
          status_id: 2,
          description: 'We are looking for a software engineer',
          requirements: 'Bachelor degree in Computer Science',
          responsibilities: 'Develop software applications',
          created_by: 1,
        },
      ]);

      // Verify all relationships work correctly
      const jobPostingWithRelations = await db('job_postings')
        .join('departments', 'job_postings.department_id', 'departments.id')
        .join('job_categories', 'job_postings.job_category_id', 'job_categories.id')
        .join('job_types', 'job_postings.job_type_id', 'job_types.id')
        .join('employment_levels', 'job_postings.employment_level_id', 'employment_levels.id')
        .join('job_posting_statuses', 'job_postings.status_id', 'job_posting_statuses.id')
        .join('users', 'job_postings.created_by', 'users.id')
        .select(
          'job_postings.title',
          'departments.name as department_name',
          'job_categories.name as category_name',
          'job_types.name as type_name',
          'employment_levels.name as level_name',
          'job_posting_statuses.name as status_name',
          'users.name as created_by_name'
        );

      expect(jobPostingWithRelations.length).toBe(1);
      const jobPosting = jobPostingWithRelations[0];
      expect(jobPosting.title).toBe('Software Engineer');
      expect(jobPosting.department_name).toBe('Engineering');
      expect(jobPosting.category_name).toBe('Software Development');
      expect(jobPosting.type_name).toBe('Full-time');
      expect(jobPosting.level_name).toBe('Entry Level');
      expect(jobPosting.status_name).toBe('Published');
      expect(jobPosting.created_by_name).toBe('Admin User');

      // Clean up
      await jobPostingsMigration.down(db);
      await jobPostingStatusesMigration.down(db);
      await employmentLevelsMigration.down(db);
      await jobTypesMigration.down(db);
      await jobCategoriesMigration.down(db);
      await departmentsMigration.down(db);
      await rolePermissionsMigration.down(db);
      await usersMigration.down(db);
      await permissionsMigration.down(db);
      await rolesMigration.down(db);
    });
  });
});
