/**
 * Session Management Types
 *
 * This module defines comprehensive types for session management,
 * token rotation, and session validation across the authentication system.
 *
 * @module src/types/session
 */

// JWT types are imported for future use in session management
// import { JWTPayload, TokenType } from './jwt';

/**
 * Session store interface for abstracting storage
 */
export interface ISessionStore {
  /** Find session by ID */
  findById(sessionId: string): Promise<Session | null>;
  /** Find session by refresh token */
  findByRefreshToken(refreshToken: string): Promise<Session | null>;
  /** Save session */
  save(session: Session): Promise<void>;
  /** Delete session by ID */
  delete(sessionId: string): Promise<void>;
  /** Get all sessions for a user */
  findByUserId(userId: string): Promise<Session[]>;
  /** Get all active sessions */
  findActiveSessions(): Promise<Session[]>;
  /** Get session statistics */
  getStats(): Promise<SessionStats>;
  /** Cleanup expired sessions */
  cleanupExpiredSessions(): Promise<number>;
  /** Initialize store */
  initialize(): Promise<void>;
  /** Shutdown store */
  shutdown(): Promise<void>;
  /** Get session count for a user */
  getUserSessionCount(userId: string): Promise<number>;
  /** Update session's last activity */
  updateLastActivity(sessionId: string): Promise<void>;
  /** Invalidate all sessions for a user (optimized for database stores) */
  invalidateAllByUserId(userId: string): Promise<void>;
}

/**
 * Session configuration interface
 */
export interface SessionConfig {
  /** Session timeout in milliseconds */
  sessionTimeout: number;
  /** Token rotation interval in milliseconds */
  tokenRotationInterval: number;
  /** Refresh token expiry in milliseconds */
  refreshTokenExpiry: number;
  /** Access token expiry in milliseconds */
  accessTokenExpiry: number;
  /** Whether to enable automatic token rotation */
  enableTokenRotation: boolean;
  /** Session cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Maximum concurrent sessions per user */
  maxSessionsPerUser: number;
}

/**
 * Session data structure
 */
export interface Session {
  /** Unique session ID */
  id: string;
  /** User ID associated with this session */
  userId: string;
  /** Access token for this session */
  accessToken: string;
  /** Refresh token for this session */
  refreshToken: string;
  /** Session creation timestamp */
  createdAt: Date;
  /** Last activity timestamp */
  lastActivity: Date;
  /** Session expiry timestamp */
  expiresAt: Date;
  /** User agent information */
  userAgent: string | undefined;
  /** IP address */
  ipAddress: string | undefined;
  /** Whether session is active */
  isActive: boolean;
  /** Session metadata */
  metadata: Record<string, any> | undefined;
}

/**
 * Token rotation configuration
 */
export interface TokenRotationConfig {
  /** Whether to rotate tokens automatically */
  enabled: boolean;
  /** Rotation threshold (percentage of token lifetime) */
  rotationThreshold: number;
  /** Whether to invalidate old tokens after rotation */
  invalidateOldTokens: boolean;
}

/**
 * Session validation result
 */
export interface SessionValidationResult {
  /** Whether session is valid */
  isValid: boolean;
  /** Session data if valid */
  session?: Session;
  /** Error message if invalid */
  error?: string;
  /** Whether token needs refresh */
  needsRefresh: boolean;
  /** Time until token expires (in milliseconds) */
  timeUntilExpiry?: number;
}

/**
 * Session creation options
 */
export interface CreateSessionOptions {
  /** User ID */
  userId: string;
  /** User agent */
  userAgent?: string;
  /** IP address */
  ipAddress?: string;
  /** Session metadata */
  metadata?: Record<string, any>;
  /** Custom session timeout */
  customTimeout?: number;
}

/**
 * Token refresh request
 */
export interface TokenRefreshRequest {
  /** Refresh token */
  refreshToken: string;
  /** User agent */
  userAgent: string | undefined;
  /** IP address */
  ipAddress: string | undefined;
}

/**
 * Token refresh response
 */
export interface TokenRefreshResponse {
  /** New access token */
  accessToken: string;
  /** New refresh token (if rotation enabled) */
  refreshToken: string | undefined;
  /** Session information */
  session: Session;
  /** Token expiry information */
  expiresIn: number;
}

/**
 * Session statistics
 */
export interface SessionStats {
  /** Total active sessions */
  totalSessions: number;
  /** Sessions per user */
  sessionsPerUser: Map<string, number>;
  /** Average session duration */
  averageSessionDuration: number;
  /** Sessions created in last hour */
  sessionsCreatedLastHour: number;
  /** Sessions expired in last hour */
  sessionsExpiredLastHour: number;
}

/**
 * Session error types
 */
export class SessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SessionError';
  }
}

export class SessionExpiredError extends SessionError {
  constructor(message: string = 'Session has expired') {
    super(message, 'SESSION_EXPIRED', 401);
    this.name = 'SessionExpiredError';
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(message: string = 'Session not found') {
    super(message, 'SESSION_NOT_FOUND', 404);
    this.name = 'SessionNotFoundError';
  }
}

export class TokenRotationError extends SessionError {
  constructor(message: string = 'Token rotation failed') {
    super(message, 'TOKEN_ROTATION_ERROR', 500);
    this.name = 'TokenRotationError';
  }
}

export class SessionLimitExceededError extends SessionError {
  constructor(message: string = 'Maximum sessions exceeded') {
    super(message, 'SESSION_LIMIT_EXCEEDED', 429);
    this.name = 'SessionLimitExceededError';
  }
}
