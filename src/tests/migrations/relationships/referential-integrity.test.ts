import knex from 'knex';
import config from '../../../config/knexfile';

describe('Referential Integrity Validation', () => {
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

  describe('Cascade Delete Behavior', () => {
    it('should cascade delete role_permissions when role is deleted', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      await permissionsMigration.up(db);

      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );
      await rolePermissionsMigration.up(db);

      // Insert test data
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
        { name: 'user', display_name: 'User', description: 'Regular user' },
      ]);

      await db('permissions').insert([
        { name: 'read_posts', description: 'Read posts' },
        { name: 'write_posts', description: 'Write posts' },
      ]);

      await db('role_permissions').insert([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
        { role_id: 2, permission_id: 1 },
      ]);

      // Verify initial state
      let rolePermissions = await db('role_permissions').select('*');
      expect(rolePermissions.length).toBe(3);

      // Delete a role
      await db('roles').where('id', 1).del();

      // Verify cascade delete
      rolePermissions = await db('role_permissions').select('*');
      expect(rolePermissions.length).toBe(1);
      expect(parseInt(rolePermissions[0].role_id)).toBe(2);
    });

    it('should cascade delete role_permissions when permission is deleted', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      await permissionsMigration.up(db);

      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );
      await rolePermissionsMigration.up(db);

      // Insert test data
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
        { name: 'user', display_name: 'User', description: 'Regular user' },
      ]);

      await db('permissions').insert([
        { name: 'read_posts', description: 'Read posts' },
        { name: 'write_posts', description: 'Write posts' },
      ]);

      await db('role_permissions').insert([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
        { role_id: 2, permission_id: 1 },
      ]);

      // Verify initial state
      let rolePermissions = await db('role_permissions').select('*');
      expect(rolePermissions.length).toBe(3);

      // Delete a permission
      await db('permissions').where('id', 1).del();

      // Verify cascade delete
      rolePermissions = await db('role_permissions').select('*');
      expect(rolePermissions.length).toBe(1);
      expect(parseInt(rolePermissions[0].permission_id)).toBe(2);
    });
  });

  describe('Restrict Delete Behavior', () => {
    it('should prevent deletion of role when users reference it', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      // Insert test data
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
        { name: 'user', display_name: 'User', description: 'Regular user' },
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

      // Try to delete the role - should fail due to RESTRICT constraint
      try {
        await db('roles').where('id', 1).del();
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('violates foreign key constraint');
      }

      // Verify role still exists
      const roles = await db('roles').where('id', 1).select('*');
      expect(roles.length).toBe(1);
    });

    it('should prevent deletion of job_type when job_postings reference it', async () => {
      // Create all dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );
      await departmentsMigration.up(db);

      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );
      await jobTypesMigration.up(db);

      const employmentLevelsMigration = await import(
        '../../../database/migrations/20250728070506_employment_levels'
      );
      await employmentLevelsMigration.up(db);

      const jobPostingStatusesMigration = await import(
        '../../../database/migrations/20250728070512_job_posting_statuses'
      );
      await jobPostingStatusesMigration.up(db);

      const jobPostingsMigration = await import(
        '../../../database/migrations/20250728070623_job_postings'
      );
      await jobPostingsMigration.up(db);

      // Insert test data
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
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

      await db('job_types').insert([{ name: 'Full-time' }, { name: 'Part-time' }]);

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

      // Try to delete the job_type - should fail due to RESTRICT constraint
      try {
        await db('job_types').where('id', 1).del();
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('violates foreign key constraint');
      }

      // Verify job_type still exists
      const jobTypes = await db('job_types').where('id', 1).select('*');
      expect(jobTypes.length).toBe(1);
    });
  });

  describe('Set NULL Delete Behavior', () => {
    it('should set department_id to NULL when department is deleted', async () => {
      // Create all dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );
      await departmentsMigration.up(db);

      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );
      await jobTypesMigration.up(db);

      const employmentLevelsMigration = await import(
        '../../../database/migrations/20250728070506_employment_levels'
      );
      await employmentLevelsMigration.up(db);

      const jobPostingStatusesMigration = await import(
        '../../../database/migrations/20250728070512_job_posting_statuses'
      );
      await jobPostingStatusesMigration.up(db);

      const jobPostingsMigration = await import(
        '../../../database/migrations/20250728070623_job_postings'
      );
      await jobPostingsMigration.up(db);

      // Insert test data
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
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
        {
          uuid: '123e4567-e89b-12d3-a456-426614174002',
          title: 'Marketing Manager',
          slug: 'marketing-manager',
          department_id: 2,
          job_category_id: 1,
          job_type_id: 1,
          employment_level_id: 1,
          status_id: 2,
          description: 'We are looking for a marketing manager',
          requirements: 'Bachelor degree in Marketing',
          responsibilities: 'Manage marketing campaigns',
          created_by: 1,
        },
      ]);

      // Verify initial state
      let jobPostings = await db('job_postings').select('department_id');
      expect(parseInt(jobPostings[0].department_id)).toBe(1);
      expect(parseInt(jobPostings[1].department_id)).toBe(2);

      // Delete the engineering department
      await db('departments').where('id', 1).del();

      // Verify SET NULL behavior
      jobPostings = await db('job_postings').select('department_id').orderBy('id');
      expect(jobPostings[0].department_id).toBeNull();
      expect(parseInt(jobPostings[1].department_id)).toBe(2);
    });
  });
});
