/**
 * Email Verification Validator
 *
 * Comprehensive validation for email verification tokens and related functionality.
 * Provides token validation, email format validation, and input sanitization.
 *
 * @module src/validators/emailVerificationValidator
 */

import {
  EmailVerificationToken,
  CreateEmailVerificationTokenRequest,
  VerifyEmailVerificationTokenRequest,
  EmailVerificationValidationResult,
  EmailVerificationValidationError,
} from '@/types/emailVerification';

export class EmailVerificationValidator {
  /**
   * Validate create email verification token request
   */
  static validateCreateTokenRequest(data: any): EmailVerificationValidationResult {
    const errors: EmailVerificationValidationError[] = [];

    // Check required fields
    if (!data.user_id) {
      errors.push({ field: 'user_id', message: 'User ID is required' });
    }

    if (!data.type) {
      errors.push({ field: 'type', message: 'Token type is required' });
    }

    // If there are missing required fields, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate user_id
    if (data.user_id) {
      if (!Number.isInteger(data.user_id) || data.user_id <= 0) {
        errors.push({ field: 'user_id', message: 'User ID must be a positive integer' });
      }
    }

    // Validate token type
    if (data.type) {
      const validTypes = ['email_verification', 'password_reset'];
      if (!validTypes.includes(data.type)) {
        errors.push({
          field: 'type',
          message: 'Token type must be either "email_verification" or "password_reset"',
        });
      }
    }

    // Validate expires_in_hours if provided
    if (data.expires_in_hours !== undefined) {
      if (!Number.isInteger(data.expires_in_hours) || data.expires_in_hours <= 0) {
        errors.push({
          field: 'expires_in_hours',
          message: 'Expires in hours must be a positive integer',
        });
      }

      if (data.expires_in_hours > 168) {
        // 7 days max
        errors.push({
          field: 'expires_in_hours',
          message: 'Token expiry cannot exceed 168 hours (7 days)',
        });
      }
    }

    // Validate IP address format if provided
    if (data.ip_address) {
      // Skip validation for empty strings, localhost, and IPv6 localhost
      if (
        data.ip_address.trim() === '' ||
        data.ip_address === 'localhost' ||
        data.ip_address === '::1' ||
        data.ip_address === '127.0.0.1'
      ) {
        // These are valid for development/testing
        // Continue with validation for other fields
      } else {
        const ipRegex =
          /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (!ipRegex.test(data.ip_address)) {
          errors.push({ field: 'ip_address', message: 'Invalid IP address format' });
        }
      }
    }

    // Validate user agent length if provided
    if (data.user_agent && data.user_agent.length > 500) {
      errors.push({ field: 'user_agent', message: 'User agent must be less than 500 characters' });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate verify email verification token request
   */
  static validateVerifyTokenRequest(data: any): EmailVerificationValidationResult {
    const errors: EmailVerificationValidationError[] = [];

    // Check required fields
    if (!data.token) {
      errors.push({ field: 'token', message: 'Verification token is required' });
    }

    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    // If there are missing required fields, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate email format
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (data.email.length > 255) {
        errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
      }
    }

    // Validate token format (UUID-like)
    if (data.token) {
      const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!tokenRegex.test(data.token)) {
        errors.push({ field: 'token', message: 'Invalid token format' });
      }
    }

    // Validate optional token type
    if (data.type) {
      const validTypes = ['email_verification', 'password_reset'];
      if (!validTypes.includes(data.type)) {
        errors.push({
          field: 'type',
          message: 'Token type must be either "email_verification" or "password_reset"',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email verification token object
   */
  static validateToken(token: EmailVerificationToken): EmailVerificationValidationResult {
    const errors: EmailVerificationValidationError[] = [];

    // Check if token is used
    if (token.is_used) {
      errors.push({ field: 'token', message: 'Token has already been used' });
    }

    // Check if token is expired
    if (token.expires_at && new Date() > new Date(token.expires_at)) {
      errors.push({ field: 'token', message: 'Token has expired' });
    }

    // Validate token format
    const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!tokenRegex.test(token.token)) {
      errors.push({ field: 'token', message: 'Invalid token format' });
    }

    // Validate user_id - handle both string and number types from database
    const userId = typeof token.user_id === 'string' ? parseInt(token.user_id, 10) : token.user_id;
    if (!Number.isInteger(userId) || userId <= 0) {
      errors.push({ field: 'user_id', message: 'Invalid user ID' });
    }

    // Validate token type
    const validTypes = ['email_verification', 'password_reset'];
    if (!validTypes.includes(token.type)) {
      errors.push({ field: 'type', message: 'Invalid token type' });
    }

    return {
      isValid: errors.length === 0,
      errors,
      token,
    };
  }

  /**
   * Sanitize create token request data
   */
  static sanitizeCreateTokenData(data: any): CreateEmailVerificationTokenRequest {
    return {
      user_id: parseInt(data.user_id, 10) || data.user_id,
      type: data.type || 'email_verification',
      ip_address: data.ip_address?.trim() || data.ip_address,
      user_agent: data.user_agent?.trim() || data.user_agent,
      expires_in_hours: parseInt(data.expires_in_hours, 10) || 24, // Default to 24 hours
    };
  }

  /**
   * Sanitize verify token request data
   */
  static sanitizeVerifyTokenData(data: any): VerifyEmailVerificationTokenRequest {
    return {
      token: data.token?.trim() || data.token,
      email: data.email?.trim()?.toLowerCase() || data.email,
      type: data.type || undefined,
    };
  }
}
