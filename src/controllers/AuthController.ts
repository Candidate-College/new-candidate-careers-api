import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { AuthValidator } from '@/validators/authValidator';
import { LoginValidator } from '@/validators/loginValidator';
import { AuthResource } from '@/resources/authResource';
import { LoginResource } from '@/resources/loginResource';
import { createSuccessResponse } from '@/utils/response';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { formatValidationErrorResponse } from '@/utils/errors';
import { createInMemorySessionService } from '@/services/SessionServiceFactory';
import { AuthenticatedRequest } from '@/types/jwt';
import { AuditLogService } from '@/services/AuditLogService';

export class AuthController {
  private authService: AuthService;
  private sessionService: any;
  private auditLogService: AuditLogService;

  constructor() {
    this.authService = new AuthService();
    this.sessionService = createInMemorySessionService();
    this.auditLogService = new AuditLogService();
  }

  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Registration request received');

    // Sanitize and validate request data
    const sanitizedData = AuthValidator.sanitizeRegisterData(req.body);
    const validation = AuthValidator.validateRegisterRequest(sanitizedData);

    if (!validation.isValid) {
      logger.warn('Registration validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    // Register user
    const newUser = await this.authService.register(sanitizedData);

    // Log registration event with IP and user agent
    await this.auditLogService.logUserRegistration(
      newUser.id,
      {
        email: sanitizedData.email,
        name: `${sanitizedData.first_name} ${sanitizedData.last_name}`,
        role_id: 2,
      },
      req.ip,
      req.get('User-Agent')
    );

    // Format response
    const userData = AuthResource.formatRegisterResponse(newUser);
    const successResponse = createSuccessResponse('User registered successfully', userData);

    logger.info(`User ${newUser.id} registered successfully`);

    res.status(201).json(successResponse);
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Login request received');

    // Sanitize and validate request data
    const sanitizedData = LoginValidator.sanitizeLoginData(req.body);
    const validation = LoginValidator.validateLoginRequest(sanitizedData);

    if (!validation.isValid) {
      logger.warn('Login validation failed:', validation.errors);
      res.status(400).json(formatValidationErrorResponse('Validation failed', validation.errors));
      return;
    }

    try {
      // Login user
      const loginData = await this.authService.login({
        email: sanitizedData.email,
        password: sanitizedData.password,
        ...(sanitizedData.remember_me !== undefined && { rememberMe: sanitizedData.remember_me }),
      });

      // Get full user data for response
      const user = await this.authService.getUserFromToken(loginData.tokens.accessToken);
      if (!user) {
        logger.error('Failed to get user data after login');
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Get complete user data from database
      const userService = new (await import('@/services/UserService')).UserService();
      const fullUser = await userService.getUserById(parseInt(user.id, 10));

      if (!fullUser) {
        logger.error('Failed to get full user data after login');
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      // Create session for the user
      const session = await this.sessionService.createSession({
        userId: user.id,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        metadata: {
          loginMethod: 'email',
          rememberMe: sanitizedData.remember_me || false,
        },
      });

      // Log successful login with IP and user agent
      await this.auditLogService.logLogin(
        parseInt(user.id, 10),
        true,
        undefined,
        req.ip,
        req.get('User-Agent')
      );

      // Format response
      const responseData = LoginResource.formatLoginResponse(loginData, fullUser);
      const successResponse = createSuccessResponse('Login successful', responseData);

      logger.info(`User ${user.id} logged in successfully with session ${session.id}`);

      res.status(200).json(successResponse);
    } catch (error) {
      // Log failed login attempt
      await this.auditLogService.logLogin(
        0, // Unknown user ID
        false,
        error instanceof Error ? error.message : 'Login failed',
        req.ip,
        req.get('User-Agent')
      );

      logger.error('Login failed:', error);
      res.status(401).json({
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid credentials',
      });
    }
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    logger.info('Token refresh request received');

    const { refresh_token } = req.body;

    if (!refresh_token) {
      logger.warn('Refresh token missing in request');
      res.status(400).json({
        error: 'Validation failed',
        message: 'Refresh token is required',
      });
      return;
    }

    try {
      // Refresh tokens using session service
      const refreshResult = await this.sessionService.refreshTokens({
        refreshToken: refresh_token,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
      });

      const responseData = {
        access_token: refreshResult.accessToken,
        refresh_token: refreshResult.refreshToken,
        expires_in: refreshResult.expiresIn,
      };

      const successResponse = createSuccessResponse('Token refreshed successfully', responseData);

      logger.info('Token refreshed successfully');

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Token refresh failed:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Invalid or expired refresh token',
      });
    }
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      logger.warn('Logout attempted without authentication');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      // Extract session ID from token or header
      const sessionId = this.extractSessionId(req);
      if (sessionId) {
        await this.sessionService.invalidateSession(sessionId);
        logger.info(`Session ${sessionId} invalidated during logout`);
      }

      // Log logout event with IP and user agent
      await this.auditLogService.logLogout(parseInt(authReq.user.id, 10), req.ip);

      const successResponse = createSuccessResponse('Logout successful');

      logger.info(`User ${authReq.user.id} logged out successfully`);

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Logout failed:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred during logout',
      });
    }
  });

  /**
   * Get session status
   */
  getSessionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      logger.warn('Session status requested without authentication');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      const sessionId = this.extractSessionId(req);
      if (!sessionId) {
        res.status(401).json({
          error: 'Session not found',
          message: 'Session ID not found in request',
        });
        return;
      }

      const validationResult = await this.sessionService.validateSession(sessionId);

      if (!validationResult.isValid) {
        res.status(401).json({
          error: 'Session invalid',
          message: validationResult.error || 'Session validation failed',
        });
        return;
      }

      const session = validationResult.session!;

      const responseData = {
        session: {
          id: session.id,
          user_id: session.userId,
          created_at: session.createdAt.toISOString(),
          last_activity: session.lastActivity.toISOString(),
          expires_at: session.expiresAt.toISOString(),
          is_active: session.isActive,
        },
        user: {
          id: authReq.user.id,
          email: authReq.user.email,
        },
      };

      const successResponse = createSuccessResponse('Session information retrieved', responseData);

      logger.info(`Session status retrieved for user ${authReq.user.id}`);

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Session status retrieval failed:', error);
      res.status(500).json({
        error: 'Session status failed',
        message: 'An error occurred while retrieving session status',
      });
    }
  });

  /**
   * Revoke all user sessions
   */
  revokeAllSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      logger.warn('Session revocation attempted without authentication');
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    try {
      // Get user sessions count before revocation
      const stats = await this.sessionService.getStats();
      const userSessions = stats.sessionsPerUser.get(authReq.user.id) || 0;

      // Revoke all sessions for the user
      await this.sessionService.invalidateUserSessions(authReq.user.id);

      const responseData = {
        revoked_count: userSessions,
      };

      const successResponse = createSuccessResponse(
        'All sessions revoked successfully',
        responseData
      );

      logger.info(`All sessions revoked for user ${authReq.user.id} (${userSessions} sessions)`);

      res.status(200).json(successResponse);
    } catch (error) {
      logger.error('Session revocation failed:', error);
      res.status(500).json({
        error: 'Session revocation failed',
        message: 'An error occurred while revoking sessions',
      });
    }
  });

  /**
   * Extract session ID from request
   */
  private extractSessionId(req: Request): string | null {
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
}
