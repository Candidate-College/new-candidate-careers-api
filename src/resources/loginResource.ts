import { LoginResponse } from '@/types/auth';
import { LoginResponse as JWTLoginResponse } from '@/types/jwt';
import { User } from '@/types';

export class LoginResource {
  /**
   * Format user data for login response
   */
  static formatLoginResponse(loginData: JWTLoginResponse, user: User): LoginResponse {
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
        role: loginData.user.role,
        is_active: user.status === 'active',
      },
      tokens: {
        access_token: loginData.tokens.accessToken,
        refresh_token: loginData.tokens.refreshToken,
      },
    };
  }
}
