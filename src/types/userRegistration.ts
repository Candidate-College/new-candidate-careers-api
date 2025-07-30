/**
 * User Registration Types
 *
 * Type definitions for user registration, email verification, and profile management
 * functionality. These types ensure type safety across the registration workflow.
 *
 * @module src/types/userRegistration
 */

/**
 * User registration request interface
 */
export interface UserRegistrationRequest {
  email: string;
  name: string;
  password: string;
  role_id: number;
}

/**
 * User registration response interface
 */
export interface UserRegistrationResponse {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role_id: number;
  status: 'active' | 'inactive' | 'suspended';
  email_verified_at: Date | null;
  created_at: Date;
}

/**
 * Email verification request interface
 */
export interface EmailVerificationRequest {
  token: string;
  email: string;
}

/**
 * Email verification response interface
 */
export interface EmailVerificationResponse {
  message: string;
  user_id: number;
  verified_at: Date;
}

/**
 * User profile view response interface
 */
export interface UserProfileResponse {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role_id: number;
  status: 'active' | 'inactive' | 'suspended';
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * User profile update request interface
 */
export interface UserProfileUpdateRequest {
  name?: string;
  current_password?: string;
  new_password?: string;
}

/**
 * Resend verification email request interface
 */
export interface ResendVerificationRequest {
  email: string;
}

/**
 * Resend verification email response interface
 */
export interface ResendVerificationResponse {
  message: string;
  email: string;
  expires_at: Date;
}

/**
 * User registration validation result
 */
export interface UserRegistrationValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * User email verification validation result
 */
export interface UserEmailVerificationValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Profile update validation result
 */
export interface ProfileUpdateValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * User registration service result
 */
export interface UserRegistrationResult {
  user: UserRegistrationResponse;
  verificationToken: string;
  expiresAt: Date;
}

/**
 * Email verification service result
 */
export interface EmailVerificationResult {
  success: boolean;
  user_id: number;
  verified_at: Date;
  message: string;
}

/**
 * Profile update service result
 */
export interface ProfileUpdateResult {
  success: boolean;
  user: UserProfileResponse;
  message: string;
}
