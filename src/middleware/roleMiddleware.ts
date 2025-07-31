/**
 * Role-Based Access Control Middleware
 *
 * Provides middleware functions for role-based authorization and permission checking.
 * Implements Super Admin authorization and granular permission control for the
 * CC Career platform recruitment system.
 *
 * @module src/middleware/roleMiddleware
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types/jwt';
import { PermissionService } from '@/services/PermissionService';
import { logger } from '@/utils/logger';

/**
 * Middleware to require a specific role
 */
export const requireRole = (requiredRoles: string | string[]) => {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 401,
          message: 'Authentication required',
        });
        return;
      }

      const userRole = req.user.role;
      if (!userRole || !roles.includes(userRole)) {
        res.status(403).json({
          status: 403,
          message: `Access denied. Required roles: ${roles.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role middleware error:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error during role verification',
      });
    }
  };
};

/**
 * Middleware to require Super Admin role
 */
export const requireSuperAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      res.status(401).json({
        status: 401,
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.role !== 'super_admin') {
      res.status(403).json({
        status: 403,
        message: 'Access denied. Super Admin role required',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Super Admin middleware error:', error);
    res.status(500).json({
      status: 500,
      message: 'Internal server error during authorization',
    });
  }
};

/**
 * Middleware to require specific permission
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 401,
          message: 'Authentication required',
        });
        return;
      }

      const permissionService = new PermissionService();
      const hasPermission = await permissionService.checkUserPermission(
        Number(req.user.id),
        requiredPermission
      );

      if (!hasPermission) {
        res.status(403).json({
          status: 403,
          message: `Access denied. Required permission: ${requiredPermission}`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error during permission verification',
      });
    }
  };
};

/**
 * Middleware to require multiple permissions (all must be present)
 */
export const requireAllPermissions = (requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 401,
          message: 'Authentication required',
        });
        return;
      }

      const permissionService = new PermissionService();
      const hasAllPermissions = await permissionService.checkUserAllPermissions(
        Number(req.user.id),
        requiredPermissions
      );

      if (!hasAllPermissions.has_permission) {
        res.status(403).json({
          status: 403,
          message: `Access denied. Required permissions: ${requiredPermissions.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Multiple permissions middleware error:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error during permission verification',
      });
    }
  };
};

/**
 * Middleware to require any of the specified permissions (at least one must be present)
 */
export const requireAnyPermission = (requiredPermissions: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          status: 401,
          message: 'Authentication required',
        });
        return;
      }

      const permissionService = new PermissionService();
      const hasAnyPermission = await permissionService.checkUserAnyPermission(
        Number(req.user.id),
        requiredPermissions
      );

      if (!hasAnyPermission.has_permission) {
        res.status(403).json({
          status: 403,
          message: `Access denied. Required at least one permission: ${requiredPermissions.join(', ')}`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Any permission middleware error:', error);
      res.status(500).json({
        status: 500,
        message: 'Internal server error during permission verification',
      });
    }
  };
};
