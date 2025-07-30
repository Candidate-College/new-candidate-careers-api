/**
 * In-Memory Session Store
 *
 * This module provides an in-memory implementation of the session store
 * with efficient lookups and proper indexing for production-like behavior.
 *
 * @module src/stores/InMemorySessionStore
 */

import { ISessionStore, Session, SessionStats } from '@/types/session';
import { logger } from '@/utils/logger';

/**
 * In-Memory Session Store Implementation
 *
 * Provides efficient O(1) lookups with proper indexing and cleanup.
 * Suitable for development and testing environments.
 */
export class InMemorySessionStore implements ISessionStore {
  private sessions = new Map<string, Session>();
  private userSessions = new Map<string, Set<string>>();
  private refreshTokenToSessionId = new Map<string, string>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private config: {
    cleanupInterval: number;
    maxSessionsPerUser: number;
  };

  constructor(config: { cleanupInterval: number; maxSessionsPerUser: number }) {
    this.config = config;
  }

  /**
   * Initialize the store with cleanup interval
   */
  async initialize(): Promise<void> {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredSessions();
      }, this.config.cleanupInterval);
      logger.info('In-memory session store initialized with cleanup interval');
    }
  }

  /**
   * Find session by ID
   */
  async findById(sessionId: string): Promise<Session | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Find session by refresh token (O(1) lookup)
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const sessionId = this.refreshTokenToSessionId.get(refreshToken);
    if (!sessionId) {
      return null;
    }
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Save session with proper indexing and cleanup of old refresh tokens
   */
  async save(session: Session): Promise<void> {
    const existingSession = this.sessions.get(session.id);
    if (existingSession && existingSession.refreshToken !== session.refreshToken) {
      // If the session exists and the refresh token has changed, clean up the old index
      this.refreshTokenToSessionId.delete(existingSession.refreshToken);
    }

    this.sessions.set(session.id, session);

    // Index by user
    let userSessions = this.userSessions.get(session.userId);
    if (!userSessions) {
      userSessions = new Set();
      this.userSessions.set(session.userId, userSessions);
    }
    userSessions.add(session.id);

    // Index by new refresh token
    this.refreshTokenToSessionId.set(session.refreshToken, session.id);

    logger.debug(`Session ${session.id} saved and indexed`);
  }

  /**
   * Delete session and clean up indexes
   */
  async delete(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Remove from refresh token index
      this.refreshTokenToSessionId.delete(session.refreshToken);

      // Remove from user sessions index
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }

      // Remove from main sessions map
      this.sessions.delete(sessionId);

      logger.debug(`Session ${sessionId} deleted and indexes cleaned`);
    }
  }

  /**
   * Get all sessions for a user
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) {
      return [];
    }

    const sessions: Session[] = [];
    for (const sessionId of userSessions) {
      const session = this.sessions.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Get all active sessions
   */
  async findActiveSessions(): Promise<Session[]> {
    const activeSessions: Session[] = [];
    for (const session of this.sessions.values()) {
      if (session.isActive) {
        activeSessions.push(session);
      }
    }
    return activeSessions;
  }

  /**
   * Get session statistics
   */
  async getStats(): Promise<SessionStats> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    let sessionsCreatedLastHour = 0;
    let sessionsExpiredLastHour = 0;
    let totalDuration = 0;
    let activeSessions = 0;

    for (const session of this.sessions.values()) {
      if (session.isActive) {
        activeSessions++;
        totalDuration += now.getTime() - session.createdAt.getTime();
      }

      if (session.createdAt > oneHourAgo) {
        sessionsCreatedLastHour++;
      }

      if (!session.isActive && session.lastActivity > oneHourAgo) {
        sessionsExpiredLastHour++;
      }
    }

    return {
      totalSessions: activeSessions,
      sessionsPerUser: new Map(
        Array.from(this.userSessions.entries()).map(([userId, sessions]) => [userId, sessions.size])
      ),
      averageSessionDuration: activeSessions > 0 ? totalDuration / activeSessions : 0,
      sessionsCreatedLastHour,
      sessionsExpiredLastHour,
    };
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt || !session.isActive) {
        await this.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
    }

    return cleanedCount;
  }

  /**
   * Shutdown the store
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.sessions.clear();
    this.userSessions.clear();
    this.refreshTokenToSessionId.clear();
    logger.info('In-memory session store shutdown');
  }

  /**
   * Get session count for a user (for limit checking)
   */
  async getUserSessionCount(userId: string): Promise<number> {
    const userSessions = this.userSessions.get(userId);
    return userSessions ? userSessions.size : 0;
  }

  /**
   * Update session's last activity
   */
  async updateLastActivity(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Invalidate all sessions for a user (optimized for database stores)
   */
  async invalidateAllByUserId(userId: string): Promise<void> {
    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      // Mark all sessions as inactive in a single operation
      for (const sessionId of userSessions) {
        const session = this.sessions.get(sessionId);
        if (session) {
          session.isActive = false;
          this.sessions.set(sessionId, session);
        }
      }
      // Clear the user sessions index
      this.userSessions.delete(userId);
      logger.info(`All sessions invalidated for user ${userId}`);
    }
  }
}
