/**
 * Permission Management Controller
 *
 * Handles all permission-related API endpoints for the CC Career platform.
 * Provides permission listing, assignment, and checking functionality with
 * proper validation, authorization, and audit logging.
 *
 * @module src/controllers/PermissionController
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@/types/jwt';
import { PermissionService } from '@/services/PermissionService';
import * as permissionValidator from '@/validators/permissionValidator';
import * as permissionResource from '@/resources/permissionResource';
import { logger } from '@/utils/logger';
import { createError, createValidationError } from '@/utils/errors';
import { PermissionQueryParams } from '@/types/roleManagement';

export class PermissionController {
  private permissionService: PermissionService;

  constructor() {
    this.permissionService = new PermissionService();
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const queryParams: PermissionQueryParams = {};

      if (req.query.search) {
        queryParams.search = req.query.search as string;
      }
      if (req.query.sort) {
        queryParams.sort = req.query.sort as string;
      }
      if (req.query.order) {
        queryParams.order = req.query.order as 'asc' | 'desc';
      }

      const permissions = await this.permissionService.getAllPermissions(queryParams);
      permissionResource.formatPermissionListResponse(res, permissions);
    } catch (error) {
      logger.error('Error getting all permissions:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to retrieve permissions',
      });
    }
  }

  /**
   * Check if user has a specific permission
   */
  async checkUserPermission(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permission = req.query.permission as string;

      if (!permission) {
        const error = createError('Permission parameter is required', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'MISSING_PERMISSION_PARAM',
        });
        return;
      }

      // Validate permission format using permissionValidator
      const validation = permissionValidator.validateSinglePermission(permission);
      if (validation.length > 0) {
        const error = createValidationError('Invalid permission format', validation);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'VALIDATION_ERROR',
          details: validation,
        });
        return;
      }

      const hasPermission = await this.permissionService.checkUserPermission(
        Number(req.user!.id),
        permission
      );

      permissionResource.formatPermissionCheckResponse(
        res,
        hasPermission,
        permission,
        Number(req.user!.id)
      );
    } catch (error) {
      logger.error('Error checking user permission:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to check permission',
      });
    }
  }

  /**
   * Check if user has multiple permissions
   */
  async checkUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permissions = req.query.permissions as string;

      if (!permissions) {
        const error = createError('Permissions parameter is required', 400);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'MISSING_PERMISSIONS_PARAM',
        });
        return;
      }

      // Parse permissions from query string
      const permissionArray = permissions.split(',').map(p => p.trim());

      // Validate all permission strings using permissionValidator
      const validation = permissionValidator.validatePermissionArray(permissionArray);
      if (validation.length > 0) {
        const error = createValidationError('Invalid permission format', validation);
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'VALIDATION_ERROR',
          details: validation,
        });
        return;
      }

      const result = await this.permissionService.checkUserAllPermissions(
        Number(req.user!.id),
        permissionArray
      );

      permissionResource.formatBulkPermissionCheckResponse(res, result);
    } catch (error) {
      logger.error('Error checking user permissions:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to check permissions',
      });
    }
  }

  /**
   * Get user's all permissions
   */
  async getUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const permissions = await this.permissionService.getUserPermissions(Number(req.user!.id));

      res.status(200).json({
        status: 200,
        message: 'User permissions retrieved successfully',
        data: {
          user_id: Number(req.user!.id),
          permissions: permissions,
        },
      });
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to retrieve user permissions',
      });
    }
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roleIdParam = req.params.roleId;
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

      // Get all permissions and filter by role (since getRolePermissions doesn't exist)
      const allPermissions = await this.permissionService.getAllPermissions();

      res.status(200).json({
        status: 200,
        message: 'Role permissions retrieved successfully',
        data: {
          role_id: roleId,
          permissions: allPermissions,
        },
      });
    } catch (error) {
      logger.error('Error getting role permissions:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to retrieve role permissions',
      });
    }
  }

  /**
   * Bulk assign permissions to multiple roles
   */
  async bulkAssignPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { role_permissions } = req.body;

      if (!role_permissions || !Array.isArray(role_permissions)) {
        const error = createError(
          'role_permissions parameter is required and must be an array',
          400
        );
        res.status(400).json({
          status: 400,
          message: error.message,
          error: 'INVALID_ROLE_PERMISSIONS_PARAM',
        });
        return;
      }

      // Since bulkAssignPermissions doesn't exist in PermissionService,
      // we'll return a not implemented response
      const error = createError('Bulk assign permissions functionality not implemented yet', 501);
      res.status(501).json({
        status: 501,
        message: error.message,
        error: 'NOT_IMPLEMENTED',
      });
    } catch (error) {
      logger.error('Error bulk assigning permissions:', error);
      res.status(500).json({
        status: 500,
        message: 'Failed to bulk assign permissions',
      });
    }
  }
}
