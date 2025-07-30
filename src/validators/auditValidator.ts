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
  ];

  private static readonly VALID_RESOURCE_TYPES = [
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

    if (!data.resource_type) {
      errors.push('Resource type is required');
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

    if (data.resource_type && !this.VALID_RESOURCE_TYPES.includes(data.resource_type as string)) {
      errors.push(`Invalid resource type. Must be one of: ${this.VALID_RESOURCE_TYPES.join(', ')}`);
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

    if (data.resource_id !== undefined) {
      if (!Number.isInteger(data.resource_id) || (data.resource_id as number) < 0) {
        errors.push('Resource ID must be a non-negative integer');
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

  /**
   * Validate audit log filter options
   */
  static validateFilterOptions(data: Record<string, unknown>): AuditValidationResult {
    const errors: string[] = [];

    // Validate user_id if provided
    if (data.user_id !== undefined) {
      if (!Number.isInteger(data.user_id) || (data.user_id as number) < 0) {
        errors.push('User ID must be a non-negative integer');
      }
    }

    // Validate action if provided
    if (data.action && !this.VALID_ACTIONS.includes(data.action as string)) {
      errors.push(`Invalid action. Must be one of: ${this.VALID_ACTIONS.join(', ')}`);
    }

    // Validate resource_type if provided
    if (data.resource_type && !this.VALID_RESOURCE_TYPES.includes(data.resource_type as string)) {
      errors.push(`Invalid resource type. Must be one of: ${this.VALID_RESOURCE_TYPES.join(', ')}`);
    }

    // Validate resource_id if provided
    if (data.resource_id !== undefined) {
      if (!Number.isInteger(data.resource_id) || (data.resource_id as number) < 0) {
        errors.push('Resource ID must be a non-negative integer');
      }
    }

    // Validate success if provided
    if (data.success !== undefined && typeof data.success !== 'boolean') {
      errors.push('Success field must be a boolean');
    }

    // Validate date range if provided
    if (data.start_date) {
      if (!(data.start_date instanceof Date) && isNaN(Date.parse(data.start_date as string))) {
        errors.push('Start date must be a valid date');
      }
    }

    if (data.end_date) {
      if (!(data.end_date instanceof Date) && isNaN(Date.parse(data.end_date as string))) {
        errors.push('End date must be a valid date');
      }
    }

    // Validate date range logic
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date as string);
      const endDate = new Date(data.end_date as string);
      if (startDate > endDate) {
        errors.push('Start date must be before end date');
      }
    }

    // Validate IP address format if provided
    if (data.ip_address) {
      const ipAddress = data.ip_address as string;
      if (!this.isValidIpAddress(ipAddress)) {
        errors.push('Invalid IP address format');
      }
    }

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
        'resource_type',
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

  /**
   * Validate audit log export options
   */
  static validateExportOptions(data: Record<string, unknown>): AuditValidationResult {
    const errors: string[] = [];

    // Check required fields
    if (!data.format) {
      errors.push('Export format is required');
    }

    // If there are missing required fields, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate format
    if (data.format && !this.VALID_EXPORT_FORMATS.includes(data.format as string)) {
      errors.push(`Invalid export format. Must be one of: ${this.VALID_EXPORT_FORMATS.join(', ')}`);
    }

    // Validate include_details
    if (data.include_details !== undefined && typeof data.include_details !== 'boolean') {
      errors.push('Include details must be a boolean');
    }

    // Validate filters if provided
    if (data.filters) {
      const filterValidation = this.validateFilterOptions(data.filters as Record<string, unknown>);
      if (!filterValidation.isValid) {
        errors.push(...filterValidation.errors);
      }
    }

    // Validate date range if provided
    if (data.start_date) {
      if (!(data.start_date instanceof Date) && isNaN(Date.parse(data.start_date as string))) {
        errors.push('Start date must be a valid date');
      }
    }

    if (data.end_date) {
      if (!(data.end_date instanceof Date) && isNaN(Date.parse(data.end_date as string))) {
        errors.push('End date must be a valid date');
      }
    }

    // Validate date range logic
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date as string);
      const endDate = new Date(data.end_date as string);
      if (startDate > endDate) {
        errors.push('Start date must be before end date');
      }
    }

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
      resource_type: (data.resource_type as string)?.trim() || (data.resource_type as string),
      details: (data.details as Record<string, unknown>) || {},
      success: data.success !== undefined ? Boolean(data.success) : true,
    };

    if (data.user_id !== undefined) {
      result.user_id = parseInt(data.user_id as string, 10);
    }

    if (data.resource_id !== undefined) {
      result.resource_id = parseInt(data.resource_id as string, 10);
    }

    if (data.ip_address) {
      result.ip_address = (data.ip_address as string)?.trim();
    }

    if (data.user_agent) {
      result.user_agent = (data.user_agent as string)?.trim();
    }

    if (data.session_id) {
      result.session_id = (data.session_id as string)?.trim();
    }

    if (data.error_message) {
      result.error_message = (data.error_message as string)?.trim();
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

    if (data.resource_type) {
      result.resource_type = (data.resource_type as string)?.trim();
    }

    if (data.resource_id !== undefined) {
      result.resource_id = parseInt(data.resource_id as string, 10);
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
