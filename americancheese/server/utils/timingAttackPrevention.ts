import type { Response } from 'express';

/**
 * Timing Attack Prevention Utility (SEC-01)
 *
 * Adds random delays to API responses to prevent timing-based user enumeration attacks.
 *
 * WHY THIS IS NEEDED:
 * Even with identical error messages, attackers can sometimes distinguish between scenarios
 * by measuring response times. For example:
 * - Checking if user exists in DB: 50ms
 * - Checking if user is owner: 10ms
 * - Validation error: 5ms
 *
 * By adding random delay, we mask these timing differences and make it impossible
 * to reliably distinguish scenarios based on response time alone.
 *
 * USAGE:
 * Call this function before returning any error response that might reveal
 * information about user existence or state.
 *
 * @example
 * ```typescript
 * if (userIsOwner) {
 *   await addRandomDelay(); // Add delay before responding
 *   return res.status(400).json({ message: SAFE_ERROR_MESSAGES.INVITATION_FAILED });
 * }
 * ```
 *
 * @param minMs Minimum delay in milliseconds (default 0)
 * @param maxMs Maximum delay in milliseconds (default 100)
 * @returns Promise that resolves after the random delay
 */
export async function addRandomDelay(minMs = 0, maxMs = 100): Promise<void> {
  const delay = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Send a security-hardened error response with timing attack prevention
 *
 * This is a convenience wrapper that combines:
 * 1. Random delay (timing attack prevention)
 * 2. Consistent error message format
 * 3. Appropriate HTTP status code
 *
 * Use this for any error response that might reveal user existence or state.
 *
 * SECURITY NOTE:
 * Always use SAFE_ERROR_MESSAGES constants for the message parameter.
 * Never pass raw error messages or user-provided strings.
 *
 * @example
 * ```typescript
 * if (userIsOwner) {
 *   return sendSecureErrorResponse(res, SAFE_ERROR_MESSAGES.INVITATION_FAILED);
 * }
 * ```
 *
 * @param res Express response object
 * @param message Safe error message (use SAFE_ERROR_MESSAGES constants)
 * @param statusCode HTTP status code (default 400 Bad Request)
 * @returns Promise that resolves after sending the response
 */
export async function sendSecureErrorResponse(
  res: Response,
  message: string,
  statusCode: number = 400
): Promise<void> {
  await addRandomDelay();
  res.status(statusCode).json({ message });
}
