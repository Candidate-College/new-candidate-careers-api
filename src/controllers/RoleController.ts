/**
 * Role Management Controller
 *
 * Handles all role-related API endpoints for the CC Career platform.
 * Provides CRUD operations for roles with proper validation, authorization,
 * and audit logging for the recruitment system.
 *
 * @module src/controllers/RoleController
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@/types/jwt';
import { RoleService } from '@/services/RoleService';
import * as roleValidator from '@/validators/roleValidator';
import * as roleResource from '@/resources/roleResource';
import { logger } from '@/utils/logger';
import { createError, createValidationError, createNotFoundError } from '@/utils/errors';
import { CreateRoleRequest, UpdateRoleRequest, RoleQueryParams } from '@/types/roleManagement';

export class RoleController {
  private roleService: RoleService;

  constructor() {
    this.roleService = new RoleService();
  }

  /**
   * Get all roles with pagination and filtering
   */
  async getAllRoles(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const queryParams: RoleQueryParams = {};

      if (req.query.page) {
        queryParams.page = parseInt(req.query.page as string);
      }
      if (req.query.limit) {
        queryParams.limit = parseInt(req.query.limit as string);
      }
      if (req.query.status) {
        queryParams.status = req.query.status as 'active' | 'inactive';
      }
      if (req.query.search) {
        queryParams.search = req.query.search as string;
      }
      if (req.query.sort) {
        queryParams.sort = req.query.sort as string;
      }
      if (req.query.order) {
        queryParams.order = req.query.order as 'asc' | 'desc';
      }

      const result = await this.roleService.getRoles(queryParams);
      roleResource.formatRoleListResponse(res, result.roles, result.pagination);
    } catch (error) {
      logger.error('Error getting all roles:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to retrieve roles',
      });
    }
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roleIdParam = req.params.id;
      if (!roleIdParam) {
        const error = createError('Role ID parameter is required', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'MISSING_ROLE_ID_PARAM',
        });
        return;
      }

      const roleId = parseInt(roleIdParam);
      if (isNaN(roleId)) {
        const error = createError('Invalid role ID', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'INVALID_ROLE_ID',
        });
        return;
      }

      const role = await this.roleService.getRole(roleId);
      if (!role) {
        const error = createNotFoundError('Role not found');
        res.status(404).json({
          status: 404,
          message: error.message,
          error: 'ROLE_NOT_FOUND',
        });
        return;
      }

      roleResource.formatSingleRoleResponse(res, role);
    } catch (error) {
      logger.error('Error getting role by ID:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to retrieve role',
      });
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const createData: CreateRoleRequest = req.body;

      // Validate input using roleValidator
      const validation = roleValidator.validateRoleData(createData);
      if (!validation.isValid) {
        const error = createValidationError('Validation failed', validation.errors);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'VALIDATION_ERROR',
          details: validation.errors,
        });
        return;
      }

      const role = await this.roleService.createRole(createData, Number(req.user!.id));
      roleResource.formatRoleCreatedResponse(res, role);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        res.status(409).json({
          status: 409,
          message: 'Role with this name already exists',
          error: 'ROLE_ALREADY_EXISTS',
        });
        return;
      }

      logger.error('Error creating role:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to create role',
      });
    }
  }

  /**
   * Update an existing role
   */
  async updateRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roleIdParam = req.params.id;
      if (!roleIdParam) {
        const error = createError('Role ID parameter is required', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'MISSING_ROLE_ID_PARAM',
        });
        return;
      }

      const roleId = parseInt(roleIdParam);
      if (isNaN(roleId)) {
        const error = createError('Invalid role ID', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'INVALID_ROLE_ID',
        });
        return;
      }

      const updateData: UpdateRoleRequest = req.body;

      // Validate input using roleValidator
      const validation = roleValidator.validateRoleData(updateData);
      if (!validation.isValid) {
        const error = createValidationError('Validation failed', validation.errors);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'VALIDATION_ERROR',
          details: validation.errors,
        });
        return;
      }

      const role = await this.roleService.updateRole(roleId, updateData, Number(req.user!.id));
      if (!role) {
        const error = createNotFoundError('Role not found');
        res.status(404).json({
          status: 404,
          message: error.message,
          error: 'ROLE_NOT_FOUND',
        });
        return;
      }

      roleResource.formatRoleUpdatedResponse(res, role);
    } catch (error) {
      logger.error('Error updating role:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to update role',
      });
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roleIdParam = req.params.id;
      if (!roleIdParam) {
        const error = createError('Role ID parameter is required', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'MISSING_ROLE_ID_PARAM',
        });
        return;
      }

      const roleId = parseInt(roleIdParam);
      if (isNaN(roleId)) {
        const error = createError('Invalid role ID', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'INVALID_ROLE_ID',
        });
        return;
      }

      const result = await this.roleService.deleteRole(roleId, Number(req.user!.id));
      if (!result) {
        res.status(400).json({
          status: 400,
          message: 'Failed to delete role',
          error: 'DELETE_FAILED',
        });
        return;
      }

      roleResource.formatRoleDeletedResponse(res, roleId);
    } catch (error) {
      logger.error('Error deleting role:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to delete role',
      });
    }
  }

  /**
   * Assign permissions to a role
   */
  async assignPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roleIdParam = req.params.id;
      if (!roleIdParam) {
        const error = createError('Role ID parameter is required', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'MISSING_ROLE_ID_PARAM',
        });
        return;
      }

      const roleId = parseInt(roleIdParam);
      if (isNaN(roleId)) {
        const error = createError('Invalid role ID', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'INVALID_ROLE_ID',
        });
        return;
      }

      const { permissions, action } = req.body;

      // Validate input using roleValidator
      const validation = roleValidator.validateRoleData({
        permissions,
        action,
      } as any);
      if (!validation.isValid) {
        const error = createValidationError('Validation failed', validation.errors);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'VALIDATION_ERROR',
          details: validation.errors,
        });
        return;
      }

      await this.roleService.assignPermissionsToRole(roleId, permissions, Number(req.user!.id));

      res.status(200).json({
        status: 200,
        message: 'Permissions assigned successfully',
        data: {
          role_id: roleId,
          permissions: permissions,
          action: action,
        },
      });
    } catch (error) {
      logger.error('Error assigning permissions:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to assign permissions',
      });
    }
  }
}
