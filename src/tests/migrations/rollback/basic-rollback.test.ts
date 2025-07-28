import knex from 'knex';
import config from '../../../config/knexfile';

describe('Basic Migration Rollback', () => {
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

  describe('Simple Table Rollback', () => {
    it('should rollback roles table migration', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');

      // Run migration up
      await rolesMigration.up(db);

      // Verify table exists
      let hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(true);

      // Run migration down
      await rolesMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(false);
    });

    it('should rollback permissions table migration', async () => {
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );

      // Run migration up
      await permissionsMigration.up(db);

      // Verify table exists
      let hasTable = await db.schema.hasTable('permissions');
      expect(hasTable).toBe(true);

      // Run migration down
      await permissionsMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('permissions');
      expect(hasTable).toBe(false);
    });

    it('should rollback job_categories table migration', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );

      // Run migration up
      await jobCategoriesMigration.up(db);

      // Verify table exists
      let hasTable = await db.schema.hasTable('job_categories');
      expect(hasTable).toBe(true);

      // Run migration down
      await jobCategoriesMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('job_categories');
      expect(hasTable).toBe(false);
    });

    it('should rollback job_types table migration', async () => {
      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );

      // Run migration up
      await jobTypesMigration.up(db);

      // Verify table exists
      let hasTable = await db.schema.hasTable('job_types');
      expect(hasTable).toBe(true);

      // Run migration down
      await jobTypesMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('job_types');
      expect(hasTable).toBe(false);
    });
  });

  describe('Dependent Table Rollback', () => {
    it('should rollback users table migration with foreign key', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const usersMigration = await import('../../../database/migrations/20250728070538_users');

      // Run migrations up
      await rolesMigration.up(db);
      await usersMigration.up(db);

      // Verify tables exist
      let hasRolesTable = await db.schema.hasTable('roles');
      let hasUsersTable = await db.schema.hasTable('users');
      expect(hasRolesTable).toBe(true);
      expect(hasUsersTable).toBe(true);

      // Run users migration down
      await usersMigration.down(db);

      // Verify users table is dropped but roles table remains
      hasUsersTable = await db.schema.hasTable('users');
      hasRolesTable = await db.schema.hasTable('roles');
      expect(hasUsersTable).toBe(false);
      expect(hasRolesTable).toBe(true);

      // Run roles migration down
      await rolesMigration.down(db);

      // Verify roles table is also dropped
      hasRolesTable = await db.schema.hasTable('roles');
      expect(hasRolesTable).toBe(false);
    });

    it('should rollback departments table migration with foreign key', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );

      // Run migrations up
      await rolesMigration.up(db);
      await usersMigration.up(db);
      await departmentsMigration.up(db);

      // Verify tables exist
      let hasDepartmentsTable = await db.schema.hasTable('departments');
      expect(hasDepartmentsTable).toBe(true);

      // Run departments migration down
      await departmentsMigration.down(db);

      // Verify departments table is dropped
      hasDepartmentsTable = await db.schema.hasTable('departments');
      expect(hasDepartmentsTable).toBe(false);

      // Clean up remaining tables
      await usersMigration.down(db);
      await rolesMigration.down(db);
    });
  });

  describe('Junction Table Rollback', () => {
    it('should rollback role_permissions junction table migration', async () => {
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

      // Verify junction table exists
      let hasRolePermissionsTable = await db.schema.hasTable('role_permissions');
      expect(hasRolePermissionsTable).toBe(true);

      // Run role_permissions migration down
      await rolePermissionsMigration.down(db);

      // Verify junction table is dropped
      hasRolePermissionsTable = await db.schema.hasTable('role_permissions');
      expect(hasRolePermissionsTable).toBe(false);

      // Clean up remaining tables
      await permissionsMigration.down(db);
      await rolesMigration.down(db);
    });
  });

  describe('Complex Table Rollback', () => {
    it('should rollback job_postings table migration with multiple foreign keys', async () => {
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

      // Verify job_postings table exists
      let hasJobPostingsTable = await db.schema.hasTable('job_postings');
      expect(hasJobPostingsTable).toBe(true);

      // Run job_postings migration down
      await jobPostingsMigration.down(db);

      // Verify job_postings table is dropped
      hasJobPostingsTable = await db.schema.hasTable('job_postings');
      expect(hasJobPostingsTable).toBe(false);

      // Verify dependent tables still exist
      const hasJobPostingStatusesTable = await db.schema.hasTable('job_posting_statuses');
      const hasEmploymentLevelsTable = await db.schema.hasTable('employment_levels');
      const hasJobTypesTable = await db.schema.hasTable('job_types');
      const hasJobCategoriesTable = await db.schema.hasTable('job_categories');
      const hasDepartmentsTable = await db.schema.hasTable('departments');
      const hasUsersTable = await db.schema.hasTable('users');
      const hasRolesTable = await db.schema.hasTable('roles');

      expect(hasJobPostingStatusesTable).toBe(true);
      expect(hasEmploymentLevelsTable).toBe(true);
      expect(hasJobTypesTable).toBe(true);
      expect(hasJobCategoriesTable).toBe(true);
      expect(hasDepartmentsTable).toBe(true);
      expect(hasUsersTable).toBe(true);
      expect(hasRolesTable).toBe(true);

      // Clean up remaining tables
      await jobPostingStatusesMigration.down(db);
      await employmentLevelsMigration.down(db);
      await jobTypesMigration.down(db);
      await jobCategoriesMigration.down(db);
      await departmentsMigration.down(db);
      await usersMigration.down(db);
      await rolesMigration.down(db);
    });
  });
});
