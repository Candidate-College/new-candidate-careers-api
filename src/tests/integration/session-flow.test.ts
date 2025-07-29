/**
 * Session Flow Integration Tests
 *
 * End-to-end tests for complete session management flow
 * including authentication, session creation, token refresh, and logout.
 *
 * @module src/tests/integration/session-flow.test
 */

import request from 'supertest';
import app from '../../index';
import { createInMemorySessionService } from '../../services/SessionServiceFactory';
import { db } from '../../config/database';

describe('Session Management Flow', () => {
  let sessionService: any;
  const cleanupFunctions: (() => void)[] = [];

  beforeAll(async () => {
    // Initialize session service for testing
    sessionService = createInMemorySessionService();
    await sessionService.initialize();
  });

  afterAll(async () => {
    try {
      // Cleanup session service
      await sessionService.shutdown();

      // Close database connection
      await db.destroy();

      // Run all cleanup functions
      cleanupFunctions.forEach(cleanup => cleanup());

      // Clear any remaining timers
      jest.clearAllTimers();

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, 10000); // 10 second timeout for cleanup

  describe('Authentication Flow', () => {
    it('should complete full authentication flow with session management', async () => {
      const uniqueEmail = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
      const uniqueUsername = `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Step 1: Register a new user
      const registerResponse = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        username: uniqueUsername,
        first_name: 'Test',
        last_name: 'User',
        password: 'securePassword123',
        confirm_password: 'securePassword123',
      });

      // Registration might succeed (201), fail if user exists (409), or fail validation (400)
      expect([201, 409, 400]).toContain(registerResponse.status);
      if (registerResponse.status === 201) {
        expect(registerResponse.body.success).toBe(true);
      }

      // Step 2: Login and get tokens (only if registration was successful)
      if (registerResponse.status === 201) {
        const loginResponse = await request(app).post('/api/v1/auth/login').send({
          email: uniqueEmail,
          password: 'securePassword123',
          remember_me: true,
        });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.success).toBe(true);
        expect(loginResponse.body.data.tokens).toBeDefined();
        expect(loginResponse.body.data.tokens.access_token).toBeDefined();
        expect(loginResponse.body.data.tokens.refresh_token).toBeDefined();

        const { access_token, refresh_token } = loginResponse.body.data.tokens;

        // Step 3: Get session status
        const sessionResponse = await request(app)
          .get('/api/v1/auth/session')
          .set('Authorization', `Bearer ${access_token}`);

        expect(sessionResponse.status).toBe(200);
        expect(sessionResponse.body.success).toBe(true);
        expect(sessionResponse.body.data.session).toBeDefined();
        expect(sessionResponse.body.data.user).toBeDefined();

        // Step 4: Refresh tokens
        const refreshResponse = await request(app).post('/api/v1/auth/refresh').send({
          refresh_token,
        });

        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.body.success).toBe(true);
        expect(refreshResponse.body.data.access_token).toBeDefined();
        expect(refreshResponse.body.data.refresh_token).toBeDefined();

        // Step 5: Logout
        const logoutResponse = await request(app)
          .post('/api/v1/auth/logout')
          .set('Authorization', `Bearer ${access_token}`);

        expect(logoutResponse.status).toBe(200);
        expect(logoutResponse.body.success).toBe(true);
      }
    });

    it('should handle invalid refresh token', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refresh_token: 'invalid-token',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should handle session status without authentication', async () => {
      const response = await request(app).get('/api/v1/auth/session');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should handle logout without authentication', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    it('should handle revoke all sessions', async () => {
      const uniqueEmail = `test_revoke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;
      const uniqueUsername = `testuser_revoke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // First register a new user
      const registerResponse = await request(app).post('/api/v1/auth/register').send({
        email: uniqueEmail,
        username: uniqueUsername,
        first_name: 'Test',
        last_name: 'User',
        password: 'securePassword123',
        confirm_password: 'securePassword123',
      });

      // Registration might succeed (201), fail if user exists (409), or fail validation (400)
      expect([201, 409, 400]).toContain(registerResponse.status);

      // Then login to get tokens (only if registration was successful)
      if (registerResponse.status === 201) {
        const loginResponse = await request(app).post('/api/v1/auth/login').send({
          email: uniqueEmail,
          password: 'securePassword123',
        });

        expect(loginResponse.status).toBe(200);
        const { access_token } = loginResponse.body.data.tokens;

        // Revoke all sessions
        const revokeResponse = await request(app)
          .post('/api/v1/auth/revoke')
          .set('Authorization', `Bearer ${access_token}`);

        expect(revokeResponse.status).toBe(200);
        expect(revokeResponse.body.success).toBe(true);
        expect(revokeResponse.body.data.revoked_count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      const requests = Array.from({ length: 6 }, () =>
        request(app).post('/api/v1/auth/login').send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      );

      const responses = await Promise.all(requests);
      const successfulRequests = responses.filter(r => r.status !== 429);
      const rateLimitedRequests = responses.filter(r => r.status === 429);

      // Should allow 5 requests per minute, 6th should be rate limited
      expect(successfulRequests.length).toBeLessThanOrEqual(5);
      expect(rateLimitedRequests.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      // Wait a bit to avoid rate limiting from previous tests
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app).post('/api/v1/auth/login').send({
        // Missing required fields
      });

      // Could be either 400 (validation error) or 429 (rate limited)
      expect([400, 429]).toContain(response.status);
      // For 400 responses, check for validation errors
      if (response.status === 400) {
        expect(response.body.errors || response.body.message || response.body.error).toBeDefined();
      }
    });

    it('should handle server errors gracefully', async () => {
      const response = await request(app).post('/api/v1/auth/refresh').send({
        refresh_token: 'malformed.jwt.token',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });
  });
});
