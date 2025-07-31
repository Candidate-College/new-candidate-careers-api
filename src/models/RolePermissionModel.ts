/**
 * Role Permission Model
 *
 * Handles the many-to-many relationship between roles and permissions.
 * Provides methods for associating/dissociating permissions with roles,
 * bulk operations, and validation for constraint violations.
 *
 * @module src/models/RolePermissionModel
 */

import { RolePermission, Permission, Role } from '@/types/roleManagement';
import db from '@/config/database';

export class RolePermissionModel {
  protected tableName = 'role_permissions';
  protected db = db;

  /**
   * Associate permissions with a role
   */
  async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
    if (!permissionIds.length) return;

    // Check if role exists
    const role = await this.db('roles').where('id', roleId).first();
    if (!role) {
      throw new Error(`Role with ID ${roleId} does not exist`);
    }

    // Check if permissions exist
    const permissions = await this.db('permissions').whereIn('id', permissionIds).select('id');

    const existingPermissionIds = permissions.map((p: { id: number }) => p.id);
    const nonExistentIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

    if (nonExistentIds.length > 0) {
      throw new Error(`Permissions with IDs ${nonExistentIds.join(', ')} do not exist`);
    }

    // Insert role-permission associations
    const rolePermissions = permissionIds.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId,
    }));

    await this.db(this.tableName).insert(rolePermissions);
  }

  /**
   * Remove permissions from a role
   */
  async removePermissionsFromRole(roleId: number, permissionIds: number[]): Promise<void> {
    if (!permissionIds.length) return;

    await this.db(this.tableName)
      .where('role_id', roleId)
      .whereIn('permission_id', permissionIds)
      .del();
  }

  /**
   * Replace all permissions for a role
   */
  async replaceRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Remove all existing permissions for the role
    await this.db(this.tableName).where('role_id', roleId).del();

    // Assign new permissions
    if (permissionIds.length > 0) {
      await this.assignPermissionsToRole(roleId, permissionIds);
    }
  }

  /**
   * Get all permissions for a role
   */
  async getPermissionsByRoleId(roleId: number): Promise<Permission[]> {
    return await this.db('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .orderBy('permissions.name', 'asc');
  }

  /**
   * Get all roles for a permission
   */
  async getRolesByPermissionId(permissionId: number): Promise<Role[]> {
    return await this.db('roles')
      .select('roles.*')
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .where('role_permissions.permission_id', permissionId)
      .orderBy('roles.name', 'asc');
  }

  /**
   * Check if a role has a specific permission
   */
  async roleHasPermission(roleId: number, permissionId: number): Promise<boolean> {
    const rolePermission = await this.db(this.tableName)
      .where('role_id', roleId)
      .where('permission_id', permissionId)
      .first();

    return !!rolePermission;
  }

  /**
   * Check if a role has any of the specified permissions
   */
  async roleHasAnyPermission(roleId: number, permissionIds: number[]): Promise<boolean> {
    if (!permissionIds.length) return false;

    const rolePermissions = await this.db(this.tableName)
      .where('role_id', roleId)
      .whereIn('permission_id', permissionIds)
      .select('permission_id');

    return rolePermissions.length > 0;
  }

  /**
   * Check if a role has all of the specified permissions
   */
  async roleHasAllPermissions(roleId: number, permissionIds: number[]): Promise<boolean> {
    if (!permissionIds.length) return true;

    const rolePermissions = await this.db(this.tableName)
      .where('role_id', roleId)
      .whereIn('permission_id', permissionIds)
      .select('permission_id');

    return rolePermissions.length === permissionIds.length;
  }

  /**
   * Get permission IDs for a role
   */
  async getPermissionIdsByRoleId(roleId: number): Promise<number[]> {
    const rolePermissions = await this.db(this.tableName)
      .where('role_id', roleId)
      .select('permission_id');

    return rolePermissions.map((rp: { permission_id: number }) => rp.permission_id);
  }

  /**
   * Get role IDs for a permission
   */
  async getRoleIdsByPermissionId(permissionId: number): Promise<number[]> {
    const rolePermissions = await this.db(this.tableName)
      .where('permission_id', permissionId)
      .select('role_id');

    return rolePermissions.map((rp: { role_id: number }) => rp.role_id);
  }

  /**
   * Bulk assign permissions to roles
   */
  async bulkAssignPermissions(
    assignments: { roleId: number; permissionIds: number[] }[]
  ): Promise<void> {
    if (!assignments.length) return;

    const rolePermissions: RolePermission[] = [];

    for (const assignment of assignments) {
      const { roleId, permissionIds } = assignment;

      for (const permissionId of permissionIds) {
        rolePermissions.push({
          role_id: roleId,
          permission_id: permissionId,
        });
      }
    }

    if (rolePermissions.length > 0) {
      await this.db(this.tableName).insert(rolePermissions);
    }
  }

  /**
   * Count total role-permission assignments
   */
  async count(): Promise<number> {
    const result = await this.db(this.tableName).count('* as count').first();
    return parseInt((result?.count as string) || '0', 10);
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
    const totalAssignments = await this.count();

    const rolesWithPermissions = await this.db(this.tableName)
      .countDistinct('role_id as count')
      .first()
      .then((result: any) => parseInt((result?.count as string) || '0', 10));

    const permissionsWithRoles = await this.db(this.tableName)
      .countDistinct('permission_id as count')
      .first()
      .then((result: any) => parseInt((result?.count as string) || '0', 10));

    const totalRoles = await this.db('roles')
      .count('* as count')
      .first()
      .then((result: any) => parseInt((result?.count as string) || '0', 10));

    const averagePermissionsPerRole = totalRoles > 0 ? totalAssignments / totalRoles : 0;

    return {
      totalAssignments,
      rolesWithPermissions,
      permissionsWithRoles,
      averagePermissionsPerRole: Math.round(averagePermissionsPerRole * 100) / 100,
    };
  }

  /**
   * Delete all permissions for a role
   */
  async deleteAllPermissionsForRole(roleId: number): Promise<void> {
    await this.db(this.tableName).where('role_id', roleId).del();
  }

  /**
   * Delete all roles for a permission
   */
  async deleteAllRolesForPermission(permissionId: number): Promise<void> {
    await this.db(this.tableName).where('permission_id', permissionId).del();
  }
}
