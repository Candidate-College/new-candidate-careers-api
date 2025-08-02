/**
 * Role Model Unit Tests
 *
 * Comprehensive test suite for the RoleModel class covering CRUD operations,
 * role-specific methods, validation, error handling, and edge cases.
 * Tests follow the existing codebase patterns and use proper mocking
 * for database operations.
 *
 * @module src/tests/models/RoleModel.test.ts
 */

import { RoleModel } from '../../models/RoleModel';
import { Role, RoleWithPermissions } from '../../types/roleManagement';

// Create a proper mock query builder that supports method chaining
const createMockQueryBuilder = () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    first: jest.fn(),
    returning: jest.fn(),
    count: jest.fn(),
    countDistinct: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
  };

  return mockQueryBuilder;
};

// Mock the database module
jest.mock('../../config/database', () => {
  const mockDb = jest.fn(() => createMockQueryBuilder());
  return {
    db: mockDb,
  };
});

describe('RoleModel', () => {
  let roleModel: RoleModel;
  let mockDb: any;
  let mockQueryBuilder: any;

  const mockRole: Role = {
    id: 1,
    name: 'admin',
    display_name: 'Administrator',
    description: 'Super administrator role',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockRoleWithPermissions: RoleWithPermissions = {
    ...mockRole,
    permissions: [],
    users_count: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    roleModel = new RoleModel();

    // Get the mocked db function
    mockDb = jest.requireMock('../../config/database').db;
    mockQueryBuilder = createMockQueryBuilder();
    mockDb.mockReturnValue(mockQueryBuilder);
  });

  describe('findById', () => {
    it('should find a role by ID successfully', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRole);

      const result = await roleModel.findById(1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockRole);
    });

    it('should return null when role is not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const result = await roleModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should find all roles with default pagination', async () => {
      const mockRoles = [mockRole];
      const mockCountResult = [{ count: '1' }];

      // Mock the count query
      mockQueryBuilder.count.mockResolvedValue(mockCountResult);

      // Mock the data query with proper chaining
      const mockDataQuery = createMockQueryBuilder();
      mockDataQuery.orderBy.mockReturnValue(mockDataQuery);
      mockDataQuery.limit.mockReturnValue(mockDataQuery);
      mockDataQuery.offset.mockResolvedValue(mockRoles);

      // Mock the select to return the data query
      mockQueryBuilder.select.mockReturnValue(mockDataQuery);

      const result = await roleModel.findAll();

      expect(result).toEqual({
        data: mockRoles,
        total: 1,
      });
    });

    it('should find roles with custom pagination and search', async () => {
      const mockRoles = [mockRole];
      const mockCountResult = [{ count: '1' }];

      // Mock the count query
      mockQueryBuilder.count.mockResolvedValue(mockCountResult);

      // Mock the data query with proper chaining
      const mockDataQuery = createMockQueryBuilder();
      mockDataQuery.orderBy.mockReturnValue(mockDataQuery);
      mockDataQuery.limit.mockReturnValue(mockDataQuery);
      mockDataQuery.offset.mockResolvedValue(mockRoles);

      // Mock the select to return the data query
      mockQueryBuilder.select.mockReturnValue(mockDataQuery);

      const result = await roleModel.findAll({
        page: 2,
        limit: 5,
        search: 'admin',
        sort: 'name',
        order: 'asc',
      });

      expect(result).toEqual({
        data: mockRoles,
        total: 1,
      });
    });
  });

  describe('create', () => {
    it('should create a role successfully', async () => {
      const roleData = {
        name: 'editor',
        display_name: 'Editor',
        description: 'Content editor role',
      };

      mockQueryBuilder.insert.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockRole]),
      });

      const result = await roleModel.create(roleData);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        ...roleData,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
      expect(result).toEqual(mockRole);
    });
  });

  describe('update', () => {
    it('should update a role successfully', async () => {
      const updateData = {
        display_name: 'Updated Administrator',
        description: 'Updated description',
      };

      mockQueryBuilder.update.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockRole]),
      });

      const result = await roleModel.update(1, updateData);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(Date),
      });
      expect(result).toEqual(mockRole);
    });

    it('should return null when role does not exist', async () => {
      mockQueryBuilder.update.mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      });

      const result = await roleModel.update(999, { display_name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a role successfully', async () => {
      mockQueryBuilder.del.mockResolvedValue(1);

      const result = await roleModel.delete(1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(true);
    });

    it('should return false when role does not exist', async () => {
      mockQueryBuilder.del.mockResolvedValue(0);

      const result = await roleModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('findByName', () => {
    it('should find a role by name successfully', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRole);

      const result = await roleModel.findByName('admin');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith({ name: 'admin' });
      expect(result).toEqual(mockRole);
    });

    it('should return null when role name is not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const result = await roleModel.findByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByNames', () => {
    it('should find roles by names successfully', async () => {
      const mockRoles = [mockRole];
      mockQueryBuilder.whereIn.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.orderBy.mockResolvedValue(mockRoles);

      const result = await roleModel.findByNames(['admin', 'user']);

      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('name', ['admin', 'user']);
      expect(result).toEqual(mockRoles);
    });

    it('should return empty array when no names provided', async () => {
      const result = await roleModel.findByNames([]);

      expect(result).toEqual([]);
    });
  });

  describe('existsByName', () => {
    it('should return true when role exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRole);

      const result = await roleModel.existsByName('admin');

      expect(result).toBe(true);
    });

    it('should return false when role does not exist', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const result = await roleModel.existsByName('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('createRole', () => {
    it('should create a role successfully when name is unique', async () => {
      mockQueryBuilder.first.mockResolvedValue(null); // Role doesn't exist
      mockQueryBuilder.insert.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockRole]),
      });

      const roleData = {
        name: 'editor',
        display_name: 'Editor',
        description: 'Content editor role',
      };

      const result = await roleModel.createRole(roleData);

      expect(result).toEqual(mockRole);
    });

    it('should throw error when role name already exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRole); // Role exists

      const roleData = {
        name: 'admin',
        display_name: 'Administrator',
        description: 'Admin role',
      };

      await expect(roleModel.createRole(roleData)).rejects.toThrow(
        "Role with name 'admin' already exists"
      );
    });
  });

  describe('updateRole', () => {
    it('should update a role successfully when it exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRole); // Role exists
      mockQueryBuilder.update.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockRole]),
      });

      const updateData = {
        display_name: 'Updated Administrator',
      };

      const result = await roleModel.updateRole(1, updateData);

      expect(result).toEqual(mockRole);
    });

    it('should return null when role does not exist', async () => {
      mockQueryBuilder.first.mockResolvedValue(null); // Role doesn't exist

      const result = await roleModel.updateRole(999, { display_name: 'Test' });

      expect(result).toBeNull();
    });

    it('should throw error when updating name to existing name', async () => {
      const existingRole = { ...mockRole, name: 'admin' };
      const conflictingRole = { ...mockRole, id: 2, name: 'editor' };

      mockQueryBuilder.first
        .mockResolvedValueOnce(existingRole) // First call for existing role
        .mockResolvedValueOnce(conflictingRole); // Second call for name conflict

      const updateData = {
        name: 'editor',
      };

      await expect(roleModel.updateRole(1, updateData)).rejects.toThrow(
        "Role with name 'editor' already exists"
      );
    });
  });

  describe('deleteRole', () => {
    it('should delete a role successfully when no users are assigned', async () => {
      mockQueryBuilder.first.mockResolvedValue(null); // No users with this role
      mockQueryBuilder.del.mockResolvedValue(1);

      const result = await roleModel.deleteRole(1);

      expect(result).toBe(true);
    });

    it('should throw error when role is assigned to users', async () => {
      mockQueryBuilder.first.mockResolvedValue({ id: 1 }); // User exists with this role

      await expect(roleModel.deleteRole(1)).rejects.toThrow(
        'Cannot delete role that is assigned to users'
      );
    });
  });

  describe('getRoleWithPermissions', () => {
    it('should get role with permissions successfully', async () => {
      // Mock the role query
      mockQueryBuilder.first.mockResolvedValue(mockRole);

      // Mock the permissions query
      const mockPermissionsQuery = createMockQueryBuilder();
      mockPermissionsQuery.select.mockReturnValue(mockPermissionsQuery);
      mockPermissionsQuery.join.mockReturnValue(mockPermissionsQuery);
      mockPermissionsQuery.where.mockReturnValue(mockPermissionsQuery);
      mockPermissionsQuery.orderBy.mockResolvedValue([]);

      // Mock the users count query
      const mockUsersQuery = createMockQueryBuilder();
      mockUsersQuery.count.mockReturnValue(mockUsersQuery);
      mockUsersQuery.first.mockResolvedValue({ count: '0' });

      // Mock the db calls for different tables
      mockDb
        .mockReturnValueOnce(mockQueryBuilder) // For role query
        .mockReturnValueOnce(mockPermissionsQuery) // For permissions query
        .mockReturnValueOnce(mockUsersQuery); // For users count query

      const result = await roleModel.getRoleWithPermissions(1);

      expect(result).toEqual(mockRoleWithPermissions);
    });

    it('should return null when role does not exist', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const result = await roleModel.getRoleWithPermissions(999);

      expect(result).toBeNull();
    });
  });

  describe('getRolesWithPermissions', () => {
    it('should get all roles with permissions successfully', async () => {
      const mockRolesWithPermissions = [mockRoleWithPermissions];

      // Mock the findAll method to return roles
      const mockDataQuery = createMockQueryBuilder();
      mockDataQuery.orderBy.mockReturnValue(mockDataQuery);
      mockDataQuery.limit.mockReturnValue(mockDataQuery);
      mockDataQuery.offset.mockResolvedValue([mockRole]);
      mockQueryBuilder.select.mockReturnValue(mockDataQuery);
      mockQueryBuilder.count.mockResolvedValue([{ count: '1' }]);

      // Mock the getRoleWithPermissions method
      jest.spyOn(roleModel, 'getRoleWithPermissions').mockResolvedValue(mockRoleWithPermissions);

      const result = await roleModel.getRolesWithPermissions();

      expect(result).toEqual(mockRolesWithPermissions);
    });
  });

  describe('getRolesWithPermissionsPaginated', () => {
    it('should get paginated roles with permissions successfully', async () => {
      const mockRolesWithPermissions = [mockRoleWithPermissions];

      // Create a proper mock for the query chain that handles applySearch
      const mockQueryChain = {
        clone: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ count: '1' }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([mockRole]),
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };

      // Mock the db to return the query chain
      mockDb.mockReturnValue(mockQueryChain);

      // Mock the getRoleWithPermissions method
      jest.spyOn(roleModel, 'getRoleWithPermissions').mockResolvedValue(mockRoleWithPermissions);

      const result = await roleModel.getRolesWithPermissionsPaginated(1, 10, 'admin');

      expect(result).toEqual({
        roles: mockRolesWithPermissions,
        total: 1,
      });
    });
  });

  describe('getTableName', () => {
    it('should return correct table name', () => {
      const tableName = roleModel.getTableName();
      expect(tableName).toBe('roles');
    });
  });

  describe('getDb', () => {
    it('should return database instance', () => {
      const dbInstance = roleModel.getDb();
      expect(dbInstance).toBe(mockDb);
    });
  });
});
