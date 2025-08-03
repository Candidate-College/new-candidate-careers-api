/**
 * Audit Logging Validator
 *
 * Comprehensive validation for audit logging functionality.
 * Provides validation for audit events, log entries, and export operations.
 *
 * @module src/validators/auditValidator
 */

import {
  CreateAuditLogRequest,
  AuditLogFilterOptions,
  AuditLogQueryParams,
  AuditLogExportOptions,
} from '@/types/audit';

export interface AuditValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuditValidator {
  private static readonly VALID_ACTIONS = [
    'user_registered',
    'email_verified',
    'email_verification_failed',
    'profile_updated',
    'password_changed',
    'user_login',
    'login_failed',
    'user_logout',
    'session_created',
    'session_destroyed',
    'role_assigned',
    'permission_granted',
    'permission_revoked',
    // Add role management actions
    'create',
    'read',
    'update',
    'delete',
    'assign_permissions',
  ];

  private static readonly VALID_SUBJECT_TYPES = [
    'user',
    'email_verification_token',
    'session',
    'role',
    'permission',
    'profile',
    'password',
  ];

  private static readonly VALID_EXPORT_FORMATS = ['csv', 'json', 'xlsx'];

  /**
   * Validate create audit log request
   */
  static validateCreateAuditLogRequest(data: Record<string, unknown>): AuditValidationResult {
    const errors: string[] = [];

    // Validate required fields
    const requiredFieldValidation = this.validateRequiredFields(data);
    errors.push(...requiredFieldValidation.errors);

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate action and resource type
    const actionValidation = this.validateActionAndResourceType(data);
    errors.push(...actionValidation.errors);

    // Validate numeric fields
    const numericValidation = this.validateNumericFields(data);
    errors.push(...numericValidation.errors);

    // Validate IP address
    const ipValidation = this.validateIpAddress(data);
    errors.push(...ipValidation.errors);

    // Validate other fields
    const otherValidation = this.validateOtherFields(data);
    errors.push(...otherValidation.errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate required fields
   */
  private static validateRequiredFields(data: Record<string, unknown>): { errors: string[] } {
    const errors: string[] = [];

    if (!data.action) {
      errors.push('Action is required');
    }

    if (!data.subject_type) {
      errors.push('Subject type is required');
    }

    return { errors };
  }

  /**
   * Validate action and resource type
   */
  private static validateActionAndResourceType(data: Record<string, unknown>): {
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.action && !this.VALID_ACTIONS.includes(data.action as string)) {
      errors.push(`Invalid action. Must be one of: ${this.VALID_ACTIONS.join(', ')}`);
    }

    if (data.subject_type && !this.VALID_SUBJECT_TYPES.includes(data.subject_type as string)) {
      errors.push(`Invalid subject type. Must be one of: ${this.VALID_SUBJECT_TYPES.join(', ')}`);
    }

    return { errors };
  }

  /**
   * Validate numeric fields
   */
  private static validateNumericFields(data: Record<string, unknown>): { errors: string[] } {
    const errors: string[] = [];

    if (data.user_id !== undefined) {
      if (!Number.isInteger(data.user_id) || (data.user_id as number) < 0) {
        errors.push('User ID must be a non-negative integer');
      }
    }

    if (data.subject_id !== undefined) {
      if (!Number.isInteger(data.subject_id) || (data.subject_id as number) < 0) {
        errors.push('Subject ID must be a non-negative integer');
      }
    }

    return { errors };
  }

  /**
   * Validate IP address
   */
  private static validateIpAddress(data: Record<string, unknown>): { errors: string[] } {
    const errors: string[] = [];

    if (data.ip_address) {
      const ipAddress = data.ip_address as string;
      if (!this.isValidIpAddress(ipAddress)) {
        errors.push('Invalid IP address format');
      }
    }

    return { errors };
  }

  /**
   * Validate other fields
   */
  private static validateOtherFields(data: Record<string, unknown>): { errors: string[] } {
    const errors: string[] = [];

    // Validate user agent length
    if (data.user_agent && typeof data.user_agent === 'string' && data.user_agent.length > 500) {
      errors.push('User agent must be less than 500 characters');
    }

    // Validate session_id format
    if (data.session_id) {
      const sessionId = data.session_id as string;
      const sessionIdRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!sessionIdRegex.test(sessionId)) {
        errors.push('Invalid session ID format');
      }
    }

    // Validate success field
    if (data.success !== undefined && typeof data.success !== 'boolean') {
      errors.push('Success field must be a boolean');
    }

    // Validate error message length
    if (
      data.error_message &&
      typeof data.error_message === 'string' &&
      data.error_message.length > 1000
    ) {
      errors.push('Error message must be less than 1000 characters');
    }

    return { errors };
  }

