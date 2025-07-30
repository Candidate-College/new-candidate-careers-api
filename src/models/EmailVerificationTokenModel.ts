import { BaseModel } from './BaseModel';
import { EmailVerificationToken } from '@/types/emailVerification';
import { QueryParams } from '@/types';

export class EmailVerificationTokenModel extends BaseModel<EmailVerificationToken> {
  protected tableName = 'email_verification_tokens';

  /**
   * Create a new email verification token
   */
  async createToken(tokenData: {
    token: string;
    user_id: number;
    type: 'email_verification' | 'password_reset';
    expires_at: Date;
    ip_address?: string;
    user_agent?: string;
  }): Promise<EmailVerificationToken> {
    const [token] = await this.db(this.tableName)
      .insert({
        token: tokenData.token,
        user_id: tokenData.user_id,
        type: tokenData.type,
        is_used: false,
        expires_at: tokenData.expires_at,
        ip_address: tokenData.ip_address || null,
        user_agent: tokenData.user_agent || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    return token;
  }

  /**
   * Find token by token value
   */
  async findByToken(tokenValue: string): Promise<EmailVerificationToken | null> {
    const token = await this.db(this.tableName).where('token', tokenValue).first();

    return token || null;
  }

  /**
   * Find active tokens for a user
   */
  async findActiveByUserId(userId: number): Promise<EmailVerificationToken[]> {
    return await this.db(this.tableName)
      .where('user_id', userId)
      .where('is_used', false)
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');
  }

  /**
   * Find expired tokens
   */
  async findExpired(): Promise<EmailVerificationToken[]> {
    return await this.db(this.tableName).where('expires_at', '<', new Date());
  }

  /**
   * Mark token as used
   */
  async markAsUsed(tokenId: number): Promise<boolean> {
    const result = await this.db(this.tableName).where('id', tokenId).update({
      is_used: true,
      used_at: new Date(),
      updated_at: new Date(),
    });

    return result > 0;
  }

  /**
   * Delete token by ID
   */
  async deleteToken(tokenId: number): Promise<boolean> {
    const result = await this.db(this.tableName).where('id', tokenId).del();

    return result > 0;
  }

  /**
   * Get all tokens
   */
  async findAll(
    queryParams?: QueryParams
  ): Promise<{ data: EmailVerificationToken[]; total: number }> {
    return await super.findAll(queryParams);
  }

  /**
   * Get token statistics
   */
  async getStatistics(): Promise<{
    total_tokens: number;
    active_tokens: number;
    expired_tokens: number;
    used_tokens: number;
    email_verification_tokens: number;
    password_reset_tokens: number;
  }> {
    const { data: allTokens } = await this.findAll();
    const now = new Date();

    const activeTokens = allTokens.filter(token => !token.is_used && token.expires_at > now);
    const expiredTokens = allTokens.filter(token => token.expires_at < now);
    const usedTokens = allTokens.filter(token => token.is_used);

    return {
      total_tokens: allTokens.length,
      active_tokens: activeTokens.length,
      expired_tokens: expiredTokens.length,
      used_tokens: usedTokens.length,
      email_verification_tokens: allTokens.filter(token => token.type === 'email_verification')
        .length,
      password_reset_tokens: allTokens.filter(token => token.type === 'password_reset').length,
    };
  }
}
