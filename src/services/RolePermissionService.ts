/**
 * Role Permission Service
 *
 * Handles business logic for role-permission associations including
 * assignment, removal, bulk operations, and validation. Provides
 * comprehensive role-permission management functionality with proper
 * error handling and audit logging.
 *
 * @module src/services/RolePermissionService
 */

import { RolePermissionModel } from '@/models/RolePermissionModel';
import { RoleModel } from '@/models/RoleModel';
import { PermissionModel } from '@/models/PermissionModel';
import { AuditLogService } from '@/services/AuditLogService';
import { logger } from '@/utils/logger';
import { createError } from '@/utils/errors';
import {
  Role,
  Permission,
  AssignPermissionsRequest,
  PermissionAction,
} from '@/types/roleManagement';

export class RolePermissionService {
  private readonly rolePermissionModel: RolePermissionModel;
  private readonly roleModel: RoleModel;
  private readonly permissionModel: PermissionModel;
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.rolePermissionModel = new RolePermissionModel();
    this.roleModel = new RoleModel();
    this.permissionModel = new PermissionModel();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(
    roleId: number,
    permissionNames: string[],
    userId: number
  ): Promise<{ role: Role; permissions: Permission[] }> {
    try {
      logger.info(`Assigning permissions to role ${roleId}: ${permissionNames.join(', ')}`);

      // Validate role exists
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }

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

      // Get updated permissions
      const updatedPermissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);

      // Log audit event
      await this.auditLogService.logRoleAction(userId, PermissionAction.ADD, roleId, role.name, {
        assigned_permissions: permissionNames,
        added_permission_ids: permissionsToAdd,
        total_permissions: updatedPermissions.length,
      });

