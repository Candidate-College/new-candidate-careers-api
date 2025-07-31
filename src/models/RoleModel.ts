/**
 * Role Model
 *
 * Handles database operations for roles including CRUD operations,
 * role-permission associations, and role usage validation. Extends
 * BaseModel for consistent database interaction patterns.
 *
 * @module src/models/RoleModel
 */

import { BaseModel } from './BaseModel';
import { Role, RoleWithPermissions } from '@/types/roleManagement';
import { Knex } from 'knex';

export class RoleModel extends BaseModel<Role> {
  protected tableName = 'roles';

  /**
   * Apply search functionality for roles
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    return query.where(builder => {
      builder
        .where('name', 'ilike', `%${search}%`)
        .orWhere('display_name', 'ilike', `%${search}%`)
        .orWhere('description', 'ilike', `%${search}%`);
    });
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    return await this.findOneBy({ name } as Partial<Role>);
  }

  /**
   * Find roles by names (bulk operation)
   */
  async findByNames(names: string[]): Promise<Role[]> {
    if (!names.length) return [];

    return await this.db(this.tableName).whereIn('name', names).orderBy('name', 'asc');
  }

  /**
   * Check if role exists by name
   */
  async existsByName(name: string): Promise<boolean> {
    const role = await this.findByName(name);
    return !!role;
  }

  /**
   * Create role with validation
   */
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    // Check if role name already exists
    if (await this.existsByName(roleData.name)) {
      throw new Error(`Role with name '${roleData.name}' already exists`);
    }

    return await this.create(roleData);
  }

  /**
   * Update role with validation
   */
  async updateRole(id: number, updateData: Partial<Role>): Promise<Role | null> {
    // Check if role exists
    const existingRole = await this.findById(id);
    if (!existingRole) {
      return null;
    }

    // If name is being updated, check for uniqueness
    if (updateData.name && updateData.name !== existingRole.name) {
      if (await this.existsByName(updateData.name)) {
        throw new Error(`Role with name '${updateData.name}' already exists`);
      }
    }

    return await this.update(id, updateData);
  }

  /**
   * Delete role with validation
   */
  async deleteRole(id: number): Promise<boolean> {
    // Check if role is being used by any users
    const usersWithRole = await this.db('users').where('role_id', id).first();

    if (usersWithRole) {
      throw new Error('Cannot delete role that is assigned to users');
    }

    const deleted = await this.delete(id);
    return !!deleted;
  }

  /**
   * Get role with permissions
   */
  async getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
    const role = await this.findById(roleId);
    if (!role) return null;

    const permissions = await this.db('permissions')
      .select('permissions.*')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .where('role_permissions.role_id', roleId)
      .orderBy('permissions.name', 'asc');

    const usersCount = await this.db('users')
      .where('role_id', roleId)
      .count('* as count')
      .first()
      .then(result => parseInt((result?.count as string) || '0', 10));

    return {
      ...role,
      permissions,
      users_count: usersCount,
    };
  }

  /**
   * Get roles with permissions and user counts
   */
  async getRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    const roles = await this.findAll();
    const rolesWithPermissions: RoleWithPermissions[] = [];

    for (const role of roles.data) {
      const roleWithPermissions = await this.getRoleWithPermissions(role.id);
      if (roleWithPermissions) {
        rolesWithPermissions.push(roleWithPermissions);
      }
    }

    return rolesWithPermissions;
  }

  /**
   * Get roles with pagination and permissions
   */
  async getRolesWithPermissionsPaginated(
    page: number = 1,
    limit: number = 20,
    search?: string
  ): Promise<{ roles: RoleWithPermissions[]; total: number }> {
    let query = this.db(this.tableName);

    if (search) {
      query = this.applySearch(query, search);
    }

    const total = await query
      .clone()
      .count('* as count')
      .first()
      .then(result => parseInt((result?.count as string) || '0', 10));

    const roles = await query
      .orderBy('name', 'asc')
      .limit(limit)
      .offset((page - 1) * limit);

    const rolesWithPermissions: RoleWithPermissions[] = [];
    for (const role of roles) {
      const roleWithPermissions = await this.getRoleWithPermissions(role.id);
      if (roleWithPermissions) {
        rolesWithPermissions.push(roleWithPermissions);
      }
    }

    return { roles: rolesWithPermissions, total };
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
    const total = await this.count();

    const withUsers = await this.db(this.tableName)
      .join('users', 'roles.id', 'users.role_id')
      .countDistinct('roles.id as count')
      .first()
      .then(result => parseInt((result?.count as string) || '0', 10));

    const withPermissions = await this.db(this.tableName)
      .join('role_permissions', 'roles.id', 'role_permissions.role_id')
      .countDistinct('roles.id as count')
      .first()
      .then(result => parseInt((result?.count as string) || '0', 10));

    return {
      total,
      withUsers,
      withoutUsers: total - withUsers,
      withPermissions,
    };
  }
}
