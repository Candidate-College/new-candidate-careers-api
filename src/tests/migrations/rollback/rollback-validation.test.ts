import knex from 'knex';
import config from '../../../config/knexfile';

describe('Rollback Validation', () => {
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

  describe('Rollback Validation', () => {
    it('should validate rollback removes all table artifacts', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');

      // Run migration up
      await rolesMigration.up(db);

      // Verify table exists
      let hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(true);

      // Check for indexes
      const indexes = await db.raw(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'roles'
      `);
      expect(indexes.rows.length).toBeGreaterThan(0);

      // Run migration down
      await rolesMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(false);

      // Verify indexes are also removed
      const remainingIndexes = await db.raw(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'roles'
      `);
      expect(remainingIndexes.rows.length).toBe(0);
    });

    it('should validate rollback removes constraints', async () => {
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

      // Verify foreign key constraints exist
      const constraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'role_permissions'
      `);
      expect(constraints.rows.length).toBeGreaterThan(0);

      // Run migration down
      await rolePermissionsMigration.down(db);

      // Verify table is dropped
      const hasTable = await db.schema.hasTable('role_permissions');
      expect(hasTable).toBe(false);

      // Clean up
      await permissionsMigration.down(db);
      await rolesMigration.down(db);
    });

    it('should validate rollback removes unique constraints', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');

      // Run migration up
      await rolesMigration.up(db);

      // Check for unique constraints
      const uniqueConstraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
          AND tc.table_name = 'roles'
      `);
      expect(uniqueConstraints.rows.length).toBeGreaterThan(0);

      // Run migration down
      await rolesMigration.down(db);

      // Verify table is dropped
      const hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(false);
    });
  });

  describe('Rollback Edge Cases', () => {
    it('should handle rollback of table with complex constraints', async () => {
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

      // Verify job_postings table exists with complex constraints
      let hasJobPostingsTable = await db.schema.hasTable('job_postings');
      expect(hasJobPostingsTable).toBe(true);

      // Check for foreign key constraints
      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'job_postings'
      `);
      expect(foreignKeys.rows.length).toBeGreaterThan(0);

      // Run job_postings migration down
      await jobPostingsMigration.down(db);

      // Verify job_postings table is dropped
      hasJobPostingsTable = await db.schema.hasTable('job_postings');
      expect(hasJobPostingsTable).toBe(false);

      // Clean up remaining tables
      await jobPostingStatusesMigration.down(db);
      await employmentLevelsMigration.down(db);
      await jobTypesMigration.down(db);
      await jobCategoriesMigration.down(db);
      await departmentsMigration.down(db);
      await usersMigration.down(db);
      await rolesMigration.down(db);
    });

    it('should handle rollback of table with enum constraints', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );

      // Run migration up
      await jobCategoriesMigration.up(db);

      // Verify table exists with enum constraint
      let hasTable = await db.schema.hasTable('job_categories');
      expect(hasTable).toBe(true);

      // Check for enum constraint
      const enumColumns = await db.raw(`
        SELECT 
          column_name,
          data_type
        FROM information_schema.columns 
        WHERE table_name = 'job_categories' 
          AND data_type = 'text'
          AND column_name = 'status'
      `);
      expect(enumColumns.rows.length).toBe(1);

      // Run migration down
      await jobCategoriesMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('job_categories');
      expect(hasTable).toBe(false);
    });

    it('should handle rollback of table with default values', async () => {
      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');

      // Run migrations up
      await rolesMigration.up(db);
      await usersMigration.up(db);

      // Verify table exists with default values
      let hasTable = await db.schema.hasTable('users');
      expect(hasTable).toBe(true);

      // Check for default values
      const defaultColumns = await db.raw(`
        SELECT 
          column_name,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_default IS NOT NULL
      `);
      expect(defaultColumns.rows.length).toBeGreaterThan(0);

      // Run migration down
      await usersMigration.down(db);

      // Verify table is dropped
      hasTable = await db.schema.hasTable('users');
      expect(hasTable).toBe(false);

      // Clean up
      await rolesMigration.down(db);
    });
  });

  describe('Rollback Consistency', () => {
    it('should maintain consistency after rollback and re-apply', async () => {
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

      // Run migration up again
      await rolesMigration.up(db);

      // Verify table exists again
      hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(true);

      // Verify table structure is consistent
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'roles'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('display_name');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');

      // Clean up
      await rolesMigration.down(db);
    });
  });
});
