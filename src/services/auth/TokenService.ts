import { JWTUtils } from '@/utils/jwt';
import { logger } from '@/utils/logger';
import {
  JWTUser,
  JWTPayload,
  TokenPair,
  VerificationTokenRequest,
  VerificationTokenResponse,
} from '@/types/jwt';
import { createError } from '@/utils/errors';
import { ErrorCodes } from '@/types/errors';
import { db } from '@/config/database';

/**
 * TokenService handles all JWT token operations
 * Extracted from AuthService to follow single responsibility principle
 */
export class TokenService {
  constructor(private readonly database = db) {}

  /**
   * Generate token pair for user authentication
   */
  generateTokenPair(user: JWTUser): TokenPair {
    try {
      logger.debug(`Generating token pair for user: ${user.id}`);
      const tokens = JWTUtils.generateTokenPair(user);
      logger.info(`Token pair generated successfully for user: ${user.id}`);
      return tokens;
    } catch (error) {
      logger.error('Failed to generate token pair:', error);
      throw createError('Token generation failed', 500, ErrorCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refresh tokens using a valid refresh token
   */
  refreshTokens(refreshToken: string): TokenPair {
    try {
      logger.debug('Token refresh attempt');
      const newTokens = JWTUtils.refreshTokens(refreshToken);
      logger.info('Tokens refreshed successfully');
      return newTokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw createError('Token refresh failed', 401, ErrorCodes.UNAUTHORIZED);
    }
  }

  /**
   * Generate verification token for email verification, password reset, etc.
   */
  generateVerificationToken(request: VerificationTokenRequest): VerificationTokenResponse {
    try {
      const { userId, purpose, email } = request;
      logger.info(`Generating ${purpose} token for user: ${userId}`);

      const token = JWTUtils.generateVerificationToken(userId, purpose, email);
      const expirationTime = JWTUtils.getTokenExpiration(token);

      if (!expirationTime) {
        throw createError(
          'Failed to determine token expiration',
          500,
          ErrorCodes.INTERNAL_SERVER_ERROR
        );
      }

      logger.info(`Generated ${purpose} token for user ${userId}`);

      return {
        token,
        expiresAt: expirationTime,
        message: `${purpose} token generated successfully`,
      };
    } catch (error) {
      logger.error('Verification token generation failed:', error);
      throw createError(
        'Verification token generation failed',
        500,
        ErrorCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Verify a verification token
   */
  verifyToken(token: string, purpose?: string): JWTPayload {
    try {
      logger.debug(`Verifying ${purpose || 'verification'} token`);
      const payload = JWTUtils.verifyVerificationToken(token, purpose);
      logger.info(`${purpose || 'Verification'} token verified for user ${payload.sub}`);
      return payload;
    } catch (error) {
      logger.error('Token verification failed:', error);
      throw createError('Token verification failed', 401, ErrorCodes.UNAUTHORIZED);
    }
  }

  /**
   * Verify access token and extract payload
   */
  verifyAccessToken(token: string): JWTPayload {
    try {
      logger.debug('Verifying access token');
      const payload = JWTUtils.verifyToken(token, 'access');
      logger.debug(`Access token verified for user: ${payload.sub}`);
      return payload;
    } catch (error) {
      logger.error('Access token verification failed:', error);
      throw createError('Invalid access token', 401, ErrorCodes.UNAUTHORIZED);
    }
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      return JWTUtils.isTokenExpired(token);
    } catch (error) {
      logger.debug('Token expiration check failed:', error);
      return true; // Assume expired if we can't verify
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    try {
      return JWTUtils.getTokenExpiration(token);
    } catch (error) {
      logger.debug('Failed to get token expiration:', error);
      return null;
    }
  }

  /**
   * Get time until token expiration in milliseconds
   */
  getTimeUntilExpiration(token: string): number | null {
    try {
      return JWTUtils.getTimeUntilExpiration(token);
    } catch (error) {
      logger.debug('Failed to get time until expiration:', error);
      return null;
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): JWTPayload | null {
    try {
      return JWTUtils.decodeToken(token);
    } catch (error) {
      logger.debug('Token decode failed:', error);
      return null;
    }
  }

  /**
   * Extract user information from JWT payload
   */
  extractUserFromPayload(payload: JWTPayload): JWTUser {
    try {
      return JWTUtils.extractUser(payload);
    } catch (error) {
      logger.error('Failed to extract user from payload:', error);
      throw createError('Invalid token payload', 401, ErrorCodes.UNAUTHORIZED);
    }
  }

  /**
   * Validate token format and structure
   */
  validateTokenFormat(token: string): boolean {
    try {
      const decoded = JWTUtils.decodeToken(token);
      return decoded !== null && typeof decoded === 'object';
    } catch (error) {
      logger.debug('Token format validation failed:', error);
      return false;
    }
  }

  /**
   * Get token statistics for monitoring
   */
  async getTokenStats(): Promise<{ totalTokens: number; expiredTokens: number }> {
    try {
      // Use injected database connection instead of dynamic import
      // Count active sessions (non-expired tokens)
      const activeSessions = await this.database('sessions')
        .where('last_activity', '>', Math.floor(Date.now() / 1000) - 24 * 60 * 60) // Last 24 hours
        .count('* as count')
        .first();

      // Count password reset tokens
      const resetTokens = await this.database('password_reset_tokens')
        .where('created_at', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .count('* as count')
        .first();

      const totalTokens = Number(activeSessions?.count || 0) + Number(resetTokens?.count || 0);
      const expiredTokens = 0; // Would need to track expired tokens separately

      return {
        totalTokens,
        expiredTokens,
      };
    } catch (error) {
      logger.error('Failed to get token statistics:', error);
      return {
        totalTokens: 0,
        expiredTokens: 0,
      };
    }
  }
}
