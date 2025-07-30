/**
 * Password Validator
 *
 * Comprehensive password validation with configurable complexity rules.
 * Provides reusable password validation functions for consistent security.
 *
 * @module src/validators/passwordValidator
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100 password strength score
}

export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  preventCommonPasswords?: boolean;
  preventUserInfo?: boolean;
  userInfo?: {
    email?: string;
    name?: string;
    username?: string;
  };
}

export class PasswordValidator {
  private static readonly DEFAULT_OPTIONS: Required<PasswordValidationOptions> = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    preventCommonPasswords: true,
    preventUserInfo: true,
    userInfo: {},
  };

  private static readonly COMMON_PASSWORDS = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    'dragon',
    'master',
    'hello',
    'freedom',
    'whatever',
    'qazwsx',
    'trustno1',
    'jordan',
    'harley',
    'hunter',
    'buster',
    'thomas',
    'tigger',
    'robert',
    'access',
    'love',
    'buster',
    'shadow',
    'ashley',
    'michael',
    'dallas',
    'maggie',
    'mustang',
    'dennis',
    'jessica',
    'porsche',
    'liverpool',
    'marlin',
    'gandalf',
    'wizard',
    'cooper',
    'jackson',
    'chelsea',
    'jordan23',
    'eagle1',
    'helen',
    'madonna',
    'joanna',
    'apollo',
    'parker',
    'alpha',
    'bonfire',
    'roberto',
    'angel',
    'shad0w',
    'anthony',
    'jordan2',
    '111111',
    'superman',
    'roger',
    'homer',
    'vikings',
    'liverpoo',
    'calvin',
    'shalom',
    'success',
  ];

  /**
   * Validate password with comprehensive rules
   */
  static validatePassword(
    password: string,
    options: PasswordValidationOptions = {}
  ): PasswordValidationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const errors: string[] = [];
    let score = 0;

    // Validate basic requirements
    const basicValidation = this.validateBasicRequirements(password, opts);
    errors.push(...basicValidation.errors);
    score += basicValidation.score;

    // Validate special characters if required
    if (opts.requireSpecialChars) {
      const specialCharValidation = this.validateSpecialCharacters(password);
      errors.push(...specialCharValidation.errors);
      score += specialCharValidation.score;
    }

    // Check for common passwords
    if (opts.preventCommonPasswords && this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a more unique password');
    } else {
      score += 10;
    }

    // Check for user information in password
    if (opts.preventUserInfo && opts.userInfo) {
      const userInfoValidation = this.validateUserInfo(password, opts.userInfo);
      errors.push(...userInfoValidation.errors);
    }

    // Additional strength checks
    const strengthValidation = this.calculateStrengthScore(password);
    score += strengthValidation.score;

    // Cap score at 100
    score = Math.min(score, 100);

    return {
      isValid: errors.length === 0,
      errors,
      score,
    };
  }

  /**
   * Validate basic password requirements
   */
  private static validateBasicRequirements(
    password: string,
    options: Required<PasswordValidationOptions>
  ): { errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;

    // Check minimum length
    if (password.length < options.minLength) {
      errors.push(`Password must be at least ${options.minLength} characters long`);
    } else {
      score += 10;
    }

    // Check maximum length
    if (password.length > options.maxLength) {
      errors.push(`Password must be less than ${options.maxLength} characters`);
    } else {
      score += 5;
    }

    // Check for uppercase letters
    if (options.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 15;
    }

    // Check for lowercase letters
    if (options.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 15;
    }

    // Check for numbers
    if (options.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 15;
    }

    return { errors, score };
  }

  /**
   * Validate special characters
   */
  private static validateSpecialCharacters(password: string): { errors: string[]; score: number } {
    const errors: string[] = [];
    let score = 0;

    // Use a character class without unnecessary escapes
    const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

    if (!specialCharRegex.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 20;
    }

    return { errors, score };
  }

  /**
   * Validate user information in password
   */
  private static validateUserInfo(
    password: string,
    userInfo: PasswordValidationOptions['userInfo']
  ): { errors: string[] } {
    const errors: string[] = [];

    if (!userInfo) return { errors };

    const userInfoValues = Object.values(userInfo).filter(Boolean);
    const passwordLower = password.toLowerCase();

    for (const info of userInfoValues) {
      if (info && passwordLower.includes(info.toLowerCase())) {
        errors.push('Password should not contain personal information');
        break;
      }
    }

    return { errors };
  }

  /**
   * Calculate additional strength score
   */
  private static calculateStrengthScore(password: string): { score: number } {
    let score = 0;

    // Additional strength checks
    if (password.length >= 12) score += 10;
    if (/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(password)) score += 10;

    // Use the same special char regex without unnecessary escapes
    const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
    if (specialCharRegex.test(password)) score += 10;

    return { score };
  }

  /**
   * Get password strength description
   */
  static getPasswordStrength(score: number): string {
    if (score >= 80) return 'Very Strong';
    if (score >= 60) return 'Strong';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Weak';
    return 'Very Weak';
  }

  /**
   * Generate password suggestions
   */
  static generateSuggestions(password: string, options: PasswordValidationOptions = {}): string[] {
    const suggestions: string[] = [];
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    if (password.length < opts.minLength) {
      suggestions.push(`Make it at least ${opts.minLength} characters long`);
    }

    if (!/[A-Z]/.test(password) && opts.requireUppercase) {
      suggestions.push('Add an uppercase letter');
    }

    if (!/[a-z]/.test(password) && opts.requireLowercase) {
      suggestions.push('Add a lowercase letter');
    }

    if (!/\d/.test(password) && opts.requireNumbers) {
      suggestions.push('Add a number');
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) && opts.requireSpecialChars) {
      suggestions.push('Add a special character');
    }

    if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
      suggestions.push('Choose a more unique password');
    }

    if (password.length < 12) {
      suggestions.push('Consider making it longer for better security');
    }

    return suggestions;
  }

  /**
   * Check if password meets basic requirements
   */
  static meetsBasicRequirements(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password)
    );
  }

  /**
   * Check if password is strong enough
   */
  static isStrongPassword(password: string): boolean {
    const result = this.validatePassword(password);
    return result.isValid && result.score >= 60;
  }
}
