/**
 * Email Verification Service
 *
 * Handles email verification token management, including token generation,
 * validation, cleanup, and statistics. Provides secure token lifecycle management.
 *
 * @module src/services/EmailVerificationService
 */

import {
  EmailVerificationToken,
  CreateEmailVerificationTokenRequest,
  VerifyEmailVerificationTokenRequest,
  EmailVerificationServiceResult,
  TokenCleanupResult,
  TokenStatistics,
  EmailVerificationConfig,
} from '@/types/emailVerification';
import { UserService } from './UserService';
import { EmailVerificationValidator } from '@/validators/emailVerificationValidator';
import { logger } from '@/utils/logger';
import { generateUUID } from '@/utils/uuid';
import { mailer } from '@/mails';

export class EmailVerificationService {
  private userService: UserService;
  private config: EmailVerificationConfig;

  constructor(config: Partial<EmailVerificationConfig> = {}) {
    this.userService = new UserService();
    this.config = {
      token_expiry_hours: 24,
      max_tokens_per_user: 5,
      cleanup_expired_after_hours: 168,
      allow_multiple_active_tokens: false,
      ...config,
    };
  }

  /**
   * Create email verification token for user
   */
  async createToken(
    request: CreateEmailVerificationTokenRequest
  ): Promise<EmailVerificationServiceResult> {
    try {
      // Validate request
      const validation = EmailVerificationValidator.validateCreateTokenRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid token creation request',
          token: null,
          user_id: null,
          message: 'Token creation failed',
        };
      }

      const sanitizedRequest = EmailVerificationValidator.sanitizeCreateTokenData(request);

