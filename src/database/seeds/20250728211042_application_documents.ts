import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('application_documents').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Inserts seed entries
  await knex('application_documents').insert([
    {
      application_id: 1, // Ahmad Fauzi - Senior Backend Engineer
      document_type: 'cv',
      url: 'https://path/to/cv_ahmad_fauzi.pdf',
      filename: 'cv_ahmad_fauzi.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 1, // Ahmad Fauzi - Senior Backend Engineer
      document_type: 'portfolio',
      url: 'https://path/to/portfolio_ahmad_fauzi.pdf',
      filename: 'portfolio_ahmad_fauzi.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 2, // Riri Aprilia - Senior Backend Engineer
      document_type: 'cv',
      url: 'https://path/to/cv_riri_aprilia.pdf',
      filename: 'cv_riri_aprilia.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 3, // Ahmad Fauzi - DevOps Engineer
      document_type: 'cv',
      url: 'https://path/to/cv_ahmad_fauzi_2.pdf',
      filename: 'cv_ahmad_fauzi_2.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 4, // Chandra Putra - UI/UX Designer
      document_type: 'cv',
      url: 'https://path/to/cv_chandra_putra.pdf',
      filename: 'cv_chandra_putra.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 4, // Chandra Putra - UI/UX Designer
      document_type: 'portfolio',
      url: 'https://path/to/portfolio_chandra_putra.pdf',
      filename: 'portfolio_chandra_putra.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 5, // Diana Sari - Digital Marketing Intern
      document_type: 'cv',
      url: 'https://path/to/cv_diana_sari.pdf',
      filename: 'cv_diana_sari.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 6, // Farhan Malik - Digital Marketing Intern
      document_type: 'cv',
      url: 'https://path/to/cv_farhan_malik.pdf',
      filename: 'cv_farhan_malik.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 7, // Indah Permatasari - HR Generalist
      document_type: 'cv',
      url: 'https://path/to/cv_indah_permatasari.pdf',
      filename: 'cv_indah_permatasari.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 8, // Grace Natalia - Financial Analyst
      document_type: 'cv',
      url: 'https://path/to/cv_grace_natalia.pdf',
      filename: 'cv_grace_natalia.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 9, // Hadi Pranata - Product Manager
      document_type: 'cv',
      url: 'https://path/to/cv_hadi_pranata.pdf',
      filename: 'cv_hadi_pranata.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      application_id: 10, // Riri Aprilia - Lead Mobile Developer (iOS)
      document_type: 'cv',
      url: 'https://path/to/cv_riri_aprilia_2.pdf',
      filename: 'cv_riri_aprilia_2.pdf',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
