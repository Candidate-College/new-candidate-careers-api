import knex from 'knex';
import config from '../../../config/knexfile';

describe('Migration Dependencies', () => {
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

  describe('Core Dependencies', () => {
    it('should require roles table before users table', async () => {
      const usersMigration = await import('../../../database/migrations/20250728070538_users');

      // Try to run users migration without roles table
      try {
        await usersMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require roles and permissions before role_permissions table', async () => {
      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );

      // Try to run role_permissions migration without roles and permissions tables
      try {
        await rolePermissionsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require users table before departments table', async () => {
      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );

      // Try to run departments migration without users table
      try {
        await departmentsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });
  });

  describe('Business Logic Dependencies', () => {
    it('should require all lookup tables before job_postings table', async () => {
      const jobPostingsMigration = await import(
        '../../../database/migrations/20250728070623_job_postings'
      );

      // Try to run job_postings migration without dependencies
      try {
        await jobPostingsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require job_postings and candidates before applications table', async () => {
      const applicationsMigration = await import(
        '../../../database/migrations/20250728070628_applications'
      );

      // Try to run applications migration without dependencies
      try {
        await applicationsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require job_postings before job_views table', async () => {
      const jobViewsMigration = await import(
        '../../../database/migrations/20250728070633_job_views'
      );

      // Try to run job_views migration without job_postings table
      try {
        await jobViewsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });
  });

  describe('Supporting Feature Dependencies', () => {
    it('should require applications before application_documents table', async () => {
      const applicationDocumentsMigration = await import(
        '../../../database/migrations/20250728070643_application_documents'
      );

      // Try to run application_documents migration without applications table
      try {
        await applicationDocumentsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require applications and users before application_notes table', async () => {
      const applicationNotesMigration = await import(
        '../../../database/migrations/20250728070649_application_notes'
      );

      // Try to run application_notes migration without dependencies
      try {
        await applicationNotesMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require departments and job_categories before monthly_analytics table', async () => {
      const monthlyAnalyticsMigration = await import(
        '../../../database/migrations/20250728070654_monthly_analytics'
      );

      // Try to run monthly_analytics migration without dependencies
      try {
        await monthlyAnalyticsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });
  });

  describe('Authentication Dependencies', () => {
    it('should require users table before password_reset_tokens table', async () => {
      const passwordResetTokensMigration = await import(
        '../../../database/migrations/20250728070608_password_reset_tokens'
      );

      // Try to run password_reset_tokens migration without users table
      try {
        await passwordResetTokensMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require users table before sessions table', async () => {
      const sessionsMigration = await import(
        '../../../database/migrations/20250728070612_sessions'
      );

      // Try to run sessions migration without users table
      try {
        await sessionsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });

    it('should require users table before activity_logs table', async () => {
      const activityLogsMigration = await import(
        '../../../database/migrations/20250728070616_activity_logs'
      );

      // Try to run activity_logs migration without users table
      try {
        await activityLogsMigration.up(db);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('relation');
      }
    });
  });

  describe('Valid Dependency Sequences', () => {
    it('should allow users migration after roles migration', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const usersMigration = await import('../../../database/migrations/20250728070538_users');

      // Run roles migration first
      await rolesMigration.up(db);

      // Verify roles table exists
      const hasRolesTable = await db.schema.hasTable('roles');
      expect(hasRolesTable).toBe(true);

      // Run users migration - should succeed
      await usersMigration.up(db);

      // Verify users table exists
      const hasUsersTable = await db.schema.hasTable('users');
      expect(hasUsersTable).toBe(true);

      // Clean up
      await usersMigration.down(db);
      await rolesMigration.down(db);
    });

    it('should allow role_permissions migration after roles and permissions', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      const rolePermissionsMigration = await import(
        '../../../database/migrations/20250728070543_role_permissions'
      );

      // Run dependencies first
      await rolesMigration.up(db);
      await permissionsMigration.up(db);

      // Verify dependency tables exist
      const hasRolesTable = await db.schema.hasTable('roles');
      const hasPermissionsTable = await db.schema.hasTable('permissions');
      expect(hasRolesTable).toBe(true);
      expect(hasPermissionsTable).toBe(true);

      // Run role_permissions migration - should succeed
      await rolePermissionsMigration.up(db);

      // Verify role_permissions table exists
      const hasRolePermissionsTable = await db.schema.hasTable('role_permissions');
      expect(hasRolePermissionsTable).toBe(true);

      // Clean up
      await rolePermissionsMigration.down(db);
      await permissionsMigration.down(db);
      await rolesMigration.down(db);
    });
  });
});
