import { UserService } from '../UserService';
import { EmailVerificationService } from '../EmailVerificationService';
import { AuditLogService } from '../AuditLogService';
import { logger } from '@/utils/logger';
import { AUTH_CONFIG } from '@/config/auth';
import { RegisterRequest } from '@/types/auth';
import { User } from '@/types';
import { USER_ROLE_ID } from '@/types/roles';
import { createResourceConflictError, createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

/**
 * RegistrationService handles user registration logic
 * Extracted from AuthService to follow single responsibility principle
 */
export class RegistrationService {
  constructor(
    private userService: UserService,
    private emailVerificationService: EmailVerificationService,
    private auditLogService: AuditLogService
  ) {}

  /**
   * Register a new user
   */
  async registerUser(userData: RegisterRequest): Promise<User> {
    try {
      logger.info(`Registration attempt for email: ${userData.email}`);

      // Validate registration data
      this.validateRegistrationData(userData);

      // Check if email already exists
      const existingUserByEmail = await this.userService.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw createResourceConflictError(
          'Email already exists',
          ErrorCodes.EMAIL_ALREADY_EXISTS,
          'A user with this email address is already registered'
        );
      }

      // Register user using UserService
      const registrationResult = await this.userService.registerUser({
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`,
        password: userData.password,
        role_id: USER_ROLE_ID,
      });

      if (!registrationResult.success) {
        throw createResourceConflictError(
          registrationResult.error || 'Registration failed',
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'An unexpected error occurred during registration'
        );
      }

      // Send verification email if token was created
      if (registrationResult.verificationToken && registrationResult.user) {
        await this.sendVerificationEmail(
          registrationResult.user,
          registrationResult.verificationToken
        );
      } else {
        logger.warn('No verification token or user data available for email sending');
      }

      // Log successful registration
      await this.auditLogService.logUserRegistration(registrationResult.user!.id, {
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`,
        role_id: USER_ROLE_ID,
      });

      logger.info(`User ${registrationResult.user!.id} registered successfully`);

      return registrationResult.user!;
    } catch (error) {
      logger.error('Registration failed:', error);
      if (error instanceof Error && 'statusCode' in error && 'errorCode' in error) {
        throw error;
      }
      throw createResourceConflictError(
        'Registration failed',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred during registration'
      );
    }
  }

  /**
   * Validate registration data
   */
  private validateRegistrationData(userData: RegisterRequest): void {
    const { email, password, first_name, last_name } = userData;

    // Validate email
    if (!email || !AUTH_CONFIG.VALIDATION.EMAIL_REGEX.test(email)) {
      throw createError('Invalid email format', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Validate password
    if (!password || password.length < AUTH_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH) {
      throw createError(
        `Password must be at least ${AUTH_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
        400,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate names
    if (!first_name || first_name.trim().length === 0) {
      throw createError('First name is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    if (!last_name || last_name.trim().length === 0) {
      throw createError('Last name is required', 400, ErrorCodes.VALIDATION_ERROR);
    }

    // Validate name length
    if (first_name.length > 50 || last_name.length > 50) {
      throw createError('Name must be less than 50 characters', 400, ErrorCodes.VALIDATION_ERROR);
    }
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(user: User, token: string): Promise<void> {
    try {
      logger.info(`Attempting to send verification email for user ${user.id}`);
      logger.debug(`Token: ${token}`);
      logger.debug(`User email: ${user.email}`);
      logger.debug(`User name: ${user.name}`);

      await this.emailVerificationService.sendVerificationEmail(
        user.id,
        token,
        user.email,
        user.name
      );

      logger.info(`Verification email sent to user ${user.id}`);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      logger.error('Email error details:', {
        message: emailError instanceof Error ? emailError.message : 'Unknown error',
        stack: emailError instanceof Error ? emailError.stack : undefined,
        userId: user.id,
        userEmail: user.email,
      });
      // Don't fail registration if email fails
    }
  }

  /**
   * Check if email is available for registration
   */
  async isEmailAvailable(email: string): Promise<boolean> {
    try {
      const existingUser = await this.userService.getUserByEmail(email);
      return !existingUser;
    } catch (error) {
      logger.error('Error checking email availability:', error);
      return false;
    }
  }

  /**
   * Get registration statistics for monitoring
   */
  getRegistrationStats(): { totalRegistrations: number; successfulRegistrations: number } {
    // This would typically track registration statistics
    return {
      totalRegistrations: 0,
      successfulRegistrations: 0,
    };
  }

  /**
   * Validate email format
   */
  validateEmailFormat(email: string): boolean {
    return AUTH_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
  }

  /**
   * Check if registration is allowed (e.g., during maintenance)
   */
  async isRegistrationAllowed(): Promise<boolean> {
    // This would typically check system settings or maintenance mode
    return true;
  }

  /**
   * Get registration requirements
   */
  getRegistrationRequirements(): {
    minPasswordLength: number;
    maxPasswordLength: number;
    requireEmailVerification: boolean;
  } {
    return {
      minPasswordLength: AUTH_CONFIG.VALIDATION.MIN_PASSWORD_LENGTH,
      maxPasswordLength: AUTH_CONFIG.VALIDATION.MAX_PASSWORD_LENGTH,
      requireEmailVerification: true,
    };
  }
}
