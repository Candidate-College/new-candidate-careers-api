import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 string
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Generate multiple UUIDs for seeding
 * @param count Number of UUIDs to generate
 * @returns Array of UUID strings
 */
export function generateUUIDs(count: number): string[] {
  return Array.from({ length: count }, () => uuidv4());
}
