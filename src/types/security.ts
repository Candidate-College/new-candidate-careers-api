/**
 * Security Types and Interfaces
 *
 * This module defines the types and interfaces used for security
 * middleware, including input sanitization, security headers,
 * and validation configurations.
 *
 * @module src/types/security
 */

import { Request, Response, NextFunction } from 'express';

// Security header configuration
export interface SecurityHeadersConfig {
  helmet: {
    enabled: boolean;
    options?: {
      contentSecurityPolicy?: boolean | object;
      crossOriginEmbedderPolicy?: boolean;
      crossOriginOpenerPolicy?: boolean;
      crossOriginResourcePolicy?: boolean;
      dnsPrefetchControl?: boolean;
      frameguard?: boolean | object;
      hidePoweredBy?: boolean;
      hsts?: boolean | object;
      ieNoOpen?: boolean;
      noSniff?: boolean;
      permittedCrossDomainPolicies?: boolean;
      referrerPolicy?: boolean;
      xssFilter?: boolean;
    };
  };
  cors: {
    enabled: boolean;
    options?: {
      origin?:
        | string
        | string[]
        | boolean
        | RegExp
        | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
      methods?: string | string[];
      allowedHeaders?: string | string[];
      exposedHeaders?: string | string[];
      credentials?: boolean;
      maxAge?: number;
      preflightContinue?: boolean;
      optionsSuccessStatus?: number;
    };
  };
  additionalHeaders?: Record<string, string>;
}

// Input sanitization configuration
export interface SanitizationConfig {
  enabled: boolean;
  options: {
    xss: boolean;
    sqlInjection: boolean;
    noSqlInjection: boolean;
    pathTraversal: boolean;
    commandInjection: boolean;
    htmlEntities: boolean;
    trimWhitespace: boolean;
    removeNullBytes: boolean;
    maxLength?: {
      body?: number;
      query?: number;
      params?: number;
      headers?: number;
    };
  };
}

// Validation configuration
export interface ValidationConfig {
  enabled: boolean;
  options: {
    strictMode: boolean;
    allowUnknownFields: boolean;
    stripUnknownFields: boolean;
    coerceTypes: boolean;
    abortEarly: boolean;
    errorDetails: boolean;
  };
}

// Security middleware options
export interface SecurityMiddlewareOptions {
  headers?: SecurityHeadersConfig;
  sanitization?: SanitizationConfig;
  validation?: ValidationConfig;
  rateLimit?: boolean;
  logging?: boolean;
}

// Input sanitization result
export interface SanitizationResult {
  isClean: boolean;
  sanitizedData: any;
  threats: SecurityThreat[];
  warnings: string[];
}

// Security threat types
export interface SecurityThreat {
  type: 'xss' | 'sql-injection' | 'no-sql-injection' | 'path-traversal' | 'command-injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  payload: string;
  location: 'body' | 'query' | 'params' | 'headers';
}

// Security validation result
export interface SecurityValidationResult {
  isValid: boolean;
  errors: SecurityValidationError[];
  warnings: string[];
  sanitizedData?: any;
}

// Security validation error
export interface SecurityValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

// Security middleware context
export interface SecurityContext {
  requestId: string;
  timestamp: Date;
  ip: string;
  userAgent: string;
  method: string;
  url: string;
  threats: SecurityThreat[];
  sanitizationResult?: SanitizationResult;
  validationResult?: SecurityValidationResult;
}

// Security logging configuration
export interface SecurityLoggingConfig {
  enabled: boolean;
  level: 'info' | 'warn' | 'error';
  includeThreats: boolean;
  includeContext: boolean;
  excludePaths?: string[];
  maxLogSize?: number;
}

// Security metrics
export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  threatsDetected: number;
  sanitizationApplied: number;
  validationErrors: number;
}

// Security threat patterns
export interface ThreatPattern {
  name: string;
  pattern: RegExp;
  severity: SecurityThreat['severity'];
  description: string;
  examples: string[];
}

