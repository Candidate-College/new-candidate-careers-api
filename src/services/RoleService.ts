/**
 * Role Service
 *
 * Handles business logic for role management including CRUD operations,
 * pagination, filtering, role-permission associations, and audit logging.
 * Provides comprehensive role management functionality with proper validation
 * and error handling.
 *
 * @module src/services/RoleService
 */

import { RoleModel } from '@/models/RoleModel';
import { PermissionModel } from '@/models/PermissionModel';
import { RolePermissionModel } from '@/models/RolePermissionModel';
import { AuditLogService } from '@/services/AuditLogService';
import { logger } from '@/utils/logger';
import { createError, createResourceConflictError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';
import {
  Role,
  RoleWithPermissions,
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleQueryParams,
  RoleValidationResult,
  RoleAction,
} from '@/types/roleManagement';
import { PaginationMeta } from '@/types';

export class RoleService {
  private readonly roleModel: RoleModel;
  private readonly permissionModel: PermissionModel;
  private readonly rolePermissionModel: RolePermissionModel;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.roleModel = new RoleModel();
    this.permissionModel = new PermissionModel();
    this.rolePermissionModel = new RolePermissionModel();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Create a new role with optional permissions
   */
  async createRole(roleData: CreateRoleRequest, userId: number): Promise<RoleWithPermissions> {
    try {
      logger.info(`Creating role: ${roleData.name} by user: ${userId}`);

      // Validate role data
      const validation = this.validateCreateRoleRequest(roleData);
      if (!validation.isValid) {
        throw createError('Validation failed', 400);
      }

      // Check if role name already exists
      const existingRole = await this.roleModel.findByName(roleData.name);
      if (existingRole) {
        throw createResourceConflictError(
          `Role with name '${roleData.name}' already exists`,
          ErrorCodes.ROLE_ALREADY_EXISTS
        );
      }

      // Create role
      const newRole = await this.roleModel.createRole({
        name: roleData.name,
        display_name: roleData.display_name,
        description: roleData.description || null,
      });

      // Assign permissions if provided
      if (roleData.permissions && roleData.permissions.length > 0) {
        await this.assignPermissionsToRole(newRole.id, roleData.permissions, userId);
      }

      // Get role with permissions
      const roleWithPermissions = await this.getRoleWithPermissions(newRole.id);
      if (!roleWithPermissions) {
        throw createError('Failed to retrieve created role', 500);
      }

      // Log audit event
      await this.auditLogService.logRoleAction(
        userId,
        RoleAction.CREATE,
        newRole.id,
        roleData.name,
        { created_role: roleWithPermissions }
      );

      logger.info(`Role created successfully: ${newRole.id}`);
      return roleWithPermissions;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Get a single role with permissions
   */
  async getRole(roleId: number): Promise<RoleWithPermissions> {
    try {
      const role = await this.roleModel.getRoleWithPermissions(roleId);
      if (!role) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }
      return role;
    } catch (error) {
      logger.error(`Error getting role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get all roles with pagination and filtering
   */
  async getRoles(queryParams: RoleQueryParams = {}): Promise<{
    roles: RoleWithPermissions[];
    pagination: PaginationMeta;
  }> {
    try {
      const { page = 1, limit = 20, search } = queryParams;

      const result = await this.roleModel.getRolesWithPermissionsPaginated(page, limit, search);

      return {
        roles: result.roles,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
          hasNext: page < Math.ceil(result.total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: number,
    updateData: UpdateRoleRequest,
    userId: number
  ): Promise<RoleWithPermissions> {
    try {
      logger.info(`Updating role ${roleId} by user ${userId}`);

      // Check if role exists
      const existingRole = await this.roleModel.findById(roleId);
      if (!existingRole) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }

      // Validate update data
      const validation = this.validateUpdateRoleRequest(updateData);
      if (!validation.isValid) {
        throw createError('Validation failed', 400);
      }

      // Update role
      const updatePayload: Partial<Role> = {};
      if (updateData.display_name !== undefined) {
        updatePayload.display_name = updateData.display_name;
      }
      if (updateData.description !== undefined) {
        updatePayload.description = updateData.description;
      }

      const updatedRole = await this.roleModel.updateRole(roleId, updatePayload);

      if (!updatedRole) {
        throw createError('Failed to update role', 500);
      }

      // Update permissions if provided
      if (updateData.permissions !== undefined) {
        await this.rolePermissionModel.replaceRolePermissions(roleId, []);
        if (updateData.permissions.length > 0) {
          await this.assignPermissionsToRole(roleId, updateData.permissions, userId);
        }
      }

      // Get updated role with permissions
      const roleWithPermissions = await this.getRoleWithPermissions(roleId);
      if (!roleWithPermissions) {
        throw createError('Failed to retrieve updated role', 500);
      }

      // Log audit event
      await this.auditLogService.logRoleAction(
        userId,
        RoleAction.UPDATE,
        roleId,
        existingRole.name,
        {
          before: existingRole,
          after: roleWithPermissions,
          changes: updateData,
        }
      );

      logger.info(`Role updated successfully: ${roleId}`);
      return roleWithPermissions;
    } catch (error) {
      logger.error(`Error updating role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: number, userId: number): Promise<boolean> {
    try {
      logger.info(`Deleting role ${roleId} by user ${userId}`);

      // Check if role exists
      const existingRole = await this.roleModel.findById(roleId);
      if (!existingRole) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }

      // Check if role can be deleted
      const validation = await this.validateRoleDeletion(roleId);
      if (!validation.isValid) {
        throw createError(validation.errors[0]?.message || 'Cannot delete role', 400);
      }

      // Delete role (this will cascade delete role_permissions)
      const deleted = await this.roleModel.deleteRole(roleId);
      if (!deleted) {
        throw createError('Failed to delete role', 500);
      }

      // Log audit event
      await this.auditLogService.logRoleAction(
        userId,
        RoleAction.DELETE,
        roleId,
        existingRole.name,
        { deleted_role: existingRole }
      );

      logger.info(`Role deleted successfully: ${roleId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get role with permissions
   */
  async getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
    try {
      return await this.roleModel.getRoleWithPermissions(roleId);
    } catch (error) {
      logger.error(`Error getting role with permissions ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(
    roleId: number,
    permissionNames: string[],
    userId: number
  ): Promise<void> {
    try {
      logger.info(`Assigning permissions to role ${roleId}: ${permissionNames.join(', ')}`);

      // Get permissions by names
      const permissions = await this.permissionModel.findByNames(permissionNames);
      const foundPermissionNames = permissions.map(p => p.name);
      const missingPermissions = permissionNames.filter(
        name => !foundPermissionNames.includes(name)
      );

      if (missingPermissions.length > 0) {
        throw createError(`Permissions not found: ${missingPermissions.join(', ')}`, 400);
      }

      // Get current permissions for the role
      const currentPermissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);
      const currentPermissionIds = currentPermissions.map(p => p.id);
      const newPermissionIds = permissions.map(p => p.id);

      // Find permissions to add (not already assigned)
      const permissionsToAdd = newPermissionIds.filter(id => !currentPermissionIds.includes(id));

      if (permissionsToAdd.length > 0) {
        await this.rolePermissionModel.assignPermissionsToRole(roleId, permissionsToAdd);
      }

      // Log audit event
      await this.auditLogService.logRoleAction(
        userId,
        RoleAction.ASSIGN_PERMISSIONS,
        roleId,
        'role',
        {
          assigned_permissions: permissionNames,
          added_permission_ids: permissionsToAdd,
        }
      );

      logger.info(`Permissions assigned successfully to role ${roleId}`);
    } catch (error) {
      logger.error(`Error assigning permissions to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<{
    total: number;
    withUsers: number;
    withoutUsers: number;
    withPermissions: number;
  }> {
    try {
      return await this.roleModel.getRoleStats();
    } catch (error) {
      logger.error('Error getting role stats:', error);
      throw error;
    }
  }

  /**
   * Validate create role request
   */
  private validateCreateRoleRequest(data: CreateRoleRequest): RoleValidationResult {
    const errors = [];

    // Validate name
    if (!data.name || data.name.length < 3 || data.name.length > 50) {
      errors.push({ field: 'name', message: 'Name must be between 3 and 50 characters' });
    } else if (!/^[a-z_][a-z0-9_]*$/.test(data.name)) {
      errors.push({ field: 'name', message: 'Name must be in snake_case format' });
    }

    // Validate display_name
    if (!data.display_name || data.display_name.length < 3 || data.display_name.length > 100) {
      errors.push({
        field: 'display_name',
        message: 'Display name must be between 3 and 100 characters',
      });
    }

    // Validate description
    if (data.description && data.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description must be less than 500 characters',
      });
    }

    // Validate permissions
    if (data.permissions) {
      for (const permission of data.permissions) {
        if (!permission || permission.length < 3 || permission.length > 100) {
          errors.push({
            field: 'permissions',
            message: 'Permission names must be between 3 and 100 characters',
          });
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate update role request
   */
  private validateUpdateRoleRequest(data: UpdateRoleRequest): RoleValidationResult {
    const errors = [];

    // Validate display_name
    if (data.display_name !== undefined) {
      if (!data.display_name || data.display_name.length < 3 || data.display_name.length > 100) {
        errors.push({
          field: 'display_name',
          message: 'Display name must be between 3 and 100 characters',
        });
      }
    }

    // Validate description
    if (data.description !== undefined && data.description && data.description.length > 500) {
      errors.push({
        field: 'description',
        message: 'Description must be less than 500 characters',
      });
    }

    // Validate permissions
    if (data.permissions !== undefined) {
      for (const permission of data.permissions) {
        if (!permission || permission.length < 3 || permission.length > 100) {
          errors.push({
            field: 'permissions',
            message: 'Permission names must be between 3 and 100 characters',
          });
          break;
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate role deletion
   */
  private async validateRoleDeletion(roleId: number): Promise<RoleValidationResult> {
    const errors = [];

    // Check if role has users assigned
    const roleWithPermissions = await this.roleModel.getRoleWithPermissions(roleId);
    if (roleWithPermissions && roleWithPermissions.users_count > 0) {
      errors.push({
        field: 'role_id',
        message: `Cannot delete role that is assigned to ${roleWithPermissions.users_count} users`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
