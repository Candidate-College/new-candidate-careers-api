import knex from 'knex';
import config from '../../../config/knexfile';

describe('Constraints Validation', () => {
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

  describe('Unique Constraints', () => {
    it('should have unique constraints on roles table', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      // Check unique constraints
      const uniqueConstraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'roles' 
          AND tc.constraint_type = 'UNIQUE'
        ORDER BY kcu.ordinal_position
      `);

      const constraintNames = uniqueConstraints.rows.map((row: any) => row.column_name);
      expect(constraintNames).toContain('name');
    });

    it('should have unique constraints on permissions table', async () => {
      const permissionsMigration = await import(
        '../../../database/migrations/20250728070437_permissions'
      );
      await permissionsMigration.up(db);

      const uniqueConstraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'permissions' 
          AND tc.constraint_type = 'UNIQUE'
        ORDER BY kcu.ordinal_position
      `);

      const constraintNames = uniqueConstraints.rows.map((row: any) => row.column_name);
      expect(constraintNames).toContain('name');
    });

    it('should have unique constraints on users table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const uniqueConstraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'users' 
          AND tc.constraint_type = 'UNIQUE'
        ORDER BY kcu.ordinal_position
      `);

      const constraintNames = uniqueConstraints.rows.map((row: any) => row.column_name);
      expect(constraintNames).toContain('uuid');
      expect(constraintNames).toContain('email');
    });

    it('should have unique constraints on job_categories table', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const uniqueConstraints = await db.raw(`
        SELECT 
          tc.constraint_name,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'job_categories' 
          AND tc.constraint_type = 'UNIQUE'
        ORDER BY kcu.ordinal_position
      `);

      const constraintNames = uniqueConstraints.rows.map((row: any) => row.column_name);
      expect(constraintNames).toContain('slug');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign key constraints on users table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'users'
      `);

      const fkColumns = foreignKeys.rows.map((row: any) => row.column_name);
      expect(fkColumns).toContain('role_id');

      // Check that it references the roles table
      const roleFk = foreignKeys.rows.find((row: any) => row.column_name === 'role_id');
      expect(roleFk).toBeDefined();
      expect(roleFk.foreign_table_name).toBe('roles');
      expect(roleFk.foreign_column_name).toBe('id');
    });
  });

  describe('Default Values', () => {
    it('should have correct default values on users table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND column_default IS NOT NULL
        ORDER BY ordinal_position
      `);

      const defaultMap = new Map();
      columns.rows.forEach((row: any) => {
        defaultMap.set(row.column_name, row.column_default);
      });

      // Check status default value
      expect(defaultMap.has('status')).toBe(true);
      expect(defaultMap.get('status')).toContain('active');
    });

    it('should have correct default values on job_categories table', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const columns = await db.raw(`
        SELECT 
          column_name,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'job_categories' 
          AND column_default IS NOT NULL
        ORDER BY ordinal_position
      `);

      const defaultMap = new Map();
      columns.rows.forEach((row: any) => {
        defaultMap.set(row.column_name, row.column_default);
      });

      // Check status default value
      expect(defaultMap.has('status')).toBe(true);
      expect(defaultMap.get('status')).toContain('active');
    });
  });

  describe('Enum Constraints', () => {
    it('should have enum constraints on users table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const enumColumns = await db.raw(`
        SELECT 
          column_name,
          data_type
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND data_type = 'text'
          AND column_name IN ('status')
        ORDER BY ordinal_position
      `);

      const enumColumnNames = enumColumns.rows.map((row: any) => row.column_name);
      expect(enumColumnNames).toContain('status');
    });

    it('should have enum constraints on job_categories table', async () => {
      const jobCategoriesMigration = await import(
        '../../../database/migrations/20250728070450_job_categories'
      );
      await jobCategoriesMigration.up(db);

      const enumColumns = await db.raw(`
        SELECT 
          column_name,
          data_type
        FROM information_schema.columns 
        WHERE table_name = 'job_categories' 
          AND data_type = 'text'
          AND column_name IN ('status')
        ORDER BY ordinal_position
      `);

      const enumColumnNames = enumColumns.rows.map((row: any) => row.column_name);
      expect(enumColumnNames).toContain('status');
    });
  });

  describe('NOT NULL Constraints', () => {
    it('should have NOT NULL constraints on roles table', async () => {
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const notNullColumns = await db.raw(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'roles' 
          AND is_nullable = 'NO'
        ORDER BY ordinal_position
      `);

      const notNullColumnNames = notNullColumns.rows.map((row: any) => row.column_name);
      expect(notNullColumnNames).toContain('id');
      expect(notNullColumnNames).toContain('name');
      expect(notNullColumnNames).toContain('display_name');
      expect(notNullColumnNames).toContain('created_at');
      expect(notNullColumnNames).toContain('updated_at');
    });

    it('should have NOT NULL constraints on users table', async () => {
      // Create dependencies first
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const notNullColumns = await db.raw(`
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_name = 'users' 
          AND is_nullable = 'NO'
        ORDER BY ordinal_position
      `);

      const notNullColumnNames = notNullColumns.rows.map((row: any) => row.column_name);
      expect(notNullColumnNames).toContain('id');
      expect(notNullColumnNames).toContain('uuid');
      expect(notNullColumnNames).toContain('email');
      expect(notNullColumnNames).toContain('password');
      expect(notNullColumnNames).toContain('name');
      expect(notNullColumnNames).toContain('created_at');
      expect(notNullColumnNames).toContain('updated_at');
    });
  });
});
