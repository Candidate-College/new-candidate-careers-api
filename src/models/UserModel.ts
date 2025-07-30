import { BaseModel } from './BaseModel';
import { User, CreateUserRequest } from '@/types';
import { Knex } from 'knex';
import { isValidUUID } from '@/utils/uuid';

export class UserModel extends BaseModel<User> {
  protected tableName = 'users';

  /**
   * Apply search functionality for users
   */
  protected applySearch(query: Knex.QueryBuilder, search: string): Knex.QueryBuilder {
    return query.where(builder => {
      builder.where('email', 'ilike', `%${search}%`).orWhere('name', 'ilike', `%${search}%`);
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email } as Partial<User>);
  }

  /**
   * Find user by email with password hash for authentication
   */
  async findByEmailWithPassword(email: string): Promise<(User & { password_hash: string }) | null> {
    const user = await this.db(this.tableName).select('*').where({ email }).first();

    return user || null;
  }

  /**
   * Check if email exists (excluding specific user ID)
   */
  async emailExists(email: string, excludeId?: number): Promise<boolean> {
    let query = this.db(this.tableName).where({ email });

    if (excludeId) {
      query = query.andWhere('id', '!=', excludeId);
    }

    const user = await query.first();
    return !!user;
  }

  /**
   * Create user with validation
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Check for existing email
    if (await this.emailExists(userData.email)) {
      throw new Error('Email already exists');
    }
    // Create the user (password should be hashed before calling this method)
    return await this.create({
      email: userData.email,
      name: userData.name,
      password: userData.password, // This should be hashed
      role_id: userData.role_id,
      status: 'inactive',
      email_verified_at: null,
      last_login_at: null,
      deleted_at: null,
    } as Omit<User, 'id' | 'created_at' | 'updated_at'>);
  }

  /**
   * Update user with validation
   */
  async updateUser(id: number, updateData: Partial<User>): Promise<User | null> {
    // Check if user exists
    const existingUser = await this.findById(id);
    if (!existingUser) {
      return null;
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      if (await this.emailExists(updateData.email, id)) {
        throw new Error('Email already exists');
      }
    }
    // Validate uuid if present
    if ('uuid' in updateData && updateData.uuid && !isValidUUID(updateData.uuid)) {
      throw new Error('Invalid UUID format');
    }

    return await this.update(id, updateData);
  }

  /**
   * Get active users only
   */
  async findActiveUsers(): Promise<User[]> {
    return await this.findBy({ status: 'active' } as Partial<User>);
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: number): Promise<User | null> {
    return await this.update(id, { last_login_at: new Date() });
  }

  /**
   * Deactivate user instead of deleting
   */
  async deactivateUser(id: number): Promise<User | null> {
    return await this.update(id, { status: 'inactive' });
  }

  /**
   * Activate user
   */
  async activateUser(id: number): Promise<User | null> {
    return await this.update(id, { status: 'active' });
  }

  /**
   * Get users created within a date range
   */
  async findUsersByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    return await this.db(this.tableName)
      .where('created_at', '>=', startDate)
      .andWhere('created_at', '<=', endDate)
      .orderBy('created_at', 'desc');
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    recentlyCreated: number;
  }> {
    const total = await this.count();
    const active = await this.count({ status: 'active' } as Partial<User>);
    const inactive = await this.count({ status: 'inactive' } as Partial<User>);

    // Users created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUsers = await this.db(this.tableName)
      .where('created_at', '>=', thirtyDaysAgo)
      .count('* as count');

    const recentlyCreated = parseInt((recentUsers[0]?.count as string) || '0', 10);

    return {
      total,
      active,
      inactive,
      recentlyCreated,
    };
  }
}
