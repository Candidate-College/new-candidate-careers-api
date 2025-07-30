/**
 * Email Verification Types
 *
 * Type definitions for email verification token management and related functionality.
 * These types ensure secure and type-safe token handling throughout the verification process.
 *
 * @module src/types/emailVerification
 */

import { DatabaseRecord } from './index';

/**
 * Email verification token interface
 */
export interface EmailVerificationToken extends DatabaseRecord {
  token: string;
  user_id: number;
  type: 'email_verification' | 'password_reset';
  is_used: boolean;
  expires_at: Date;
  used_at: Date | null;
  ip_address: string | null;
  user_agent: string | null;
}

/**
 * Create email verification token request
 */
export interface CreateEmailVerificationTokenRequest {
  user_id: number;
  type: 'email_verification' | 'password_reset';
  ip_address?: string;
  user_agent?: string;
  expires_in_hours?: number;
}

/**
 * Verify email verification token request
 */
export interface VerifyEmailVerificationTokenRequest {
  token: string;
  email: string;
  type?: 'email_verification' | 'password_reset';
}

/**
 * Email verification token payload for JWT
 */
export interface EmailVerificationTokenPayload {
  token_id: number;
  user_id: number;
  email: string;
  type: 'email_verification' | 'password_reset';
  purpose: string;
  iat: number;
  exp: number;
}

/**
 * Email verification service result
 */
export interface EmailVerificationServiceResult {
  success: boolean;
  token: EmailVerificationToken | null;
  user_id: number | null;
  message: string;
  error?: string;
}

/**
 * Token cleanup result
 */
export interface TokenCleanupResult {
  deleted_count: number;
  message: string;
}

/**
 * Token statistics
 */
export interface TokenStatistics {
  total_tokens: number;
  active_tokens: number;
  expired_tokens: number;
  used_tokens: number;
  email_verification_tokens: number;
  password_reset_tokens: number;
}

/**
 * Email verification configuration
 */
export interface EmailVerificationConfig {
  token_expiry_hours: number;
  max_tokens_per_user: number;
  cleanup_expired_after_hours: number;
  allow_multiple_active_tokens: boolean;
}

/**
 * Email verification validation result
 */
export interface EmailVerificationValidationResult {
  isValid: boolean;
  errors: EmailVerificationValidationError[];
  token?: EmailVerificationToken;
}

/**
 * Email verification validation error interface
 */
export interface EmailVerificationValidationError {
  field: string;
  message: string;
}

export enum EmailVerificationTokenType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}
