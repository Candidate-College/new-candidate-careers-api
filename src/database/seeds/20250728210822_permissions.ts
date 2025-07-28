import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('permissions').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('permissions').insert([
    // User management permissions
    {
      id: 1,
      name: 'users.view',
      description: 'View user accounts',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      name: 'users.create',
      description: 'Create new user accounts',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      name: 'users.update',
      description: 'Update user accounts',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      name: 'users.delete',
      description: 'Delete user accounts',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    // Role management permissions
    {
      id: 5,
      name: 'roles.view',
      description: 'View roles and permissions',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      name: 'roles.create',
      description: 'Create new roles',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 7,
      name: 'roles.update',
      description: 'Update existing roles',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 8,
      name: 'roles.delete',
      description: 'Delete roles',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    // Job management permissions
    {
      id: 9,
      name: 'jobs.view',
      description: 'View job postings',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 10,
      name: 'jobs.create',
      description: 'Create job postings',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 11,
      name: 'jobs.update',
      description: 'Update job postings',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 12,
      name: 'jobs.delete',
      description: 'Delete job postings',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 13,
      name: 'jobs.publish',
      description: 'Publish job postings',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    // Application management permissions
    {
      id: 14,
      name: 'applications.view',
      description: 'View applications',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 15,
      name: 'applications.review',
      description: 'Review applications',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 16,
      name: 'applications.approve',
      description: 'Approve applications',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 17,
      name: 'applications.reject',
      description: 'Reject applications',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    // Analytics permissions
    {
      id: 18,
      name: 'analytics.view',
      description: 'View analytics and reports',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 19,
      name: 'analytics.export',
      description: 'Export reports',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 20,
      name: 'analytics.executive',
      description: 'View executive dashboard',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    // System management permissions
    {
      id: 21,
      name: 'system.settings',
      description: 'Manage system settings',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 22,
      name: 'system.audit',
      description: 'View audit logs',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 23,
      name: 'system.maintenance',
      description: 'Perform system maintenance',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
