/**
 * Security Headers Middleware
 *
 * This module provides comprehensive security headers configuration
 * including enhanced helmet settings, CORS configuration, and
 * additional security headers for protection against various attacks.
 *
 * @module src/middleware/securityHeaders
 */

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from '@/utils/logger';
import { SecurityHeadersConfig, SecurityMiddlewareOptions } from '@/types/security';

/**
 * Security Headers Service
 *
 * Provides comprehensive security headers configuration and management.
 */
export class SecurityHeadersService {
  /**
   * Create helmet configuration
   */
  static createHelmetConfig(config: SecurityHeadersConfig['helmet']) {
    if (!config.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    const helmetOptions = config.options || {};

    // Simplified helmet configuration
    const enhancedOptions = {
      contentSecurityPolicy: helmetOptions.contentSecurityPolicy !== false,
      crossOriginEmbedderPolicy: helmetOptions.crossOriginEmbedderPolicy !== false,
      crossOriginOpenerPolicy: helmetOptions.crossOriginOpenerPolicy !== false,
      crossOriginResourcePolicy: helmetOptions.crossOriginResourcePolicy !== false,
      dnsPrefetchControl: helmetOptions.dnsPrefetchControl !== false,
      frameguard: helmetOptions.frameguard !== false,
      hidePoweredBy: helmetOptions.hidePoweredBy !== false,
      hsts: helmetOptions.hsts !== false,
      ieNoOpen: helmetOptions.ieNoOpen !== false,
      noSniff: helmetOptions.noSniff !== false,
      permittedCrossDomainPolicies: helmetOptions.permittedCrossDomainPolicies !== false,
      referrerPolicy: helmetOptions.referrerPolicy !== false,
      xssFilter: helmetOptions.xssFilter !== false,
    };

    return helmet(enhancedOptions);
  }

  /**
   * Create CORS configuration
   */
  static createCorsConfig(config: SecurityHeadersConfig['cors']) {
    if (!config.enabled) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    const corsOptions = config.options || {};

    // Simplified CORS configuration
    const enhancedOptions = {
      origin: corsOptions.origin || ['http://localhost:3000'],
      methods: corsOptions.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: corsOptions.allowedHeaders || [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-API-Key',
        'X-CSRF-Token',
      ],
      exposedHeaders: corsOptions.exposedHeaders || ['X-Total-Count', 'X-Page-Count'],
      credentials: corsOptions.credentials ?? true,
      maxAge: corsOptions.maxAge || 86400,
      preflightContinue: corsOptions.preflightContinue || false,
      optionsSuccessStatus: corsOptions.optionsSuccessStatus || 204,
    };

    return cors(enhancedOptions as any);
  }

  /**
   * Create additional security headers middleware
   */
  static createAdditionalHeaders(config: SecurityHeadersConfig['additionalHeaders'] = {}) {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Default security headers
      const defaultHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        'X-Permitted-Cross-Domain-Policies': 'none',
        'X-Download-Options': 'noopen',
        'X-DNS-Prefetch-Control': 'off',
        'X-Request-ID': req.headers['x-request-id'] || this.generateRequestId(),
      };

      // Apply default headers
      Object.entries(defaultHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Apply custom headers
      Object.entries(config).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      next();
    };
  }

  /**
   * Generate request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create comprehensive security headers middleware
   */
  static createSecurityHeaders(config: SecurityHeadersConfig) {
    const helmetMiddleware = this.createHelmetConfig(config.helmet);
    const corsMiddleware = this.createCorsConfig(config.cors);
    const additionalHeadersMiddleware = this.createAdditionalHeaders(config.additionalHeaders);

    return (req: Request, res: Response, next: NextFunction): void => {
      // Apply helmet security headers
      helmetMiddleware(req, res, err => {
        if (err) {
          logger.error('Helmet middleware error:', err);
          return next(err);
        }

        // Apply CORS headers
        corsMiddleware(req, res, err => {
          if (err) {
            logger.error('CORS middleware error:', err);
            return next(err);
          }

          // Apply additional security headers
          additionalHeadersMiddleware(req, res, next);
        });
      });
    };
  }

