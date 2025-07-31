/**
 * Input Sanitization Middleware
 *
 * This module provides comprehensive input sanitization and validation
 * to protect against XSS, SQL injection, NoSQL injection, path traversal,
 * command injection, and other security threats.
 *
 * @module src/middleware/inputSanitizer
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import {
  SanitizationConfig,
  SanitizationResult,
  SecurityThreat,
  SecurityThreatError,
  ThreatPattern,
  SecurityContext,
} from '@/types/security';

/**
 * Input Sanitization Service
 *
 * Provides comprehensive input sanitization and threat detection.
 */
export class InputSanitizer {
  private static threatPatterns: ThreatPattern[] = [
    // XSS patterns
    {
      name: 'XSS Script Tags',
      pattern: /<script[^>]*>.*?<\/script>/gi,
      severity: 'high',
      description: 'Potential XSS attack using script tags',
      examples: ['<script>alert("xss")</script>', '<script src="malicious.js"></script>'],
    },
    {
      name: 'XSS Event Handlers',
      pattern: /on\w+\s*=/gi,
      severity: 'high',
      description: 'Potential XSS attack using event handlers',
      examples: ['onclick="alert(1)"', 'onload="malicious()"'],
    },
    {
      name: 'XSS JavaScript Protocol',
      pattern: /javascript:/gi,
      severity: 'high',
      description: 'Potential XSS attack using javascript protocol',
      examples: ['javascript:alert(1)', 'javascript:void(0)'],
    },
    {
      name: 'XSS Data URLs',
      pattern: /data:text\/html/gi,
      severity: 'medium',
      description: 'Potential XSS attack using data URLs',
      examples: ['data:text/html,<script>alert(1)</script>'],
    },

    // SQL Injection patterns
    {
      name: 'SQL Injection Keywords',
      pattern:
        /\b(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|create\s+table|alter\s+table|exec\s+|execute\s+)\b/gi,
      severity: 'high',
      description: 'Potential SQL injection attack',
      examples: ["' UNION SELECT * FROM users", 'DROP TABLE users'],
    },
    {
      name: 'SQL Injection Comments',
      pattern: /--\s*$/gm,
      severity: 'high',
      description: 'Potential SQL injection using comments',
      examples: ["' OR 1=1--", "admin'--"],
    },
    {
      name: 'SQL Injection Quotes',
      pattern: /'[^']*'[^']*$/gm,
      severity: 'medium',
      description: 'Potential SQL injection using quote manipulation',
      examples: ["' OR '1'='1", "admin' OR '1'='1"],
    },

    // NoSQL Injection patterns
    {
      name: 'NoSQL Injection Operators',
      pattern: /\$[a-zA-Z]+/g,
      severity: 'high',
      description: 'Potential NoSQL injection attack',
      examples: ['$where', '$ne', '$gt', '$lt', '$regex'],
    },
    {
      name: 'NoSQL Injection JavaScript',
      pattern: /\{\s*"\$where"\s*:\s*".*"\s*\}/g,
      severity: 'high',
      description: 'Potential NoSQL injection using $where',
      examples: ['{"$where": "this.username == \'admin\'"}'],
    },

    // Path Traversal patterns
    {
      name: 'Path Traversal',
      pattern: /\.\.\/|\.\.\\/g,
      severity: 'high',
      description: 'Potential path traversal attack',
      examples: ['../../../etc/passwd', '..\\..\\windows\\system32'],
    },
    {
      name: 'Path Traversal Encoded',
      pattern: /%2e%2e%2f|%2e%2e%5c/gi,
      severity: 'high',
      description: 'Potential path traversal attack (URL encoded)',
      examples: ['%2e%2e%2fetc%2fpasswd', '%2e%2e%5cwindows%5csystem32'],
    },

    // Command Injection patterns
    {
      name: 'Command Injection',
      pattern: /[;&|`$()[\]]/g,
      severity: 'critical',
      description: 'Potential command injection attack',
      examples: ['; rm -rf /', '| cat /etc/passwd', '`whoami`'],
    },
    {
      name: 'Command Injection Keywords',
      pattern: /\b(cat|ls|pwd|whoami|id|uname|hostname|wget|curl|nc|netcat)\b/gi,
      severity: 'medium',
      description: 'Potential command injection using system commands',
      examples: ['cat /etc/passwd', 'ls -la', 'whoami'],
    },
  ];

  /**
   * Sanitize input data
   */
  static sanitizeInput(
    data: any,
    location: 'body' | 'query' | 'params' | 'headers',
    config: SanitizationConfig
  ): SanitizationResult {
    const threats: SecurityThreat[] = [];
    const warnings: string[] = [];
    let sanitizedData = data;

    try {
      // Convert to string for analysis if not already
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);

      // Check for threats with intelligent handling for JSON body data
      if (location === 'body' && typeof data === 'object' && data !== null) {
        // For JSON body data, only check string values within the object
        this.checkObjectForThreats(data, threats, location);
      } else {
        // For other data types, check the entire string
        for (const pattern of this.threatPatterns) {
          if (pattern.pattern.test(dataString)) {
            threats.push({
              type: this.getThreatType(pattern.name),
              severity: pattern.severity,
              description: pattern.description,
              payload: dataString,
              location,
            });
          }
        }
      }

      // Apply sanitization if enabled
      if (config.enabled) {
        sanitizedData = this.applySanitization(data, config);
      }

      // Check length limits
      if (config.options.maxLength) {
        const maxLength = config.options.maxLength[location];
        if (maxLength && dataString.length > maxLength) {
          warnings.push(`Input exceeds maximum length of ${maxLength} characters`);
        }
      }

      const isClean = threats.length === 0;

      return {
        isClean,
        sanitizedData,
        threats,
        warnings,
      };
    } catch (error) {
      logger.error('Input sanitization failed:', error);
      return {
        isClean: false,
        sanitizedData: data,
        threats: [
          {
            type: 'xss',
            severity: 'high',
            description: 'Input sanitization failed',
            payload: String(data),
            location,
          },
        ],
        warnings: ['Input sanitization process failed'],
      };
    }
  }

  /**
   * Apply sanitization to input data
   */
  private static applySanitization(data: any, config: SanitizationConfig): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data, config);
    } else if (typeof data === 'object' && data !== null) {
      return this.sanitizeObject(data, config);
    }
    return data;
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(input: string, config: SanitizationConfig): string {
    let sanitized = input;

    if (config.options.trimWhitespace) {
      sanitized = sanitized.trim();
    }

    if (config.options.removeNullBytes) {
      sanitized = sanitized.replace(/\0/g, '');
    }

    if (config.options.htmlEntities) {
      sanitized = this.encodeHtmlEntities(sanitized);
    }

    if (config.options.xss) {
      sanitized = this.removeXSSPatterns(sanitized);
    }

    return sanitized;
  }

  /**
   * Sanitize object input
   */
  private static sanitizeObject(obj: any, config: SanitizationConfig): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.applySanitization(item, config));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.applySanitization(value, config);
    }

    return sanitized;
  }

  /**
   * Encode HTML entities
   */
  private static encodeHtmlEntities(input: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'/]/g, char => htmlEntities[char] || char);
  }

  /**
   * Remove XSS patterns
   */
  private static removeXSSPatterns(input: string): string {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');
  }

  /**
   * Get threat type from pattern name
   */
  private static getThreatType(patternName: string): SecurityThreat['type'] {
    if (patternName.includes('XSS')) return 'xss';
    if (patternName.includes('SQL')) return 'sql-injection';
    if (patternName.includes('NoSQL')) return 'no-sql-injection';
    if (patternName.includes('Path')) return 'path-traversal';
    if (patternName.includes('Command')) return 'command-injection';
    return 'xss'; // Default to XSS
  }

  /**
   * Check object for threats by examining string values only
   */
  private static checkObjectForThreats(
    obj: any,
    threats: SecurityThreat[],
    location: 'body' | 'query' | 'params' | 'headers'
  ): void {
    const checkValue = (value: any, path: string = '') => {
      if (typeof value === 'string') {
        // Only check string values for threats
        for (const pattern of this.threatPatterns) {
          if (pattern.pattern.test(value)) {
            threats.push({
              type: this.getThreatType(pattern.name),
              severity: pattern.severity,
              description: pattern.description,
              payload: value,
              location,
            });
          }
        }
      } else if (Array.isArray(value)) {
        // Recursively check array elements
        value.forEach((item, index) => {
          checkValue(item, `${path}[${index}]`);
        });
      } else if (typeof value === 'object' && value !== null) {
        // Recursively check object properties
        Object.keys(value).forEach(key => {
          checkValue(value[key], path ? `${path}.${key}` : key);
        });
      }
    };

    checkValue(obj);
  }

  /**
   * Validate input length
   */
  static validateLength(
    input: string,
    maxLength: number,
    fieldName: string
  ): { isValid: boolean; error?: string } {
    if (input.length > maxLength) {
      return {
        isValid: false,
        error: `${fieldName} exceeds maximum length of ${maxLength} characters`,
      };
    }
    return { isValid: true };
  }

  /**
   * Check if input contains threats
   */
  static hasThreats(input: any, location: 'body' | 'query' | 'params' | 'headers'): boolean {
    const result = this.sanitizeInput(input, location, {
      enabled: false,
      options: {
        xss: true,
        sqlInjection: true,
        noSqlInjection: true,
        pathTraversal: true,
        commandInjection: true,
        htmlEntities: false,
        trimWhitespace: false,
        removeNullBytes: false,
      },
    });

    return !result.isClean;
  }
}

/**
 * Input Sanitization Middleware
 *
 * Middleware that sanitizes and validates request input.
 */
export class InputSanitizerMiddleware {
  /**
   * Create input sanitization middleware
   */
  static createSanitizer(config: SanitizationConfig) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const context: SecurityContext = {
          requestId: (req.headers['x-request-id'] as string) || 'unknown',
          timestamp: new Date(),
          ip: req.ip || req.connection.remoteAddress || 'unknown',
          userAgent: req.get('User-Agent') || 'unknown',
          method: req.method,
          url: req.url,
          threats: [],
        };

        // Sanitize request body
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyResult = InputSanitizer.sanitizeInput(req.body, 'body', config);
          req.body = bodyResult.sanitizedData;
          context.threats.push(...bodyResult.threats);

          if (!bodyResult.isClean) {
            logger.warn('Security threat detected in request body', {
              threats: bodyResult.threats,
              context,
            });
          }
        }

        // Sanitize query parameters
        if (req.query && Object.keys(req.query).length > 0) {
          const queryResult = InputSanitizer.sanitizeInput(req.query, 'query', config);
          req.query = queryResult.sanitizedData;
          context.threats.push(...queryResult.threats);

          if (!queryResult.isClean) {
            logger.warn('Security threat detected in query parameters', {
              threats: queryResult.threats,
              context,
            });
          }
        }

        // Sanitize URL parameters
        if (req.params && Object.keys(req.params).length > 0) {
          const paramsResult = InputSanitizer.sanitizeInput(req.params, 'params', config);
          req.params = paramsResult.sanitizedData;
          context.threats.push(...paramsResult.threats);

          if (!paramsResult.isClean) {
            logger.warn('Security threat detected in URL parameters', {
              threats: paramsResult.threats,
              context,
            });
          }
        }

        // Check for critical threats
        const criticalThreats = context.threats.filter(threat => threat.severity === 'critical');
        if (criticalThreats.length > 0) {
          const error = new SecurityThreatError(
            'Critical security threat detected',
            criticalThreats
          );
          return next(error);
        }

        // Check for high severity threats
        const highThreats = context.threats.filter(threat => threat.severity === 'high');
        if (highThreats.length > 0) {
          logger.warn('High severity security threats detected', {
            threats: highThreats,
            context,
          });
        }

        // Attach sanitization context to request for logging
        (req as any).securityContext = context;

        next();
      } catch (error) {
        logger.error('Input sanitization middleware error:', error);
        next(error);
      }
    };
  }

  /**
   * Create strict sanitization middleware
   */
  static strict() {
    return InputSanitizerMiddleware.createSanitizer({
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
        maxLength: {
          body: 10000,
          query: 1000,
          params: 500,
          headers: 1000,
        },
      },
    });
  }

  /**
   * Create moderate sanitization middleware
   */
  static moderate() {
    return InputSanitizerMiddleware.createSanitizer({
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
    });
  }

  /**
   * Create lenient sanitization middleware
   */
  static lenient() {
    return InputSanitizerMiddleware.createSanitizer({
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
    });
  }

  /**
   * Create custom sanitization middleware
   */
  static custom(config: SanitizationConfig) {
    return InputSanitizerMiddleware.createSanitizer(config);
  }
}

// Export middleware functions for convenience
export const inputSanitizer = InputSanitizerMiddleware.createSanitizer;
export const strictSanitizer = () => InputSanitizerMiddleware.strict();
export const moderateSanitizer = () => InputSanitizerMiddleware.moderate();
export const lenientSanitizer = () => InputSanitizerMiddleware.lenient();
export const customSanitizer = (config: SanitizationConfig) =>
  InputSanitizerMiddleware.custom(config);

// Export default middleware (moderate sanitization)
export default () => InputSanitizerMiddleware.moderate();
