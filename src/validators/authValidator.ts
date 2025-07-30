import { RegisterRequest, ValidationError, ValidationResult } from '@/types/auth';

export class AuthValidator {
  private static getStringField(data: Record<string, unknown>, field: string): string {
    return typeof data[field] === 'string' ? data[field] : '';
  }

  private static validateRequiredFields(
    data: Record<string, unknown>,
    fields: string[]
  ): ValidationError[] {
    return fields
      .filter(f => !data[f])
      .map(f => ({ field: f, message: `${f.replace('_', ' ')} is required` }));
  }

  private static validateEmail(email: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ field: 'email', message: 'Invalid email format' });
    }
    if (email.length > 255) {
      errors.push({ field: 'email', message: 'Email must be less than 255 characters' });
    }
    return errors;
  }

  private static validateName(field: string, value: string): ValidationError[] {
    const errors: ValidationError[] = [];
    if (value.length < 1) {
      errors.push({ field, message: `${field.replace('_', ' ')} cannot be empty` });
    }
    if (value.length > 50) {
      errors.push({ field, message: `${field.replace('_', ' ')} must be less than 50 characters` });
    }
    return errors;
  }

  private static validateUsername(username: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const usernameRegex = /^\w+$/;
    if (!usernameRegex.test(username)) {
      errors.push({
        field: 'username',
        message: 'Username can only contain letters, numbers, and underscores',
      });
    }
    if (username.length < 3) {
      errors.push({ field: 'username', message: 'Username must be at least 3 characters long' });
    }
    if (username.length > 30) {
      errors.push({ field: 'username', message: 'Username must be less than 30 characters' });
    }
    return errors;
  }

  private static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    if (password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }
    if (password.length > 128) {
      errors.push({ field: 'password', message: 'Password must be less than 128 characters' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      errors.push({
        field: 'password',
        message:
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      });
    }
    return errors;
  }

  private static validatePasswordConfirmation(
    password: string,
    confirm: string
  ): ValidationError[] {
    if (password !== confirm) {
      return [{ field: 'confirm_password', message: 'Passwords do not match' }];
    }
    return [];
  }

  /**
   * Validate registration request
   */
  static validateRegisterRequest(data: Record<string, unknown>): ValidationResult {
    const requiredFields = [
      'email',
      'username',
      'first_name',
      'last_name',
      'password',
      'confirm_password',
    ];
    let errors: ValidationError[] = this.validateRequiredFields(data, requiredFields);
    if (errors.length > 0) {
      return { isValid: false, errors };
    }
    const email = this.getStringField(data, 'email');
    const username = this.getStringField(data, 'username');
    const firstName = this.getStringField(data, 'first_name');
    const lastName = this.getStringField(data, 'last_name');
    const password = this.getStringField(data, 'password');
    const confirmPassword = this.getStringField(data, 'confirm_password');
    errors = [
      ...this.validateEmail(email),
      ...this.validateName('first_name', firstName),
      ...this.validateName('last_name', lastName),
      ...this.validateUsername(username),
      ...this.validatePassword(password),
      ...this.validatePasswordConfirmation(password, confirmPassword),
    ];
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Sanitize registration data
   */
  static sanitizeRegisterData(data: Record<string, unknown>): RegisterRequest {
    return {
      email: (data.email as string)?.trim()?.toLowerCase() || (data.email as string),
      username: (data.username as string)?.trim()?.toLowerCase() || (data.username as string),
      first_name: (data.first_name as string)?.trim() || (data.first_name as string),
      last_name: (data.last_name as string)?.trim() || (data.last_name as string),
      password: data.password as string,
      confirm_password: data.confirm_password as string,
    };
  }

  /**
   * Validate refresh token request
   */
  static validateRefreshTokenRequest(data: Record<string, unknown>): ValidationResult {
    const errors: ValidationError[] = [];
    if (!data.refresh_token || typeof data.refresh_token !== 'string') {
      errors.push({
        field: 'refresh_token',
        message: 'Refresh token is required and must be a string',
      });
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate logout request
   */
  static validateLogoutRequest(data: Record<string, unknown>): ValidationResult {
    // refresh_token is optional, but if present must be a string
    const errors: ValidationError[] = [];
    if (data.refresh_token !== undefined && typeof data.refresh_token !== 'string') {
      errors.push({
        field: 'refresh_token',
        message: 'Refresh token must be a string if provided',
      });
    }
    return { isValid: errors.length === 0, errors };
  }
}
