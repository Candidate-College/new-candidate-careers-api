import { UserService } from '../UserService';
import { EmailVerificationService } from '../EmailVerificationService';
import { PermissionService } from '../PermissionService';
import { AuditLogService } from '../AuditLogService';
import { LockoutService } from './LockoutService';
import { TokenService } from './TokenService';
import { PasswordService } from './PasswordService';
import { LoginService } from './LoginService';
import { RegistrationService } from './RegistrationService';
import { logger } from '@/utils/logger';
import {
  LoginCredentials,
  LoginResponse,
  RefreshTokenResponse,
  VerificationTokenRequest,
  VerificationTokenResponse,
  AuthenticatedUser,
  JWTPayload,
  AuthServiceInterface,
} from '@/types/jwt';
import { User } from '@/types';
import { RegisterRequest } from '@/types/auth';
import { createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';
import { PermissionCheckResult } from '@/types/roleManagement';

/**
 * AuthService - Orchestrator for authentication and authorization
 * Coordinates between specialized services while maintaining existing interface
 */
export class AuthService implements AuthServiceInterface {
  private readonly userService: UserService;
  private readonly emailVerificationService: EmailVerificationService;
  private readonly permissionService: PermissionService;
  private readonly auditLogService: AuditLogService;
  private readonly lockoutService: LockoutService;
  private readonly tokenService: TokenService;
  private readonly passwordService: PasswordService;
  private readonly loginService: LoginService;
  private readonly registrationService: RegistrationService;

  constructor(
    userService?: UserService,
    emailVerificationService?: EmailVerificationService,
    permissionService?: PermissionService,
    auditLogService?: AuditLogService
  ) {
    this.userService = userService || new UserService();
    this.emailVerificationService = emailVerificationService || new EmailVerificationService();
    this.permissionService = permissionService || new PermissionService();
    this.auditLogService = auditLogService || new AuditLogService();

    // Initialize specialized services
    this.lockoutService = new LockoutService();
    this.tokenService = new TokenService();
    this.passwordService = new PasswordService(this.userService);
    this.loginService = new LoginService(
      this.userService,
      this.lockoutService,
      this.tokenService,
      this.auditLogService
    );
    this.registrationService = new RegistrationService(
      this.userService,
      this.emailVerificationService,
      this.auditLogService
    );
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<User> {
    return this.registrationService.registerUser(userData);
  }

  /**
   * Authenticate user and generate JWT tokens
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.loginService.authenticateUser(credentials);
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: string): Promise<void> {
    try {
      logger.info(`Logout for user: ${userId}`);
      await this.auditLogService.logLogout(parseInt(userId, 10));
      logger.info(`User ${userId} logged out successfully`);
    } catch (error) {
      logger.error('Logout failed:', error);
      throw createError('Logout failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refresh JWT tokens using a valid refresh token
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const newTokens = this.tokenService.refreshTokens(refreshToken);
      return {
        tokens: newTokens,
        message: 'Tokens refreshed successfully',
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw createError('Token refresh failed', 401, ErrorCodes.UNAUTHORIZED);
    }
  }

  /**
   * Generate verification token for email verification, password reset, etc.
   */
  async generateVerificationToken(
    request: VerificationTokenRequest
  ): Promise<VerificationTokenResponse> {
    return this.tokenService.generateVerificationToken(request);
  }

  /**
   * Verify a verification token
   */
  async verifyToken(token: string, purpose?: string): Promise<JWTPayload> {
    return this.tokenService.verifyToken(token, purpose);
  }

  /**
   * Get user information from JWT token
   */
  async getUserFromToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = this.tokenService.verifyAccessToken(token);
      const user = await this.userService.getUserByEmailWithRole(payload.email || '');

      if (!user) {
        return null;
      }

      return {
        id: user.id.toString(),
        email: user.email,
        role: user.role_name || payload.role || 'user',
        isActive: user.status === 'active',
      };
    } catch (error) {
      logger.debug('Failed to get user from token:', error);
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
    return this.passwordService.changePassword(userId, currentPassword, newPassword);
  }

  /**
   * Reset password using verification token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    return this.passwordService.resetPassword(token, newPassword);
  }

  /**
   * Validate token and get user (utility method for middleware)
   */
  async validateTokenAndGetUser(token: string): Promise<AuthenticatedUser | null> {
    return this.getUserFromToken(token);
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
      return role === 'user';
    } catch (error) {
      logger.error('Role check failed:', error);
      return false;
    }
  }

  /**
   * Check if user has a specific permission
   */
  async userHasPermission(userId: number, permission: string): Promise<boolean> {
    try {
      return await this.permissionService.checkUserPermission(userId, permission);
    } catch (error) {
      logger.error(`Error checking user permission: ${error}`);
      return false;
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async userHasAnyPermission(
    userId: number,
    permissions: string[]
  ): Promise<PermissionCheckResult> {
    try {
      return await this.permissionService.checkUserAnyPermission(userId, permissions);
    } catch (error) {
      logger.error(`Error checking user any permission: ${error}`);
      return {
        has_permission: false,
        checked_permissions: permissions,
        granted_permissions: [],
        user_id: userId,
      };
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  async userHasAllPermissions(
    userId: number,
    permissions: string[]
  ): Promise<PermissionCheckResult> {
    try {
      return await this.permissionService.checkUserAllPermissions(userId, permissions);
    } catch (error) {
      logger.error(`Error checking user all permissions: ${error}`);
      return {
        has_permission: false,
        checked_permissions: permissions,
        granted_permissions: [],
        user_id: userId,
      };
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    try {
      return await this.permissionService.getUserPermissionNames(userId);
    } catch (error) {
      logger.error(`Error getting user permissions for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Check if user has role-based access
   */
  async checkRolePermissions(userId: number, roleId: number): Promise<boolean> {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user?.role_id) {
        return false;
      }
      return user.role_id === roleId;
    } catch (error) {
      logger.error(`Error checking role permissions for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get service statistics for monitoring
   */
  getServiceStats(): {
    lockoutStats: { totalLockouts: number; activeLockouts: number };
    tokenStats: { totalTokens: number; expiredTokens: number };
    loginStats: { totalAttempts: number; successfulLogins: number; failedLogins: number };
    registrationStats: { totalRegistrations: number; successfulRegistrations: number };
  } {
    return {
      lockoutStats: this.lockoutService.getLockoutStats(),
      tokenStats: this.tokenService.getTokenStats(),
      loginStats: this.loginService.getLoginStats(),
      registrationStats: this.registrationService.getRegistrationStats(),
    };
  }

  /**
   * Cleanup method for graceful shutdown
   */
  destroy(): void {
    this.lockoutService.destroy();
    logger.info('AuthService destroyed');
  }
}
