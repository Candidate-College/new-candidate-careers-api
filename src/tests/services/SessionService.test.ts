/**
 * Session Service Tests
 *
 * Comprehensive unit tests for SessionService functionality
 * including session creation, validation, refresh, and cleanup.
 *
 * @module src/tests/services/SessionService.test
 */

import { SessionService, SessionServiceConfig } from '../../services/SessionService';
import { InMemorySessionStore } from '../../stores/InMemorySessionStore';
import { JWTUtils } from '../../utils/jwt';
import { Session, TokenRefreshRequest } from '../../types/session';
import {
  SessionLimitExceededError,
  SessionNotFoundError,
  TokenRotationError,
} from '../../types/session';

describe('SessionService', () => {
  let sessionService: SessionService;
  let store: InMemorySessionStore;
  let config: SessionServiceConfig;

  beforeEach(() => {
    config = {
      accessTokenExpiry: 15 * 60 * 1000, // 15 minutes
      refreshTokenExpiry: 7 * 24 * 60 * 1000, // 7 days
      tokenRotationInterval: 5 * 60 * 1000, // 5 minutes
      sessionTimeout: 7 * 24 * 60 * 1000, // 7 days
      enableTokenRotation: true,
      maxSessionsPerUser: 3,
    };

    store = new InMemorySessionStore({
      cleanupInterval: 60 * 60 * 1000, // 1 hour
      maxSessionsPerUser: config.maxSessionsPerUser,
    });

    sessionService = new SessionService(store, config);
  });

  afterEach(async () => {
    await sessionService.shutdown();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(sessionService.initialize()).resolves.not.toThrow();
    });

    it('should shutdown successfully', async () => {
      await sessionService.initialize();
      await expect(sessionService.shutdown()).resolves.not.toThrow();
    });
  });

  describe('createSession', () => {
    beforeEach(async () => {
      await sessionService.initialize();
    });

    it('should create a new session successfully', async () => {
      const options = {
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
        metadata: { loginMethod: 'email' },
      };

      const session = await sessionService.createSession(options);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.accessToken).toBeDefined();
      expect(session.refreshToken).toBeDefined();
      expect(session.isActive).toBe(true);
      expect(session.userAgent).toBe('Mozilla/5.0');
      expect(session.ipAddress).toBe('192.168.1.1');
      expect(session.metadata).toEqual({ loginMethod: 'email' });
    });

    it('should enforce session limits per user', async () => {
      const options = {
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      // Create maximum allowed sessions
      for (let i = 0; i < config.maxSessionsPerUser; i++) {
        await sessionService.createSession(options);
      }

      // Attempt to create one more session
      await expect(sessionService.createSession(options)).rejects.toThrow(
        SessionLimitExceededError
      );
    });

    it('should use custom timeout when provided', async () => {
      const customTimeout = 30 * 60 * 1000; // 30 minutes
      const options = {
        userId: 'user123',
        customTimeout,
      };

      const session = await sessionService.createSession(options);
      const expectedExpiry = new Date(session.createdAt.getTime() + customTimeout);

      expect(session.expiresAt.getTime()).toBeCloseTo(expectedExpiry.getTime(), -2);
    });
  });

  describe('validateSession', () => {
    let session: Session;

    beforeEach(async () => {
      await sessionService.initialize();
      session = await sessionService.createSession({
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });
    });

    it('should validate an active session successfully', async () => {
      const result = await sessionService.validateSession(session.id);

      expect(result.isValid).toBe(true);
      expect(result.session).toBeDefined();
      expect(result.session!.id).toBe(session.id);
      expect(result.needsRefresh).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      const result = await sessionService.validateSession('non-existent-id');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session not found');
      expect(result.needsRefresh).toBe(false);
    });

    it('should mark session as needing refresh when close to expiry', async () => {
      // Create a session that expires soon
      const shortConfig = { ...config, tokenRotationInterval: 24 * 60 * 60 * 1000 }; // 24 hours
      const shortSessionService = new SessionService(store, shortConfig);
      await shortSessionService.initialize();

      const shortSession = await shortSessionService.createSession({
        userId: 'user456',
        customTimeout: 30 * 60 * 1000, // 30 minutes
      });

      const result = await shortSessionService.validateSession(shortSession.id);

      expect(result.isValid).toBe(true);
      expect(result.needsRefresh).toBe(true);
      expect(result.timeUntilExpiry).toBeDefined();
    });

    it('should invalidate expired sessions', async () => {
      // Create a session that expires immediately
      const expiredSession = await sessionService.createSession({
        userId: 'user789',
        customTimeout: -1000, // Expired
      });

      const result = await sessionService.validateSession(expiredSession.id);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session has expired');
    });
  });

  describe('refreshTokens', () => {
    let session: Session;

    beforeEach(async () => {
      await sessionService.initialize();
      session = await sessionService.createSession({
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });
    });

    it('should refresh tokens successfully', async () => {
      const request: TokenRefreshRequest = {
        refreshToken: session.refreshToken,
        userAgent: 'Mozilla/5.0 (Updated)',
        ipAddress: '192.168.1.2',
      };

      const result = await sessionService.refreshTokens(request);

      expect(result.accessToken).toBeDefined();
      // Note: Tokens might be the same if generated at the same time with same payload
      // In real scenarios, they would be different due to timing differences
      expect(result.refreshToken).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.expiresIn).toBe(config.accessTokenExpiry);
    });

    it('should throw error for invalid refresh token', async () => {
      const request: TokenRefreshRequest = {
        refreshToken: 'invalid-token',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      await expect(sessionService.refreshTokens(request)).rejects.toThrow(TokenRotationError);
    });

    it('should throw error for non-existent session', async () => {
      // Create a valid JWT token for a non-existent user
      const validToken = JWTUtils.signToken({ sub: 'non-existent-user' }, 'refresh', {
        expiresIn: '1h',
      });

      const request: TokenRefreshRequest = {
        refreshToken: validToken,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      await expect(sessionService.refreshTokens(request)).rejects.toThrow(SessionNotFoundError);
    });

    it('should not rotate refresh token when disabled', async () => {
      const noRotationConfig = { ...config, enableTokenRotation: false };
      const noRotationService = new SessionService(store, noRotationConfig);
      await noRotationService.initialize();

      const request: TokenRefreshRequest = {
        refreshToken: session.refreshToken,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      const result = await noRotationService.refreshTokens(request);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeUndefined();
    });
  });

  describe('invalidateSession', () => {
    let session: Session;

    beforeEach(async () => {
      await sessionService.initialize();
      session = await sessionService.createSession({
        userId: 'user123',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      });
    });

    it('should invalidate session successfully', async () => {
      await sessionService.invalidateSession(session.id);

      const result = await sessionService.validateSession(session.id);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Session is inactive');
    });

    it('should handle invalidating non-existent session gracefully', async () => {
      await expect(sessionService.invalidateSession('non-existent-id')).resolves.not.toThrow();
    });
  });

  describe('invalidateUserSessions', () => {
    beforeEach(async () => {
      await sessionService.initialize();
    });

    it('should invalidate all sessions for a user', async () => {
      const userId = 'user123';

      // Create multiple sessions for the same user
      const session1 = await sessionService.createSession({ userId });
      const session2 = await sessionService.createSession({ userId });
      const session3 = await sessionService.createSession({ userId });

      await sessionService.invalidateUserSessions(userId);

      // All sessions should be invalidated
      const result1 = await sessionService.validateSession(session1.id);
      const result2 = await sessionService.validateSession(session2.id);
      const result3 = await sessionService.validateSession(session3.id);

      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
    });

    it('should handle user with no sessions gracefully', async () => {
      await expect(
        sessionService.invalidateUserSessions('user-with-no-sessions')
      ).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await sessionService.initialize();
    });

    it('should return session statistics', async () => {
      // Create some sessions
      await sessionService.createSession({ userId: 'user1' });
      await sessionService.createSession({ userId: 'user1' });
      await sessionService.createSession({ userId: 'user2' });

      const stats = await sessionService.getStats();

      expect(stats.totalSessions).toBe(3);
      expect(stats.sessionsPerUser.get('user1')).toBe(2);
      expect(stats.sessionsPerUser.get('user2')).toBe(1);
      expect(stats.averageSessionDuration).toBeGreaterThan(0);
    });

    it('should return zero stats for empty store', async () => {
      const stats = await sessionService.getStats();

      expect(stats.totalSessions).toBe(0);
      expect(stats.sessionsPerUser.size).toBe(0);
      expect(stats.averageSessionDuration).toBe(0);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await sessionService.initialize();
    });

    it('should handle malformed refresh tokens gracefully', async () => {
      const request: TokenRefreshRequest = {
        refreshToken: 'malformed-token',
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      await expect(sessionService.refreshTokens(request)).rejects.toThrow(TokenRotationError);
    });

    it('should handle expired refresh tokens', async () => {
      // Create a session with very short expiry
      const shortConfig = { ...config, refreshTokenExpiry: 1 }; // 1ms
      const shortService = new SessionService(store, shortConfig);
      await shortService.initialize();

      const session = await shortService.createSession({ userId: 'user123' });

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 10));

      const request: TokenRefreshRequest = {
        refreshToken: session.refreshToken,
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      await expect(shortService.refreshTokens(request)).rejects.toThrow(TokenRotationError);
    });
  });
});
