/**
 * User Registration Resource
 *
 * Provides response formatting for user registration, email verification,
 * and profile management endpoints. Ensures consistent API responses
 * across the registration workflow.
 *
 * @module src/resources/userRegistrationResource
 */

import { User } from '@/types';
import {
  UserRegistrationResponse,
  EmailVerificationResponse,
  UserProfileResponse,
  ResendVerificationResponse,
} from '@/types/userRegistration';

export class UserRegistrationResource {
  /**
   * Format user data for registration response
   */
  static formatRegistrationResponse(user: User): UserRegistrationResponse {
    return {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
      status: user.status,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at,
    };
  }

  /**
   * Format email verification response
   */
  static formatEmailVerificationResponse(
    userId: number,
    verifiedAt: Date,
    message: string
  ): EmailVerificationResponse {
    return {
      message,
      user_id: userId,
      verified_at: verifiedAt,
    };
  }

  /**
   * Format user profile response
   */
  static formatUserProfileResponse(user: User): UserProfileResponse {
    return {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      name: user.name,
      role_id: user.role_id,
      status: user.status,
      email_verified_at: user.email_verified_at,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  /**
   * Format resend verification email response
   */
  static formatResendVerificationResponse(
    email: string,
    expiresAt: Date,
    message: string
  ): ResendVerificationResponse {
    return {
      message,
      email,
      expires_at: expiresAt,
    };
  }

  /**
   * Format registration success response with verification token
   */
  static formatRegistrationSuccessResponse(user: User, verificationToken?: string) {
    const userData = this.formatRegistrationResponse(user);

    return {
      status: 201,
      message: 'User registered successfully. Verification email sent.',
      data: {
        ...userData,
        verification_token: verificationToken,
      },
    };
  }

  /**
   * Format email verification success response
   */
  static formatEmailVerificationSuccessResponse(userId: number, verifiedAt: Date) {
    const verificationData = this.formatEmailVerificationResponse(
      userId,
      verifiedAt,
      'Email verified successfully'
    );

    return {
      status: 200,
      message: 'Email verified successfully',
      data: verificationData,
    };
  }

  /**
   * Format profile update success response
   */
  static formatProfileUpdateSuccessResponse(user: User) {
    const userData = this.formatUserProfileResponse(user);

    return {
      status: 200,
      message: 'Profile updated successfully',
      data: userData,
    };
  }

  /**
   * Format resend verification success response
   */
  static formatResendVerificationSuccessResponse(email: string, expiresAt: Date) {
    const verificationData = this.formatResendVerificationResponse(
      email,
      expiresAt,
      'Verification email sent successfully'
    );

    return {
      status: 200,
      message: 'Verification email sent successfully',
      data: verificationData,
    };
  }
}
