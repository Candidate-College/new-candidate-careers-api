import { UserService } from './UserService';
import { JWTUtils } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import { PasswordUtils } from '@/utils/password';
import { AuditLogService } from './AuditLogService';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  VerificationTokenRequest,
  VerificationTokenResponse,
  AuthenticatedUser,
  JWTPayload,
  JWTUser,
  AuthServiceInterface,
} from '@/types/jwt';
import { User } from '@/types';
import { RegisterRequest, LoginLockoutInfo } from '@/types/auth';
import { createResourceConflictError, createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';

export class AuthService implements AuthServiceInterface {
  private readonly userService: UserService;
  private readonly auditLogService: AuditLogService;

  /**
   * In-memory lockout map: email -> lockout info
   */
  private static readonly lockoutMap: Map<string, LoginLockoutInfo> = new Map();
  private static readonly MAX_FAILED = 5;
  private static readonly LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.userService = new UserService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<User> {
    try {
      logger.info(`Registration attempt for email: ${userData.email}`);

      // Check if email already exists
      const existingUserByEmail = await this.userService.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        throw createResourceConflictError(
          'Email already exists',
          ErrorCodes.EMAIL_ALREADY_EXISTS,
          'A user with this email address is already registered'
        );
      }

      // Create user using UserService
      const newUser = await this.userService.createUser({
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`,
        password: userData.password,
        role_id: 2, // Default role for regular users
      });

      // Log successful registration
      await this.auditLogService.logUserRegistration(
        newUser.id,
        {
          email: userData.email,
          name: `${userData.first_name} ${userData.last_name}`,
          role_id: 2,
        },
        undefined, // IP address not available in this context
        undefined // User agent not available in this context
      );

      logger.info(`User ${newUser.id} registered successfully`);

      return newUser;
    } catch (error) {
      logger.error('Registration failed:', error);

      // Re-throw AppError instances as they are already properly formatted
      if (error instanceof Error && 'statusCode' in error && 'errorCode' in error) {
        throw error;
      }

      // For other errors, throw a generic registration error
      throw createResourceConflictError(
        'Registration failed',
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred during registration'
      );
    }
  }

  /**
   * Authenticate user and generate JWT tokens
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { email, password } = credentials;
    const now = Date.now();
    const lockout = AuthService.lockoutMap.get(email);
    if (lockout && lockout.lockedUntil && now < lockout.lockedUntil) {
      throw createError(
        'Too many failed login attempts. Please try again later.',
        429,
        ErrorCodes.FORBIDDEN
      );
    }

    logger.info(`Login attempt for email: ${email}`);

    // Validate user credentials using existing UserService
    const user = await this.validateUserCredentials(email, password);

    if (!user) {
      // Update lockout info
      const failedCount = (lockout?.failedCount || 0) + 1;
      const info: LoginLockoutInfo = {
        failedCount,
        lastFailed: now,
      };
      if (failedCount >= AuthService.MAX_FAILED) {
        info.lockedUntil = now + AuthService.LOCKOUT_MS;
      } else if (lockout?.lockedUntil) {
        info.lockedUntil = lockout.lockedUntil;
      }
      AuthService.lockoutMap.set(email, info);
      // Log failed login attempt
      await this.auditLogService.logLogin(0, false, 'Invalid email or password');
      throw createError('Invalid email or password', 401, ErrorCodes.INVALID_CREDENTIALS);
    }

    if (user.status !== 'active') {
      // Log failed login attempt due to inactive account
      await this.auditLogService.logLogin(user.id, false, 'Account is deactivated');
      throw createError('Account is deactivated', 401, ErrorCodes.UNAUTHORIZED);
    }

    // Create JWT user object
    const jwtUser: JWTUser = {
      id: user.id.toString(),
      email: user.email,
      role: 'user', // Default role, can be extended based on user data
    };

    // Generate token pair
    const tokens = JWTUtils.generateTokenPair(jwtUser);

    // Update user's last login timestamp
    await this.updateLastLogin(user.id);

    await this.auditLogService.logLogin(user.id, true);

    // Create authenticated user response
    const authenticatedUser: AuthenticatedUser = {
      id: user.id.toString(),
      email: user.email,
      role: 'user',
      isActive: user.status === 'active',
    };

    logger.info(`User ${user.id} logged in successfully`);

    return {
      user: authenticatedUser,
      tokens,
      message: 'Login successful',
    };
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<void> {
    try {
      logger.info(`Logout for user: ${userId}`);

      // Log logout event
      await this.auditLogService.logLogout(
        parseInt(userId, 10),
        undefined // IP address not available in this context
      );

      // In a stateless JWT system, logout is primarily handled client-side
      // by clearing cookies/tokens. However, we can log the event and
      // potentially implement token blacklisting in the future.

      // For now, we'll just log the logout event
      logger.info(`User ${userId} logged out successfully`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw createError('Logout failed', 500);
    }
  }

  /**
   * Refresh JWT tokens using a valid refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      logger.debug('Token refresh attempt');

      // Use JWT utility to refresh tokens
      const newTokens = JWTUtils.refreshTokens(refreshToken);

      logger.info('Tokens refreshed successfully');

      return {
        tokens: newTokens,
        message: 'Tokens refreshed successfully',
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Token refresh failed', 401);
    }
  }

  /**
   * Generate verification token for email verification, password reset, etc.
   */
  async generateVerificationToken(
    request: VerificationTokenRequest
  ): Promise<VerificationTokenResponse> {
    try {
      const { userId, purpose, email } = request;

      logger.info(`Generating ${purpose} token for user: ${userId}`);

      // Verify user exists
      const user = await this.userService.getUserById(parseInt(userId, 10));
      if (!user) {
        throw createError('User not found', 404);
      }

      // Generate verification token
      const token = JWTUtils.generateVerificationToken(userId, purpose, email || user.email);

      // Calculate expiration time
      const expirationTime = JWTUtils.getTokenExpiration(token);
      if (!expirationTime) {
        throw createError('Failed to determine token expiration', 500);
      }

      logger.info(`Generated ${purpose} token for user ${userId}`);

      return {
        token,
        expiresAt: expirationTime,
        message: `${purpose} token generated successfully`,
      };
    } catch (error) {
      logger.error('Verification token generation failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Verification token generation failed', 500);
    }
  }

  /**
   * Verify a verification token
   */
  async verifyToken(token: string, purpose?: string): Promise<JWTPayload> {
    try {
      logger.debug(`Verifying ${purpose || 'verification'} token`);

      // Verify the token using JWT utility
      const payload = JWTUtils.verifyVerificationToken(token, purpose);

      logger.info(`${purpose || 'Verification'} token verified for user ${payload.sub}`);

      return payload;
    } catch (error) {
      logger.error('Token verification failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Token verification failed', 401);
    }
  }

  /**
   * Get user information from JWT token
   */
  async getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      // Verify and decode the token
      const payload = JWTUtils.verifyToken(token, 'access');

      // Get full user information from database
      const user = await this.userService.getUserById(parseInt(payload.sub, 10));
      if (!user) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        role: 'user', // Default role, can be extended
        isActive: user.status === 'active',
      };
    } catch (error) {
      logger.debug(
        'Failed to get user from token:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

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

      // Get user from database first to get email
      const user = await this.userService.getUserById(parseInt(userId, 10));
      if (!user) {
        throw createError('User not found', 404);
      }

      // Get user from database with password hash
      const userWithPassword = await this.userService.getUserByEmailWithPassword(user.email);
      if (!userWithPassword) {
        throw createError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await PasswordUtils.verifyPassword(
        currentPassword,
        userWithPassword.password_hash
      );
      if (!isCurrentPasswordValid) {
        throw createError('Current password is incorrect', 401);
      }

      // Update password using UserService
      await this.userService.updateUser(parseInt(userId, 10), { password: newPassword });

      logger.info(`Password changed successfully for user ${userId}`);
    } catch (error) {
      logger.error('Password change failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Password change failed', 500);
    }
  }

  /**
   * Reset password using verification token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      logger.info('Password reset attempt');

      // Verify the reset token
      const payload = await this.verifyToken(token, 'password_reset');

      // Update password
      await this.userService.updateUser(parseInt(payload.sub, 10), { password: newPassword });

      logger.info(`Password reset successfully for user ${payload.sub}`);
    } catch (error) {
      logger.error('Password reset failed:', error);

      if (error instanceof Error && 'statusCode' in error) {
        throw error;
      }

      throw createError('Password reset failed', 500);
    }
  }

  /**
   * Validate user credentials (private method)
   */
  private async validateUserCredentials(email: string, password: string): Promise<User | null> {
    try {
      // Get user by email with password hash using UserService
      const userWithPassword = await this.userService.getUserByEmailWithPassword(email);

      if (!userWithPassword) {
        return null;
      }

      // Use password_hash if present, otherwise fallback to password
      const hash = userWithPassword.password_hash || userWithPassword.password;
      const isPasswordValid = await PasswordUtils.verifyPassword(password, hash);

      if (!isPasswordValid) {
        return null;
      }

      // Return user without password hash
      const user: User = {
        id: userWithPassword.id,
        uuid: userWithPassword.uuid,
        email: userWithPassword.email,
        password: userWithPassword.password,
        name: userWithPassword.name,
        role_id: userWithPassword.role_id,
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
   * Update user's last login timestamp (private method)
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
   * Validate token and get user (utility method for middleware)
   */
  async validateTokenAndGetUser(token: string): Promise<AuthenticatedUser | null> {
    try {
      return await this.getUserFromToken(token);
    } catch (error) {
      logger.debug(
        'Token validation failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Check if user has specific role (utility method)
   */
  async userHasRole(userId: string, role: string): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(parseInt(userId, 10));
      if (!user) {
        return false;
      }

      // TODO: Implement proper role checking based on your user model
      // For now, return true for 'user' role
      return role === 'user';
    } catch (error) {
      logger.error('Role check failed:', error);
      return false;
    }
  }
}
