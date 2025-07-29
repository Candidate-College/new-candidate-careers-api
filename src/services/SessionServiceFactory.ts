/**
 * Session Service Factory
 *
 * This module provides factory functions to create SessionService instances
 * with proper configuration and store setup for different environments.
 *
 * @module src/services/SessionServiceFactory
 */

import { SessionService, SessionServiceConfig } from './SessionService';
import { InMemorySessionStore } from '@/stores/InMemorySessionStore';
import { ISessionStore } from '@/types/session';
import { SessionConfigUtils } from '@/config/session';

/**
 * Create a session service with in-memory store for development/testing
 */
export function createInMemorySessionService(
  config?: Partial<SessionServiceConfig>
): SessionService {
  const defaultConfig: SessionServiceConfig = {
    accessTokenExpiry: SessionConfigUtils.getAccessTokenExpiry(),
    refreshTokenExpiry: SessionConfigUtils.getRefreshTokenExpiry(),
    tokenRotationInterval: SessionConfigUtils.getTokenRotationInterval(),
    sessionTimeout: SessionConfigUtils.getSessionTimeout(),
    enableTokenRotation: SessionConfigUtils.isTokenRotationEnabled(),
    maxSessionsPerUser: SessionConfigUtils.getMaxSessionsPerUser(),
  };

  const finalConfig = { ...defaultConfig, ...config };

  const store = new InMemorySessionStore({
    cleanupInterval: SessionConfigUtils.getCleanupInterval(),
    maxSessionsPerUser: finalConfig.maxSessionsPerUser,
  });

  return new SessionService(store, finalConfig);
}

/**
 * Create a session service with custom store for production
 */
export function createSessionService(
  store: ISessionStore,
  config?: Partial<SessionServiceConfig>
): SessionService {
  const defaultConfig: SessionServiceConfig = {
    accessTokenExpiry: SessionConfigUtils.getAccessTokenExpiry(),
    refreshTokenExpiry: SessionConfigUtils.getRefreshTokenExpiry(),
    tokenRotationInterval: SessionConfigUtils.getTokenRotationInterval(),
    sessionTimeout: SessionConfigUtils.getSessionTimeout(),
    enableTokenRotation: SessionConfigUtils.isTokenRotationEnabled(),
    maxSessionsPerUser: SessionConfigUtils.getMaxSessionsPerUser(),
  };

  const finalConfig = { ...defaultConfig, ...config };

  return new SessionService(store, finalConfig);
}

/**
 * Create a session service for testing with custom configuration
 */
export function createTestSessionService(
  store: ISessionStore,
  config: SessionServiceConfig
): SessionService {
  return new SessionService(store, config);
}