      logger.info(`Permissions assigned successfully to role ${roleId}`);
      return { role, permissions: updatedPermissions };
    } catch (error) {
      logger.error(`Error assigning permissions to role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Remove permissions from a role
   */
  async removePermissionsFromRole(
    roleId: number,
    permissionNames: string[],
    userId: number
  ): Promise<{ role: Role; permissions: Permission[] }> {
    try {
      logger.info(`Removing permissions from role ${roleId}: ${permissionNames.join(', ')}`);

      // Validate role exists
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }

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
      const permissionIdsToRemove = permissions.map(p => p.id);

      // Find permissions to remove (currently assigned)
      const permissionsToRemove = permissionIdsToRemove.filter(id =>
        currentPermissionIds.includes(id)
      );

      if (permissionsToRemove.length > 0) {
        await this.rolePermissionModel.removePermissionsFromRole(roleId, permissionsToRemove);
      }

      // Get updated permissions
      const updatedPermissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);

      // Log audit event
      await this.auditLogService.logRoleAction(userId, PermissionAction.REMOVE, roleId, role.name, {
        removed_permissions: permissionNames,
        removed_permission_ids: permissionsToRemove,
        total_permissions: updatedPermissions.length,
      });

      logger.info(`Permissions removed successfully from role ${roleId}`);
      return { role, permissions: updatedPermissions };
    } catch (error) {
      logger.error(`Error removing permissions from role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Replace all permissions for a role
   */
  async replaceRolePermissions(
    roleId: number,
    permissionNames: string[],
    userId: number
  ): Promise<{ role: Role; permissions: Permission[] }> {
    try {
      logger.info(`Replacing permissions for role ${roleId}: ${permissionNames.join(', ')}`);

      // Validate role exists
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }

      // Get current permissions for comparison
      const currentPermissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);
      const currentPermissionNames = currentPermissions.map(p => p.name);

      // Get new permissions by names
      const newPermissions = await this.permissionModel.findByNames(permissionNames);
      const foundPermissionNames = newPermissions.map(p => p.name);
      const missingPermissions = permissionNames.filter(
        name => !foundPermissionNames.includes(name)
      );

      if (missingPermissions.length > 0) {
        throw createError(`Permissions not found: ${missingPermissions.join(', ')}`, 400);
      }

      // Replace all permissions
      const newPermissionIds = newPermissions.map(p => p.id);
      await this.rolePermissionModel.replaceRolePermissions(roleId, newPermissionIds);

      // Get updated permissions
      const updatedPermissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);

      // Log audit event
      await this.auditLogService.logRoleAction(
        userId,
        PermissionAction.REPLACE,
        roleId,
        role.name,
        {
          old_permissions: currentPermissionNames,
          new_permissions: permissionNames,
          total_permissions: updatedPermissions.length,
        }
      );

      logger.info(`Permissions replaced successfully for role ${roleId}`);
      return { role, permissions: updatedPermissions };
    } catch (error) {
      logger.error(`Error replacing permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Handle permission assignment with action type
   */
  async handlePermissionAssignment(
    roleId: number,
    request: AssignPermissionsRequest,
    userId: number
  ): Promise<{ role: Role; permissions: Permission[] }> {
    try {
      const { permissions, action } = request;

      switch (action) {
        case 'add':
          return await this.assignPermissionsToRole(roleId, permissions, userId);
        case 'remove':
          return await this.removePermissionsFromRole(roleId, permissions, userId);
        case 'replace':
          return await this.replaceRolePermissions(roleId, permissions, userId);
        default:
          throw createError(`Invalid action: ${action}`, 400);
      }
    } catch (error) {
      logger.error(`Error handling permission assignment for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: number): Promise<{ role: Role; permissions: Permission[] }> {
    try {
      // Validate role exists
      const role = await this.roleModel.findById(roleId);
      if (!role) {
        throw createError(`Role with ID ${roleId} not found`, 404);
      }

      // Get permissions for the role
      const permissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);

      return { role, permissions };
    } catch (error) {
      logger.error(`Error getting permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get all roles for a permission
   */
  async getPermissionRoles(
    permissionId: number
  ): Promise<{ permission: Permission; roles: Role[] }> {
    try {
      // Validate permission exists
      const permission = await this.permissionModel.findById(permissionId);
      if (!permission) {
        throw createError(`Permission with ID ${permissionId} not found`, 404);
      }

      // Get roles for the permission
      const roles = await this.rolePermissionModel.getRolesByPermissionId(permissionId);

      return { permission, roles };
    } catch (error) {
      logger.error(`Error getting roles for permission ${permissionId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a role has a specific permission
   */
  async roleHasPermission(roleId: number, permissionName: string): Promise<boolean> {
    try {
      // Get permission by name
      const permission = await this.permissionModel.findByName(permissionName);
      if (!permission) {
        return false;
      }

      // Check if role has the permission
      return await this.rolePermissionModel.roleHasPermission(roleId, permission.id);
    } catch (error) {
      logger.error(`Error checking if role ${roleId} has permission ${permissionName}:`, error);
      return false;
    }
  }

  /**
   * Check if a role has any of the specified permissions
   */
  async roleHasAnyPermission(roleId: number, permissionNames: string[]): Promise<boolean> {
    try {
      // Get permissions by names
      const permissions = await this.permissionModel.findByNames(permissionNames);
      if (permissions.length === 0) {
        return false;
      }

      // Check if role has any of the permissions
      const permissionIds = permissions.map(p => p.id);
      return await this.rolePermissionModel.roleHasAnyPermission(roleId, permissionIds);
    } catch (error) {
      logger.error(`Error checking if role ${roleId} has any permissions:`, error);
      return false;
    }
  }

  /**
   * Check if a role has all of the specified permissions
   */
  async roleHasAllPermissions(roleId: number, permissionNames: string[]): Promise<boolean> {
    try {
      // Get permissions by names
      const permissions = await this.permissionModel.findByNames(permissionNames);
      if (permissions.length === 0) {
        return true; // No permissions to check
      }

      // Check if role has all permissions
      const permissionIds = permissions.map(p => p.id);
      return await this.rolePermissionModel.roleHasAllPermissions(roleId, permissionIds);
    } catch (error) {
      logger.error(`Error checking if role ${roleId} has all permissions:`, error);
      return false;
    }
  }

  /**
   * Bulk assign permissions to multiple roles
   */
  async bulkAssignPermissions(
    assignments: { roleId: number; permissionNames: string[] }[],
    userId: number
  ): Promise<{ roleId: number; success: boolean; error?: string }[]> {
    try {
      logger.info(`Bulk assigning permissions to ${assignments.length} roles`);

      const results = [];

      for (const assignment of assignments) {
        try {
          const { roleId, permissionNames } = assignment;
          await this.assignPermissionsToRole(roleId, permissionNames, userId);
          results.push({ roleId, success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.push({ roleId: assignment.roleId, success: false, error: errorMessage });
        }
      }

      logger.info(
        `Bulk permission assignment completed with ${results.filter(r => r.success).length} successes`
      );
      return results;
    } catch (error) {
      logger.error('Error in bulk permission assignment:', error);
      throw error;
    }
  }

  /**
   * Get role-permission statistics
   */
  async getRolePermissionStats(): Promise<{
    totalAssignments: number;
    rolesWithPermissions: number;
    permissionsWithRoles: number;
    averagePermissionsPerRole: number;
  }> {
    try {
      return await this.rolePermissionModel.getRolePermissionStats();
    } catch (error) {
      logger.error('Error getting role-permission stats:', error);
      throw error;
    }
  }

  /**
   * Get permission names for a role
   */
  async getRolePermissionNames(roleId: number): Promise<string[]> {
    try {
      const permissions = await this.rolePermissionModel.getPermissionsByRoleId(roleId);
      return permissions.map(p => p.name);
    } catch (error) {
      logger.error(`Error getting permission names for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Get role names for a permission
   */
  async getPermissionRoleNames(permissionId: number): Promise<string[]> {
    try {
      const roles = await this.rolePermissionModel.getRolesByPermissionId(permissionId);
      return roles.map(r => r.name);
    } catch (error) {
      logger.error(`Error getting role names for permission ${permissionId}:`, error);
      throw error;
    }
  }
}
