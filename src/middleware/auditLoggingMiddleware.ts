/**
 * Audit Logging Middleware
 *
 * Automatically logs authentication and user management activities
 * across all endpoints. Provides comprehensive audit trail for
 * security monitoring and compliance requirements.
 *
 * @module src/middleware/auditLoggingMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '@/services/AuditLogService';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types/jwt';

export class AuditLoggingMiddleware {
  private readonly auditLogService: AuditLogService;

  constructor() {
    this.auditLogService = new AuditLogService();
  }

  private handleLoginAudit(req: Request, res: Response, statusCode: number): void {
    if (req.path === '/api/v1/auth/login' && req.method === 'POST') {
      const auditService = this.auditLogService;
      const authReq = req as AuthenticatedRequest;
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;
      const isSuccess = statusCode === 200;
      const userId = isSuccess && authReq.user ? parseInt(authReq.user.id, 10) : null;
      auditService
        .logLogin(
          userId,
          isSuccess,
          isSuccess ? undefined : 'Authentication failed',
          ipAddress,
          userAgent
        )
        .catch((error: unknown) => {
          logger.error('Failed to log authentication attempt:', error);
        });
    }
  }

  private handleLogoutAudit(req: Request): void {
    if (req.path === '/api/v1/auth/logout' && req.method === 'POST') {
      const auditService = this.auditLogService;
      const authReq = req as AuthenticatedRequest;
      if (authReq.user) {
        auditService.logLogout(parseInt(authReq.user.id, 10), req.ip).catch((error: unknown) => {
          logger.error('Failed to log logout event:', error);
        });
      }
    }
  }

  private handleProfileUpdateAudit(req: Request, statusCode: number): void {
    if (req.path === '/api/v1/users/profile' && req.method === 'PUT') {
      const auditService = this.auditLogService;
      const authReq = req as AuthenticatedRequest;
      const isSuccess = statusCode === 200;
      if (authReq.user && isSuccess) {
        auditService
          .logProfileUpdate(parseInt(authReq.user.id, 10), req.body, true)
          .catch((error: unknown) => {
            logger.error('Failed to log profile update:', error);
          });
      }
    }
  }

  private handlePasswordChangeAudit(req: Request, statusCode: number): void {
    if (req.path === '/api/v1/users/profile' && req.method === 'PUT' && req.body.new_password) {
      const auditService = this.auditLogService;
      const authReq = req as AuthenticatedRequest;
      const isSuccess = statusCode === 200;
      if (authReq.user && isSuccess) {
        auditService
          .logPasswordChange(parseInt(authReq.user.id, 10), true)
          .catch((error: unknown) => {
            logger.error('Failed to log password change:', error);
          });
      }
    }
  }

  /**
   * Middleware to log authentication attempts
   */
  logAuthAttempts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send.bind(res);

    // Override res.send to capture response
    res.send = (body: unknown): Response => {
      const statusCode = res.statusCode;
      this.handleLoginAudit(req, res, statusCode);
      this.handleLogoutAudit(req);
      this.handleProfileUpdateAudit(req, statusCode);
      this.handlePasswordChangeAudit(req, statusCode);
      return originalSend.call(res, body);
    };

    next();
  };

  /**
   * Middleware to log user registration events
   */
  logUserRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send.bind(res);
    const auditService = this.auditLogService;

    res.send = function (body: unknown): Response {
      const statusCode = res.statusCode;

      // Log user registration
      if (req.path === '/api/v1/auth/register' && req.method === 'POST' && statusCode === 201) {
        try {
          const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
          const userData = responseBody?.data;

          if (userData?.id) {
            auditService
              .logUserRegistration(
                userData.id,
                {
                  email: req.body.email,
                  name: req.body.name,
                  role_id: req.body.role_id,
                },
                req.ip,
                req.get('User-Agent')
              )
              .catch((error: unknown) => {
                logger.error('Failed to log user registration:', error);
              });
          }
        } catch (error) {
          logger.error('Failed to parse registration response:', error);
        }
      }

      return originalSend.call(res, body);
    };

    next();
  };

  /**
   * Middleware to log email verification events
   */
  logEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send.bind(res);
    const auditService = this.auditLogService;

    res.send = function (body: unknown): Response {
      const statusCode = res.statusCode;

      // Log email verification
      if (req.path === '/api/v1/auth/verify-email' && req.method === 'POST') {
        const isSuccess = statusCode === 200;

        // Try to get user ID from response
        let userId: number | null = null;
        if (isSuccess) {
          try {
            const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            if (responseBody?.data?.user_id) {
              userId = responseBody.data.user_id;
            }
          } catch (error) {
            logger.error('Failed to parse verification response:', error);
          }
        }

        auditService
          .logEmailVerification(
            userId,
            isSuccess,
            isSuccess ? undefined : 'Email verification failed',
            req.ip
          )
          .catch((error: unknown) => {
            logger.error('Failed to log email verification:', error);
          });
      }

      return originalSend.call(res, body);
    };

    next();
  };

  /**
   * Middleware to log failed authentication attempts
   */
  logFailedAuthAttempts = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalSend = res.send.bind(res);
    const auditService = this.auditLogService;

    res.send = function (body: unknown): Response {
      const statusCode = res.statusCode;

      // Log failed authentication attempts
      if (req.path === '/api/v1/auth/login' && req.method === 'POST' && statusCode !== 200) {
        auditService
          .logLogin(
            null, // Use null instead of 0 for unknown user ID
            false,
            'Authentication failed',
            req.ip,
            req.get('User-Agent')
          )
          .catch((error: unknown) => {
            logger.error('Failed to log failed authentication attempt:', error);
          });
      }

      return originalSend.call(res, body);
    };

    next();
  };

  /**
   * Middleware to log session events
   */
  logSessionEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send.bind(res);
    const auditService = this.auditLogService;

    res.send = function (body: unknown): Response {
      const statusCode = res.statusCode;

      // Log session revocation
      if (
        req.path === '/api/v1/auth/revoke-sessions' &&
        req.method === 'POST' &&
        statusCode === 200
      ) {
        const authReq = req as AuthenticatedRequest;
        if (authReq.user) {
          try {
            const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
            const revokedCount = responseBody?.data?.revoked_count || 0;

            // Log session revocation event
            auditService
              .createAuditLog({
                user_id: parseInt(authReq.user.id, 10),
                action: 'sessions_revoked',
                subject_type: 'session',
                subject_id: parseInt(authReq.user.id, 10),
                description: `Sessions revoked: ${revokedCount} sessions`,
                new_values: {
                  revoked_count: revokedCount,
                  revocation_type: 'all_sessions',
                  success: true,
                },
                ip_address: req.ip || '',
                user_agent: req.get('User-Agent') || '',
              })
              .catch((error: unknown) => {
                logger.error('Failed to log session revocation:', error);
              });
          } catch (error) {
            logger.error('Failed to parse session revocation response:', error);
          }
        }
      }

      return originalSend.call(res, body);
    };

    next();
  };

  /**
   * Middleware to log security events
   */
  logSecurityEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalSend = res.send.bind(res);
    const auditService = this.auditLogService;

    res.send = function (body: unknown): Response {
      const statusCode = res.statusCode;

      // Log unauthorized access attempts
      if (statusCode === 401 || statusCode === 403) {
        const authReq = req as AuthenticatedRequest;
        const userId = authReq.user ? parseInt(authReq.user.id, 10) : null;

        auditService
          .createAuditLog({
            user_id: userId,
            action: statusCode === 401 ? 'unauthorized_access' : 'forbidden_access',
            subject_type: 'endpoint',
            subject_id: 0, // Use 0 for endpoint
            description: `${statusCode === 401 ? 'Unauthorized' : 'Forbidden'} access to ${req.path}`,
            new_values: {
              path: req.path,
              method: req.method,
              status_code: statusCode,
              success: false,
              error_message: statusCode === 401 ? 'Unauthorized access' : 'Forbidden access',
            },
            ip_address: req.ip || '',
            user_agent: req.get('User-Agent') || '',
          })
          .catch((error: unknown) => {
            logger.error('Failed to log security event:', error);
          });
      }

      return originalSend.call(res, body);
    };

    next();
  };
}

// Export middleware instance
export const auditLoggingMiddleware = new AuditLoggingMiddleware();
