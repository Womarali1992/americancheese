import { db } from '../db';
import { rateLimits } from '../../shared/schema';
import { lt } from 'drizzle-orm';

/**
 * Rate Limit Cleanup Service
 *
 * Deletes expired rate limit records (older than 24 hours) to prevent
 * unbounded table growth. All rate limit windows are at most 15 minutes,
 * so records older than 24 hours serve no purpose.
 *
 * Part of SEC-03: No Rate Limiting Allows Abuse (Task 4.2)
 */

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Deletes rate limit records where windowStart is more than 24 hours ago.
 *
 * @returns The number of deleted records
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

  const deleted = await db.delete(rateLimits)
    .where(lt(rateLimits.windowStart, cutoff))
    .returning();

  const count = deleted.length;

  if (count > 0) {
    console.log(`Rate limit cleanup: deleted ${count} expired record(s)`);
  }

  return count;
}

/**
 * Starts a recurring cleanup job that runs every hour via setInterval.
 *
 * @returns The interval ID (can be used to clear the interval for shutdown)
 */
export function startRateLimitCleanupSchedule(): ReturnType<typeof setInterval> {
  // Run cleanup immediately on startup
  cleanupExpiredRateLimits().catch((error) => {
    console.error('Rate limit cleanup failed on startup:', error);
  });

  // Then run every hour
  const intervalId = setInterval(() => {
    cleanupExpiredRateLimits().catch((error) => {
      console.error('Rate limit cleanup failed:', error);
    });
  }, ONE_HOUR_MS);

  console.log('Rate limit cleanup schedule started (runs every hour)');

  return intervalId;
}
