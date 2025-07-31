/**
 * Permission Service
 *
 * Handles business logic for permission management including listing,
 * validation, permission checking utilities, and bulk operations.
 * Provides comprehensive permission management functionality with proper
 * validation and error handling.
 *
 * @module src/services/PermissionService
 */

import { PermissionModel } from '@/models/PermissionModel';
import { RolePermissionModel } from '@/models/RolePermissionModel';
import { UserModel } from '@/models/UserModel';
import { AuditLogService } from '@/services/AuditLogService';
import { logger } from '@/utils/logger';
import { createError, createResourceConflictError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';
import {
  Permission,
  PermissionQueryParams,
  PermissionValidationResult,
  PermissionCheckResult,
  PermissionAction,
} from '@/types/roleManagement';

export class PermissionService {
  private readonly permissionModel: PermissionModel;
  private readonly rolePermissionModel: RolePermissionModel;
  private readonly userModel: UserModel;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.permissionModel = new PermissionModel();
    this.rolePermissionModel = new RolePermissionModel();
    this.userModel = new UserModel();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Get all permissions with optional filtering
   */
  async getAllPermissions(queryParams: PermissionQueryParams = {}): Promise<Permission[]> {
    try {
      const { search } = queryParams;

      if (search) {
        return await this.permissionModel.search(search);
      }

      const result = await this.permissionModel.findAll();
      return result.data;
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      throw error;
    }
  }

  /**
   * Get a single permission by ID
   */
  async getPermission(permissionId: number): Promise<Permission> {
    try {
      const permission = await this.permissionModel.findById(permissionId);
      if (!permission) {
        throw createError(`Permission with ID ${permissionId} not found`, 404);
      }
      return permission;
    } catch (error) {
      logger.error(`Error getting permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * Get permission by name
   */
  async getPermissionByName(name: string): Promise<Permission | null> {
    try {
      return await this.permissionModel.findByName(name);
    } catch (error) {
      logger.error(`Error getting permission by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(
    permissionData: { name: string; description?: string },
    userId: number
  ): Promise<Permission> {
    try {
      logger.info(`Creating permission: ${permissionData.name} by user: ${userId}`);

      // Validate permission data
      const validation = this.validatePermissionData(permissionData);
      if (!validation.isValid) {
        throw createError('Validation failed', 400);
      }

      // Check if permission name already exists
      const existingPermission = await this.permissionModel.findByName(permissionData.name);
      if (existingPermission) {
        throw createResourceConflictError(
          `Permission with name '${permissionData.name}' already exists`,
          ErrorCodes.PERMISSION_ALREADY_EXISTS
        );
      }

      // Create permission
      const newPermission = await this.permissionModel.createPermission({
        name: permissionData.name,
        description: permissionData.description || null,
      });

      // Log audit event
      await this.auditLogService.logPermissionAction(
        userId,
        PermissionAction.CREATE,
        newPermission.id,
        permissionData.name,
        { created_permission: newPermission }
      );

      logger.info(`Permission created successfully: ${newPermission.id}`);
      return newPermission;
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Update a permission
   */
  async updatePermission(
    permissionId: number,
    updateData: { name?: string; description?: string },
    userId: number
  ): Promise<Permission> {
    try {
      logger.info(`Updating permission ${permissionId} by user ${userId}`);

      // Check if permission exists
      const existingPermission = await this.permissionModel.findById(permissionId);
      if (!existingPermission) {
        throw createError(`Permission with ID ${permissionId} not found`, 404);
      }

      // Validate update data
      const validation = this.validatePermissionData(updateData);
      if (!validation.isValid) {
        throw createError('Validation failed', 400);
      }

      // If name is being updated, check for uniqueness
      if (updateData.name && updateData.name !== existingPermission.name) {
        const nameExists = await this.permissionModel.findByName(updateData.name);
        if (nameExists) {
          throw createResourceConflictError(
            `Permission with name '${updateData.name}' already exists`,
            ErrorCodes.PERMISSION_ALREADY_EXISTS
          );
        }
      }

      // Update permission
      const updatedPermission = await this.permissionModel.updatePermission(
        permissionId,
        updateData
      );
      if (!updatedPermission) {
        throw createError('Failed to update permission', 500);
      }

      // Log audit event
      await this.auditLogService.logPermissionAction(
        userId,
        PermissionAction.UPDATE,
        permissionId,
        existingPermission.name,
        {
          before: existingPermission,
          after: updatedPermission,
          changes: updateData,
        }
      );

      logger.info(`Permission updated successfully: ${permissionId}`);
      return updatedPermission;
    } catch (error) {
      logger.error(`Error updating permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a permission
   */
  async deletePermission(permissionId: number, userId: number): Promise<boolean> {
    try {
      logger.info(`Deleting permission ${permissionId} by user ${userId}`);

      // Check if permission exists
      const existingPermission = await this.permissionModel.findById(permissionId);
      if (!existingPermission) {
        throw createError(`Permission with ID ${permissionId} not found`, 404);
      }

      // Check if permission can be deleted
      const validation = await this.validatePermissionDeletion(permissionId);
      if (!validation.isValid) {
        throw createError(validation.errors[0]?.message || 'Cannot delete permission', 400);
      }

      // Delete permission
      const deleted = await this.permissionModel.deletePermission(permissionId);
      if (!deleted) {
        throw createError('Failed to delete permission', 500);
      }

      // Log audit event
      await this.auditLogService.logPermissionAction(
        userId,
        PermissionAction.DELETE,
        permissionId,
        existingPermission.name,
        { deleted_permission: existingPermission }
      );

      logger.info(`Permission deleted successfully: ${permissionId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user has a specific permission
   */
  async checkUserPermission(userId: number, permissionName: string): Promise<boolean> {
    try {
      // Get user with role
      const user = await this.userModel.findById(userId);
      if (!user || !user.role_id) {
        return false;
      }

      // Get permission by name
      const permission = await this.permissionModel.findByName(permissionName);
      if (!permission) {
        return false;
      }

      // Check if role has the permission
      return await this.rolePermissionModel.roleHasPermission(user.role_id, permission.id);
    } catch (error) {
      logger.error(`Error checking user permission: ${error}`);
      return false;
    }
  }

  /**
   * Check if a user has any of the specified permissions
   */
  async checkUserAnyPermission(
    userId: number,
    permissionNames: string[]
  ): Promise<PermissionCheckResult> {
    try {
      // Get user with role
      const user = await this.userModel.findById(userId);
      if (!user || !user.role_id) {
        return {
          has_permission: false,
          checked_permissions: permissionNames,
          granted_permissions: [],
          user_id: userId,
        };
      }

      // Get permissions by names
      const permissions = await this.permissionModel.findByNames(permissionNames);
      if (permissions.length === 0) {
        return {
          has_permission: false,
          checked_permissions: permissionNames,
          granted_permissions: [],
          user_id: userId,
        };
      }

      // Check which permissions the role has
      const permissionIds = permissions.map(p => p.id);
      const hasAnyPermission = await this.rolePermissionModel.roleHasAnyPermission(
        user.role_id,
        permissionIds
      );

      if (!hasAnyPermission) {
        return {
          has_permission: false,
          checked_permissions: permissionNames,
          granted_permissions: [],
          user_id: userId,
        };
      }

      // Get granted permissions
      const grantedPermissions: string[] = [];
      for (const permission of permissions) {
        const hasPermission = await this.rolePermissionModel.roleHasPermission(
          user.role_id,
          permission.id
        );
        if (hasPermission) {
          grantedPermissions.push(permission.name);
        }
      }

      return {
        has_permission: grantedPermissions.length > 0,
        checked_permissions: permissionNames,
        granted_permissions: grantedPermissions,
        user_id: userId,
      };
    } catch (error) {
      logger.error(`Error checking user permissions: ${error}`);
      return {
        has_permission: false,
        checked_permissions: permissionNames,
        granted_permissions: [],
        user_id: userId,
      };
    }
  }

  /**
   * Check if a user has all of the specified permissions
   */
  async checkUserAllPermissions(
    userId: number,
    permissionNames: string[]
  ): Promise<PermissionCheckResult> {
    try {
      // Get user with role
      const user = await this.userModel.findById(userId);
      if (!user || !user.role_id) {
        return {
          has_permission: false,
          checked_permissions: permissionNames,
          granted_permissions: [],
          user_id: userId,
        };
      }

      // Get permissions by names
      const permissions = await this.permissionModel.findByNames(permissionNames);
      if (permissions.length === 0) {
        return {
          has_permission: false,
          checked_permissions: permissionNames,
          granted_permissions: [],
          user_id: userId,
        };
      }

      // Check if role has all permissions
      const permissionIds = permissions.map(p => p.id);
      const hasAllPermissions = await this.rolePermissionModel.roleHasAllPermissions(
        user.role_id,
        permissionIds
      );

      return {
        has_permission: hasAllPermissions,
        checked_permissions: permissionNames,
        granted_permissions: hasAllPermissions ? permissionNames : [],
        user_id: userId,
      };
    } catch (error) {
      logger.error(`Error checking user all permissions: ${error}`);
      return {
        has_permission: false,
        checked_permissions: permissionNames,
        granted_permissions: [],
        user_id: userId,
      };
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: number): Promise<Permission[]> {
    try {
      // Get user with role
      const user = await this.userModel.findById(userId);
      if (!user || !user.role_id) {
        return [];
      }

      // Get permissions for the role
      return await this.rolePermissionModel.getPermissionsByRoleId(user.role_id);
    } catch (error) {
      logger.error(`Error getting user permissions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get permission names for a user
   */
  async getUserPermissionNames(userId: number): Promise<string[]> {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.map(p => p.name);
    } catch (error) {
      logger.error(`Error getting user permission names for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Validate permission string format
   */
  validatePermissionString(permission: string): PermissionValidationResult {
    const errors = [];

    if (!permission || permission.length < 3 || permission.length > 100) {
      errors.push({
        field: 'permission',
        message: 'Permission must be between 3 and 100 characters',
      });
    } else if (!/^[a-z_][a-z0-9_:]*$/.test(permission)) {
      errors.push({ field: 'permission', message: 'Permission must be in snake_case format' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get permission statistics
   */
  async getPermissionStats(): Promise<{
    total: number;
    withRoles: number;
    withoutRoles: number;
  }> {
    try {
      return await this.permissionModel.getPermissionStats();
    } catch (error) {
      logger.error('Error getting permission stats:', error);
      throw error;
    }
  }

  /**
   * Validate permission data
   */
  private validatePermissionData(data: {
    name?: string;
    description?: string;
  }): PermissionValidationResult {
    const errors = [];

    // Validate name
    if (data.name !== undefined) {
      if (!data.name || data.name.length < 3 || data.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must be between 3 and 100 characters' });
      } else if (!/^[a-z_][a-z0-9_:]*$/.test(data.name)) {
        errors.push({ field: 'name', message: 'Name must be in snake_case format' });
      }
    }

    // Validate description
    if (data.description !== undefined && data.description && data.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description must be less than 500 characters',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate permission deletion
   */
  private async validatePermissionDeletion(
    permissionId: number
  ): Promise<PermissionValidationResult> {
    const errors = [];

    // Check if permission is assigned to any roles
    const rolesWithPermission = await this.rolePermissionModel.getRolesByPermissionId(permissionId);
    if (rolesWithPermission.length > 0) {
      errors.push({
        field: 'permission_id',
        message: `Cannot delete permission that is assigned to ${rolesWithPermission.length} roles`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
