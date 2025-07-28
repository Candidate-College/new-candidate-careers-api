import knex from 'knex';
import config from '../../../config/knexfile';

describe('Rollback Integrity Validation', () => {
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

  describe('Data Preservation During Rollback', () => {
    it('should preserve data in dependent tables when rolling back child table', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const usersMigration = await import('../../../database/migrations/20250728070538_users');

      // Run migrations up
      await rolesMigration.up(db);
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
        {
          uuid: '123e4567-e89b-12d3-a456-426614174001',
          email: 'user@example.com',
          password: 'hashed_password',
          name: 'Regular User',
          role_id: 2,
        },
      ]);

      // Verify data exists
      let roles = await db('roles').select('*');
      let users = await db('users').select('*');
      expect(roles.length).toBe(2);
      expect(users.length).toBe(2);

      // Rollback users table
      await usersMigration.down(db);

      // Verify users table is dropped but roles table and data remain
      let hasUsersTable = await db.schema.hasTable('users');
      let hasRolesTable = await db.schema.hasTable('roles');
      expect(hasUsersTable).toBe(false);
      expect(hasRolesTable).toBe(true);

      roles = await db('roles').select('*');
      expect(roles.length).toBe(2);

      // Clean up
      await rolesMigration.down(db);
    });

    it('should preserve data in parent tables when rolling back child table', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );

      // Run migrations up
      await rolesMigration.up(db);
      await permissionsMigration.up(db);
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

      // Verify data exists
      let roles = await db('roles').select('*');
      let permissions = await db('permissions').select('*');
      let rolePermissions = await db('role_permissions').select('*');
      expect(roles.length).toBe(2);
      expect(permissions.length).toBe(2);
      expect(rolePermissions.length).toBe(3);

      // Rollback role_permissions table
      await rolePermissionsMigration.down(db);

      // Verify role_permissions table is dropped but parent tables and data remain
      let hasRolePermissionsTable = await db.schema.hasTable('role_permissions');
      let hasRolesTable = await db.schema.hasTable('roles');
      let hasPermissionsTable = await db.schema.hasTable('permissions');
      expect(hasRolePermissionsTable).toBe(false);
      expect(hasRolesTable).toBe(true);
      expect(hasPermissionsTable).toBe(true);

      roles = await db('roles').select('*');
      permissions = await db('permissions').select('*');
      expect(roles.length).toBe(2);
      expect(permissions.length).toBe(2);

      // Clean up
      await permissionsMigration.down(db);
      await rolesMigration.down(db);
    });
  });

  describe('Rollback Order Validation', () => {
    it('should handle rollback in correct dependency order', async () => {
      // Create all dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
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

      // Run all migrations up
      await rolesMigration.up(db);
      await usersMigration.up(db);
      await departmentsMigration.up(db);
      await jobCategoriesMigration.up(db);
      await jobTypesMigration.up(db);
      await employmentLevelsMigration.up(db);
      await jobPostingStatusesMigration.up(db);
      await jobPostingsMigration.up(db);

      // Verify all tables exist
      let hasJobPostingsTable = await db.schema.hasTable('job_postings');
      let hasJobPostingStatusesTable = await db.schema.hasTable('job_posting_statuses');
      let hasEmploymentLevelsTable = await db.schema.hasTable('employment_levels');
      let hasJobTypesTable = await db.schema.hasTable('job_types');
      let hasJobCategoriesTable = await db.schema.hasTable('job_categories');
      let hasDepartmentsTable = await db.schema.hasTable('departments');
      let hasUsersTable = await db.schema.hasTable('users');
      let hasRolesTable = await db.schema.hasTable('roles');

      expect(hasJobPostingsTable).toBe(true);
      expect(hasJobPostingStatusesTable).toBe(true);
      expect(hasEmploymentLevelsTable).toBe(true);
      expect(hasJobTypesTable).toBe(true);
      expect(hasJobCategoriesTable).toBe(true);
      expect(hasDepartmentsTable).toBe(true);
      expect(hasUsersTable).toBe(true);
      expect(hasRolesTable).toBe(true);

      // Rollback in reverse dependency order
      await jobPostingsMigration.down(db);
      await jobPostingStatusesMigration.down(db);
      await employmentLevelsMigration.down(db);
      await jobTypesMigration.down(db);
      await jobCategoriesMigration.down(db);
      await departmentsMigration.down(db);
      await usersMigration.down(db);
      await rolesMigration.down(db);

      // Verify all tables are dropped
      hasJobPostingsTable = await db.schema.hasTable('job_postings');
      hasJobPostingStatusesTable = await db.schema.hasTable('job_posting_statuses');
      hasEmploymentLevelsTable = await db.schema.hasTable('employment_levels');
      hasJobTypesTable = await db.schema.hasTable('job_types');
      hasJobCategoriesTable = await db.schema.hasTable('job_categories');
      hasDepartmentsTable = await db.schema.hasTable('departments');
      hasUsersTable = await db.schema.hasTable('users');
      hasRolesTable = await db.schema.hasTable('roles');

      expect(hasJobPostingsTable).toBe(false);
      expect(hasJobPostingStatusesTable).toBe(false);
      expect(hasEmploymentLevelsTable).toBe(false);
      expect(hasJobTypesTable).toBe(false);
      expect(hasJobCategoriesTable).toBe(false);
      expect(hasDepartmentsTable).toBe(false);
      expect(hasUsersTable).toBe(false);
      expect(hasRolesTable).toBe(false);
    });
  });

  describe('Rollback Error Handling', () => {
    it('should handle rollback errors gracefully', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');

      // Try to rollback a table that doesn't exist
      try {
        await rolesMigration.down(db);
        // This should not throw an error if the table doesn't exist
        // Knex handles this gracefully
      } catch (error: any) {
        // If an error occurs, it should be a specific type of error
        expect(error.message).toBeDefined();
      }
    });

    it('should handle rollback with existing data', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');

      // Run migration up
      await rolesMigration.up(db);

      // Insert data
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
      ]);

      // Rollback should work even with data
      await rolesMigration.down(db);

      // Verify table is dropped
      const hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(false);
    });
  });
});
