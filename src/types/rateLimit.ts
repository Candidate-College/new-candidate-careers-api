/**
 * Rate Limiting Types and Interfaces
 *
 * This module defines the types and interfaces used for rate limiting
 * configuration, including different rate limit strategies, endpoint
 * configurations, and rate limit response formats.
 *
 * @module src/types/rateLimit
 */

import { Request, Response } from 'express';

// Rate limit configuration types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  onLimitReached?: (req: Request, res: Response) => void;
}

// Rate limit strategy types
export type RateLimitStrategy = 'strict' | 'moderate' | 'lenient' | 'custom';

// Endpoint-specific rate limit configuration
export interface EndpointRateLimit {
  path: string;
  method: string;
  strategy: RateLimitStrategy;
  customConfig?: Partial<RateLimitConfig>;
}

// Rate limit response format
export interface RateLimitResponse {
  error: string;
  message: string;
  retryAfter: number;
  limit: number;
  remaining: number;
  resetTime: Date;
}

// Rate limit error types
export class RateLimitError extends Error {
  public statusCode: number = 429;
  public retryAfter: number;
  public limit: number;
  public remaining: number;
  public resetTime: Date;

  constructor(
    message: string,
    retryAfter: number,
    limit: number,
    remaining: number,
    resetTime: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.limit = limit;
    this.remaining = remaining;
    this.resetTime = resetTime;
  }
}

// Rate limit middleware options
export interface RateLimitMiddlewareOptions {
  strategy?: RateLimitStrategy;
  customConfig?: Partial<RateLimitConfig>;
  skipPaths?: string[];
  includeHeaders?: boolean;
  errorHandler?: (error: RateLimitError, req: Request, res: Response) => void;
}

// Rate limit statistics
export interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  averageRequestsPerMinute: number;
}

// Rate limit configuration for different environments
export interface EnvironmentRateLimitConfig {
  development: RateLimitConfig;
  production: RateLimitConfig;
  test: RateLimitConfig;
}

// Rate limit key generator types
export type RateLimitKeyGenerator = (req: Request) => string;

// Rate limit handler types
export type RateLimitHandler = (req: Request, res: Response) => void;

// Rate limit onLimitReached callback
export type RateLimitOnLimitReached = (req: Request, res: Response) => void;

// Rate limit validation result
export interface RateLimitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Rate limit configuration validation
export interface RateLimitConfigValidation {
  validateConfig(config: RateLimitConfig): RateLimitValidationResult;
  validateStrategy(strategy: RateLimitStrategy): boolean;
  validateEndpointConfig(endpoint: EndpointRateLimit): RateLimitValidationResult;
}

// Rate limit monitoring and metrics
export interface RateLimitMetrics {
  incrementRequest(ip: string, endpoint: string): void;
  incrementBlocked(ip: string, endpoint: string): void;
  getStats(): RateLimitStats;
  resetStats(): void;
}

// Rate limit cache interface (for future Redis implementation)
export interface RateLimitCache {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Rate limit configuration presets
export const RATE_LIMIT_PRESETS: Record<RateLimitStrategy, RateLimitConfig> = {
  strict: {
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many requests, please try again later.',
    statusCode: 429,
    headers: true,
  },
  moderate: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Rate limit exceeded, please try again later.',
    statusCode: 429,
    headers: true,
  },
  lenient: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
    message: 'Rate limit exceeded, please try again later.',
    statusCode: 429,
    headers: true,
  },
  custom: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'Rate limit exceeded, please try again later.',
    statusCode: 429,
    headers: true,
  },
};

// Default rate limit configuration
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  headers: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// Auth-specific rate limit configuration
export const AUTH_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  statusCode: 429,
  headers: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// API-specific rate limit configuration
export const API_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'API rate limit exceeded, please try again later.',
  statusCode: 429,
  headers: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};
