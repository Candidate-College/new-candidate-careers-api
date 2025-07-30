import { BaseModel } from './BaseModel';

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
}

export class RoleModel extends BaseModel<Role> {
  protected tableName = 'roles';

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    return await this.findOneBy({ name } as Partial<Role>);
  }

  /**
   * Find role by ID
   */
  async findById(id: number): Promise<Role | null> {
    return await super.findById(id);
  }

  /**
   * Get all roles (overrides base method to return simple array)
   */
  async getAllRoles(): Promise<Role[]> {
    const result = await super.findAll();
    return result.data;
  }
}
