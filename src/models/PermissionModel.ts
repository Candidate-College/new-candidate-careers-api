/**
 * Permission Model
 *
 * Handles database operations for permissions including CRUD operations,
 * bulk operations, and permission validation. Extends BaseModel for
 * consistent database interaction patterns.
 *
 * @module src/models/PermissionModel
 */

import { BaseModel } from './BaseModel';
import { Permission } from '@/types/roleManagement';
import { Knex } from 'knex';

export class PermissionModel extends BaseModel<Permission> {
  protected tableName = 'permissions';

  /**
   * Apply search functionality for permissions
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    return query.where(builder => {
      builder.where('name', 'ilike', `%${search}%`).orWhere('description', 'ilike', `%${search}%`);
    });
  }

  /**
   * Find permission by name
   */
  async findByName(name: string): Promise<Permission | null> {
    return await this.findOneBy({ name } as Partial<Permission>);
  }

  /**
   * Find permissions by names (bulk operation)
   */
  async findByNames(names: string[]): Promise<Permission[]> {
    if (!names.length) return [];

    return await this.db(this.tableName).whereIn('name', names).orderBy('name', 'asc');
  }

  /**
   * Check if permission exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const permission = await this.findByName(name);
    return !!permission;
  }

  /**
   * Check if multiple permissions exist by names
   */
  async existByNames(names: string[]): Promise<{ [name: string]: boolean }> {
    if (!names.length) return {};

    const permissions = await this.findByNames(names);
    const existingNames = new Set(permissions.map(p => p.name));

    return names.reduce(
      (acc, name) => {
        acc[name] = existingNames.has(name);
        return acc;
      },
      {} as { [name: string]: boolean }
    );
  }

  /**
   * Create permission with validation
   */
  async createPermission(
    permissionData: Omit<Permission, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Permission> {
    // Check if permission name already exists
    if (await this.existsByName(permissionData.name)) {
      throw new Error(`Permission with name '${permissionData.name}' already exists`);
    }

    return await this.create(permissionData);
  }

  /**
   * Update permission with validation
   */
  async updatePermission(id: number, updateData: Partial<Permission>): Promise<Permission | null> {
    // Check if permission exists
    const existingPermission = await this.findById(id);
    if (!existingPermission) {
      return null;
    }

    // If name is being updated, check for uniqueness
    if (updateData.name && updateData.name !== existingPermission.name) {
      if (await this.existsByName(updateData.name)) {
        throw new Error(`Permission with name '${updateData.name}' already exists`);
      }
    }

    return await this.update(id, updateData);
  }

  /**
   * Delete permission with validation
   */
  async deletePermission(id: number): Promise<boolean> {
    // Check if permission is being used by any roles
    const rolePermissions = await this.db('role_permissions').where('permission_id', id).first();

    if (rolePermissions) {
      throw new Error('Cannot delete permission that is assigned to roles');
    }

    const deleted = await this.delete(id);
    return !!deleted;
  }

  /**
   * Get permissions with role information
   */
  async getPermissionsWithRoles(): Promise<Permission[]> {
    return await this.db(this.tableName).select('permissions.*').orderBy('permissions.name', 'asc');
  }

  /**
   * Get permissions by role ID
   */
  async getPermissionsByRoleId(roleId: number): Promise<Permission[]> {
    return await this.db(this.tableName)
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .orderBy('permissions.name', 'asc');
  }

  /**
   * Get permission names by role ID
   */
  async getPermissionNamesByRoleId(roleId: number): Promise<string[]> {
    const permissions = await this.getPermissionsByRoleId(roleId);
    return permissions.map(p => p.name);
  }

  /**
   * Bulk create permissions
   */
  async bulkCreatePermissions(
    permissions: Omit<Permission, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<Permission[]> {
    if (!permissions.length) return [];

    // Check for existing permissions
    const names = permissions.map(p => p.name);
    const existingPermissions = await this.findByNames(names);
    const existingNames = new Set(existingPermissions.map(p => p.name));

    // Filter out existing permissions
    const newPermissions = permissions.filter(p => !existingNames.has(p.name));

    if (!newPermissions.length) {
      return existingPermissions;
    }

    // Insert new permissions
    const insertedPermissions = await this.db(this.tableName).insert(newPermissions).returning('*');

    return [...existingPermissions, ...insertedPermissions];
  }

  /**
   * Get permission statistics
   */
  async getPermissionStats(): Promise<{
    total: number;
    withRoles: number;
    withoutRoles: number;
  }> {
    const total = await this.count();

    const withRoles = await this.db(this.tableName)
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .countDistinct('permissions.id as count')
      .first()
      .then(result => parseInt((result?.count as string) || '0', 10));

    return {
      total,
      withRoles,
      withoutRoles: total - withRoles,
    };
  }
}
