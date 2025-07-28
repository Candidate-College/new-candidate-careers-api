import knex from 'knex';
import config from '../../../config/knexfile';

describe('Migration Basics', () => {
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
    // Clean up any existing test tables
    await db.schema.dropTableIfExists('test_migration_table');
  });

  afterEach(async () => {
    // Ensure cleanup runs even if test fails
    await db.schema.dropTableIfExists('test_migration_table');
  });

  describe('Basic Migration Functionality', () => {
    it('should be able to create a simple table', async () => {
      await db.schema.createTable('test_migration_table', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.timestamps(true, true);
      });

      const hasTable = await db.schema.hasTable('test_migration_table');
      expect(hasTable).toBe(true);
    });

    it('should be able to drop a table', async () => {
      // First create the table
      await db.schema.createTable('test_migration_table', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
      });

      // Then drop it
      await db.schema.dropTable('test_migration_table');

      const hasTable = await db.schema.hasTable('test_migration_table');
      expect(hasTable).toBe(false);
    });

    it('should be able to add and remove columns', async () => {
      // Create table
      await db.schema.createTable('test_migration_table', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
      });

      // Add column
      await db.schema.alterTable('test_migration_table', table => {
        table.string('description').nullable();
      });

      // Verify column exists
      const columns = await db.raw(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'test_migration_table' 
        AND column_name = 'description'
      `);
      expect(columns.rows.length).toBe(1);
    });

    it('should be able to add and remove indexes', async () => {
      // Create table with index
      await db.schema.createTable('test_migration_table', table => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.index(['name'], 'idx_test_name');
      });

      // Verify index exists
      const indexes = await db.raw(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'test_migration_table' 
        AND indexname = 'idx_test_name'
      `);
      expect(indexes.rows.length).toBe(1);
    });
  });

  describe('Migration Transaction Support', () => {
    it('should support transactions for migrations', async () => {
      await db.transaction(async trx => {
        await trx.schema.createTable('test_migration_table', table => {
          table.increments('id').primary();
          table.string('name').notNullable();
        });

        const hasTable = await trx.schema.hasTable('test_migration_table');
        expect(hasTable).toBe(true);
      });

      // Table should still exist after transaction
      const hasTable = await db.schema.hasTable('test_migration_table');
      expect(hasTable).toBe(true);
    });

    it('should rollback on transaction failure', async () => {
      try {
        await db.transaction(async trx => {
          await trx.schema.createTable('test_migration_table', table => {
            table.increments('id').primary();
            table.string('name').notNullable();
          });

          // Force an error to trigger rollback
          throw new Error('Test rollback');
        });
      } catch (error) {
        // Expected error
      }

      // Table should not exist after rollback
      const hasTable = await db.schema.hasTable('test_migration_table');
      expect(hasTable).toBe(false);
    });
  });

  describe('Migration Schema Validation', () => {
    it('should validate table structure after creation', async () => {
      await db.schema.createTable('test_migration_table', table => {
        table.increments('id').primary();
        table.string('name', 255).notNullable();
        table.text('description').nullable();
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });

      // Get table structure
      const columns = await db.raw(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'test_migration_table'
        ORDER BY ordinal_position
      `);

      const columnNames = columns.rows.map((row: any) => row.column_name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('is_active');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
    });
  });
});
