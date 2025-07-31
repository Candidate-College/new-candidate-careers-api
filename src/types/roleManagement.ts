/**
 * Role & Permission Management Types
 *
 * Defines all interfaces, types, and enums for the role and permission
 * management system. Includes request/response types, validation types,
 * and pagination types for API endpoints.
 *
 * @module src/types/roleManagement
 */

import { DatabaseRecord, PaginationMeta } from './index';

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Role extends DatabaseRecord {
  name: string;
  display_name: string;
  description: string | null;
}

export interface Permission extends DatabaseRecord {
  name: string;
  description: string | null;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
  users_count: number;
}

export interface PermissionWithRoles extends Permission {
  roles: Role[];
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface CreateRoleRequest {
  name: string;
  display_name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest {
  display_name?: string;
  description?: string;
  permissions?: string[];
}

export interface AssignPermissionsRequest {
  permissions: string[];
  action: 'add' | 'remove' | 'replace';
}

export interface CheckPermissionRequest {
  permission: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface RoleListResponse {
  roles: RoleWithPermissions[];
  pagination: PaginationMeta;
}

export interface SingleRoleResponse {
  role: RoleWithPermissions;
}

export interface PermissionListResponse {
  permissions: Permission[];
}

export interface PermissionCheckResponse {
  has_permission: boolean;
  permission: string;
  user_id: number;
}

export interface PermissionCheckResult {
  has_permission: boolean;
  checked_permissions: string[];
  granted_permissions: string[];
  user_id: number;
}

export interface RolePermissionResponse {
  role_id: number;
  permissions: Permission[];
  action: string;
  message: string;
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

export interface RoleQueryParams {
  page?: number;
  limit?: number;
  status?: 'active' | 'inactive';
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PermissionQueryParams {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface RoleValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface PermissionValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface RoleValidationResult {
  isValid: boolean;
  errors: RoleValidationError[];
}

export interface PermissionValidationResult {
  isValid: boolean;
  errors: PermissionValidationError[];
}

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum RoleAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  ASSIGN_PERMISSIONS = 'assign_permissions',
}

export enum PermissionAction {
  ADD = 'add',
  REMOVE = 'remove',
  REPLACE = 'replace',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export const ROLE_NAME_REGEX = /^[a-z_][a-z0-9_]*$/;
export const PERMISSION_NAME_REGEX = /^[a-z][a-z0-9]*\.[a-z][a-z0-9]*$/;

export const ROLE_NAME_MIN_LENGTH = 3;
export const ROLE_NAME_MAX_LENGTH = 50;
export const ROLE_DISPLAY_NAME_MIN_LENGTH = 3;
export const ROLE_DISPLAY_NAME_MAX_LENGTH = 100;
export const ROLE_DESCRIPTION_MAX_LENGTH = 500;

export const PERMISSION_NAME_MIN_LENGTH = 3;
export const PERMISSION_NAME_MAX_LENGTH = 100;
export const PERMISSION_DESCRIPTION_MAX_LENGTH = 500;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type RoleStatus = 'active' | 'inactive';

export type PermissionOperation = 'add' | 'remove' | 'replace';

export interface RolePermissionMap {
  [roleId: number]: string[];
}

export interface PermissionRoleMap {
  [permissionName: string]: number[];
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export interface RoleAuditLog {
  action: RoleAction;
  role_id: number;
  role_name: string;
  user_id: number;
  changes?: Record<string, any>;
  timestamp: Date;
}

export interface PermissionAuditLog {
  action: string;
  role_id: number;
  permission_id: number;
  user_id: number;
  changes?: Record<string, any>;
  timestamp: Date;
}
