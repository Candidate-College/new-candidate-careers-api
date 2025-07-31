/**
 * Permission Management Validation
 *
 * Provides comprehensive validation for permission-related operations including
 * permission format validation, assignment operations, and bulk operations.
 * Implements input sanitization and security checks.
 *
 * @module src/validators/permissionValidator
 */

import { Request, Response, NextFunction } from 'express';
import {
  PermissionValidationResult,
  PermissionValidationError,
  PERMISSION_NAME_REGEX,
  PERMISSION_NAME_MIN_LENGTH,
  PERMISSION_NAME_MAX_LENGTH,
  PERMISSION_DESCRIPTION_MAX_LENGTH,
} from '@/types/roleManagement';
import { sanitizeInput } from '@utils/inputSanitizer';

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates permission name format and constraints
 */
export const validatePermissionName = (name: string): PermissionValidationError[] => {
  const errors: PermissionValidationError[] = [];

  if (!name || typeof name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Permission name is required and must be a string',
      code: 'INVALID_NAME_TYPE',
    });
    return errors;
  }

  const trimmedName = name.trim();

  if (trimmedName.length < PERMISSION_NAME_MIN_LENGTH) {
    errors.push({
      field: 'name',
      message: `Permission name must be at least ${PERMISSION_NAME_MIN_LENGTH} characters long`,
      code: 'NAME_TOO_SHORT',
    });
  }

  if (trimmedName.length > PERMISSION_NAME_MAX_LENGTH) {
    errors.push({
      field: 'name',
      message: `Permission name must not exceed ${PERMISSION_NAME_MAX_LENGTH} characters`,
      code: 'NAME_TOO_LONG',
    });
  }

  if (!PERMISSION_NAME_REGEX.test(trimmedName)) {
    errors.push({
      field: 'name',
      message: 'Permission name must be in valid format (e.g., users.create, roles.view)',
      code: 'INVALID_NAME_FORMAT',
    });
  }

  return errors;
};

/**
 * Validates permission description
 */
export const validatePermissionDescription = (
  description?: string
): PermissionValidationError[] => {
  const errors: PermissionValidationError[] = [];

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({
        field: 'description',
        message: 'Description must be a string',
        code: 'INVALID_DESCRIPTION_TYPE',
      });
    } else if (description.length > PERMISSION_DESCRIPTION_MAX_LENGTH) {
      errors.push({
        field: 'description',
        message: `Description must not exceed ${PERMISSION_DESCRIPTION_MAX_LENGTH} characters`,
        code: 'DESCRIPTION_TOO_LONG',
      });
    }
  }

  return errors;
};

/**
 * Validates single permission string
 */
export const validateSinglePermission = (
  permission: string,
  index?: number
): PermissionValidationError[] => {
  const errors: PermissionValidationError[] = [];
  const fieldName = index !== undefined ? `permissions[${index}]` : 'permission';

  if (typeof permission !== 'string') {
    errors.push({
      field: fieldName,
      message: 'Permission must be a string',
      code: 'INVALID_PERMISSION_TYPE',
    });
    return errors;
  }

  const trimmedPermission = permission.trim();

  if (trimmedPermission.length === 0) {
    errors.push({
      field: fieldName,
      message: 'Permission cannot be empty',
      code: 'EMPTY_PERMISSION',
    });
    return errors;
  }

  if (trimmedPermission.length < PERMISSION_NAME_MIN_LENGTH) {
    errors.push({
      field: fieldName,
      message: `Permission must be at least ${PERMISSION_NAME_MIN_LENGTH} characters long`,
      code: 'PERMISSION_TOO_SHORT',
    });
  }

  if (trimmedPermission.length > PERMISSION_NAME_MAX_LENGTH) {
    errors.push({
      field: fieldName,
      message: `Permission must not exceed ${PERMISSION_NAME_MAX_LENGTH} characters`,
      code: 'PERMISSION_TOO_LONG',
    });
  }

  if (!PERMISSION_NAME_REGEX.test(trimmedPermission)) {
    errors.push({
      field: fieldName,
      message: 'Permission must be in valid format (e.g., users.create, roles.view)',
      code: 'INVALID_PERMISSION_FORMAT',
    });
  }

  return errors;
};

/**
 * Validates permission array for bulk operations
 */