  /**
   * Check if IP address is valid
   */
  private static isValidIpAddress(ip: string): boolean {
    // Accept common localhost representations for development and testing
    // IPv6 localhost shorthand (::1) and IPv4 localhost (127.0.0.1) are commonly used
    // in development environments and should be considered valid
    if (ip === '::1' || ip === '127.0.0.1') return true;

    // Simplified IP validation for IPv4 and IPv6
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    if (ipv4Regex.test(ip)) {
      const parts = ip.split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    return ipv6Regex.test(ip);
  }

  private static validateUserId(user_id: unknown): string[] {
    if (user_id !== undefined && (!Number.isInteger(user_id) || (user_id as number) < 0)) {
      return ['User ID must be a non-negative integer'];
    }
    return [];
  }

  private static validateAction(action: unknown): string[] {
    if (action && !this.VALID_ACTIONS.includes(action as string)) {
      return [`Invalid action. Must be one of: ${this.VALID_ACTIONS.join(', ')}`];
    }
    return [];
  }

  private static validateSubjectType(subject_type: unknown): string[] {
    if (subject_type && !this.VALID_SUBJECT_TYPES.includes(subject_type as string)) {
      return [`Invalid subject type. Must be one of: ${this.VALID_SUBJECT_TYPES.join(', ')}`];
    }
    return [];
  }

  private static validateSubjectId(subject_id: unknown): string[] {
    if (subject_id !== undefined && (!Number.isInteger(subject_id) || (subject_id as number) < 0)) {
      return ['Subject ID must be a non-negative integer'];
    }
    return [];
  }

  private static validateSuccess(success: unknown): string[] {
    if (success !== undefined && typeof success !== 'boolean') {
      return ['Success field must be a boolean'];
    }
    return [];
  }

  private static validateDate(date: unknown, label: string): string[] {
    if (date && !(date instanceof Date) && isNaN(Date.parse(date as string))) {
      return [`${label} must be a valid date`];
    }
    return [];
  }

  private static validateDateRange(start_date: unknown, end_date: unknown): string[] {
    if (start_date && end_date) {
      const startDate = new Date(start_date as string);
      const endDate = new Date(end_date as string);
      if (startDate > endDate) {
        return ['Start date must be before end date'];
      }
    }
    return [];
  }

  private static validateIp(ip_address: unknown): string[] {
    if (ip_address) {
      const ip = ip_address as string;
      if (!this.isValidIpAddress(ip)) {
        return ['Invalid IP address format'];
      }
    }
    return [];
  }

  /**
   * Validate audit log filter options
   */
  static validateFilterOptions(data: Record<string, unknown>): AuditValidationResult {
    const errors: string[] = [
      ...this.validateUserId(data.user_id),
      ...this.validateAction(data.action),
      ...this.validateSubjectType(data.subject_type),
      ...this.validateSubjectId(data.subject_id),
      ...this.validateSuccess(data.success),
      ...this.validateDate(data.start_date, 'Start date'),
      ...this.validateDate(data.end_date, 'End date'),
      ...this.validateDateRange(data.start_date, data.end_date),
      ...this.validateIp(data.ip_address),
    ];
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate audit log query parameters
   */
  static validateQueryParams(data: Record<string, unknown>): AuditValidationResult {
    const errors: string[] = [];

    // Validate pagination parameters
    if (data.page !== undefined) {
      if (!Number.isInteger(data.page) || (data.page as number) < 1) {
        errors.push('Page must be a positive integer');
      }
    }

    if (data.limit !== undefined) {
      if (
        !Number.isInteger(data.limit) ||
        (data.limit as number) < 1 ||
        (data.limit as number) > 1000
      ) {
        errors.push('Limit must be between 1 and 1000');
      }
    }

    // Validate sort field
    if (data.sort) {
      const validSortFields = [
        'created_at',
        'action',
        'subject_type',
        'user_id',
        'success',
        'ip_address',
      ];
      if (!validSortFields.includes(data.sort as string)) {
        errors.push(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`);
      }
    }

    // Validate order
    if (data.order && !['asc', 'desc'].includes(data.order as string)) {
      errors.push('Order must be either "asc" or "desc"');
    }

    // Validate filters if provided
    if (data.filters) {
      const filterValidation = this.validateFilterOptions(data.filters as Record<string, unknown>);
      if (!filterValidation.isValid) {
        errors.push(...filterValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateExportFormat(format: unknown): string[] {
    if (!format) {
      return ['Export format is required'];
    }
    if (!this.VALID_EXPORT_FORMATS.includes(format as string)) {
      return [`Invalid export format. Must be one of: ${this.VALID_EXPORT_FORMATS.join(', ')}`];
    }
    return [];
  }

  private static validateIncludeDetails(include_details: unknown): string[] {
    if (include_details !== undefined && typeof include_details !== 'boolean') {
      return ['Include details must be a boolean'];
    }
    return [];
  }

  private static validateExportFilters(filters: unknown): string[] {
    if (filters) {
      const filterValidation = this.validateFilterOptions(filters as Record<string, unknown>);
      if (!filterValidation.isValid) {
        return filterValidation.errors;
      }
    }
    return [];
  }

  /**
   * Validate audit log export options
   */
  static validateExportOptions(data: Record<string, unknown>): AuditValidationResult {
    const errors: string[] = [
      ...this.validateExportFormat(data.format),
      ...this.validateIncludeDetails(data.include_details),
      ...this.validateExportFilters(data.filters),
      ...this.validateDate(data.start_date, 'Start date'),
      ...this.validateDate(data.end_date, 'End date'),
      ...this.validateDateRange(data.start_date, data.end_date),
    ];
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize create audit log request data
   */
  static sanitizeCreateAuditLogData(data: Record<string, unknown>): CreateAuditLogRequest {
    const result: CreateAuditLogRequest = {
      action: (data.action as string)?.trim() || (data.action as string),
      subject_type: (data.subject_type as string)?.trim() || (data.subject_type as string),
      description: (data.description as string)?.trim() || '',
    };

    if (data.user_id !== undefined) {
      result.user_id = parseInt(data.user_id as string, 10);
    }

    if (data.subject_id !== undefined) {
      result.subject_id = parseInt(data.subject_id as string, 10);
    }

    if (data.old_values !== undefined) {
      result.old_values = data.old_values as Record<string, unknown>;
    }

    if (data.new_values !== undefined) {
      result.new_values = data.new_values as Record<string, unknown>;
    }

    if (data.ip_address) {
      result.ip_address = (data.ip_address as string)?.trim();
    }

    if (data.user_agent) {
      result.user_agent = (data.user_agent as string)?.trim();
    }

    return result;
  }

  /**
   * Sanitize filter options data
   */
  static sanitizeFilterOptionsData(data: Record<string, unknown>): AuditLogFilterOptions {
    const result: AuditLogFilterOptions = {};

    if (data.user_id !== undefined) {
      result.user_id = parseInt(data.user_id as string, 10);
    }

    if (data.action) {
      result.action = (data.action as string)?.trim();
    }

    if (data.subject_type) {
      result.subject_type = (data.subject_type as string)?.trim();
    }

    if (data.subject_id !== undefined) {
      result.subject_id = parseInt(data.subject_id as string, 10);
    }

    if (data.success !== undefined) {
      result.success = Boolean(data.success);
    }

    if (data.start_date) {
      result.start_date = new Date(data.start_date as string);
    }

    if (data.end_date) {
      result.end_date = new Date(data.end_date as string);
    }

    if (data.ip_address) {
      result.ip_address = (data.ip_address as string)?.trim();
    }

    return result;
  }

  /**
   * Sanitize query parameters data
   */
  static sanitizeQueryParamsData(data: Record<string, unknown>): AuditLogQueryParams {
    const result: AuditLogQueryParams = {
      page: data.page !== undefined ? parseInt(data.page as string, 10) : 1,
      limit: data.limit !== undefined ? parseInt(data.limit as string, 10) : 50,
      sort: (data.sort as string)?.trim() || 'created_at',
      order: data.order === 'asc' ? 'asc' : 'desc',
    };

    if (data.filters) {
      result.filters = this.sanitizeFilterOptionsData(data.filters as Record<string, unknown>);
    }

    return result;
  }

  /**
   * Sanitize export options data
   */
  static sanitizeExportOptionsData(data: Record<string, unknown>): AuditLogExportOptions {
    const result: AuditLogExportOptions = {
      format: ((data.format as string)?.trim() || 'json') as 'csv' | 'json' | 'xlsx',
      include_details: data.include_details !== undefined ? Boolean(data.include_details) : false,
    };

    if (data.filters) {
      result.filters = this.sanitizeFilterOptionsData(data.filters as Record<string, unknown>);
    }

    if (data.start_date) {
      result.start_date = new Date(data.start_date as string);
    }

    if (data.end_date) {
      result.end_date = new Date(data.end_date as string);
    }

    return result;
  }
}
