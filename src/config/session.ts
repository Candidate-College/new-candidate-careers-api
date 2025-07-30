/**
 * Session Configuration
 *
 * This module provides centralized session configuration management
 * with environment variable support and validation.
 *
 * @module src/config/session
 */

import { SessionConfig, TokenRotationConfig } from '@/types/session';

/**
 * Default session configuration
 */
export const defaultSessionConfig: SessionConfig = {
  sessionTimeout: 7 * 24 * 60 * 60 * 1000, // 7 days
  tokenRotationInterval: 15 * 60 * 1000, // 15 minutes
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  accessTokenExpiry: 15 * 60 * 1000, // 15 minutes
  enableTokenRotation: true,
  cleanupInterval: 60 * 60 * 1000, // 1 hour
  maxSessionsPerUser: 5,
};

/**
 * Default token rotation configuration
 */
export const defaultTokenRotationConfig: TokenRotationConfig = {
  enabled: true,
  rotationThreshold: 0.8, // 80% of token lifetime
  invalidateOldTokens: true,
};

/**
 * Session configuration with environment variable support
 */
export const sessionConfig: SessionConfig = {
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '604800000'), // 7 days
  tokenRotationInterval: parseInt(process.env.TOKEN_ROTATION_INTERVAL || '900000'), // 15 minutes
  refreshTokenExpiry: parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800000'), // 7 days
  accessTokenExpiry: parseInt(process.env.ACCESS_TOKEN_EXPIRY || '900000'), // 15 minutes
  enableTokenRotation: process.env.ENABLE_TOKEN_ROTATION !== 'false',
  cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '3600000'), // 1 hour
  maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER || '5'),
};

/**
 * Token rotation configuration with environment variable support
 */
export const tokenRotationConfig: TokenRotationConfig = {
  enabled: process.env.ENABLE_TOKEN_ROTATION !== 'false',
  rotationThreshold: parseFloat(process.env.TOKEN_ROTATION_THRESHOLD || '0.8'),
  invalidateOldTokens: process.env.INVALIDATE_OLD_TOKENS !== 'false',
};

/**
 * Session configuration utilities
 */
export class SessionConfigUtils {
  /**
   * Get session configuration
   */
  static getConfig(): SessionConfig {
    return sessionConfig;
  }

  /**
   * Get token rotation configuration
   */
  static getTokenRotationConfig(): TokenRotationConfig {
    return tokenRotationConfig;
  }

  /**
   * Validate session configuration
   */
  static validateConfig(config: SessionConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.sessionTimeout <= 0) {
      errors.push('Session timeout must be greater than 0');
    }

    if (config.tokenRotationInterval <= 0) {
      errors.push('Token rotation interval must be greater than 0');
    }

    if (config.refreshTokenExpiry <= 0) {
      errors.push('Refresh token expiry must be greater than 0');
    }

    if (config.accessTokenExpiry <= 0) {
      errors.push('Access token expiry must be greater than 0');
    }

    if (config.maxSessionsPerUser <= 0) {
      errors.push('Maximum sessions per user must be greater than 0');
    }

    if (config.cleanupInterval <= 0) {
      errors.push('Cleanup interval must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get session timeout in milliseconds
   */
  static getSessionTimeout(): number {
    return sessionConfig.sessionTimeout;
  }

  /**
   * Get token rotation interval in milliseconds
   */
  static getTokenRotationInterval(): number {
    return sessionConfig.tokenRotationInterval;
  }

  /**
   * Get refresh token expiry in milliseconds
   */
  static getRefreshTokenExpiry(): number {
    return sessionConfig.refreshTokenExpiry;
  }

  /**
   * Get access token expiry in milliseconds
   */
  static getAccessTokenExpiry(): number {
    return sessionConfig.accessTokenExpiry;
  }

  /**
   * Check if token rotation is enabled
   */
  static isTokenRotationEnabled(): boolean {
    return sessionConfig.enableTokenRotation;
  }

  /**
   * Get maximum sessions per user
   */
  static getMaxSessionsPerUser(): number {
    return sessionConfig.maxSessionsPerUser;
  }

  /**
   * Get cleanup interval in milliseconds
   */
  static getCleanupInterval(): number {
    return sessionConfig.cleanupInterval;
  }
}