export const validatePermissionArray = (permissions: string[]): PermissionValidationError[] => {
  const errors: PermissionValidationError[] = [];

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
    if (permission === undefined) {
      errors.push({
        field: `permissions[${i}]`,
        message: 'Permission cannot be undefined',
        code: 'UNDEFINED_PERMISSION',
      });
      continue;
    }

    const permissionErrors = validateSinglePermission(permission, i);
    errors.push(...permissionErrors);

    if (permissionErrors.length === 0) {
      const trimmedPermission = permission.trim();

      if (uniquePermissions.has(trimmedPermission)) {
        errors.push({
          field: `permissions[${i}]`,
          message: 'Duplicate permission found',
          code: 'DUPLICATE_PERMISSION',
        });
      } else {
        uniquePermissions.add(trimmedPermission);
      }
    }
  }

  return errors;
};

/**
 * Validates permission checking request
 */
export const validatePermissionCheck = (permission: string): PermissionValidationError[] => {
  return validateSinglePermission(permission);
};

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Validates permission checking request
 */
export const validateCheckPermission = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { permission } = req.query;
    const errors: PermissionValidationError[] = [];

    if (!permission || typeof permission !== 'string') {
      res.status(400).json({
        status: 400,
        message: 'Permission parameter is required',
        error: 'MISSING_PERMISSION_PARAM',
      });
      return;
    }

    const sanitizedPermission = sanitizeInput(permission);
    errors.push(...validatePermissionCheck(sanitizedPermission));

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Permission validation failed',
        error: 'VALIDATION_ERROR',
        details: errors.map(error => ({
          field: error.field,
          message: error.message,
          code: error.code,
        })),
      });
      return;
    }

    // Attach sanitized permission to request
    req.query.permission = sanitizedPermission;
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
 * Validates bulk permission operations
 */
export const validateBulkPermissions = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { permissions } = req.body;
    const errors: PermissionValidationError[] = [];

    // Sanitize inputs
    const sanitizedData = {
      permissions: permissions || [],
    };

    // Validate permissions array
    errors.push(...validatePermissionArray(sanitizedData.permissions));

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Bulk permission validation failed',
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
 * Validates permission creation request
 */
export const validateCreatePermission = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, description } = req.body;
    const errors: PermissionValidationError[] = [];

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      description: description ? sanitizeInput(description) : undefined,
    };

    // Validate required fields
    errors.push(...validatePermissionName(sanitizedData.name));
    errors.push(...validatePermissionDescription(sanitizedData.description));

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Permission creation validation failed',
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
 * Validates permission update request
 */
export const validateUpdatePermission = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { name, description } = req.body;
    const errors: PermissionValidationError[] = [];

    // Sanitize inputs
    const sanitizedData = {
      name: name ? sanitizeInput(name) : undefined,
      description: description ? sanitizeInput(description) : undefined,
    };

    // Validate provided fields
    if (sanitizedData.name !== undefined) {
      errors.push(...validatePermissionName(sanitizedData.name));
    }

    if (sanitizedData.description !== undefined) {
      errors.push(...validatePermissionDescription(sanitizedData.description));
    }

    if (errors.length > 0) {
      res.status(400).json({
        status: 400,
        message: 'Permission update validation failed',
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
 * Validates permission ID parameter
 */
export const validatePermissionId = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        status: 400,
        message: 'Permission ID is required',
        error: 'MISSING_PERMISSION_ID',
      });
      return;
    }

    const permissionId = parseInt(id, 10);

    if (isNaN(permissionId) || permissionId <= 0) {
      res.status(400).json({
        status: 400,
        message: 'Permission ID must be a positive integer',
        error: 'INVALID_PERMISSION_ID',
      });
      return;
    }

    // Attach validated ID to request
    req.params.id = permissionId.toString();
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
 * Validates complete permission data and returns validation result
 */
export const validatePermissionData = (data: {
  name?: string;
  description?: string;
}): PermissionValidationResult => {
  const errors: PermissionValidationError[] = [];

  if (data.name !== undefined) {
    errors.push(...validatePermissionName(data.name));
  }

  if (data.description !== undefined) {
    errors.push(...validatePermissionDescription(data.description));
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitizes and validates permission strings for security
 */
export const sanitizeAndValidatePermissions = (
  permissions: string[]
): { valid: string[]; errors: PermissionValidationError[] } => {
  const valid: string[] = [];
  const errors: PermissionValidationError[] = [];

  for (let i = 0; i < permissions.length; i++) {
    const permission = permissions[i];
    const sanitized = sanitizeInput(permission);
    const permissionErrors = validateSinglePermission(sanitized, i);

    if (permissionErrors.length === 0) {
      valid.push(sanitized);
    } else {
      errors.push(...permissionErrors);
    }
  }

  return { valid, errors };
};
