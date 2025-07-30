import type { Knex } from 'knex';
import { generateUUIDs } from '../../utils/uuid';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('email_verification_tokens').del();

  // Base timestamp for July 30, 2025
  const baseTimestamp = new Date('2025-07-30T10:51:56.000Z');

  // Generate sample tokens for testing
  const sampleTokens = generateUUIDs(5);

  // Inserts seed entries
  await knex('email_verification_tokens').insert([
    {
      id: 1,
      token: sampleTokens[0],
      user_id: 1, // admin@ccp.com
      type: 'email_verification',
      is_used: false,
      expires_at: new Date(baseTimestamp.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
      used_at: null,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      token: sampleTokens[1],
      user_id: 2, // head.hr@ccp.com
      type: 'email_verification',
      is_used: true,
      expires_at: new Date(baseTimestamp.getTime() + 24 * 60 * 60 * 1000),
      used_at: new Date(baseTimestamp.getTime() + 2 * 60 * 60 * 1000), // Used 2 hours after creation
      ip_address: '192.168.1.101',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      token: sampleTokens[2],
      user_id: 3, // siti.nurhaliza@ccp.com
      type: 'password_reset',
      is_used: false,
      expires_at: new Date(baseTimestamp.getTime() + 1 * 60 * 60 * 1000), // 1 hour from now
      used_at: null,
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      token: sampleTokens[3],
      user_id: 4, // agus.wijaya@ccp.com
      type: 'email_verification',
      is_used: false,
      expires_at: new Date(baseTimestamp.getTime() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
      used_at: null,
      ip_address: '192.168.1.103',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      token: sampleTokens[4],
      user_id: 5, // dewi.lestari@ccp.com
      type: 'password_reset',
      is_used: true,
      expires_at: new Date(baseTimestamp.getTime() + 1 * 60 * 60 * 1000),
      used_at: new Date(baseTimestamp.getTime() + 30 * 60 * 1000), // Used 30 minutes after creation
      ip_address: '192.168.1.104',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
