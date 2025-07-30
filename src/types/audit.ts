/**
 * Audit Logging Types
 *
 * Type definitions for comprehensive audit logging of user activities,
 * including registration, profile modifications, and email verification events.
 *
 * @module src/types/audit
 */

import { DatabaseRecord } from './index';

/**
 * Audit log entry interface
 */
export interface AuditLog extends DatabaseRecord {
  user_id: number | null;
  action: string;
  subject_type: string;
  subject_id: number | null;
  description: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Create audit log request
 */
export interface CreateAuditLogRequest {
  user_id?: number | null;
  action: string;
  subject_type: string;
  subject_id?: number | null;
  description?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

/**
 * Audit log filter options
 */
export interface AuditLogFilterOptions {
  user_id?: number;
  action?: string;
  subject_type?: string;
  subject_id?: number;
  success?: boolean;
  start_date?: Date;
  end_date?: Date;
  ip_address?: string;
}

/**
 * Audit log query parameters
 */
export interface AuditLogQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: AuditLogFilterOptions;
}

/**
 * Audit log statistics
 */
export interface AuditLogStatistics {
  total_logs: number;
  successful_actions: number;
  failed_actions: number;
  unique_users: number;
  actions_by_type: Record<string, number>;
  recent_activity: AuditLog[];
}

/**
 * User registration audit event
 */
export interface UserRegistrationAuditEvent {
  action: 'user_registered';
  user_id: number;
  email: string;
  name: string;
  role_id: number;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}

/**
 * Email verification audit event
 */
export interface EmailVerificationAuditEvent {
  action: 'email_verified' | 'email_verification_failed';
  user_id: number;
  email: string;
  token_id: number;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}

/**
 * Profile update audit event
 */
export interface ProfileUpdateAuditEvent {
  action: 'profile_updated';
  user_id: number;
  updated_fields: string[];
  previous_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}

/**
 * Password change audit event
 */
export interface PasswordChangeAuditEvent {
  action: 'password_changed';
  user_id: number;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}

/**
 * Login audit event
 */
export interface LoginAuditEvent {
  action: 'user_login' | 'login_failed';
  user_id?: number;
  email: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}

/**
 * Logout audit event
 */
export interface LogoutAuditEvent {
  action: 'user_logout';
  user_id: number;
  session_id: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
}

/**
 * Audit log export options
 */
export interface AuditLogExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  filters?: AuditLogFilterOptions;
  start_date?: Date;
  end_date?: Date;
  include_details?: boolean;
}

/**
 * Audit log export result
 */
export interface AuditLogExportResult {
  filename: string;
  content: string | Buffer;
  format: string;
  record_count: number;
  generated_at: Date;
}
