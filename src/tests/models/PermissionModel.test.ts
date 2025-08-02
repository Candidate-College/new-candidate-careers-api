/**
 * Permission Model Unit Tests
 *
 * Comprehensive test suite for the PermissionModel class covering CRUD operations,
 * permission-specific methods, validation, error handling, and edge cases.
 * Tests follow the existing codebase patterns and use proper mocking
 * for database operations.
 *
 * @module src/tests/models/PermissionModel.test.ts
 */

import { PermissionModel } from '../../models/PermissionModel';
import { Permission } from '../../types/roleManagement';

// Mock the database module
jest.mock('../../config/database', () => {
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
  };

  return {
    db: jest.fn(() => mockQueryBuilder),
  };
});

describe('PermissionModel', () => {
  let permissionModel: PermissionModel;
  let mockDb: any;

  const mockPermission: Permission = {
    id: 1,
    name: 'user:read',
    description: 'Read user information',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    permissionModel = new PermissionModel();

    // Get the mocked db function
    const { db } = jest.requireMock('../../config/database');
    mockDb = db();
  });

  describe('findById', () => {
    it('should find a permission by ID successfully', async () => {
      mockDb.first.mockResolvedValue(mockPermission);

      const result = await permissionModel.findById(1);

      expect(mockDb.where).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission is not found', async () => {
      mockDb.first.mockResolvedValue(null);

      const result = await permissionModel.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a permission successfully', async () => {
      const permissionData = {
        name: 'user:write',
        description: 'Write user information',
      };

      mockDb.insert.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockPermission]),
      });

      const result = await permissionModel.create(permissionData);

      expect(mockDb.insert).toHaveBeenCalledWith({
        ...permissionData,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      });
      expect(result).toEqual(mockPermission);
    });
  });

  describe('update', () => {
    it('should update a permission successfully', async () => {
      const updateData = {
        description: 'Updated user read permission',
      };

      mockDb.update.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockPermission]),
      });

      const result = await permissionModel.update(1, updateData);

      expect(mockDb.where).toHaveBeenCalledWith({ id: 1 });
      expect(mockDb.update).toHaveBeenCalledWith({
        ...updateData,
        updated_at: expect.any(Date),
      });
      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission does not exist', async () => {
      mockDb.update.mockReturnValue({
        returning: jest.fn().mockResolvedValue([]),
      });

      const result = await permissionModel.update(999, { description: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a permission successfully', async () => {
      mockDb.del.mockResolvedValue(1);

      const result = await permissionModel.delete(1);

      expect(mockDb.where).toHaveBeenCalledWith({ id: 1 });
      expect(result).toBe(true);
    });

    it('should return false when permission does not exist', async () => {
      mockDb.del.mockResolvedValue(0);

      const result = await permissionModel.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('findByName', () => {
    it('should find a permission by name successfully', async () => {
      mockDb.first.mockResolvedValue(mockPermission);

      const result = await permissionModel.findByName('user:read');

      expect(mockDb.where).toHaveBeenCalledWith({ name: 'user:read' });
      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission name is not found', async () => {
      mockDb.first.mockResolvedValue(null);

      const result = await permissionModel.findByName('nonexistent:permission');

      expect(result).toBeNull();
    });
  });

  describe('findByNames', () => {
    it('should find permissions by names successfully', async () => {
      const mockPermissions = [mockPermission];
      mockDb.whereIn.mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockPermissions),
      });

      const result = await permissionModel.findByNames(['user:read', 'user:write']);

      expect(mockDb.whereIn).toHaveBeenCalledWith('name', ['user:read', 'user:write']);
      expect(result).toEqual(mockPermissions);
    });

    it('should return empty array when no names provided', async () => {
      const result = await permissionModel.findByNames([]);

      expect(result).toEqual([]);
    });
  });

  describe('existsByName', () => {
    it('should return true when permission exists', async () => {
      mockDb.first.mockResolvedValue(mockPermission);

      const result = await permissionModel.existsByName('user:read');

      expect(result).toBe(true);
    });

    it('should return false when permission does not exist', async () => {
      mockDb.first.mockResolvedValue(null);

      const result = await permissionModel.existsByName('nonexistent:permission');

      expect(result).toBe(false);
    });
  });

  describe('existByNames', () => {
    it('should return existence map for multiple permission names', async () => {
      const mockPermissions = [
        { id: 1, name: 'user:read' },
        { id: 2, name: 'user:write' },
      ];
      mockDb.whereIn.mockReturnValue({
        orderBy: jest.fn().mockResolvedValue(mockPermissions),
      });

      const result = await permissionModel.existByNames(['user:read', 'user:write', 'user:delete']);

      expect(result).toEqual({
        'user:read': true,
        'user:write': true,
        'user:delete': false,
      });
    });

    it('should return empty object when no names provided', async () => {
      const result = await permissionModel.existByNames([]);

      expect(result).toEqual({});
    });
  });

  describe('createPermission', () => {
    it('should create a permission successfully when name is unique', async () => {
      mockDb.first.mockResolvedValue(null); // Permission doesn't exist
      mockDb.insert.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockPermission]),
      });

      const permissionData = {
        name: 'user:write',
        description: 'Write user information',
      };

      const result = await permissionModel.createPermission(permissionData);

      expect(result).toEqual(mockPermission);
    });

    it('should throw error when permission name already exists', async () => {
      mockDb.first.mockResolvedValue(mockPermission); // Permission exists

      const permissionData = {
        name: 'user:read',
        description: 'Read user information',
      };

      await expect(permissionModel.createPermission(permissionData)).rejects.toThrow(
        "Permission with name 'user:read' already exists"
      );
    });
  });

  describe('updatePermission', () => {
    it('should update a permission successfully when it exists', async () => {
      mockDb.first.mockResolvedValue(mockPermission); // Permission exists
      mockDb.update.mockReturnValue({
        returning: jest.fn().mockResolvedValue([mockPermission]),
      });

      const updateData = {
        description: 'Updated user read permission',
      };

      const result = await permissionModel.updatePermission(1, updateData);

      expect(result).toEqual(mockPermission);
    });

    it('should return null when permission does not exist', async () => {
      mockDb.first.mockResolvedValue(null); // Permission doesn't exist

      const result = await permissionModel.updatePermission(999, { description: 'Test' });

      expect(result).toBeNull();
    });

    it('should throw error when updating name to existing name', async () => {
      const existingPermission = { ...mockPermission, name: 'user:read' };
      const conflictingPermission = { ...mockPermission, id: 2, name: 'user:write' };

      mockDb.first
        .mockResolvedValueOnce(existingPermission) // First call for existing permission
        .mockResolvedValueOnce(conflictingPermission); // Second call for name conflict

      const updateData = {
        name: 'user:write',
      };

      await expect(permissionModel.updatePermission(1, updateData)).rejects.toThrow(
        "Permission with name 'user:write' already exists"
      );
    });
  });

  describe('deletePermission', () => {
    it('should delete a permission successfully when not used by roles', async () => {
      mockDb.first.mockResolvedValue(null); // No roles using this permission
      mockDb.del.mockResolvedValue(1);

      const result = await permissionModel.deletePermission(1);

      expect(result).toBe(true);
    });

    it('should throw error when permission is used by roles', async () => {
      mockDb.first.mockResolvedValue({ id: 1 }); // Role exists using this permission

      await expect(permissionModel.deletePermission(1)).rejects.toThrow(
        'Cannot delete permission that is assigned to roles'
      );
    });
  });

  describe('search', () => {
    it('should search permissions successfully', async () => {
      const mockPermissions = [mockPermission];
      mockDb.where.mockReturnValue({
        orWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockPermissions),
      });

      const result = await permissionModel.search('user');

      expect(result).toEqual(mockPermissions);
    });
  });

  describe('getTableName', () => {
    it('should return correct table name', () => {
      const tableName = permissionModel.getTableName();
      expect(tableName).toBe('permissions');
    });
  });
});
