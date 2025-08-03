import { UserService } from '../UserService';
import { LockoutService } from './LockoutService';
import { TokenService } from './TokenService';
import { AuditLogService } from '../AuditLogService';
import { logger } from '@/utils/logger';
import { PasswordUtils } from '@/utils/password';
import { AUTH_CONFIG } from '@/config/auth';
import { LoginCredentials, LoginResponse, AuthenticatedUser, JWTUser } from '@/types/jwt';
import { UserWithRole } from '@/models';
import { createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

/**
 * LoginService handles user authentication and login logic
 * Extracted from AuthService to follow single responsibility principle
 */
export class LoginService {
  constructor(
    private userService: UserService,
    private lockoutService: LockoutService,
    private tokenService: TokenService,
    private auditLogService: AuditLogService
  ) {}

  /**
   * Authenticate user and generate JWT tokens
   */
  async authenticateUser(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { email, password } = credentials;
      logger.info(`Login attempt for email: ${email}`);

      // Check if user is locked out
      if (this.lockoutService.isLockedOut(email)) {
        const remainingTime = this.lockoutService.getRemainingLockoutTime(email);
        throw createError(
          `Too many failed login attempts. Please try again in ${Math.ceil(remainingTime / 60000)} minutes.`,
          429,
          ErrorCodes.FORBIDDEN
        );
      }

      // Validate user credentials
      const user = await this.validateUserCredentials(email, password);

      if (!user) {
        await this.handleFailedLogin(email, 'Invalid email or password');
        throw createError('Invalid email or password', 401, ErrorCodes.INVALID_CREDENTIALS);
      }

      if (user.status !== 'active') {
        await this.handleFailedLogin(email, 'Account is deactivated');
        throw createError('Account is deactivated', 401, ErrorCodes.UNAUTHORIZED);
      }

      // Clear lockout on successful login
      this.lockoutService.clearLockout(email);

      // Create JWT user object
      const jwtUser: JWTUser = {
        id: user.id.toString(),
        email: user.email,
        role: user.role_name || AUTH_CONFIG.ROLES.FALLBACK_ROLE,
      };

      // Generate token pair
      const tokens = this.tokenService.generateTokenPair(jwtUser);

      // Update user's last login timestamp
      await this.updateLastLogin(user.id);

      // Log successful login
      await this.auditLogService.logLogin(user.id, true);

      // Create authenticated user response
      const authenticatedUser: AuthenticatedUser = {
        id: user.id.toString(),
        email: user.email,
        role: user.role_name || AUTH_CONFIG.ROLES.FALLBACK_ROLE,
        isActive: user.status === 'active',
      };

      logger.info(`User ${user.id} logged in successfully`);

      return {
        user: authenticatedUser,
        tokens,
        message: 'Login successful',
      };
    } catch (error) {
      logger.error('Login failed:', error);
      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }
      throw createError('Login failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Validate user credentials
   */
  private async validateUserCredentials(
    email: string,
    password: string
  ): Promise<UserWithRole | null> {
    try {
      // Get user by email with password hash and role information
      const userWithPassword = await this.userService.getUserByEmailWithPasswordAndRole(email);

      if (!userWithPassword) {
        return null;
      }

      // Use password_hash if present, otherwise fallback to password
      const hash = userWithPassword.password_hash || userWithPassword.password;
      const isPasswordValid = await PasswordUtils.verifyPassword(password, hash);

      if (!isPasswordValid) {
        return null;
      }

      // Return user without password hash but with role information
      const user: UserWithRole = {
        id: userWithPassword.id,
        uuid: userWithPassword.uuid,
        email: userWithPassword.email,
        password: userWithPassword.password,
        name: userWithPassword.name,
        role_id: userWithPassword.role_id,
        role_name: userWithPassword.role_name,
        role_display_name: userWithPassword.role_display_name,
        role_description: userWithPassword.role_description,
        status: userWithPassword.status,
        email_verified_at: userWithPassword.email_verified_at,
        last_login_at: userWithPassword.last_login_at,
        deleted_at: userWithPassword.deleted_at,
        created_at: userWithPassword.created_at,
        updated_at: userWithPassword.updated_at,
      };
      return user;
    } catch (error) {
      logger.error('Credential validation failed:', error);
      return null;
    }
  }

  /**
   * Handle failed login attempt
   */
  private async handleFailedLogin(email: string, reason: string): Promise<void> {
    // Record failed attempt
    this.lockoutService.recordFailedAttempt(email);

    // Log failed login attempt
    await this.auditLogService.logLogin(0, false, reason);

    logger.warn(`Failed login attempt for ${email}: ${reason}`);
  }

  /**
   * Update user's last login timestamp
   */
  private async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.userService.updateUser(userId, {
        last_login_at: new Date(),
      });
    } catch (error) {
      // Don't fail the login if we can't update last_login
      logger.warn('Failed to update last login timestamp:', error);
    }
  }

  /**
   * Get login statistics for monitoring
   */
  getLoginStats(): { totalAttempts: number; successfulLogins: number; failedLogins: number } {
    // This would typically track login statistics
    return {
      totalAttempts: 0,
      successfulLogins: 0,
      failedLogins: 0,
    };
  }

  /**
   * Check if user account is active
   */
  async isUserActive(userId: number): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(userId);
      return user?.status === 'active';
    } catch (error) {
      logger.error(`Error checking user status for ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get user login history
   */
  async getUserLoginHistory(userId: number): Promise<any[]> {
    try {
      // This would typically query audit logs for login events
      // TODO: Implement actual login history query with limit parameter
      return [];
    } catch (error) {
      logger.error(`Error getting login history for user ${userId}:`, error);
      return [];
    }
  }
}
