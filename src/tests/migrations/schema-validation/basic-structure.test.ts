import knex from 'knex';
import config from '../../../config/knexfile';

describe('Basic Schema Structure Validation', () => {
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

  describe('Core Tables Structure', () => {
    it('should create roles table with correct structure', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(true);

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
    });

    it('should create permissions table with correct structure', async () => {
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      await permissionsMigration.up(db);

      const hasTable = await db.schema.hasTable('permissions');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'permissions'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should create users table with correct structure', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const hasTable = await db.schema.hasTable('users');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('uuid');
      expect(columnNames).toContain('email');
      expect(columnNames).toContain('password');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('role_id');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('email_verified_at');
      expect(columnNames).toContain('last_login_at');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('deleted_at');
    });
  });

  describe('Lookup Tables Structure', () => {
    it('should create job_categories table with correct structure', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const hasTable = await db.schema.hasTable('job_categories');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'job_categories'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });

    it('should create job_types table with correct structure', async () => {
      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );
      await jobTypesMigration.up(db);

      const hasTable = await db.schema.hasTable('job_types');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'job_types'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });

  describe('Business Logic Tables Structure', () => {
    it('should create job_postings table with correct structure', async () => {
      // Create dependencies first in correct order
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

      const hasTable = await db.schema.hasTable('job_postings');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'job_postings'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('uuid');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('slug');
      expect(columnNames).toContain('department_id');
      expect(columnNames).toContain('job_category_id');
      expect(columnNames).toContain('job_type_id');
      expect(columnNames).toContain('employment_level_id');
      expect(columnNames).toContain('status_id');
      expect(columnNames).toContain('priority_level');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('requirements');
      expect(columnNames).toContain('responsibilities');
      expect(columnNames).toContain('benefits');
      expect(columnNames).toContain('team_info');
      expect(columnNames).toContain('salary_min');
      expect(columnNames).toContain('salary_max');
      expect(columnNames).toContain('is_salary_negotiable');
      expect(columnNames).toContain('location');
      expect(columnNames).toContain('is_remote');
      expect(columnNames).toContain('application_deadline');
      expect(columnNames).toContain('max_applications');
      expect(columnNames).toContain('views_count');
      expect(columnNames).toContain('applications_count');
      expect(columnNames).toContain('published_at');
      expect(columnNames).toContain('closed_at');
      expect(columnNames).toContain('created_by');
      expect(columnNames).toContain('updated_by');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('deleted_at');
    });
  });
});
