import knex from 'knex';
import config from '../../../config/knexfile';

describe('Data Types Validation', () => {
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
    // Clean up any existing tables from previous tests
    const tablesToDrop = [
      'monthly_analytics',
      'application_notes',
      'application_documents',
      'job_views',
      'applications',
      'job_postings',
      'activity_logs',
      'departments',
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
      'password_reset_tokens',
      'sessions',
    ];

    for (const table of tablesToDrop) {
      await db.schema.dropTableIfExists(table);
    }
  });

  describe('Core Tables Data Types', () => {
    it('should have correct data types on roles table', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'roles'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(100);
      expect(columnMap.get('display_name').data_type).toBe('character varying');
      expect(columnMap.get('display_name').character_maximum_length).toBe(100);
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
    });

    it('should have correct data types on permissions table', async () => {
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      await permissionsMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'permissions'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(100);
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
    });

    it('should have correct data types on users table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('uuid').data_type).toBe('character varying');
      expect(columnMap.get('uuid').character_maximum_length).toBe(36);
      expect(columnMap.get('email').data_type).toBe('character varying');
      expect(columnMap.get('email').character_maximum_length).toBe(255);
      expect(columnMap.get('password').data_type).toBe('character varying');
      expect(columnMap.get('password').character_maximum_length).toBe(255);
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(255);
      expect(columnMap.get('role_id').data_type).toBe('bigint');
      expect(columnMap.get('status').data_type).toBe('text');
      expect(columnMap.get('email_verified_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('last_login_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('deleted_at').data_type).toBe('timestamp with time zone');
    });
  });

  describe('Lookup Tables Data Types', () => {
    it('should have correct data types on job_categories table', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'job_categories'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(255);
      expect(columnMap.get('slug').data_type).toBe('character varying');
      expect(columnMap.get('slug').character_maximum_length).toBe(255);
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('status').data_type).toBe('text');
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
    });

    it('should have correct data types on job_types table', async () => {
      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );
      await jobTypesMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'job_types'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(100);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
    });
  });

  describe('Complex Data Types', () => {
    it('should have correct data types on system_settings table', async () => {
      const systemSettingsMigration = await import(
        '../../../database/migrations/20250728070454_system_settings'
      );
      await systemSettingsMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'system_settings'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('key').data_type).toBe('character varying');
      expect(columnMap.get('key').character_maximum_length).toBe(100);
      expect(columnMap.get('value').data_type).toBe('text');
      expect(columnMap.get('type').data_type).toBe('text');
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('is_public').data_type).toBe('boolean');
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
    });

    it('should have correct data types on candidates table', async () => {
      const candidatesMigration = await import(
        '../../../database/migrations/20250728070526_candidates'
      );
      await candidatesMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'candidates'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify data types
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('uuid').data_type).toBe('character varying');
      expect(columnMap.get('uuid').character_maximum_length).toBe(36);
      expect(columnMap.get('email').data_type).toBe('character varying');
      expect(columnMap.get('email').character_maximum_length).toBe(255);
      expect(columnMap.get('full_name').data_type).toBe('character varying');
      expect(columnMap.get('full_name').character_maximum_length).toBe(255);
      expect(columnMap.get('domicile').data_type).toBe('character varying');
      expect(columnMap.get('domicile').character_maximum_length).toBe(255);
      expect(columnMap.get('university').data_type).toBe('character varying');
      expect(columnMap.get('university').character_maximum_length).toBe(255);
      expect(columnMap.get('major').data_type).toBe('character varying');
      expect(columnMap.get('major').character_maximum_length).toBe(255);
      expect(columnMap.get('semester').data_type).toBe('character varying');
      expect(columnMap.get('semester').character_maximum_length).toBe(10);
      expect(columnMap.get('instagram_url').data_type).toBe('character varying');
      expect(columnMap.get('instagram_url').character_maximum_length).toBe(500);
      expect(columnMap.get('whatsapp_number').data_type).toBe('character varying');
      expect(columnMap.get('whatsapp_number').character_maximum_length).toBe(20);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('deleted_at').data_type).toBe('timestamp with time zone');
    });
  });

  describe('Numeric Data Types', () => {
    it('should have correct numeric data types on job_postings table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

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

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );
      await departmentsMigration.up(db);

      const jobPostingsMigration = await import(
        '../../../database/migrations/20250728070623_job_postings'
      );
      await jobPostingsMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = 'job_postings'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify numeric data types
      expect(columnMap.get('salary_min').data_type).toBe('numeric');
      expect(columnMap.get('salary_min').numeric_precision).toBe(15);
      expect(columnMap.get('salary_min').numeric_scale).toBe(2);

      expect(columnMap.get('salary_max').data_type).toBe('numeric');
      expect(columnMap.get('salary_max').numeric_precision).toBe(15);
      expect(columnMap.get('salary_max').numeric_scale).toBe(2);

      expect(columnMap.get('max_applications').data_type).toBe('integer');
      expect(columnMap.get('views_count').data_type).toBe('integer');
      expect(columnMap.get('applications_count').data_type).toBe('integer');

      // Verify boolean data types
      expect(columnMap.get('is_salary_negotiable').data_type).toBe('boolean');
      expect(columnMap.get('is_remote').data_type).toBe('boolean');
    });
  });
});