// Security middleware function types
export type SecurityMiddleware = (req: Request, res: Response, next: NextFunction) => void;
export type SanitizationMiddleware = (req: Request, res: Response, next: NextFunction) => void;
export type ValidationMiddleware = (req: Request, res: Response, next: NextFunction) => void;

// Security configuration validation
export interface SecurityConfigValidation {
  validateHeadersConfig(config: SecurityHeadersConfig): ValidationResult;
  validateSanitizationConfig(config: SanitizationConfig): ValidationResult;
  validateValidationConfig(config: ValidationConfig): ValidationResult;
}

// Generic validation result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Security error types
export class SecurityError extends Error {
  public statusCode: number = 400;
  public code: string;
  public threats: SecurityThreat[] = [];

  constructor(message: string, code: string, statusCode?: number, threats?: SecurityThreat[]) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.statusCode = statusCode || 400;
    this.threats = threats || [];
  }
}

export class InputValidationError extends SecurityError {
  constructor(message: string, field: string, value?: any) {
    super(message, 'INPUT_VALIDATION_ERROR', 400);
    this.field = field;
    this.value = value;
  }

  public field: string;
  public value?: any;
}

export class SecurityThreatError extends SecurityError {
  constructor(message: string, threats: SecurityThreat[]) {
    super(message, 'SECURITY_THREAT_DETECTED', 400, threats);
  }
}

// Security configuration presets
export const SECURITY_PRESETS = {
  strict: {
    headers: {
      helmet: { enabled: true, options: { xssFilter: true, noSniff: true } },
      cors: { enabled: true, options: { credentials: false } },
    },
    sanitization: {
      enabled: true,
      options: {
        xss: true,
        sqlInjection: true,
        noSqlInjection: true,
        pathTraversal: true,
        commandInjection: true,
        htmlEntities: true,
        trimWhitespace: true,
        removeNullBytes: true,
      },
    },
    validation: {
      enabled: true,
      options: {
        strictMode: true,
        allowUnknownFields: false,
        stripUnknownFields: true,
        coerceTypes: false,
        abortEarly: true,
        errorDetails: true,
      },
    },
  },
  moderate: {
    headers: {
      helmet: { enabled: true },
      cors: { enabled: true },
    },
    sanitization: {
      enabled: true,
      options: {
        xss: true,
        sqlInjection: true,
        noSqlInjection: true,
        pathTraversal: true,
        commandInjection: false,
        htmlEntities: true,
        trimWhitespace: true,
        removeNullBytes: true,
      },
    },
    validation: {
      enabled: true,
      options: {
        strictMode: false,
        allowUnknownFields: true,
        stripUnknownFields: true,
        coerceTypes: true,
        abortEarly: false,
        errorDetails: true,
      },
    },
  },
  lenient: {
    headers: {
      helmet: { enabled: true },
      cors: { enabled: true },
    },
    sanitization: {
      enabled: true,
      options: {
        xss: true,
        sqlInjection: true,
        noSqlInjection: false,
        pathTraversal: true,
        commandInjection: false,
        htmlEntities: false,
        trimWhitespace: true,
        removeNullBytes: true,
      },
    },
    validation: {
      enabled: true,
      options: {
        strictMode: false,
        allowUnknownFields: true,
        stripUnknownFields: false,
        coerceTypes: true,
        abortEarly: false,
        errorDetails: false,
      },
    },
  },
};

// Default security configuration
export const DEFAULT_SECURITY_CONFIG: SecurityMiddlewareOptions = {
  headers: {
    helmet: { enabled: true },
    cors: { enabled: true },
  },
  sanitization: {
    enabled: true,
    options: {
      xss: true,
      sqlInjection: true,
      noSqlInjection: true,
      pathTraversal: true,
      commandInjection: false,
      htmlEntities: true,
      trimWhitespace: true,
      removeNullBytes: true,
    },
  },
  validation: {
    enabled: true,
    options: {
      strictMode: false,
      allowUnknownFields: true,
      stripUnknownFields: true,
      coerceTypes: true,
      abortEarly: false,
      errorDetails: true,
    },
  },
  rateLimit: true,
  logging: true,
};
