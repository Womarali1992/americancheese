/**
 * Safe JSON parsing utilities for client-side
 *
 * These utilities ensure that JSON parsing never crashes the application
 * by handling malformed data gracefully and returning safe fallback values.
 */

/**
 * Safely parse JSON with a fallback value
 *
 * @param value - The value to parse (string, object, null, or undefined)
 * @param fallback - The fallback value to return if parsing fails
 * @param logErrors - Whether to log parsing errors (default: true in development)
 * @returns The parsed value or the fallback
 */
export function safeJsonParse<T>(
  value: unknown,
  fallback: T,
  logErrors: boolean = import.meta.env.DEV
): T {
  // If already an object, return as-is
  if (typeof value === 'object' && value !== null) {
    return value as T;
  }

  // If not a string or is empty, return fallback
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch (error) {
    if (logErrors) {
      console.error('[safe-json] Failed to parse JSON:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        value: typeof value === 'string' ? value.substring(0, 100) : value,
      });
    }
    return fallback;
  }
}

/**
 * Safely parse JSON array with a fallback array
 *
 * @param value - The value to parse (string, array, null, or undefined)
 * @param fallback - The fallback array to return if parsing fails
 * @param logErrors - Whether to log parsing errors
 * @returns The parsed array or the fallback
 */
export function safeJsonParseArray<T>(
  value: unknown,
  fallback: T[],
  logErrors: boolean = import.meta.env.DEV
): T[] {
  // If already an array, return as-is
  if (Array.isArray(value)) {
    return value;
  }

  const parsed = safeJsonParse<unknown>(value, fallback, logErrors);

  // Ensure the result is an array
  if (!Array.isArray(parsed)) {
    if (logErrors) {
      console.error('[safe-json] Parsed value is not an array, returning fallback');
    }
    return fallback;
  }

  return parsed as T[];
}

/**
 * Safely parse JSON object with a fallback object
 *
 * @param value - The value to parse (string, object, null, or undefined)
 * @param fallback - The fallback object to return if parsing fails
 * @param logErrors - Whether to log parsing errors
 * @returns The parsed object or the fallback
 */
export function safeJsonParseObject<T extends Record<string, unknown>>(
  value: unknown,
  fallback: T,
  logErrors: boolean = import.meta.env.DEV
): T {
  // If already an object (but not array or null), return as-is
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as T;
  }

  const parsed = safeJsonParse<unknown>(value, fallback, logErrors);

  // Ensure the result is an object (not array or null)
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    if (logErrors) {
      console.error('[safe-json] Parsed value is not an object, returning fallback');
    }
    return fallback;
  }

  return parsed as T;
}

/**
 * Safely stringify a value to JSON
 *
 * @param value - The value to stringify
 * @param fallback - The fallback string to return if stringification fails
 * @param logErrors - Whether to log errors
 * @returns The JSON string or the fallback
 */
export function safeJsonStringify(
  value: unknown,
  fallback: string = '{}',
  logErrors: boolean = import.meta.env.DEV
): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    if (logErrors) {
      console.error('[safe-json] Failed to stringify value:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        valueType: typeof value,
      });
    }
    return fallback;
  }
}
