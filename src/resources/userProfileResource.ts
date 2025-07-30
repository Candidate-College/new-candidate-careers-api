/**
 * User Profile Resource
 *
 * Provides response formatting for user profile management endpoints.
 * Handles profile viewing, updating, and related operations.
 *
 * @module src/resources/userProfileResource
 */

import { User } from '@/types';
import { UserProfileResponse } from '@/types/userRegistration';

export class UserProfileResource {
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
   * Format profile view success response
   */
  static formatProfileViewSuccessResponse(user: User) {
    const userData = this.formatUserProfileResponse(user);

    return {
      status: 200,
      message: 'User profile retrieved successfully',
      data: userData,
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
   * Format profile update error response
   */
  static formatProfileUpdateErrorResponse(error: string, statusCode: number = 400) {
    return {
      status: statusCode,
      message: error,
      error: {
        success: false,
        error,
      },
    };
  }

  /**
   * Format profile not found response
   */
  static formatProfileNotFoundResponse(userId: number) {
    return {
      status: 404,
      message: 'User profile not found',
      error: {
        success: false,
        error: 'User profile not found',
        user_id: userId,
      },
    };
  }

  /**
   * Format unauthorized profile access response
   */
  static formatUnauthorizedProfileResponse() {
    return {
      status: 403,
      message: 'Unauthorized to access this profile',
      error: {
        success: false,
        error: 'Unauthorized to access this profile',
      },
    };
  }

  /**
   * Format password change success response
   */
  static formatPasswordChangeSuccessResponse(user: User) {
    const userData = this.formatUserProfileResponse(user);

    return {
      status: 200,
      message: 'Password changed successfully',
      data: {
        ...userData,
        password_changed_at: new Date(),
      },
    };
  }

  /**
   * Format password change error response
   */
  static formatPasswordChangeErrorResponse(error: string) {
    return {
      status: 400,
      message: error,
      error: {
        success: false,
        error,
      },
    };
  }
}
