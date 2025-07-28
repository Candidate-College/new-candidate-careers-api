import knex from 'knex';
import config from '../../../config/knexfile';

describe('Table Structure Validation', () => {
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

  describe('Core Tables Structure', () => {
    it('should create roles table with complete structure', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      // Check table exists
      const hasTable = await db.schema.hasTable('roles');
      expect(hasTable).toBe(true);

      // Get detailed column information
      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'roles'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify all required columns exist with correct types
      expect(columnMap.has('id')).toBe(true);
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('id').is_nullable).toBe('NO');

      expect(columnMap.has('name')).toBe(true);
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(100);
      expect(columnMap.get('name').is_nullable).toBe('NO');

      expect(columnMap.has('display_name')).toBe(true);
      expect(columnMap.get('display_name').data_type).toBe('character varying');
      expect(columnMap.get('display_name').character_maximum_length).toBe(100);
      expect(columnMap.get('display_name').is_nullable).toBe('NO');

      expect(columnMap.has('description')).toBe(true);
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('description').is_nullable).toBe('YES');

      expect(columnMap.has('created_at')).toBe(true);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at').is_nullable).toBe('NO');

      expect(columnMap.has('updated_at')).toBe(true);
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').is_nullable).toBe('NO');

      // Check primary key
      const primaryKeys = await db.raw(`
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE table_name = 'roles' AND constraint_name LIKE '%_pkey'
      `);
      expect(primaryKeys.rows.length).toBe(1);
      expect(primaryKeys.rows[0].column_name).toBe('id');
    });

    it('should create permissions table with complete structure', async () => {
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      await permissionsMigration.up(db);

      const hasTable = await db.schema.hasTable('permissions');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'permissions'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify all required columns exist with correct types
      expect(columnMap.has('id')).toBe(true);
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('id').is_nullable).toBe('NO');

      expect(columnMap.has('name')).toBe(true);
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(100);
      expect(columnMap.get('name').is_nullable).toBe('NO');

      expect(columnMap.has('description')).toBe(true);
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('description').is_nullable).toBe('YES');

      expect(columnMap.has('created_at')).toBe(true);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at').is_nullable).toBe('NO');

      expect(columnMap.has('updated_at')).toBe(true);
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').is_nullable).toBe('NO');
    });

    it('should create users table with complete structure', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const hasTable = await db.schema.hasTable('users');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify all required columns exist with correct types
      expect(columnMap.has('id')).toBe(true);
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('id').is_nullable).toBe('NO');

      expect(columnMap.has('uuid')).toBe(true);
      expect(columnMap.get('uuid').data_type).toBe('character varying');
      expect(columnMap.get('uuid').character_maximum_length).toBe(36);
      expect(columnMap.get('uuid').is_nullable).toBe('NO');

      expect(columnMap.has('email')).toBe(true);
      expect(columnMap.get('email').data_type).toBe('character varying');
      expect(columnMap.get('email').character_maximum_length).toBe(255);
      expect(columnMap.get('email').is_nullable).toBe('NO');

      expect(columnMap.has('password')).toBe(true);
      expect(columnMap.get('password').data_type).toBe('character varying');
      expect(columnMap.get('password').character_maximum_length).toBe(255);
      expect(columnMap.get('password').is_nullable).toBe('NO');

      expect(columnMap.has('name')).toBe(true);
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(255);
      expect(columnMap.get('name').is_nullable).toBe('NO');

      expect(columnMap.has('role_id')).toBe(true);
      expect(columnMap.get('role_id').data_type).toBe('bigint');
      expect(columnMap.get('role_id').is_nullable).toBe('YES');

      expect(columnMap.has('status')).toBe(true);
      expect(columnMap.get('status').data_type).toBe('text');
      expect(columnMap.get('status').is_nullable).toBe('YES');

      expect(columnMap.has('email_verified_at')).toBe(true);
      expect(columnMap.get('email_verified_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('email_verified_at').is_nullable).toBe('YES');

      expect(columnMap.has('last_login_at')).toBe(true);
      expect(columnMap.get('last_login_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('last_login_at').is_nullable).toBe('YES');

      expect(columnMap.has('created_at')).toBe(true);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at').is_nullable).toBe('NO');

      expect(columnMap.has('updated_at')).toBe(true);
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').is_nullable).toBe('NO');

      expect(columnMap.has('deleted_at')).toBe(true);
      expect(columnMap.get('deleted_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('deleted_at').is_nullable).toBe('YES');
    });
  });

  describe('Lookup Tables Structure', () => {
    it('should create job_categories table with complete structure', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const hasTable = await db.schema.hasTable('job_categories');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'job_categories'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify all required columns exist with correct types
      expect(columnMap.has('id')).toBe(true);
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('id').is_nullable).toBe('NO');

      expect(columnMap.has('name')).toBe(true);
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(255);
      expect(columnMap.get('name').is_nullable).toBe('NO');

      expect(columnMap.has('slug')).toBe(true);
      expect(columnMap.get('slug').data_type).toBe('character varying');
      expect(columnMap.get('slug').character_maximum_length).toBe(255);
      expect(columnMap.get('slug').is_nullable).toBe('NO');

      expect(columnMap.has('description')).toBe(true);
      expect(columnMap.get('description').data_type).toBe('text');
      expect(columnMap.get('description').is_nullable).toBe('YES');

      expect(columnMap.has('status')).toBe(true);
      expect(columnMap.get('status').data_type).toBe('text');
      expect(columnMap.get('status').is_nullable).toBe('YES');

      expect(columnMap.has('created_at')).toBe(true);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at').is_nullable).toBe('NO');

      expect(columnMap.has('updated_at')).toBe(true);
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').is_nullable).toBe('NO');
    });

    it('should create job_types table with complete structure', async () => {
      const jobTypesMigration = await import(
        '../../../database/migrations/20250728070458_job_types'
      );
      await jobTypesMigration.up(db);

      const hasTable = await db.schema.hasTable('job_types');
      expect(hasTable).toBe(true);

      const columns = await db.raw(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'job_types'
        ORDER BY ordinal_position
      `);

      const columnMap = new Map();
      columns.rows.forEach((row: any) => {
        columnMap.set(row.column_name, row);
      });

      // Verify all required columns exist with correct types
      expect(columnMap.has('id')).toBe(true);
      expect(columnMap.get('id').data_type).toBe('integer');
      expect(columnMap.get('id').is_nullable).toBe('NO');

      expect(columnMap.has('name')).toBe(true);
      expect(columnMap.get('name').data_type).toBe('character varying');
      expect(columnMap.get('name').character_maximum_length).toBe(100);
      expect(columnMap.get('name').is_nullable).toBe('NO');

      expect(columnMap.has('created_at')).toBe(true);
      expect(columnMap.get('created_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('created_at').is_nullable).toBe('NO');

      expect(columnMap.has('updated_at')).toBe(true);
      expect(columnMap.get('updated_at').data_type).toBe('timestamp with time zone');
      expect(columnMap.get('updated_at').is_nullable).toBe('NO');
    });
  });
});
