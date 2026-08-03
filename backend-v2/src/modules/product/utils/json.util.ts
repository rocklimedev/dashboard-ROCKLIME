import { Logger } from '@nestjs/common';

const logger = new Logger('ProductsJsonUtil');

/**
 * Parses a JSON string safely, returning `fallback` (and logging a warning)
 * if the input is missing, empty, or not valid JSON.
 * Non-string input is returned as-is (already an object/array).
 */
export function parseJsonSafely<T = any>(
  input: unknown,
  fallback: T,
  context = '',
): T {
  if (input == null) return fallback;
  if (typeof input !== 'string') return input as T;

  const trimmed = input.trim();
  if (trimmed === '' || trimmed === 'null') return fallback;

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    logger.warn(
      `Invalid JSON detected in ${context}: ${trimmed.substring(0, 200)}`,
    );
    return fallback;
  }
}

/**
 * Like parseJsonSafely, but always normalizes the result to an array.
 */
export function parseJsonArraySafely(
  value: unknown,
  fallback: any[] = [],
): any[] {
  if (value == null) return fallback;
  if (typeof value !== 'string') return (value as any[]) ?? fallback;

  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return fallback;
  }
}
