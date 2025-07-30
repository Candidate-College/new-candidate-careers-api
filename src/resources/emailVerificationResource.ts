/**
 * Email Verification Resource
 *
 * Provides response formatting for email verification endpoints.
 * Handles token validation, verification status, and error responses.
 *
 * @module src/resources/emailVerificationResource
 */

import { EmailVerificationResponse, ResendVerificationResponse } from '@/types/userRegistration';

export class EmailVerificationResource {
  /**
   * Format successful email verification response
   */
  static formatVerificationSuccessResponse(
    userId: number,
    verifiedAt: Date,
    message: string = 'Email verified successfully'
  ): EmailVerificationResponse {
    return {
      message,
      user_id: userId,
      verified_at: verifiedAt,
    };
  }

  /**
   * Format failed email verification response
   */
  static formatVerificationErrorResponse(
    error: string,
    userId?: number
  ): { success: false; error: string; user_id?: number } {
    const response: { success: false; error: string; user_id?: number } = {
      success: false,
      error,
    };

    if (userId !== undefined) {
      response.user_id = userId;
    }

    return response;
  }

  /**
   * Format resend verification email response
   */
  static formatResendVerificationResponse(
    email: string,
    expiresAt: Date,
    message: string = 'Verification email sent successfully'
  ): ResendVerificationResponse {
    return {
      message,
      email,
      expires_at: expiresAt,
    };
  }

  /**
   * Format token validation error response
   */
  static formatTokenValidationErrorResponse(
    error: string,
    token?: string
  ): { success: false; error: string; token?: string } {
    const response: { success: false; error: string; token?: string } = {
      success: false,
      error,
    };

    if (token !== undefined) {
      response.token = token;
    }

    return response;
  }

  /**
   * Format verification success API response
   */
  static formatVerificationSuccessApiResponse(
    userId: number,
    verifiedAt: Date,
    message: string = 'Email verified successfully'
  ) {
    const verificationData = this.formatVerificationSuccessResponse(userId, verifiedAt, message);

    return {
      status: 200,
      message,
      data: verificationData,
    };
  }

  /**
   * Format resend verification success API response
   */
  static formatResendVerificationSuccessApiResponse(
    email: string,
    expiresAt: Date,
    message: string = 'Verification email sent successfully'
  ) {
    const verificationData = this.formatResendVerificationResponse(email, expiresAt, message);

    return {
      status: 200,
      message,
      data: verificationData,
    };
  }

  /**
   * Format verification error API response
   */
  static formatVerificationErrorApiResponse(
    error: string,
    statusCode: number = 400,
    userId?: number
  ) {
    const errorData = this.formatVerificationErrorResponse(error, userId);

    return {
      status: statusCode,
      message: error,
      error: errorData,
    };
  }
}
