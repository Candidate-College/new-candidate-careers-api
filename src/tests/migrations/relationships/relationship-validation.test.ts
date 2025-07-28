import knex from 'knex';
import config from '../../../config/knexfile';

describe('Relationship Validation', () => {
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

  describe('User-Role Relationship', () => {
    it('should maintain referential integrity between users and roles', async () => {
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
        {
          uuid: '123e4567-e89b-12d3-a456-426614174001',
          email: 'user@example.com',
          password: 'hashed_password',
          name: 'Regular User',
          role_id: 2,
        },
      ]);

      // Verify relationship integrity
      const usersWithRoles = await db('users')
        .join('roles', 'users.role_id', 'roles.id')
        .select('users.name', 'roles.name as role_name');

      expect(usersWithRoles.length).toBe(2);
      expect(usersWithRoles[0].role_name).toBe('admin');
      expect(usersWithRoles[1].role_name).toBe('user');
    });

    it('should prevent insertion of user with non-existent role_id', async () => {
      // Create dependencies
      const rolesMigration = await import('../../../database/migrations/20250728070419_roles');
      await rolesMigration.up(db);

      const usersMigration = await import('../../../database/migrations/20250728070538_users');
      await usersMigration.up(db);

      // Insert a role
      await db('roles').insert([
        { name: 'admin', display_name: 'Administrator', description: 'Admin role' },
      ]);

      // Try to insert user with non-existent role_id
      try {
        await db('users').insert([
          {
            uuid: '123e4567-e89b-12d3-a456-426614174000',
            email: 'admin@example.com',
            password: 'hashed_password',
            name: 'Admin User',
            role_id: 999, // Non-existent role_id
          },
        ]);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('violates foreign key constraint');
      }
    });
  });

  describe('Many-to-Many Relationship Validation', () => {
    it('should maintain referential integrity for role-permission relationships', async () => {
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
        { name: 'delete_posts', description: 'Delete posts' },
      ]);

      await db('role_permissions').insert([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
        { role_id: 1, permission_id: 3 },
        { role_id: 2, permission_id: 1 },
      ]);

      // Verify relationship integrity
      const rolePermissions = await db('role_permissions')
        .join('roles', 'role_permissions.role_id', 'roles.id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .select('roles.name as role_name', 'permissions.name as permission_name')
        .orderBy('roles.name')
        .orderBy('permissions.name');

      expect(rolePermissions.length).toBe(4);

      // Check admin permissions
      const adminPermissions = rolePermissions.filter((rp: any) => rp.role_name === 'admin');
      expect(adminPermissions.length).toBe(3);
      expect(adminPermissions.some((rp: any) => rp.permission_name === 'read_posts')).toBe(true);
      expect(adminPermissions.some((rp: any) => rp.permission_name === 'write_posts')).toBe(true);
      expect(adminPermissions.some((rp: any) => rp.permission_name === 'delete_posts')).toBe(true);

      // Check user permissions
      const userPermissions = rolePermissions.filter((rp: any) => rp.role_name === 'user');
      expect(userPermissions.length).toBe(1);
      expect(userPermissions[0].permission_name).toBe('read_posts');
    });
  });
});
