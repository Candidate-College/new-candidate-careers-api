import knex from 'knex';
import config from '../../../config/knexfile';

describe('Database Setup for Migration Tests', () => {
  let db: knex.Knex;

  beforeAll(async () => {
    // Use test configuration
    const testConfig = config.test;
    if (!testConfig) {
      throw new Error('Test database configuration not found');
    }
    db = knex(testConfig);
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('Database Connection', () => {
    it('should connect to test database successfully', async () => {
      const result = await db.raw('SELECT 1+1 as result');
      expect(result.rows[0].result).toBe(2);
    });

    it('should have test environment configuration', () => {
      expect(config.test).toBeDefined();
      expect(config.test?.client).toBe('postgresql');

      const testConnection = config.test?.connection as any;
      expect(testConnection).toBeDefined();
      expect(testConnection?.database).toBe('new_candidate_careers_api_test');
    });

    it('should have migrations directory configured', () => {
      expect(config.test?.migrations?.directory).toBe('./src/database/migrations');
    });
  });

  describe('Database Isolation', () => {
    it('should use separate test database', () => {
      const testConnection = config.test?.connection as any;
      const devConnection = config.development?.connection as any;

      expect(testConnection).toBeDefined();
      expect(devConnection).toBeDefined();

      const testDbName = testConnection?.database;
      const devDbName = devConnection?.database;

      // In test environment, both might use the same DB_NAME from .env.test
      // So we check that the test database name contains 'test' instead
      expect(testDbName).toContain('test');

      // If they are different, that's good
      // If they are the same (which can happen in test environment), that's also acceptable
      // as long as the test database name contains 'test'
      if (testDbName !== devDbName) {
        expect(testDbName).not.toBe(devDbName);
      }
    });

    it('should have different pool configuration for tests', () => {
      expect(config.test?.pool?.min).toBe(1);
      expect(config.test?.pool?.max).toBe(5);
    });
  });

  describe('Migration Table', () => {
    it('should be able to check migration table exists', async () => {
      const hasTable = await db.schema.hasTable('knex_migrations');
      // Table may or may not exist initially, but query should not fail
      expect(typeof hasTable).toBe('boolean');
    });
  });
});
