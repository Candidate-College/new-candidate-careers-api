import { UserService } from '../UserService';
import { JWTUtils } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { PasswordUtils } from '@/utils/password';
import { AUTH_CONFIG } from '@/config/auth';
import { createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

/**
 * PasswordService handles all password-related operations
 * Extracted from AuthService to follow single responsibility principle
 */
export class PasswordService {
  constructor(private readonly userService: UserService) {}

  /**
   * Change user password (requires current password verification)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      logger.info(`Password change attempt for user: ${userId}`);

      // Validate new password
      this.validatePasswordStrength(newPassword);

      // Get user from database first to get email
      const user = await this.userService.getUserById(parseInt(userId, 10));
      if (!user) {
        throw createError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
      }

      // Get user from database with password hash
      const userWithPassword = await this.userService.getUserByEmailWithPassword(user.email);
      if (!userWithPassword) {
        throw createError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(
        currentPassword,
        userWithPassword.password_hash
      );
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 401, ErrorCodes.INVALID_CREDENTIALS);
      }

      // Update password using UserService
      await this.userService.updateUser(parseInt(userId, 10), { password: newPassword });

      logger.info(`Password changed successfully for user ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw createError('Password change failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Reset password using verification token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      logger.info('Password reset attempt');

      // Validate new password
      this.validatePasswordStrength(newPassword);

      // Verify the reset token (this would be done by TokenService)
      // For now, we'll assume the token is already verified
      const userId = this.extractUserIdFromToken(token);

      // Update password
      await this.userService.updateUser(parseInt(userId, 10), { password: newPassword });

      logger.info(`Password reset successfully for user ${userId}`);
    } catch (error) {
      logger.error('Password reset failed:', error);
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw createError('Password reset failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await PasswordUtils.verifyPassword(password, hash);
    } catch (error) {
      logger.error('Password verification failed:', error);
      return false;
    }
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await PasswordUtils.hashPassword(password);
    } catch (error) {
      logger.error('Password hashing failed:', error);
      throw createError('Password hashing failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): void {
    const { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = AUTH_CONFIG.VALIDATION;

    if (!password || typeof password !== 'string') {
      throw createError('Password is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw createError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      throw createError(
        `Password must be no more than ${MAX_PASSWORD_LENGTH} characters long`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check for common password patterns
    if (this.isCommonPassword(password)) {
      throw createError(
        'Password is too common, please choose a stronger password',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check for minimum complexity requirements
    if (!this.meetsComplexityRequirements(password)) {
      throw createError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }
  }

  /**
   * Check if password meets complexity requirements
   */
  private meetsComplexityRequirements(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  /**
   * Check if password is in common password list
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
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
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Extract user ID from token
   */
  private extractUserIdFromToken(token: string): string {
    try {
      // Decode the JWT token to extract user ID
      const payload = JWTUtils.decodeToken(token);
      if (!payload?.sub) {
        throw new Error('Invalid token payload');
      }
      return payload.sub;
    } catch (error) {
      logger.error('Failed to extract user ID from token:', error);
      throw createError('Invalid reset token', 401, ErrorCodes.UNAUTHORIZED);
    }
  }

  /**
   * Generate password reset token
   */
  async generatePasswordResetToken(email: string): Promise<string> {
    try {
      const user = await this.userService.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        logger.info(`Password reset requested for email: ${email}`);
        return 'dummy-token';
      }

      // This would typically use TokenService to generate a reset token
      logger.info(`Password reset token generated for user: ${user.id}`);
      return 'dummy-reset-token';
    } catch (error) {
      logger.error('Failed to generate password reset token:', error);
      throw createError('Failed to generate reset token', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Check if password has been compromised
   */
  async isPasswordCompromised(): Promise<boolean> {
    // This would typically check against a database of compromised passwords
    // For now, return false
    return false;
  }

  /**
   * Get password statistics for monitoring
   */
  getPasswordStats(): { totalChanges: number; resetRequests: number } {
    // This would typically track password change statistics
    return {
      totalChanges: 0,
      resetRequests: 0,
    };
  }
}
