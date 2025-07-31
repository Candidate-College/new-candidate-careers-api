/**
 * Role Management Validation
 *
 * Provides comprehensive validation for role-related operations including
 * role creation, updates, and permission assignments. Implements input
 * sanitization, format validation, and business rule validation.
 *
 * @module src/validators/roleValidator
 */

import { Request, Response, NextFunction } from 'express';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignPermissionsRequest,
  RoleValidationResult,
  RoleValidationError,
  ROLE_NAME_REGEX,
  ROLE_NAME_MIN_LENGTH,
  ROLE_NAME_MAX_LENGTH,
  ROLE_DISPLAY_NAME_MIN_LENGTH,
  ROLE_DISPLAY_NAME_MAX_LENGTH,
  ROLE_DESCRIPTION_MAX_LENGTH,
  PERMISSION_NAME_REGEX,
} from '../types/roleManagement';
import { sanitizeInput } from '@utils/inputSanitizer';

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates role name format and constraints
 */
export const validateRoleName = (name: string): RoleValidationError[] => {
  const errors: RoleValidationError[] = [];

  if (!name || typeof name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Role name is required and must be a string',
      code: 'INVALID_NAME_TYPE',
    });
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < ROLE_NAME_MIN_LENGTH) {
    errors.push({
      field: 'name',
      message: `Role name must be at least ${ROLE_NAME_MIN_LENGTH} characters long`,
      code: 'NAME_TOO_SHORT',
    });
  }

  if (trimmedName.length > ROLE_NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: `Role name must not exceed ${ROLE_NAME_MAX_LENGTH} characters`,
      code: 'NAME_TOO_LONG',
    });
  }

  if (!ROLE_NAME_REGEX.test(trimmedName)) {
    errors.push({
      field: 'name',
      message:
        'Role name must be in snake_case format (lowercase letters, numbers, and underscores only)',
      code: 'INVALID_NAME_FORMAT',
    });
  }

  return errors;
};

/**
 * Validates role display name
 */
export const validateDisplayName = (displayName: string): RoleValidationError[] => {
  const errors: RoleValidationError[] = [];

  if (!displayName || typeof displayName !== 'string') {
    errors.push({
      field: 'display_name',
      message: 'Display name is required and must be a string',
      code: 'INVALID_DISPLAY_NAME_TYPE',
    });
    return errors;
  }

  const trimmedDisplayName = displayName.trim();

  if (trimmedDisplayName.length < ROLE_DISPLAY_NAME_MIN_LENGTH) {
    errors.push({
      field: 'display_name',
      message: `Display name must be at least ${ROLE_DISPLAY_NAME_MIN_LENGTH} characters long`,
      code: 'DISPLAY_NAME_TOO_SHORT',
    });
  }

  if (trimmedDisplayName.length > ROLE_DISPLAY_NAME_MAX_LENGTH) {
    errors.push({
      field: 'display_name',
      message: `Display name must not exceed ${ROLE_DISPLAY_NAME_MAX_LENGTH} characters`,
      code: 'DISPLAY_NAME_TOO_LONG',
    });
  }

  return errors;
};

/**
 * Validates role description
 */
