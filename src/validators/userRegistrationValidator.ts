/**
 * User Registration Validator
 *
 * Comprehensive validation for user registration, email verification, and profile updates.
 * Provides input sanitization, validation rules, and password complexity validation.
 *
 * @module src/validators/userRegistrationValidator
 */

import {
  UserRegistrationRequest,
  UserRegistrationValidationResult,
  EmailVerificationRequest,
  UserEmailVerificationValidationResult,
  UserProfileUpdateRequest,
  ProfileUpdateValidationResult,
  ValidationError,
} from '@/types/userRegistration';

export class UserRegistrationValidator {
  /**
   * Validate user registration request
   */
  static validateRegistrationRequest(data: any): UserRegistrationValidationResult {
    const errors: ValidationError[] = [];

    // Check required fields
    if (!data.email) {
      errors.push({ field: 'email', message: 'Email is required' });
    }

    if (!data.name) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!data.password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    if (!data.role_id) {
      errors.push({ field: 'role_id', message: 'Role ID is required' });
    }

    // If there are missing required fields, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Validate email format and length
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }

      if (data.email.length > 255) {
        errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
      }
    }

    // Validate name length
    if (data.name) {
      if (data.name.length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
      }

      if (data.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
      }
    }

    // Validate password complexity
    if (data.password) {
      if (data.password.length < 8) {
        errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
      }

      if (data.password.length > 128) {
        errors.push({ field: 'password', message: 'Password must be less than 128 characters' });
      }

      // Check for password complexity (at least one uppercase, one lowercase, one number)
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(data.password)) {
        errors.push({
          field: 'password',
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        });
      }
    }

    // Validate role_id
    if (data.role_id) {
      if (!Number.isInteger(data.role_id) || data.role_id <= 0) {
        errors.push({ field: 'role_id', message: 'Role ID must be a positive integer' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate email verification request
   */
  static validateEmailVerificationRequest(data: any): UserEmailVerificationValidationResult {
    const errors: ValidationError[] = [];

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
    }

    // Validate token format (UUID-like)
    if (data.token) {
      const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!tokenRegex.test(data.token)) {
        errors.push({ field: 'token', message: 'Invalid token format' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate profile update request
   */
  static validateProfileUpdateRequest(data: any): ProfileUpdateValidationResult {
    const errors: ValidationError[] = [];

    // Check if at least one field is provided
    if (!data.name && !data.current_password && !data.new_password) {
      errors.push({ field: 'general', message: 'At least one field must be provided for update' });
      return { isValid: false, errors };
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (data.name.length < 2) {
        errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
      }

      if (data.name.length > 100) {
        errors.push({ field: 'name', message: 'Name must be less than 100 characters' });
      }
    }

    // Validate password change if new_password is provided
    if (data.new_password !== undefined) {
      if (!data.current_password) {
        errors.push({
          field: 'current_password',
          message: 'Current password is required when setting new password',
        });
      }

      if (data.new_password.length < 8) {
        errors.push({
          field: 'new_password',
          message: 'New password must be at least 8 characters long',
        });
      }

      if (data.new_password.length > 128) {
        errors.push({
          field: 'new_password',
          message: 'New password must be less than 128 characters',
        });
      }

      // Check for password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(data.new_password)) {
        errors.push({
          field: 'new_password',
          message:
            'New password must contain at least one uppercase letter, one lowercase letter, and one number',
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize registration data
   */
  static sanitizeRegistrationData(data: any): UserRegistrationRequest {
    return {
      email: data.email?.trim()?.toLowerCase() || data.email,
      name: data.name?.trim() || data.name,
      password: data.password,
      role_id: parseInt(data.role_id, 10) || data.role_id,
    };
  }

  /**
   * Sanitize email verification data
   */
  static sanitizeEmailVerificationData(data: any): EmailVerificationRequest {
    return {
      token: data.token?.trim() || data.token,
      email: data.email?.trim()?.toLowerCase() || data.email,
    };
  }

  /**
   * Sanitize profile update data
   */
  static sanitizeProfileUpdateData(data: any): UserProfileUpdateRequest {
    return {
      name: data.name?.trim() || data.name,
      current_password: data.current_password,
      new_password: data.new_password,
    };
  }
}
