/**
 * Input Sanitization Utilities
 *
 * Provides simple input sanitization functions for basic security needs.
 * Used by validators to clean and sanitize user input.
 *
 * @module src/utils/inputSanitizer
 */

/**
 * Sanitizes a string input by removing potentially dangerous characters
 * and trimming whitespace
 */
export const sanitizeInput = (input: any): string => {
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input !== 'string') {
    return String(input);
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/\0/g, ''); // Remove null bytes
};

/**
 * Sanitizes an array of strings
 */
export const sanitizeStringArray = (input: any[]): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(item => item !== null && item !== undefined)
    .map(item => sanitizeInput(item))
    .filter(item => item.length > 0);
};

/**
 * Sanitizes an object by applying sanitizeInput to all string values
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
};
