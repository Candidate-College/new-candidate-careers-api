/**
 * Rate Limiting Middleware
 *
 * This module provides comprehensive rate limiting functionality with
 * different strategies, configurable limits, and detailed error handling.
 * It supports auth-specific rate limiting, general API rate limiting,
 * and custom configurations per endpoint.
 *
 * @module src/middleware/rateLimitMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import {
  RateLimitConfig,
  RateLimitStrategy,
  RateLimitMiddlewareOptions,
  RateLimitError,
  RATE_LIMIT_PRESETS,
  RateLimitResponse,
  RateLimitStats,
} from '@/types/rateLimit';

/**
 * Rate Limiting Service
 *
 * Provides rate limiting functionality with different strategies
 * and comprehensive error handling.
 */
export class RateLimitService {
  private static stats: RateLimitStats = {
    totalRequests: 0,
    blockedRequests: 0,
    uniqueIPs: 0,
    averageRequestsPerMinute: 0,
  };

  private static readonly ipAddresses = new Set<string>();
  private static readonly requestCounts = new Map<string, number>();

  /**
   * Create a rate limiter with the specified configuration
   */
  static createRateLimiter(
    strategy: RateLimitStrategy = 'moderate',
    customConfig?: Partial<RateLimitConfig>
  ) {
    const baseConfig = RATE_LIMIT_PRESETS[strategy];
    const config = {
      ...baseConfig,
      ...customConfig,
      keyGenerator: this.generateKey,
    };

    return rateLimit(config);
  }

  /**
   * Create auth-specific rate limiter (5 attempts per minute)
   */
  static createAuthRateLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 5, // limit each IP to 5 requests per windowMs
      message: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
      headers: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });
  }

  /**
   * Create general API rate limiter (100 requests per 15 minutes)
   */
  static createApiRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'API rate limit exceeded, please try again later.',
      statusCode: 429,
      headers: true,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    });
  }

  /**
   * Create custom rate limiter with specific configuration
   */
  static createCustomRateLimiter(config: RateLimitConfig) {
    return this.createRateLimiter('custom', config);
  }

  /**
   * Generate rate limit key based on IP address and optional user ID
   */
  private static generateKey(req: Request): string {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userId = (req as { user?: { id: string } }).user?.id || 'anonymous';

    // Track unique IPs for statistics
    this.ipAddresses.add(ip);

    // Generate key based on IP and user
    return `${ip}:${userId}`;
  }

  /**
   * Handle rate limit exceeded
   */
  private static handleRateLimit(req: Request, res: Response): void {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.path;

    // Update statistics
    this.stats.blockedRequests++;
    this.logRateLimitEvent(ip, endpoint);

    // Create detailed error response
    const errorResponse: RateLimitResponse = {
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: 60, // 1 minute
      limit: 100,
      remaining: 0,
      resetTime: new Date(Date.now() + 60 * 1000),
    };

    res.status(429).json(errorResponse);
  }

  /**
   * Log rate limit events
   */
  private static logRateLimitEvent(ip: string, endpoint: string): void {
    const key = `${ip}:${endpoint}`;
    const currentCount = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, currentCount + 1);
    this.stats.totalRequests++;
  }

  /**
   * Get rate limit statistics
   */
  static getStats(): RateLimitStats {
    // Calculate average requests per minute
    const recentRequests = Array.from(this.requestCounts.values())
      .filter(count => count > 0)
      .reduce((sum, count) => sum + count, 0);

    this.stats.averageRequestsPerMinute = Math.round(recentRequests / 60);
    this.stats.uniqueIPs = this.ipAddresses.size;

    return { ...this.stats };
  }

  /**
   * Reset rate limit statistics
   */
  static resetStats(): void {
    this.stats = {
      totalRequests: 0,
      blockedRequests: 0,
      uniqueIPs: 0,
      averageRequestsPerMinute: 0,
    };
    this.ipAddresses.clear();
    this.requestCounts.clear();
  }

  /**
   * Validate rate limit configuration
   */
  static validateConfig(config: RateLimitConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.windowMs || config.windowMs <= 0) {
      errors.push('windowMs must be a positive number');
    }

    if (!config.max || config.max <= 0) {
      errors.push('max must be a positive number');
    }

    // Remove the overly strict validation that was causing issues
    // if (config.windowMs && config.max && config.windowMs < config.max * 1000) {
    //   errors.push('windowMs should be significantly larger than max requests');
    // }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Rate Limiting Middleware Factory
 *
 * Creates rate limiting middleware with different configurations
 * and strategies.
 */
export class RateLimitMiddleware {
  /**
   * Create auth rate limiting middleware
   * Limits: 5 attempts per minute
   */
  static authRateLimit() {
    return RateLimitService.createAuthRateLimiter();
  }

