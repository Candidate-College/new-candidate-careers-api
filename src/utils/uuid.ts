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

/**
 * Validate if a string is a valid UUID (v4 or v1)
 * @param uuid The string to validate
 * @returns true if valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