      // Check if user exists
      const user = await this.userService.getUserById(sanitizedRequest.user_id);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          token: null,
          user_id: null,
          message: 'User not found',
        };
      }

      // Check if user email is already verified
      if (user.email_verified_at) {
        return {
          success: false,
          error: 'Email is already verified',
          token: null,
          user_id: null,
          message: 'Email is already verified',
        };
      }

      // Check token limit per user
      const existingTokens = await this.getActiveTokensForUser(sanitizedRequest.user_id);
      if (existingTokens.length >= this.config.max_tokens_per_user) {
        return {
          success: false,
          error: `Maximum tokens (${this.config.max_tokens_per_user}) reached for this user`,
          token: null,
          user_id: null,
          message: 'Token limit exceeded',
        };
      }

      // Generate token
      const token = generateUUID();
      const expiresAt = new Date(
        Date.now() +
          (sanitizedRequest.expires_in_hours || this.config.token_expiry_hours) * 60 * 60 * 1000
      );

      // Create token record (this would be implemented in a model)
      const tokenRecord: EmailVerificationToken = {
        id: 0, // Will be set by database
        token,
        user_id: sanitizedRequest.user_id,
        type: sanitizedRequest.type,
        is_used: false,
        expires_at: expiresAt,
        used_at: null,
        ip_address: sanitizedRequest.ip_address || null,
        user_agent: sanitizedRequest.user_agent || null,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // TODO: Implement token storage in database
      // const savedToken = await this.tokenModel.create(tokenRecord);

      logger.info(`Email verification token created for user ${sanitizedRequest.user_id}`);

      return {
        success: true,
        error: '',
        token: tokenRecord,
        user_id: sanitizedRequest.user_id,
        message: 'Token created successfully',
      };
    } catch (error) {
      logger.error('Error creating email verification token:', error);
      return {
        success: false,
        error: 'Failed to create verification token',
        token: null,
        user_id: null,
        message: 'Token creation failed',
      };
    }
  }

  /**
   * Verify email verification token
   */
  async verifyToken(
    request: VerifyEmailVerificationTokenRequest
  ): Promise<EmailVerificationServiceResult> {
    try {
      // Validate request
      const validation = EmailVerificationValidator.validateVerifyTokenRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid token verification request',
          token: null,
          user_id: null,
          message: 'Token verification failed',
        };
      }

      const sanitizedRequest = EmailVerificationValidator.sanitizeVerifyTokenData(request);

      // Find token
      const token = await this.findTokenByValue(sanitizedRequest.token);
      if (!token) {
        return {
          success: false,
          error: 'Invalid or expired verification token',
          token: null,
          user_id: null,
          message: 'Token not found',
        };
      }

      // Validate token
      const tokenValidation = EmailVerificationValidator.validateToken(token);
      if (!tokenValidation.isValid) {
        return {
          success: false,
          error: tokenValidation.errors[0]?.message || 'Token validation failed',
          token: null,
          user_id: null,
          message: 'Token validation failed',
        };
      }

      // Check if token is already used
      if (token.is_used) {
        return {
          success: false,
          error: 'Token has already been used',
          token: null,
          user_id: null,
          message: 'Token already used',
        };
      }

      // Check if token is expired
      if (token.expires_at < new Date()) {
        return {
          success: false,
          error: 'Token has expired',
          token: null,
          user_id: null,
          message: 'Token expired',
        };
      }

      // Mark token as used
      token.is_used = true;
      token.used_at = new Date();
      token.updated_at = new Date();

      // TODO: Update token in database
      // await this.tokenModel.update(token.id, token);

      // Update user email verification status
      await this.userService.updateUser(token.user_id, {
        email_verified_at: new Date(),
      });

      logger.info(`Email verified for user ${token.user_id}`);

      return {
        success: true,
        error: '',
        token,
        user_id: token.user_id,
        message: 'Email verified successfully',
      };
    } catch (error) {
      logger.error('Error verifying email verification token:', error);
      return {
        success: false,
        error: 'Failed to verify token',
        token: null,
        user_id: null,
        message: 'Token verification failed',
      };
    }
  }

  /**
   * Send verification email to user
   */
  async sendVerificationEmail(
    userId: number,
    token: string,
    userEmail: string,
    userName?: string
  ): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`;

      // Get user details if userName is not provided
      let displayName = userName;
      if (!displayName) {
        const user = await this.userService.getUserById(userId);
        displayName = user?.name || user?.email?.split('@')[0] || 'User';
      }

      // Use the new professional email template
      await mailer.sendEmailVerificationTemplate(
        userEmail,
        displayName,
        token,
        verificationUrl,
        this.config.token_expiry_hours
      );

      logger.info(`Verification email sent to user ${userId} using new template`);
      return true;
    } catch (error) {
      logger.error(`Failed to send verification email to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Send verification email with custom configuration
   */
  async sendCustomVerificationEmail(
    userId: number,
    token: string,
    userEmail: string,
    options: {
      userName?: string;
      customUrl?: string;
      expiryHours?: number;
    } = {}
  ): Promise<boolean> {
    try {
      const verificationUrl =
        options.customUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`;
      const expiryHours = options.expiryHours || this.config.token_expiry_hours;

      // Get user details if userName is not provided
      let displayName = options.userName;
      if (!displayName) {
        const user = await this.userService.getUserById(userId);
        displayName = user?.name || user?.email?.split('@')[0] || 'User';
      }

      // Use the new professional email template
      await mailer.sendEmailVerificationTemplate(
        userEmail,
        displayName,
        token,
        verificationUrl,
        expiryHours
      );

      logger.info(`Custom verification email sent to user ${userId} using new template`);
      return true;
    } catch (error) {
      logger.error(`Failed to send custom verification email to user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<TokenCleanupResult> {
    try {
      const expiredTokens = await this.findExpiredTokens();
      let deletedCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for (const token of expiredTokens) {
        // TODO: Delete token from database
        // await this.tokenModel.delete(token.id);
        deletedCount++;
      }

      logger.info(`Cleaned up ${deletedCount} expired tokens`);

      return {
        deleted_count: deletedCount,
        message: `Cleaned up ${deletedCount} expired tokens`,
      };
    } catch (error) {
      logger.error('Error cleaning up expired tokens:', error);
      return {
        deleted_count: 0,
        message: 'Failed to cleanup expired tokens',
      };
    }
  }

  /**
   * Get token statistics
   */
  async getTokenStatistics(): Promise<TokenStatistics> {
    try {
      const allTokens = await this.getAllTokens();
      const activeTokens = allTokens.filter(
        token => !token.is_used && token.expires_at > new Date()
      );
      const expiredTokens = allTokens.filter(token => token.expires_at < new Date());
      const usedTokens = allTokens.filter(token => token.is_used);

      return {
        total_tokens: allTokens.length,
        active_tokens: activeTokens.length,
        expired_tokens: expiredTokens.length,
        used_tokens: usedTokens.length,
        email_verification_tokens: allTokens.filter(token => token.type === 'email_verification')
          .length,
        password_reset_tokens: allTokens.filter(token => token.type === 'password_reset').length,
      };
    } catch (error) {
      logger.error('Error getting token statistics:', error);
      return {
        total_tokens: 0,
        active_tokens: 0,
        expired_tokens: 0,
        used_tokens: 0,
        email_verification_tokens: 0,
        password_reset_tokens: 0,
      };
    }
  }

  /**
   * Get active tokens for a user
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getActiveTokensForUser(userId: number): Promise<EmailVerificationToken[]> {
    // TODO: Implement database query
    // return await this.tokenModel.findActiveByUserId(userId);
    return [];
  }

  /**
   * Find token by value
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async findTokenByValue(tokenValue: string): Promise<EmailVerificationToken | null> {
    // TODO: Implement database query
    // return await this.tokenModel.findByToken(tokenValue);
    return null;
  }

  /**
   * Find expired tokens
   */
  private async findExpiredTokens(): Promise<EmailVerificationToken[]> {
    // TODO: Implement database query
    // return await this.tokenModel.findExpired();
    return [];
  }

  /**
   * Get all tokens
   */
  private async getAllTokens(): Promise<EmailVerificationToken[]> {
    // TODO: Implement database query
    // return await this.tokenModel.findAll();
    return [];
  }
}