  /**
   * Validate security headers configuration
   */
  static validateConfig(config: SecurityHeadersConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.helmet && typeof config.helmet.enabled !== 'boolean') {
      errors.push('helmet.enabled must be a boolean');
    }

    if (config.cors && typeof config.cors.enabled !== 'boolean') {
      errors.push('cors.enabled must be a boolean');
    }

    if (config.cors?.options?.origin) {
      const origin = config.cors.options.origin;
      if (
        typeof origin !== 'string' &&
        !Array.isArray(origin) &&
        typeof origin !== 'boolean' &&
        !(origin instanceof RegExp) &&
        typeof origin !== 'function'
      ) {
        errors.push('cors.options.origin must be a string, array, boolean, RegExp, or function');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Security Headers Middleware Factory
 *
 * Creates security headers middleware with different configurations.
 */
export class SecurityHeadersMiddleware {
  /**
   * Create strict security headers middleware
   */
  static strict() {
    return SecurityHeadersService.createSecurityHeaders({
      helmet: {
        enabled: true,
        options: {
          xssFilter: true,
          noSniff: true,
          frameguard: true,
          hsts: true,
          ieNoOpen: true,
          hidePoweredBy: true,
          dnsPrefetchControl: true,
          crossOriginEmbedderPolicy: true,
          crossOriginOpenerPolicy: true,
          crossOriginResourcePolicy: true,
          permittedCrossDomainPolicies: true,
          referrerPolicy: true,
        },
      },
      cors: {
        enabled: true,
        options: {
          credentials: false,
          origin: ['http://localhost:3000'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
      },
      additionalHeaders: {
        'X-Custom-Security-Header': 'strict',
      },
    });
  }

  /**
   * Create moderate security headers middleware
   */
  static moderate() {
    return SecurityHeadersService.createSecurityHeaders({
      helmet: {
        enabled: true,
        options: {
          xssFilter: true,
          noSniff: true,
          frameguard: true,
          hsts: true,
          ieNoOpen: true,
          hidePoweredBy: true,
        },
      },
      cors: {
        enabled: true,
        options: {
          credentials: true,
          origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
          methods: process.env.CORS_METHODS?.split(',') || [
            'GET',
            'POST',
            'PUT',
            'DELETE',
            'PATCH',
          ],
        },
      },
    });
  }

  /**
   * Create lenient security headers middleware
   */
  static lenient() {
    return SecurityHeadersService.createSecurityHeaders({
      helmet: {
        enabled: true,
        options: {
          xssFilter: true,
          noSniff: true,
          frameguard: true,
        },
      },
      cors: {
        enabled: true,
        options: {
          credentials: true,
          origin: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        },
      },
    });
  }

  /**
   * Create custom security headers middleware
   */
  static custom(config: SecurityHeadersConfig) {
    const validation = SecurityHeadersService.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid security headers configuration: ${validation.errors.join(', ')}`);
    }

    return SecurityHeadersService.createSecurityHeaders(config);
  }

  /**
   * Create security headers middleware with options
   */
  static createSecurityHeaders(options: SecurityMiddlewareOptions = {}) {
    const { headers = { helmet: { enabled: true }, cors: { enabled: true } } } = options;

    return SecurityHeadersService.createSecurityHeaders(headers);
  }
}

/**
 * Security Headers Error Handler
 *
 * Handles security headers errors and provides detailed error responses.
 */
export class SecurityHeadersErrorHandler {
  /**
   * Handle security headers errors
   */
  static handleError(error: Error, req: Request, res: Response): void {
    logger.warn('Security headers error', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.url,
      method: req.method,
    });

    res.status(500).json({
      error: 'Security configuration error',
      message: 'An error occurred while processing security headers',
      timestamp: new Date().toISOString(),
    });
  }
}

// Export middleware functions for convenience
export const securityHeaders = SecurityHeadersMiddleware.createSecurityHeaders;
export const strictSecurityHeaders = SecurityHeadersMiddleware.strict;
export const moderateSecurityHeaders = SecurityHeadersMiddleware.moderate;
export const lenientSecurityHeaders = SecurityHeadersMiddleware.lenient;
export const customSecurityHeaders = SecurityHeadersMiddleware.custom;

// Export default middleware (moderate security headers)
export default SecurityHeadersMiddleware.moderate;
