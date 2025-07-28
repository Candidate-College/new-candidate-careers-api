import knex from 'knex';
import config from '../../../config/knexfile';

describe('Foreign Key Constraints Validation', () => {
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

  describe('User Management Relationships', () => {
    it('should have foreign key constraint from users to roles', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'users'
          AND kcu.column_name = 'role_id'
      `);

      expect(foreignKeys.rows.length).toBe(1);
      const fk = foreignKeys.rows[0];
      expect(fk.column_name).toBe('role_id');
      expect(fk.foreign_table_name).toBe('roles');
      expect(fk.foreign_column_name).toBe('id');
      expect(fk.update_rule).toBe('CASCADE');
      expect(fk.delete_rule).toBe('RESTRICT');
    });

    it('should have foreign key constraint from departments to users', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const departmentsMigration = await import(
        '../../../database/migrations/20250728070557_departments'
      );
      await departmentsMigration.up(db);

      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'departments'
          AND kcu.column_name = 'created_by'
      `);

      expect(foreignKeys.rows.length).toBe(1);
      const fk = foreignKeys.rows[0];
      expect(fk.column_name).toBe('created_by');
      expect(fk.foreign_table_name).toBe('users');
      expect(fk.foreign_column_name).toBe('id');
      expect(fk.update_rule).toBe('CASCADE');
      expect(fk.delete_rule).toBe('RESTRICT');
    });
  });

  describe('Job Posting Relationships', () => {
    it('should have foreign key constraints on job_postings table', async () => {
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

      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'job_postings'
        ORDER BY kcu.column_name
      `);

      const fkMap = new Map();
      foreignKeys.rows.forEach((row: any) => {
        fkMap.set(row.column_name, row);
      });

      // Check department_id foreign key
      expect(fkMap.has('department_id')).toBe(true);
      const deptFk = fkMap.get('department_id');
      expect(deptFk.foreign_table_name).toBe('departments');
      expect(deptFk.foreign_column_name).toBe('id');
      expect(deptFk.update_rule).toBe('CASCADE');
      expect(deptFk.delete_rule).toBe('SET NULL');

      // Check job_category_id foreign key
      expect(fkMap.has('job_category_id')).toBe(true);
      const categoryFk = fkMap.get('job_category_id');
      expect(categoryFk.foreign_table_name).toBe('job_categories');
      expect(categoryFk.foreign_column_name).toBe('id');
      expect(categoryFk.update_rule).toBe('CASCADE');
      expect(categoryFk.delete_rule).toBe('SET NULL');

      // Check job_type_id foreign key
      expect(fkMap.has('job_type_id')).toBe(true);
      const typeFk = fkMap.get('job_type_id');
      expect(typeFk.foreign_table_name).toBe('job_types');
      expect(typeFk.foreign_column_name).toBe('id');
      expect(typeFk.update_rule).toBe('CASCADE');
      expect(typeFk.delete_rule).toBe('RESTRICT');

      // Check employment_level_id foreign key
      expect(fkMap.has('employment_level_id')).toBe(true);
      const levelFk = fkMap.get('employment_level_id');
      expect(levelFk.foreign_table_name).toBe('employment_levels');
      expect(levelFk.foreign_column_name).toBe('id');
      expect(levelFk.update_rule).toBe('CASCADE');
      expect(levelFk.delete_rule).toBe('RESTRICT');

      // Check status_id foreign key
      expect(fkMap.has('status_id')).toBe(true);
      const statusFk = fkMap.get('status_id');
      expect(statusFk.foreign_table_name).toBe('job_posting_statuses');
      expect(statusFk.foreign_column_name).toBe('id');
      expect(statusFk.update_rule).toBe('CASCADE');
      expect(statusFk.delete_rule).toBe('RESTRICT');

      // Check created_by foreign key
      expect(fkMap.has('created_by')).toBe(true);
      const createdByFk = fkMap.get('created_by');
      expect(createdByFk.foreign_table_name).toBe('users');
      expect(createdByFk.foreign_column_name).toBe('id');
      expect(createdByFk.update_rule).toBe('CASCADE');
      expect(createdByFk.delete_rule).toBe('RESTRICT');

      // Check updated_by foreign key
      expect(fkMap.has('updated_by')).toBe(true);
      const updatedByFk = fkMap.get('updated_by');
      expect(updatedByFk.foreign_table_name).toBe('users');
      expect(updatedByFk.foreign_column_name).toBe('id');
      expect(updatedByFk.update_rule).toBe('CASCADE');
      expect(updatedByFk.delete_rule).toBe('SET NULL');
    });
  });

  describe('Application Relationships', () => {
    it('should have foreign key constraints on applications table', async () => {
      // Create all dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      const candidatesMigration = await import(
        '../../../database/migrations/20250728070526_candidates'
      );
      await candidatesMigration.up(db);

      const applicationStatusesMigration = await import(
        '../../../database/migrations/20250728070521_application_statuses'
      );
      await applicationStatusesMigration.up(db);

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

      const applicationsMigration = await import(
        '../../../database/migrations/20250728070628_applications'
      );
      await applicationsMigration.up(db);

      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'applications'
        ORDER BY kcu.column_name
      `);

      const fkMap = new Map();
      foreignKeys.rows.forEach((row: any) => {
        fkMap.set(row.column_name, row);
      });

      // Check job_posting_id foreign key
      expect(fkMap.has('job_posting_id')).toBe(true);
      const jobPostingFk = fkMap.get('job_posting_id');
      expect(jobPostingFk.foreign_table_name).toBe('job_postings');
      expect(jobPostingFk.foreign_column_name).toBe('id');
      expect(jobPostingFk.update_rule).toBe('CASCADE');
      expect(jobPostingFk.delete_rule).toBe('RESTRICT');

      // Check candidate_id foreign key
      expect(fkMap.has('candidate_id')).toBe(true);
      const candidateFk = fkMap.get('candidate_id');
      expect(candidateFk.foreign_table_name).toBe('candidates');
      expect(candidateFk.foreign_column_name).toBe('id');
      expect(candidateFk.update_rule).toBe('CASCADE');
      expect(candidateFk.delete_rule).toBe('RESTRICT');

      // Check status_id foreign key
      expect(fkMap.has('status_id')).toBe(true);
      const statusFk = fkMap.get('status_id');
      expect(statusFk.foreign_table_name).toBe('application_statuses');
      expect(statusFk.foreign_column_name).toBe('id');
      expect(statusFk.update_rule).toBe('CASCADE');
      expect(statusFk.delete_rule).toBe('RESTRICT');

      // Check reviewed_by foreign key
      expect(fkMap.has('reviewed_by')).toBe(true);
      const reviewedByFk = fkMap.get('reviewed_by');
      expect(reviewedByFk.foreign_table_name).toBe('users');
      expect(reviewedByFk.foreign_column_name).toBe('id');
      expect(reviewedByFk.update_rule).toBe('CASCADE');
      expect(reviewedByFk.delete_rule).toBe('SET NULL');
    });
  });

  describe('Many-to-Many Relationships', () => {
    it('should have foreign key constraints on role_permissions junction table', async () => {
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

      const foreignKeys = await db.raw(`
        SELECT 
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.update_rule,
          rc.delete_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON tc.constraint_name = rc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'role_permissions'
        ORDER BY kcu.column_name
      `);

      const fkMap = new Map();
      foreignKeys.rows.forEach((row: any) => {
        fkMap.set(row.column_name, row);
      });

      // Check role_id foreign key
      expect(fkMap.has('role_id')).toBe(true);
      const roleFk = fkMap.get('role_id');
      expect(roleFk.foreign_table_name).toBe('roles');
      expect(roleFk.foreign_column_name).toBe('id');
      expect(roleFk.update_rule).toBe('CASCADE');
      expect(roleFk.delete_rule).toBe('CASCADE');

      // Check permission_id foreign key
      expect(fkMap.has('permission_id')).toBe(true);
      const permissionFk = fkMap.get('permission_id');
      expect(permissionFk.foreign_table_name).toBe('permissions');
      expect(permissionFk.foreign_column_name).toBe('id');
      expect(permissionFk.update_rule).toBe('CASCADE');
      expect(permissionFk.delete_rule).toBe('CASCADE');
    });
  });
});