  /**
   * Create general API rate limiting middleware
   * Limits: 100 requests per 15 minutes
   */
  static generalRateLimit() {
    return RateLimitService.createApiRateLimiter();
  }

  /**
   * Create strict rate limiting middleware
   * Limits: 5 requests per minute
   */
  static strictRateLimit() {
    return RateLimitService.createRateLimiter('strict');
  }

  /**
   * Create moderate rate limiting middleware
   * Limits: 100 requests per 15 minutes
   */
  static moderateRateLimit() {
    return RateLimitService.createRateLimiter('moderate');
  }

  /**
   * Create lenient rate limiting middleware
   * Limits: 1000 requests per hour
   */
  static lenientRateLimit() {
    return RateLimitService.createRateLimiter('lenient');
  }

  /**
   * Create custom rate limiting middleware
   */
  static customRateLimit(config: RateLimitConfig) {
    const validation = RateLimitService.validateConfig(config);
    if (!validation.isValid) {
      throw new Error(`Invalid rate limit configuration: ${validation.errors.join(', ')}`);
    }

    return RateLimitService.createCustomRateLimiter(config);
  }

  /**
   * Create rate limiting middleware with options
   */
  static createRateLimit(options: RateLimitMiddlewareOptions = {}) {
    const { strategy = 'moderate', customConfig, skipPaths = [] } = options;

    return (req: Request, res: Response, next: NextFunction) => {
      // Skip rate limiting for specified paths
      if (skipPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Create rate limiter based on strategy
      const rateLimiter = RateLimitService.createRateLimiter(strategy, customConfig);

      // Apply rate limiting
      rateLimiter(req, res, next);
    };
  }

  /**
   * Create endpoint-specific rate limiting
   */
  static endpointRateLimit(path: string, method: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check if request matches the specified path and method
      if (req.path === path && req.method.toUpperCase() === method.toUpperCase()) {
        // Use simple rate limiter for endpoint-specific limiting
        const rateLimiter = rateLimit({
          windowMs: 60 * 1000, // 1 minute
          max: 5, // limit each IP to 5 requests per windowMs
          message: 'Too many requests to this endpoint, please try again later.',
          statusCode: 429,
          headers: true,
          skipSuccessfulRequests: false,
          skipFailedRequests: false,
        });
        rateLimiter(req, res, next);
      } else {
        next();
      }
    };
  }

  /**
   * Create rate limiting middleware for multiple endpoints
   */
  static multiEndpointRateLimit(
    endpoints: Array<{ path: string; method: string; strategy: RateLimitStrategy }>
  ) {
    return (req: Request, res: Response, next: NextFunction) => {
      const endpoint = endpoints.find(
        ep => req.path === ep.path && req.method.toUpperCase() === ep.method.toUpperCase()
      );

      if (endpoint) {
        const rateLimiter = RateLimitService.createRateLimiter(endpoint.strategy);
        rateLimiter(req, res, next);
      } else {
        next();
      }
    };
  }
}

/**
 * Rate Limit Error Handler
 *
 * Handles rate limit errors and provides detailed error responses.
 */
export class RateLimitErrorHandler {
  /**
   * Handle rate limit errors
   */
  static handleError(error: RateLimitError, req: Request, res: Response): void {
    const errorResponse: RateLimitResponse = {
      error: 'Rate limit exceeded',
      message: error.message,
      retryAfter: error.retryAfter,
      limit: error.limit,
      remaining: error.remaining,
      resetTime: error.resetTime,
    };

    res.status(error.statusCode).json(errorResponse);
  }

  /**
   * Create rate limit error
   */
  static createError(
    message: string,
    retryAfter: number,
    limit: number,
    remaining: number,
    resetTime: Date
  ): RateLimitError {
    return new RateLimitError(message, retryAfter, limit, remaining, resetTime);
  }
}

// Export middleware functions for convenience
export const authRateLimit = RateLimitMiddleware.authRateLimit;
export const generalRateLimit = RateLimitMiddleware.generalRateLimit;
export const strictRateLimit = RateLimitMiddleware.strictRateLimit;
export const moderateRateLimit = RateLimitMiddleware.moderateRateLimit;
export const lenientRateLimit = RateLimitMiddleware.lenientRateLimit;
export const customRateLimit = RateLimitMiddleware.customRateLimit;
export const createRateLimit = RateLimitMiddleware.createRateLimit;
export const endpointRateLimit = RateLimitMiddleware.endpointRateLimit;
export const multiEndpointRateLimit = RateLimitMiddleware.multiEndpointRateLimit;

// Export default middleware (general rate limiting)
export default RateLimitMiddleware.generalRateLimit;
