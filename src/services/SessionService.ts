/**
 * Session Management Service
 *
 * This module provides comprehensive session management functionality
 * including automatic token refresh, session tracking, and cleanup.
 * Uses dependency injection for better testability and scalability.
 *
 * @module src/services/SessionService
 */

import { v4 as uuidv4 } from 'uuid';
import { JWTUtils } from '@/utils/jwt';
import { TokenInvalidError, TokenExpiredError } from '@/types/jwt';
import { logger } from '@/utils/logger';
import {
  Session,
  SessionValidationResult,
  CreateSessionOptions,
  TokenRefreshRequest,
  TokenRefreshResponse,
  SessionStats,
  SessionError,
  SessionNotFoundError,
  TokenRotationError,
  SessionLimitExceededError,
  ISessionStore,
} from '@/types/session';

/**
 * Session service configuration
 */
export interface SessionServiceConfig {
  /** Access token expiry in milliseconds */
  accessTokenExpiry: number;
  /** Refresh token expiry in milliseconds */
  refreshTokenExpiry: number;
  /** Token rotation interval in milliseconds */
  tokenRotationInterval: number;
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Whether to enable token rotation */
  enableTokenRotation: boolean;
  /** Maximum sessions per user */
  maxSessionsPerUser: number;
}

/**
 * Session Management Service
 *
 * Uses dependency injection for better testability and scalability.
 * Supports different storage backends through ISessionStore interface.
 */
export class SessionService {
  private store: ISessionStore;
  private config: SessionServiceConfig;

  constructor(store: ISessionStore, config: SessionServiceConfig) {
    this.store = store;
    this.config = config;
  }

  /**
   * Initialize the session service
   */
  async initialize(): Promise<void> {
    await this.store.initialize();
    logger.info('Session service initialized');
  }

  /**
   * Create a new session for a user
   */
  async createSession(options: CreateSessionOptions): Promise<Session> {
    const { userId, userAgent, ipAddress, metadata, customTimeout } = options;

    // Check session limit
    const userSessionCount = await this.store.getUserSessionCount(userId);
    if (userSessionCount >= this.config.maxSessionsPerUser) {
      throw new SessionLimitExceededError(
        `Maximum sessions (${this.config.maxSessionsPerUser}) exceeded for user ${userId}`
      );
    }

    // Generate tokens
    const accessToken = JWTUtils.signToken({ sub: userId }, 'access', {
      expiresIn: `${this.config.accessTokenExpiry}ms`,
    });
    const refreshToken = JWTUtils.signToken({ sub: userId }, 'refresh', {
      expiresIn: `${this.config.refreshTokenExpiry}ms`,
    });

    // Create session
    const sessionId = uuidv4();
    const now = new Date();
    const timeout = customTimeout || this.config.sessionTimeout;
    const expiresAt = new Date(now.getTime() + timeout);

    const session: Session = {
      id: sessionId,
      userId,
      accessToken,
      refreshToken,
      createdAt: now,
      lastActivity: now,
      expiresAt,
      userAgent,
      ipAddress,
      isActive: true,
      metadata,
    };

    // Save session to store
    await this.store.save(session);

    logger.info(`Session created for user ${userId} with ID ${sessionId}`);
    return session;
  }

  /**
   * Validate a session and check if refresh is needed
   */
  async validateSession(sessionId: string): Promise<SessionValidationResult> {
    const session = await this.store.findById(sessionId);
    if (!session) {
      return {
        isValid: false,
        error: 'Session not found',
        needsRefresh: false,
      };
    }

    if (!session.isActive) {
      return {
        isValid: false,
        error: 'Session is inactive',
        needsRefresh: false,
      };
    }

    const now = new Date();
    if (now > session.expiresAt) {
      await this.invalidateSession(sessionId);
      return {
        isValid: false,
        error: 'Session has expired',
        needsRefresh: false,
      };
    }

    // Update last activity
    await this.store.updateLastActivity(sessionId);

    // Check if token needs refresh
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    const needsRefresh = timeUntilExpiry < this.config.tokenRotationInterval;

    return {
      isValid: true,
      session,
      needsRefresh,
      timeUntilExpiry,
    };
  }

  /**
   * Refresh tokens for a session (O(1) lookup)
   */
  async refreshTokens(request: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    const { refreshToken, userAgent, ipAddress } = request;

    try {
      // Verify refresh token
      const payload = JWTUtils.verifyToken(refreshToken, 'refresh');
      const userId = payload.sub;

      // Find session by refresh token (O(1) lookup)
      const session = await this.store.findByRefreshToken(refreshToken);

      if (!session) {
        throw new SessionNotFoundError('Session not found for refresh token');
      }

      if (session.userId !== userId) {
        throw new SessionError('Token user mismatch', 'TOKEN_USER_MISMATCH', 401);
      }

      // Generate new tokens
      const newAccessToken = JWTUtils.signToken({ sub: userId }, 'access', {
        expiresIn: `${this.config.accessTokenExpiry}ms`,
      });

      let newRefreshToken: string | undefined;
      if (this.config.enableTokenRotation) {
        newRefreshToken = JWTUtils.signToken({ sub: userId }, 'refresh', {
          expiresIn: `${this.config.refreshTokenExpiry}ms`,
        });
      }

      // Update session
      session.accessToken = newAccessToken;
      if (newRefreshToken) {
        session.refreshToken = newRefreshToken;
      }
      session.lastActivity = new Date();
      session.userAgent = userAgent;
      session.ipAddress = ipAddress;

      await this.store.save(session);

      logger.info(`Tokens refreshed for session ${session.id}`);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        session,
        expiresIn: this.config.accessTokenExpiry,
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);

      // Re-throw specific session errors
      if (error instanceof SessionNotFoundError) {
        throw error;
      }

      // For JWT verification errors, throw TokenRotationError
      if (error instanceof TokenInvalidError || error instanceof TokenExpiredError) {
        throw new TokenRotationError((error as Error).message);
      }

      throw new TokenRotationError(error instanceof Error ? error.message : 'Token refresh failed');
    }
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const session = await this.store.findById(sessionId);
    if (session) {
      session.isActive = false;
      await this.store.save(session);
      logger.info(`Session ${sessionId} invalidated`);
    }
  }

  /**
   * Invalidate all sessions for a user (optimized to prevent N+1 queries)
   */
  async invalidateUserSessions(userId: string): Promise<void> {
    await this.store.invalidateAllByUserId(userId);
    logger.info(`All sessions invalidated for user ${userId}`);
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    return await this.store.getStats();
  }

  /**
   * Shutdown session service
   */
  async shutdown(): Promise<void> {
    await this.store.shutdown();
    logger.info('Session service shutdown');
  }

  /**
   * Get session store instance (for testing)
   */
  getStore(): ISessionStore {
    return this.store;
  }
}
