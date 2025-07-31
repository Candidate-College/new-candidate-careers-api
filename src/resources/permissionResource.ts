/**
 * Permission Management Resources
 *
 * Provides response formatting for permission-related API endpoints including
 * permission lists, permission checking, assignment responses, and error formatting.
 * Implements consistent API response structure and data transformation.
 *
 * @module src/resources/permissionResource
 */

import { Response } from 'express';
import {
  Permission,
  PermissionListResponse,
  PermissionCheckResponse,
  PermissionCheckResult,
} from '@/types/roleManagement';
import { ValidationError } from '@/types/errors';

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

/**
 * Formats a single permission for API response
 */
export const formatPermission = (permission: Permission): Permission => {
  return {
    id: permission.id,
    name: permission.name,
    description: permission.description,
    created_at: permission.created_at,
    updated_at: permission.updated_at,
  };
};

/**
 * Formats permissions array for API response
 */
export const formatPermissions = (permissions: Permission[]): Permission[] => {
  return permissions.map(formatPermission);
};

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Formats successful permission list response
 */
export const formatPermissionListResponse = (
  res: Response,
  permissions: Permission[],
  message: string = 'Permissions retrieved successfully'
): void => {
  const response: PermissionListResponse = {
    permissions: formatPermissions(permissions),
  };

  res.status(200).json({
    status: 200,
    message,
    data: response,
  });
};

/**
 * Formats successful permission creation response
 */
export const formatPermissionCreatedResponse = (
  res: Response,
  permission: Permission,
  message: string = 'Permission created successfully'
): void => {
  res.status(201).json({
    status: 201,
    message,
    data: {
      permission: formatPermission(permission),
    },
  });
};

/**
 * Formats successful permission update response
 */
export const formatPermissionUpdatedResponse = (
  res: Response,
  permission: Permission,
  message: string = 'Permission updated successfully'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: {
      permission: formatPermission(permission),
    },
  });
};

/**
 * Formats successful permission deletion response
 */
export const formatPermissionDeletedResponse = (
  res: Response,
  permissionId: number,
  message: string = 'Permission deleted successfully'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: {
      permission_id: permissionId,
      deleted: true,
    },
  });
};

/**
 * Formats successful permission check response
 */
export const formatPermissionCheckResponse = (
  res: Response,
  hasPermission: boolean,
  permission: string,
  userId: number,
  message?: string
): void => {
  const response: PermissionCheckResponse = {
    has_permission: hasPermission,
    permission,
    user_id: userId,
  };

  res.status(200).json({
    status: 200,
    message: message || 'Permission check completed',
    data: response,
  });
};

/**
 * Formats bulk permission check response
 */
export const formatBulkPermissionCheckResponse = (
  res: Response,
  result: PermissionCheckResult,
  message: string = 'Bulk permission check completed'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: result,
  });
};

/**
 * Formats permission assignment response
 */
export const formatPermissionAssignmentResponse = (
  res: Response,
  roleId: number,
  permissions: Permission[],
  action: string,
  message: string = 'Permissions assigned successfully'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: {
      role_id: roleId,
      permissions: formatPermissions(permissions),
      action,
      assigned_count: permissions.length,
    },
  });
};

/**
 * Formats permission removal response
 */
export const formatPermissionRemovalResponse = (
  res: Response,
  roleId: number,
  removedPermissions: string[],
  message: string = 'Permissions removed successfully'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: {
      role_id: roleId,
      removed_permissions: removedPermissions,
      removed_count: removedPermissions.length,
    },
  });
};

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Formats permission not found error response
 */
export const formatPermissionNotFoundError = (res: Response, permissionId: number): void => {
  res.status(404).json({
    status: 404,
    message: `Permission with ID ${permissionId} not found`,
    error: 'PERMISSION_NOT_FOUND',
  });
};

/**
 * Formats permission name already exists error response
 */
export const formatPermissionNameExistsError = (res: Response, permissionName: string): void => {
  res.status(409).json({
    status: 409,
    message: `Permission with name '${permissionName}' already exists`,
    error: 'PERMISSION_NAME_EXISTS',
  });
};

/**
 * Formats permission in use error response
 */
export const formatPermissionInUseError = (
  res: Response,
  permissionId: number,
  roleCount: number
): void => {
  res.status(400).json({
    status: 400,
    message: `Cannot delete permission with ID ${permissionId}. It is currently assigned to ${roleCount} role(s).`,
    error: 'PERMISSION_IN_USE',
    data: {
      permission_id: permissionId,
      roles_assigned: roleCount,
    },
  });
};

/**
 * Formats permission check error response
 */
export const formatPermissionCheckError = (
  res: Response,
  permission: string,
  error: string
): void => {
  res.status(400).json({
    status: 400,
    message: `Failed to check permission '${permission}': ${error}`,
    error: 'PERMISSION_CHECK_ERROR',
  });
};

/**
 * Formats validation error response
 */
export const formatValidationError = (res: Response, validationError: ValidationError): void => {
  res.status(400).json({
    status: 400,
    message: 'Validation error',
    error: 'VALIDATION_ERROR',
    details: validationError,
  });
};

/**
 * Formats generic error response
 */
export const formatErrorResponse = (
  res: Response,
  status: number,
  message: string,
  errorCode: string
): void => {
  res.status(status).json({
    status,
    message,
    error: errorCode,
  });
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Transforms database permission to API response format
 */
export const transformPermissionForResponse = (permission: Permission): Permission => {
  return formatPermission(permission);
};

/**
 * Transforms database permissions array to API response format
 */
export const transformPermissionsForResponse = (permissions: Permission[]): Permission[] => {
  return formatPermissions(permissions);
};

/**
 * Formats permission summary for list responses
 */
export const formatPermissionSummary = (permission: Permission): Permission => {
  return formatPermission(permission);
};

/**
 * Formats permission summaries for list responses
 */
export const formatPermissionSummaries = (permissions: Permission[]): Permission[] => {
  return formatPermissions(permissions);
};

/**
 * Creates a standardized success response
 */
export const createSuccessResponse = (
  res: Response,
  status: number,
  message: string,
  data: unknown
): void => {
  res.status(status).json({
    status,
    message,
    data,
  });
};

/**
 * Creates a standardized error response
 */
export const createErrorResponse = (
  res: Response,
  status: number,
  message: string,
  errorCode: string,
  details?: unknown
): void => {
  const response: Record<string, unknown> = {
    status,
    message,
    error: errorCode,
  };

  if (details) {
    response.data = details;
  }

  res.status(status).json(response);
};

/**
 * Formats permission statistics response
 */
export const formatPermissionStatsResponse = (
  res: Response,
  stats: {
    total_permissions: number;
    permissions_by_category: Record<string, number>;
    most_used_permissions: Array<{ name: string; usage_count: number }>;
  },
  message: string = 'Permission statistics retrieved successfully'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: stats,
  });
};

/**
 * Formats permission bulk operation response
 */
export const formatBulkOperationResponse = (
  res: Response,
  operation: string,
  results: {
    successful: number;
    failed: number;
    errors?: Array<{ permission: string; error: string }>;
  },
  message: string = 'Bulk operation completed'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: {
      operation,
      ...results,
    },
  });
};
