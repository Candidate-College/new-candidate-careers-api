/**
 * Session Management Middleware
 *
 * This module provides middleware for automatic token refresh,
 * session validation, and token rotation.
 *
 * @module src/middleware/sessionMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { SessionError } from '@/types/session';
import { AuthenticatedRequest } from '@/types/jwt';

/**
 * Session middleware options
 */
export interface SessionMiddlewareOptions {
  /** Whether to enable automatic token refresh */
  enableAutoRefresh?: boolean;
  /** Whether to require valid session */
  requireSession?: boolean;
  /** Custom session validation function */
  customValidation?: (req: Request, session: any) => boolean;
  /** Session service instance */
  sessionService: any;
}

/**
 * Session middleware for automatic token refresh and validation
 */
export const sessionMiddleware = (options: SessionMiddlewareOptions) => {
  const {
    enableAutoRefresh = true,
    requireSession = false,
    customValidation,
    sessionService,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Skip if no user is authenticated
      if (!authReq.user) {
        if (requireSession) {
          res.status(401).json({
            success: false,
            message: 'Session required',
            error: 'AUTHENTICATION_REQUIRED',
          });
          return;
        }
        return next();
      }

      // Extract session ID from token or header
      const sessionId = extractSessionId(req);
      if (!sessionId) {
        if (requireSession) {
          res.status(401).json({
            success: false,
            message: 'Session ID not found',
            error: 'SESSION_ID_MISSING',
          });
          return;
        }
        return next();
      }

      // Validate session
      const validationResult = await sessionService.validateSession(sessionId);

      if (!validationResult.isValid) {
        if (requireSession) {
          res.status(401).json({
            success: false,
            message: validationResult.error || 'Session validation failed',
            error: 'SESSION_INVALID',
          });
          return;
        }
        return next();
      }

      // Custom validation if provided
      if (customValidation && !customValidation(req, validationResult.session)) {
        res.status(403).json({
          success: false,
          message: 'Custom session validation failed',
          error: 'CUSTOM_VALIDATION_FAILED',
        });
        return;
      }

      // Handle automatic token refresh
      if (enableAutoRefresh && validationResult.needsRefresh) {
        try {
          const refreshResult = await sessionService.refreshTokens({
            refreshToken: validationResult.session!.refreshToken,
            userAgent: req.get('User-Agent') || undefined,
            ipAddress: req.ip || undefined,
          });

          // Set new tokens in response headers
          res.setHeader('X-New-Access-Token', refreshResult.accessToken);
          if (refreshResult.refreshToken) {
            res.setHeader('X-New-Refresh-Token', refreshResult.refreshToken);
          }

          logger.info(`Tokens auto-refreshed for session ${sessionId}`);
        } catch (error) {
          logger.error('Auto-refresh failed:', error);
          if (requireSession) {
            res.status(401).json({
              success: false,
              message: 'Token refresh failed',
              error: 'TOKEN_REFRESH_FAILED',
            });
            return;
          }
        }
      }

      // Attach session info to request
      (req as any).session = validationResult.session;
      (req as any).sessionId = sessionId;

      next();
    } catch (error) {
      logger.error('Session middleware error:', error);

      if (error instanceof SessionError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message,
          error: error.code,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Session middleware error',
          error: 'SESSION_MIDDLEWARE_ERROR',
        });
      }
    }
  };
};

/**
 * Extract session ID from request
 */
function extractSessionId(req: Request): string | null {
  // Try to extract from Authorization header
  const authHeader = req.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    // For now, use token as session ID (in production, you'd decode and extract session ID)
    return token;
  }

  // Try to extract from custom header
  const sessionHeader = req.get('X-Session-ID');
  if (sessionHeader) {
    return sessionHeader;
  }

  // Try to extract from query parameter
  const sessionQuery = req.query.sessionId as string;
  if (sessionQuery) {
    return sessionQuery;
  }

  return null;
}

/**
 * Create require valid session middleware
 */
export const createRequireSession = (sessionService: any) =>
  sessionMiddleware({ requireSession: true, sessionService });

/**
 * Create auto-refresh session middleware
 */
export const createAutoRefreshSession = (sessionService: any) =>
  sessionMiddleware({ enableAutoRefresh: true, sessionService });

/**
 * Create session validation middleware (no auto-refresh)
 */
export const createValidateSession = (sessionService: any) =>
  sessionMiddleware({ enableAutoRefresh: false, sessionService });

/**
 * Create custom session validation middleware
 */
export const createCustomSessionValidation = (
  sessionService: any,
  validationFn: (req: Request, session: any) => boolean
) => sessionMiddleware({ customValidation: validationFn, sessionService });

/**
 * Create session cleanup middleware (for logout)
 */
export const createSessionCleanup =
  (sessionService: any) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const sessionId = extractSessionId(req);
    if (sessionId) {
      sessionService.invalidateSession(sessionId);
      logger.info(`Session ${sessionId} cleaned up during logout`);
    }
    next();
  };

/**
 * Create session statistics middleware
 */
export const createSessionStats =
  (sessionService: any) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const stats = await sessionService.getStats();
    res.setHeader('X-Session-Stats', JSON.stringify(stats));
    next();
  };
