import type { Knex } from 'knex';
import { generateUUIDs } from '../../utils/uuid';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('candidates').del();

  // Base timestamp for July 28, 2025
  const baseTimestamp = new Date('2025-07-28T21:10:30.000Z');

  // Generate UUIDs for all candidates
  const candidateUUIDs = generateUUIDs(10);

  // Inserts seed entries
  await knex('candidates').insert([
    {
      id: 1,
      uuid: candidateUUIDs[0],
      email: 'ahmad.fauzi@email.com',
      full_name: 'Ahmad Fauzi',
      domicile: 'Jakarta',
      university: 'Universitas Indonesia',
      major: 'Computer Science',
      semester: '8',
      whatsapp_number: '6281234567890',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 2,
      uuid: candidateUUIDs[1],
      email: 'riri.aprilia@email.com',
      full_name: 'Riri Aprilia',
      domicile: 'Bandung',
      university: 'Institut Teknologi Bandung',
      major: 'Informatics',
      semester: '7',
      whatsapp_number: '6281234567891',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 3,
      uuid: candidateUUIDs[2],
      email: 'chandra.putra@email.com',
      full_name: 'Chandra Putra',
      domicile: 'Surabaya',
      university: 'Institut Teknologi Sepuluh Nopember',
      major: 'Visual Communication Design',
      semester: 'Graduated',
      whatsapp_number: '6281234567892',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 4,
      uuid: candidateUUIDs[3],
      email: 'diana.sari@email.com',
      full_name: 'Diana Sari',
      domicile: 'Yogyakarta',
      university: 'Universitas Gadjah Mada',
      major: 'Management',
      semester: '5',
      whatsapp_number: '6281234567893',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 5,
      uuid: candidateUUIDs[4],
      email: 'farhan.malik@email.com',
      full_name: 'Farhan Malik',
      domicile: 'Tangerang',
      university: 'Binus University',
      major: 'Marketing Communication',
      semester: '8',
      whatsapp_number: '6281234567894',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 6,
      uuid: candidateUUIDs[5],
      email: 'grace.natalia@email.com',
      full_name: 'Grace Natalia',
      domicile: 'Jakarta',
      university: 'Universitas Indonesia',
      major: 'Accounting',
      semester: 'Graduated',
      whatsapp_number: '6281234567895',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 7,
      uuid: candidateUUIDs[6],
      email: 'hadi.pranata@email.com',
      full_name: 'Hadi Pranata',
      domicile: 'Bekasi',
      university: 'Universitas Gunadarma',
      major: 'Information Systems',
      semester: 'Graduated',
      whatsapp_number: '6281234567896',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 8,
      uuid: candidateUUIDs[7],
      email: 'indah.permatasari@email.com',
      full_name: 'Indah Permatasari',
      domicile: 'Depok',
      university: 'Universitas Padjadjaran',
      major: 'Psychology',
      semester: 'Graduated',
      whatsapp_number: '6281234567897',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 9,
      uuid: candidateUUIDs[8],
      email: 'jaya.kusuma@email.com',
      full_name: 'Jaya Kusuma',
      domicile: 'Bogor',
      university: 'IPB University',
      major: 'Agribusiness',
      semester: '4',
      whatsapp_number: '6281234567898',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
    {
      id: 10,
      uuid: candidateUUIDs[9],
      email: 'kartika.dewi@email.com',
      full_name: 'Kartika Dewi',
      domicile: 'Tangerang Selatan',
      university: 'Universitas Terbuka',
      major: 'Communication',
      semester: '6',
      whatsapp_number: '6281234567899',
      created_at: baseTimestamp,
      updated_at: baseTimestamp,
    },
  ]);
}
