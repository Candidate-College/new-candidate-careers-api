/**
 * Authentication Configuration
 * Centralized configuration for all auth-related settings
 */

export const AUTH_CONFIG = {
  LOCKOUT: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
    CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 hour
  },
  TOKENS: {
    ACCESS_TOKEN_EXPIRY: '15m',
    REFRESH_TOKEN_EXPIRY: '7d',
    VERIFICATION_TOKEN_EXPIRY: '24h',
    PASSWORD_RESET_TOKEN_EXPIRY: '1h',
  },
  ROLES: {
    DEFAULT_USER_ROLE: 'user',
    FALLBACK_ROLE: 'user',
    ADMIN_ROLE: 'admin',
  },
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 128,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  SECURITY: {
    PASSWORD_SALT_ROUNDS: 12,
    SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  },
} as const;

export type AuthConfig = typeof AUTH_CONFIG;
