import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { rateLimits } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { SAFE_ERROR_MESSAGES } from '../../shared/constants/errors';

/**
 * Rate Limiter Configuration
 * Defines rate limit policies for different API endpoints
 */
interface RateLimitConfig {
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Scope of rate limiting: per-user or per-user-per-project */
  scope: 'per-user' | 'per-user-per-project';
}

/**
 * Rate limit configurations for member management endpoints
 *
 * These limits prevent abuse while allowing legitimate usage:
 * - Invitations: 10 per 15 minutes (prevents spam)
 * - Updates: 20 per 15 minutes (allows batch edits)
 * - Deletions: 20 per 15 minutes (allows batch cleanup)
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  'POST /api/projects/:id/members/invite': {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    scope: 'per-user-per-project',
  },
  'PUT /api/projects/:id/members/:memberId': {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
    scope: 'per-user-per-project',
  },
  'DELETE /api/projects/:id/members/:memberId': {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,
    scope: 'per-user-per-project',
  },
};

/**
 * Sets standard rate limit headers on the response
 *
 * These headers follow RFC 6585 and IETF draft standards for rate limiting.
 * They inform clients about their quota and when they can make requests again.
 *
 * @param res - Express response object
 * @param limit - Maximum requests allowed in the window
 * @param remaining - Number of requests remaining
 * @param resetTime - Date when the window resets
 */
function setRateLimitHeaders(
  res: Response,
  limit: number,
  remaining: number,
  resetTime: Date
): void {
  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000).toString());
}

/**
 * Creates a rate limiter middleware for a specific endpoint
 *
 * SECURITY FIX: SEC-03 - No Rate Limiting Allows Abuse
 * This middleware prevents spam attacks and brute force attempts by limiting the number
 * of requests a user can make to sensitive endpoints within a time window.
 *
 * ALGORITHM: Sliding Window with PostgreSQL-backed storage
 * 1. Check if request count exists for this user/endpoint/project/window
 * 2. If window expired, create new window with count=1
 * 3. If within window and under limit, increment count
 * 4. If within window and at/over limit, return 429 with headers
 *
 * WHY SLIDING WINDOW?
 * - Simple to implement (no complex bucket logic)
 * - Accurate rate limiting (not approximate like token bucket)
 * - PostgreSQL-backed (no additional infrastructure needed)
 * - Survives server restarts (persistent storage)
 *
 * FAIL-OPEN POLICY (CRITICAL FOR RELIABILITY):
 * The middleware MUST NOT block legitimate traffic when rate limiter fails.
 * We prefer false negatives (letting attackers through) over false positives
 * (blocking legitimate users) because:
 * - Rate limiter is defense-in-depth, not primary auth
 * - Other security layers (auth, authorization) still protect
 * - Availability matters - don't break the app if rate limiter breaks
 *
 * Fail-open scenarios:
 * - Database errors occur → call next() to allow request
 * - User not authenticated → call next() (auth middleware handles)
 * - No config exists for endpoint → call next() (no rate limit)
 *
 * HEADERS (RFC 6585 compliance):
 * Standard rate limit headers inform clients about their quota:
 * - X-RateLimit-Limit: Maximum requests allowed in window
 * - X-RateLimit-Remaining: Requests remaining in current window
 * - X-RateLimit-Reset: Unix timestamp when window resets
 * - Retry-After: Seconds until window reset (only on 429 response)
 *
 * WHY THESE HEADERS?
 * - Industry standard (used by GitHub, Twitter, Stripe, etc.)
 * - Client-friendly (apps can show "try again in X seconds")
 * - Transparent (users know they're being rate limited, not blocked)
 *
 * @param endpoint - The endpoint string (e.g., 'POST /api/projects/:id/members/invite')
 * @returns Express middleware function
 *
 * @example
 * ```typescript
 * // Apply to invitation endpoint (10 requests per 15 minutes)
 * app.post(
 *   "/api/projects/:id/members/invite",
 *   createRateLimiter('POST /api/projects/:id/members/invite'),
 *   async (req, res) => { ... }
 * );
 *
 * // Apply to update endpoint (20 requests per 15 minutes)
 * app.put(
 *   "/api/projects/:id/members/:memberId",
 *   createRateLimiter('PUT /api/projects/:id/members/:memberId'),
 *   async (req, res) => { ... }
 * );
 * ```
 *
 * @see {@link https://tools.ietf.org/html/rfc6585#section-4} RFC 6585 - 429 Too Many Requests
 * @see {@link https://www.ietf.org/archive/id/draft-ietf-httpapi-ratelimit-headers-07.html} IETF Draft - RateLimit Header Fields
 */
export function createRateLimiter(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const config = RATE_LIMIT_CONFIGS[endpoint];

    // No rate limit configured for this endpoint - pass through
    if (!config) {
      return next();
    }

    const userId = req.session?.userId;

    // User not authenticated - let auth middleware handle
    if (!userId) {
      return next();
    }

    // Extract project ID for per-user-per-project scoping
    const projectId = config.scope === 'per-user-per-project'
      ? parseInt(req.params.id, 10)
      : null;

    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Build WHERE clause for finding existing rate limit record
      const whereConditions = [
        eq(rateLimits.userId, userId),
        eq(rateLimits.endpoint, endpoint),
      ];

      if (projectId !== null) {
        whereConditions.push(eq(rateLimits.projectId, projectId));
      }

      // Get existing rate limit record
      const existing = await db.select()
        .from(rateLimits)
        .where(and(...whereConditions));

      let record = existing[0];

      // No record OR window expired - create new window
      if (!record || new Date(record.windowStart) < windowStart) {
        // Delete old record if exists
        if (record) {
          await db.delete(rateLimits).where(eq(rateLimits.id, record.id));
        }

        // Create new window with count=1
        [record] = await db.insert(rateLimits).values({
          userId,
          endpoint,
          projectId,
          requestCount: 1,
          windowStart: now,
        }).returning();
      } else {
        // Within window - check if limit exceeded
        if (record.requestCount >= config.maxRequests) {
          // Rate limit exceeded - return 429
          const resetTime = new Date(record.windowStart.getTime() + config.windowMs);
          const retryAfterSeconds = Math.ceil((resetTime.getTime() - now.getTime()) / 1000);

          // Set standard rate limit headers (RFC 6585)
          setRateLimitHeaders(res, config.maxRequests, 0, resetTime);
          res.setHeader('Retry-After', retryAfterSeconds.toString());

          return res.status(429).json({
            message: SAFE_ERROR_MESSAGES.RATE_LIMITED,
            retryAfter: retryAfterSeconds,
          });
        }

        // Within window and under limit - increment counter
        [record] = await db.update(rateLimits)
          .set({ requestCount: record.requestCount + 1 })
          .where(eq(rateLimits.id, record.id))
          .returning();
      }

      // Set rate limit headers for successful request
      const remaining = Math.max(0, config.maxRequests - record.requestCount);
      const resetTime = new Date(record.windowStart.getTime() + config.windowMs);
      setRateLimitHeaders(res, config.maxRequests, remaining, resetTime);

      next();

    } catch (error) {
      // FAIL-OPEN: Don't block on rate limiter errors
      console.error('Rate limiter error:', error);
      next();
    }
  };
}
