/**
 * Role Permission Model Unit Tests
 *
 * Comprehensive test suite for the RolePermissionModel class covering
 * role-permission associations, bulk operations, validation, and error handling.
 * Tests follow the existing codebase patterns and use proper mocking
 * for database operations.
 *
 * @module src/tests/models/RolePermissionModel.test.ts
 */

import { RolePermissionModel } from '../../models/RolePermissionModel';
import { Role, Permission, RolePermission } from '../../types/roleManagement';

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
  };

  return mockQueryBuilder;
};

// Mock the database module
jest.mock('../../config/database', () => {
  const mockDb = jest.fn(() => createMockQueryBuilder());
  return {
    __esModule: true,
    default: mockDb,
    db: mockDb,
  };
});

describe('RolePermissionModel', () => {
  let rolePermissionModel: RolePermissionModel;
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

  const mockPermission: Permission = {
    id: 1,
    name: 'user:read',
    description: 'Read user information',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockRolePermission: RolePermission = {
    role_id: 1,
    permission_id: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    rolePermissionModel = new RolePermissionModel();

    // Get the mocked db function
    mockDb = jest.requireMock('../../config/database').default;
    mockQueryBuilder = createMockQueryBuilder();
    mockDb.mockReturnValue(mockQueryBuilder);
  });

  describe('assignPermissionsToRole', () => {
    it('should assign permissions to role successfully', async () => {
      // Mock role exists
      mockQueryBuilder.first.mockResolvedValueOnce(mockRole);
      // Mock permissions exist
      mockQueryBuilder.select.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      // Mock insert
      mockQueryBuilder.insert.mockResolvedValue(undefined);

      await rolePermissionModel.assignPermissionsToRole(1, [1, 2]);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', 1);
      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('id', [1, 2]);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
      ]);
    });

    it('should do nothing when no permission IDs provided', async () => {
      await rolePermissionModel.assignPermissionsToRole(1, []);

      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    it('should throw error when role does not exist', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      await expect(rolePermissionModel.assignPermissionsToRole(999, [1, 2])).rejects.toThrow(
        'Role with ID 999 does not exist'
      );
    });

    it('should throw error when some permissions do not exist', async () => {
      mockQueryBuilder.first.mockResolvedValueOnce(mockRole);
      mockQueryBuilder.select.mockResolvedValue([{ id: 1 }]);

      await expect(rolePermissionModel.assignPermissionsToRole(1, [1, 2, 3])).rejects.toThrow(
        'Permissions with IDs 2, 3 do not exist'
      );
    });
  });

  describe('removePermissionsFromRole', () => {
    it('should remove permissions from role successfully', async () => {
      mockQueryBuilder.del.mockResolvedValue(2);

      await rolePermissionModel.removePermissionsFromRole(1, [1, 2]);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('permission_id', [1, 2]);
    });

    it('should do nothing when no permission IDs provided', async () => {
      await rolePermissionModel.removePermissionsFromRole(1, []);

      expect(mockQueryBuilder.del).not.toHaveBeenCalled();
    });
  });

  describe('replaceRolePermissions', () => {
    it('should replace all permissions for a role successfully', async () => {
      // Mock delete all existing permissions
      mockQueryBuilder.del.mockResolvedValue(3);
      // Mock role exists
      mockQueryBuilder.first.mockResolvedValueOnce(mockRole);
      // Mock permissions exist
      mockQueryBuilder.select.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      // Mock insert new permissions
      mockQueryBuilder.insert.mockResolvedValue(undefined);

      await rolePermissionModel.replaceRolePermissions(1, [1, 2]);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
      ]);
    });

    it('should remove all permissions when empty array provided', async () => {
      mockQueryBuilder.del.mockResolvedValue(3);

      await rolePermissionModel.replaceRolePermissions(1, []);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });
  });

  describe('getPermissionsByRoleId', () => {
    it('should get permissions for a role successfully', async () => {
      const mockPermissions = [mockPermission];
      mockQueryBuilder.orderBy.mockResolvedValue(mockPermissions);

      const result = await rolePermissionModel.getPermissionsByRoleId(1);

      expect(result).toEqual(mockPermissions);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('permissions.*');
      expect(mockQueryBuilder.join).toHaveBeenCalledWith(
        'role_permissions',
        'permissions.id',
        'role_permissions.permission_id'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_permissions.role_id', 1);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('permissions.name', 'asc');
    });
  });

  describe('getRolesByPermissionId', () => {
    it('should get roles for a permission successfully', async () => {
      const mockRoles = [mockRole];
      mockQueryBuilder.orderBy.mockResolvedValue(mockRoles);

      const result = await rolePermissionModel.getRolesByPermissionId(1);

      expect(result).toEqual(mockRoles);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('roles.*');
      expect(mockQueryBuilder.join).toHaveBeenCalledWith(
        'role_permissions',
        'roles.id',
        'role_permissions.role_id'
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_permissions.permission_id', 1);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('roles.name', 'asc');
    });
  });

  describe('roleHasPermission', () => {
    it('should return true when role has permission', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRolePermission);

      const result = await rolePermissionModel.roleHasPermission(1, 1);

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission_id', 1);
    });

    it('should return false when role does not have permission', async () => {
      mockQueryBuilder.first.mockResolvedValue(null);

      const result = await rolePermissionModel.roleHasPermission(1, 999);

      expect(result).toBe(false);
    });
  });

  describe('roleHasAnyPermission', () => {
    it('should return true when role has any of the permissions', async () => {
      mockQueryBuilder.select.mockResolvedValue([mockRolePermission]);

      const result = await rolePermissionModel.roleHasAnyPermission(1, [1, 2, 3]);

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('permission_id', [1, 2, 3]);
    });

    it('should return false when role has none of the permissions', async () => {
      mockQueryBuilder.select.mockResolvedValue([]);

      const result = await rolePermissionModel.roleHasAnyPermission(1, [999, 998]);

      expect(result).toBe(false);
    });
  });

  describe('roleHasAllPermissions', () => {
    it('should return true when role has all permissions', async () => {
      mockQueryBuilder.select.mockResolvedValue([{ permission_id: 1 }, { permission_id: 2 }]);

      const result = await rolePermissionModel.roleHasAllPermissions(1, [1, 2]);

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.whereIn).toHaveBeenCalledWith('permission_id', [1, 2]);
    });

    it('should return false when role does not have all permissions', async () => {
      mockQueryBuilder.select.mockResolvedValue([{ permission_id: 1 }]);

      const result = await rolePermissionModel.roleHasAllPermissions(1, [1, 2]);

      expect(result).toBe(false);
    });
  });

  describe('getPermissionIdsByRoleId', () => {
    it('should get permission IDs for a role successfully', async () => {
      const mockPermissionIds = [{ permission_id: 1 }, { permission_id: 2 }];
      mockQueryBuilder.select.mockResolvedValue(mockPermissionIds);

      const result = await rolePermissionModel.getPermissionIdsByRoleId(1);

      expect(result).toEqual([1, 2]);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('permission_id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
    });
  });

  describe('getRoleIdsByPermissionId', () => {
    it('should get role IDs for a permission successfully', async () => {
      const mockRoleIds = [{ role_id: 1 }, { role_id: 2 }];
      mockQueryBuilder.select.mockResolvedValue(mockRoleIds);

      const result = await rolePermissionModel.getRoleIdsByPermissionId(1);

      expect(result).toEqual([1, 2]);
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('role_id');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission_id', 1);
    });
  });

  describe('bulkAssignPermissions', () => {
    it('should assign permissions to multiple roles successfully', async () => {
      const assignments = [
        { roleId: 1, permissionIds: [1, 2] },
        { roleId: 2, permissionIds: [3, 4] },
      ];

      // Mock insert
      mockQueryBuilder.insert.mockResolvedValue(undefined);

      await rolePermissionModel.bulkAssignPermissions(assignments);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        { role_id: 1, permission_id: 1 },
        { role_id: 1, permission_id: 2 },
        { role_id: 2, permission_id: 3 },
        { role_id: 2, permission_id: 4 },
      ]);
    });

    it('should do nothing when no assignments provided', async () => {
      await rolePermissionModel.bulkAssignPermissions([]);

      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });
  });

  describe('count', () => {
    it('should return total count of role permissions', async () => {
      mockQueryBuilder.count.mockReturnValue({
        first: jest.fn().mockResolvedValue({ count: '10' }),
      });

      const result = await rolePermissionModel.count();

      expect(result).toBe(10);
      expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');
    });
  });

  describe('deleteAllPermissionsForRole', () => {
    it('should delete all permissions for a role successfully', async () => {
      mockQueryBuilder.del.mockResolvedValue(3);

      await rolePermissionModel.deleteAllPermissionsForRole(1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('role_id', 1);
      expect(mockQueryBuilder.del).toHaveBeenCalled();
    });
  });

  describe('deleteAllRolesForPermission', () => {
    it('should delete all roles for a permission successfully', async () => {
      mockQueryBuilder.del.mockResolvedValue(2);

      await rolePermissionModel.deleteAllRolesForPermission(1);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('permission_id', 1);
      expect(mockQueryBuilder.del).toHaveBeenCalled();
    });
  });
});
