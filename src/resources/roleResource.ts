/**
 * Role Management Resources
 *
 * Provides response formatting for role-related API endpoints including
 * role lists, single roles, creation/update responses, and error formatting.
 * Implements consistent API response structure and data transformation.
 *
 * @module src/resources/roleResource
 */

import { Response } from 'express';
import {
  Role,
  RoleWithPermissions,
  Permission,
  RoleListResponse,
  SingleRoleResponse,
  RolePermissionResponse,
} from '@/types/roleManagement';
import { PaginationMeta } from '@/types/index';
import { ValidationError } from '@/types/errors';

// ============================================================================
// RESPONSE FORMATTING
// ============================================================================

/**
 * Formats a single role with permissions for API response
 */
export const formatRole = (role: RoleWithPermissions): RoleWithPermissions => {
  return {
    id: role.id,
    name: role.name,
    display_name: role.display_name,
    description: role.description,
    permissions: role.permissions.map(formatPermission),
    users_count: role.users_count || 0,
    created_at: role.created_at,
    updated_at: role.updated_at,
  };
};

/**
 * Formats a permission for API response
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
 * Formats pagination metadata
 */
export const formatPagination = (pagination: PaginationMeta): PaginationMeta => {
  return {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages: pagination.totalPages,
    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,
  };
};

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Formats successful role list response
 */
export const formatRoleListResponse = (
  res: Response,
  roles: RoleWithPermissions[],
  pagination: PaginationMeta,
  message: string = 'Roles retrieved successfully'
): void => {
  const response: RoleListResponse = {
    roles: roles.map(formatRole),
    pagination: formatPagination(pagination),
  };

  res.status(200).json({
    status: 200,
    message,
    data: response,
  });
};

/**
 * Formats successful single role response
 */
export const formatSingleRoleResponse = (
  res: Response,
  role: RoleWithPermissions,
  message: string = 'Role retrieved successfully'
): void => {
  const response: SingleRoleResponse = {
    role: formatRole(role),
  };

  res.status(200).json({
    status: 200,
    message,
    data: response,
  });
};

/**
 * Formats successful role creation response
 */
export const formatRoleCreatedResponse = (
  res: Response,
  role: RoleWithPermissions,
  message: string = 'Role created successfully'
): void => {
  const response: SingleRoleResponse = {
    role: formatRole(role),
  };

  res.status(201).json({
    status: 201,
    message,
    data: response,
  });
};

/**
 * Formats successful role update response
 */
export const formatRoleUpdatedResponse = (
  res: Response,
  role: RoleWithPermissions,
  message: string = 'Role updated successfully'
): void => {
  const response: SingleRoleResponse = {
    role: formatRole(role),
  };

  res.status(200).json({
    status: 200,
    message,
    data: response,
  });
};

/**
 * Formats successful role deletion response
 */
export const formatRoleDeletedResponse = (
  res: Response,
  roleId: number,
  message: string = 'Role deleted successfully'
): void => {
  res.status(200).json({
    status: 200,
    message,
    data: {
      role_id: roleId,
      deleted: true,
    },
  });
};

/**
 * Formats successful permission assignment response
 */
export const formatPermissionAssignmentResponse = (
  res: Response,
  roleId: number,
  permissions: Permission[],
  action: string,
  message: string = 'Permissions assigned successfully'
): void => {
  const response: RolePermissionResponse = {
    role_id: roleId,
    permissions: permissions.map(formatPermission),
    action,
    message,
  };

  res.status(200).json({
    status: 200,
    message,
    data: response,
  });
};

// ============================================================================
// ERROR RESPONSES
// ============================================================================

/**
 * Formats role not found error response
 */
export const formatRoleNotFoundError = (res: Response, roleId: number): void => {
  res.status(404).json({
    status: 404,
    message: `Role with ID ${roleId} not found`,
    error: 'ROLE_NOT_FOUND',
  });
};

/**
 * Formats role name already exists error response
 */
export const formatRoleNameExistsError = (res: Response, roleName: string): void => {
  res.status(409).json({
    status: 409,
    message: `Role with name '${roleName}' already exists`,
    error: 'ROLE_NAME_EXISTS',
  });
};

/**
 * Formats role deletion error response (when users are assigned)
 */
export const formatRoleDeletionError = (res: Response, roleId: number, userCount: number): void => {
  res.status(400).json({
    status: 400,
    message: `Cannot delete role with ID ${roleId}. ${userCount} user(s) are currently assigned to this role.`,
    error: 'ROLE_IN_USE',
    data: {
      role_id: roleId,
      users_assigned: userCount,
    },
  });
};

/**
 * Formats permission not found error response
 */
export const formatPermissionNotFoundError = (res: Response, permissionName: string): void => {
  res.status(404).json({
    status: 404,
    message: `Permission '${permissionName}' not found`,
    error: 'PERMISSION_NOT_FOUND',
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
 * Transforms database role to API response format
 */
export const transformRoleForResponse = (role: RoleWithPermissions): RoleWithPermissions => {
  return formatRole(role);
};

/**
 * Transforms database roles array to API response format
 */
export const transformRolesForResponse = (roles: RoleWithPermissions[]): RoleWithPermissions[] => {
  return roles.map(formatRole);
};

/**
 * Formats role summary for list responses (without full permission details)
 */
export const formatRoleSummary = (role: Role & { users_count?: number }): Role => {
  return {
    id: role.id,
    name: role.name,
    display_name: role.display_name,
    description: role.description,
    created_at: role.created_at,
    updated_at: role.updated_at,
  };
};

/**
 * Formats role summaries for list responses
 */
export const formatRoleSummaries = (roles: (Role & { users_count?: number })[]): Role[] => {
  return roles.map(formatRoleSummary);
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