export const validateDescription = (description?: string): RoleValidationError[] => {
  const errors: RoleValidationError[] = [];

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        code: 'INVALID_DESCRIPTION_TYPE',
      });
    } else if (description.length > ROLE_DESCRIPTION_MAX_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must not exceed ${ROLE_DESCRIPTION_MAX_LENGTH} characters`,
        code: 'DESCRIPTION_TOO_LONG',
      });
    }
  }

  return errors;
};

/**
 * Validates permission array
 */
export const validatePermissions = (permissions?: string[]): RoleValidationError[] => {
  const errors: RoleValidationError[] = [];

  if (permissions !== undefined && permissions !== null) {
    if (!Array.isArray(permissions)) {
      errors.push({
        field: 'permissions',
        message: 'Permissions must be an array',
        code: 'INVALID_PERMISSIONS_TYPE',
      });
      return errors;
    }

    if (permissions.length === 0) {
      errors.push({
        field: 'permissions',
        message: 'Permissions array cannot be empty',
        code: 'EMPTY_PERMISSIONS',
      });
      return errors;
    }

    const uniquePermissions = new Set<string>();

    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];

      if (typeof permission !== 'string') {
        errors.push({
          field: `permissions[${i}]`,
          message: 'Each permission must be a string',
          code: 'INVALID_PERMISSION_TYPE',
        });
        continue;
      }

      const trimmedPermission = permission.trim();

      if (trimmedPermission.length === 0) {
        errors.push({
          field: `permissions[${i}]`,
          message: 'Permission cannot be empty',
          code: 'EMPTY_PERMISSION',
        });
        continue;
      }

      if (!PERMISSION_NAME_REGEX.test(trimmedPermission)) {
        errors.push({
          field: `permissions[${i}]`,
          message: 'Permission must be in valid format (e.g., users.create, roles.view)',
          code: 'INVALID_PERMISSION_FORMAT',
        });
        continue;
      }

      if (uniquePermissions.has(trimmedPermission)) {
        errors.push({
          field: `permissions[${i}]`,
          message: 'Duplicate permission found',
          code: 'DUPLICATE_PERMISSION',
        });
        continue;
      }

      uniquePermissions.add(trimmedPermission);
    }
  }

  return errors;
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validates role creation request
 */
export const validateCreateRole = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, display_name, description, permissions } = req.body as CreateRoleRequest;
    const errors: RoleValidationError[] = [];

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      display_name: sanitizeInput(display_name),
      description: description ? sanitizeInput(description) : undefined,
      permissions: permissions || [],
    };

    // Validate required fields
    errors.push(...validateRoleName(sanitizedData.name));
    errors.push(...validateDisplayName(sanitizedData.display_name));
    errors.push(...validateDescription(sanitizedData.description));
    errors.push(...validatePermissions(sanitizedData.permissions));

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Role validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.map(error => ({
          field: error.field,
          message: error.message,
          code: error.code,
        })),
      });
      return;
    }

    // Attach sanitized data to request
    req.body = sanitizedData;
    next();
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Internal server error during validation',
      error: 'VALIDATION_ERROR',
    });
  }
};

/**
 * Validates role update request
 */
export const validateUpdateRole = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { display_name, description, permissions } = req.body as UpdateRoleRequest;
    const errors: RoleValidationError[] = [];

    // Sanitize inputs
    const sanitizedData = {
      display_name: display_name ? sanitizeInput(display_name) : undefined,
      description: description ? sanitizeInput(description) : undefined,
      permissions: permissions || [],
    };

    // Validate provided fields
    if (sanitizedData.display_name !== undefined) {
      errors.push(...validateDisplayName(sanitizedData.display_name));
    }

    if (sanitizedData.description !== undefined) {
      errors.push(...validateDescription(sanitizedData.description));
    }

    if (sanitizedData.permissions.length > 0) {
      errors.push(...validatePermissions(sanitizedData.permissions));
    }

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Role update validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.map(error => ({
          field: error.field,
          message: error.message,
          code: error.code,
        })),
      });
      return;
    }

    // Attach sanitized data to request
    req.body = sanitizedData;
    next();
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Internal server error during validation',
      error: 'VALIDATION_ERROR',
    });
  }
};

/**
 * Validates permission assignment request
 */
export const validateAssignPermissions = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { permissions, action } = req.body as AssignPermissionsRequest;
    const errors: RoleValidationError[] = [];

    // Sanitize inputs
    const sanitizedData = {
      permissions: permissions || [],
      action: action ? sanitizeInput(action) : 'add',
    };

    // Validate permissions array
    errors.push(...validatePermissions(sanitizedData.permissions));

    // Validate action
    if (!['add', 'remove', 'replace'].includes(sanitizedData.action)) {
      errors.push({
        field: 'action',
        message: 'Action must be one of: add, remove, replace',
        code: 'INVALID_ACTION',
      });
    }

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Permission assignment validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.map(error => ({
          field: error.field,
          message: error.message,
          code: error.code,
        })),
      });
      return;
    }

    // Attach sanitized data to request
    req.body = sanitizedData;
    next();
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Internal server error during validation',
      error: 'VALIDATION_ERROR',
    });
  }
};

/**
 * Validates role ID parameter
 */
export const validateRoleId = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        status: 400,
        message: 'Role ID is required',
        error: 'MISSING_ROLE_ID',
      });
      return;
    }

    const roleId = parseInt(id, 10);

    if (isNaN(roleId) || roleId <= 0) {
      res.status(400).json({
        status: 400,
        message: 'Role ID must be a positive integer',
        error: 'INVALID_ROLE_ID',
      });
      return;
    }

    // Attach validated ID to request
    req.params.id = roleId.toString();
    next();
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: 'Internal server error during validation',
      error: 'VALIDATION_ERROR',
    });
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates complete role data and returns validation result
 */
export const validateRoleData = (
  data: CreateRoleRequest | UpdateRoleRequest
): RoleValidationResult => {
  const errors: RoleValidationError[] = [];

  if ('name' in data) {
    errors.push(...validateRoleName(data.name));
  }

  if ('display_name' in data && data.display_name) {
    errors.push(...validateDisplayName(data.display_name));
  }

  if ('description' in data) {
    errors.push(...validateDescription(data.description));
  }

  if ('permissions' in data) {
    errors.push(...validatePermissions(data.permissions));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
