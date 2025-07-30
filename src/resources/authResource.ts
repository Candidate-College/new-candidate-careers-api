import { User } from '@/types';
import { RegisterResponse } from '@/types/auth';

export class AuthResource {
  /**
   * Format user data for registration response
   */
  static formatRegisterResponse(user: User): RegisterResponse {
    // Extract first_name and last_name from the name field
    const nameParts = user.name.split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    return {
      user: {
        id: user.id.toString(),
        email: user.email,
        username: user.email.split('@')[0] || user.email, // Use email prefix as username
        first_name,
        last_name,
        is_active: user.status === 'active',
      },
    };
  }

  /**
   * Format refresh token response
   */
  static formatRefreshTokenResponse(
    tokens: { accessToken: string; refreshToken: string },
    expiresIn: number
  ) {
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_in: expiresIn,
    };
  }
}
