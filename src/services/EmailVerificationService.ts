/**
 * Email Verification Service
 *
 * Handles email verification token management, including token generation,
 * validation, cleanup, and statistics. Provides secure token lifecycle management.
 *
 * @module src/services/EmailVerificationService
 */

import {
  CreateEmailVerificationTokenRequest,
  VerifyEmailVerificationTokenRequest,
  EmailVerificationServiceResult,
  TokenCleanupResult,
  TokenStatistics,
  EmailVerificationConfig,
} from '@/types/emailVerification';
import { EmailVerificationTokenModel, UserModel } from '@/models';
import { EmailVerificationValidator } from '@/validators/emailVerificationValidator';
import { logger } from '@/utils/logger';
import { generateUUID } from '@/utils/uuid';
import { mailer } from '@/mails';

export class EmailVerificationService {
  private tokenModel: EmailVerificationTokenModel;
  private userModel: UserModel;
  private config: EmailVerificationConfig;

  constructor(config: Partial<EmailVerificationConfig> = {}) {
    this.tokenModel = new EmailVerificationTokenModel();
    this.userModel = new UserModel();
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
      logger.info(`Creating email verification token for user ${request.user_id}`);

      // Validate request
      const validation = EmailVerificationValidator.validateCreateTokenRequest(request);
      if (!validation.isValid) {
        logger.error(`Token creation validation failed:`, validation.errors);
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid token creation request',
          token: null,
          user_id: null,
          message: 'Token creation failed',
        };
      }

      const sanitizedRequest = EmailVerificationValidator.sanitizeCreateTokenData(request);
      logger.info(`Sanitized request:`, sanitizedRequest);

      // Check if user exists
      const user = await this.userModel.findById(sanitizedRequest.user_id);
      if (!user) {
        logger.error(`User not found: ${sanitizedRequest.user_id}`);
        return {
          success: false,
          error: 'User not found',
          token: null,
          user_id: null,
          message: 'User not found',
        };
      }

      logger.info(`User found: ${user.email}`);

      // Check if user email is already verified
      if (user.email_verified_at) {
        logger.warn(`Email already verified for user ${sanitizedRequest.user_id}`);
        return {
          success: false,
          error: 'Email is already verified',
          token: null,
          user_id: null,
          message: 'Email is already verified',
        };
      }

      // Check token limit per user
      const existingTokens = await this.tokenModel.findActiveByUserId(sanitizedRequest.user_id);
      logger.info(
        `Found ${existingTokens.length} existing tokens for user ${sanitizedRequest.user_id}`
      );

      if (existingTokens.length >= this.config.max_tokens_per_user) {
        logger.warn(`Token limit exceeded for user ${sanitizedRequest.user_id}`);
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

      logger.info(`Generated token: ${token}`);
      logger.info(`Token expires at: ${expiresAt}`);

      // Create token record
      const tokenData: {
        token: string;
        user_id: number;
        type: 'email_verification' | 'password_reset';
        expires_at: Date;
        ip_address?: string;
        user_agent?: string;
      } = {
        token,
        user_id: sanitizedRequest.user_id,
        type: sanitizedRequest.type,
        expires_at: expiresAt,
      };

      if (sanitizedRequest.ip_address) {
        tokenData.ip_address = sanitizedRequest.ip_address;
      }

      if (sanitizedRequest.user_agent) {
        tokenData.user_agent = sanitizedRequest.user_agent;
      }

      logger.info(`Creating token record:`, tokenData);

      const tokenRecord = await this.tokenModel.createToken(tokenData);

      logger.info(`Token record created successfully:`, tokenRecord);

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
      logger.info(`Starting token verification for token: ${request.token.substring(0, 8)}...`);

      // Validate request
      const validation = EmailVerificationValidator.validateVerifyTokenRequest(request);
      if (!validation.isValid) {
        logger.error(`Token verification validation failed:`, validation.errors);
        return {
          success: false,
          error: validation.errors[0]?.message || 'Invalid token verification request',
          token: null,
          user_id: null,
          message: 'Token verification failed',
        };
      }

      const sanitizedRequest = EmailVerificationValidator.sanitizeVerifyTokenData(request);
      logger.info(`Sanitized verification request:`, {
        token: sanitizedRequest.token.substring(0, 8) + '...',
      });

      // Find token
      logger.info(`Searching for token in database...`);
      const token = await this.tokenModel.findByToken(sanitizedRequest.token);
      if (!token) {
        logger.warn(`Token not found in database: ${sanitizedRequest.token.substring(0, 8)}...`);
        return {
          success: false,
          error: 'Invalid or expired verification token',
          token: null,
          user_id: null,
          message: 'Token not found',
        };
      }

      logger.info(`Token found in database:`, {
        token_id: token.id,
        user_id: token.user_id,
        type: token.type,
        is_used: token.is_used,
        expires_at: token.expires_at,
      });

      // Validate token
      const tokenValidation = EmailVerificationValidator.validateToken(token);
      if (!tokenValidation.isValid) {
        logger.error(`Token validation failed:`, tokenValidation.errors);
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
        logger.warn(`Token already used: ${token.id}`);
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
        logger.warn(`Token expired: ${token.id}, expires_at: ${token.expires_at}`);
        return {
          success: false,
          error: 'Token has expired',
          token: null,
          user_id: null,
          message: 'Token expired',
        };
      }

      logger.info(
        `Token validation passed, proceeding with verification for user ${token.user_id}`
      );

      // Mark token as used
      await this.tokenModel.markAsUsed(token.id);
      logger.info(`Token marked as used: ${token.id}`);

      // Update user email verification status
      logger.info(`Updating user ${token.user_id} email verification status`);
      const userId =
        typeof token.user_id === 'string' ? parseInt(token.user_id, 10) : token.user_id;
      const updatedUser = await this.userModel.updateUser(userId, {
        email_verified_at: new Date(),
        status: 'active',
      });

      if (!updatedUser) {
        logger.error(`Failed to update user ${userId} - user not found`);
        return {
          success: false,
          error: 'Invalid user ID',
          token: null,
          user_id: null,
          message: 'User not found',
        };
      }

      logger.info(`Email verified for user ${userId}`);

      return {
        success: true,
        error: '',
        token,
        user_id: userId,
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
      logger.info(`Starting email verification for user ${userId}`);

      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email`;

      // Get user details if userName is not provided
      let displayName = userName;
      if (!displayName) {
        const user = await this.userModel.findById(userId);
        displayName = user?.name || user?.email?.split('@')[0] || 'User';
      }

      // Use the enhanced verification email template
      await mailer.sendVerificationEmail(
        userEmail,
        token,
        verificationUrl,
        displayName,
        this.config.token_expiry_hours
      );

      logger.info(`Verification email sent successfully to user ${userId}`);
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
        const user = await this.userModel.findById(userId);
        displayName = user?.name || user?.email?.split('@')[0] || 'User';
      }

      // Use the enhanced verification email template
      await mailer.sendVerificationEmail(
        userEmail,
        token,
        verificationUrl,
        displayName,
        expiryHours
      );

      logger.info(`Custom verification email sent to user ${userId} using enhanced template`);
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
      const expiredTokens = await this.tokenModel.findExpired();
      let deletedCount = 0;

      for (const token of expiredTokens) {
        await this.tokenModel.deleteToken(token.id);
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
      return await this.tokenModel.getStatistics();
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
}
