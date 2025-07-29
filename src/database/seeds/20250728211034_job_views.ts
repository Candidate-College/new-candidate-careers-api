import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('job_views').del();

  // Inserts seed entries
  await knex('job_views').insert([
    {
      job_posting_id: 1, // Senior Backend Engineer
      ip_address: '192.168.1.200',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referrer: 'https://www.google.com/search?q=backend+engineer+jobs',
      session_id: 'session_candidate_001',
      viewed_at: new Date('2025-07-28T09:00:00.000Z'),
    },
    {
      job_posting_id: 1, // Senior Backend Engineer
      ip_address: '192.168.1.201',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      referrer: 'https://www.linkedin.com/jobs/',
      session_id: 'session_candidate_002',
      viewed_at: new Date('2025-07-28T10:30:00.000Z'),
    },
    {
      job_posting_id: 3, // Digital Marketing Intern
      ip_address: '192.168.1.202',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referrer: 'https://www.indeed.com/',
      session_id: 'session_candidate_003',
      viewed_at: new Date('2025-07-28T11:15:00.000Z'),
    },
    {
      job_posting_id: 4, // UI/UX Designer
      ip_address: '192.168.1.203',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      referrer: 'https://www.behance.net/',
      session_id: 'session_candidate_004',
      viewed_at: new Date('2025-07-28T14:20:00.000Z'),
    },
    {
      job_posting_id: 6, // DevOps Engineer
      ip_address: '192.168.1.204',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      referrer: 'https://www.stackoverflow.com/jobs/',
      session_id: 'session_candidate_005',
      viewed_at: new Date('2025-07-28T15:45:00.000Z'),
    },
  ]);
}
