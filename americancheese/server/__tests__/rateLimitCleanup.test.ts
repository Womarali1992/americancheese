import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { rateLimits, users, projects } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { cleanupExpiredRateLimits } from '../services/rateLimitCleanup';

/**
 * Rate Limit Cleanup Tests for SEC-03: Task 4.2
 * Add Cleanup Job for Old Rate Limit Records
 *
 * BEHAVIOR UNDER TEST:
 * - Expired rate limit records (older than 24 hours) are deleted to prevent
 *   unbounded table growth and maintain database performance.
 * - Recent records (within 24 hours) are preserved so active rate limiting
 *   continues to function correctly.
 * - The cleanup function returns the count of deleted records for observability.
 *
 * BUSINESS RULE:
 * Rate limit records older than 24 hours serve no purpose because all rate limit
 * windows are at most 15 minutes. Cleaning up after 24 hours provides a generous
 * safety margin while preventing table bloat.
 */

describe('Rate Limit Cleanup Service (SEC-03 Task 4.2)', () => {
  let testUserId: number;
  let testProjectId: number;
  const testEmail = `cleanup-${process.pid}@test.com`;

  beforeAll(async () => {
    // Clean up stale test data from previous runs
    const existing = await db.select().from(users).where(eq(users.email, testEmail));
    if (existing.length > 0) {
      await db.delete(rateLimits).where(eq(rateLimits.userId, existing[0].id));
      await db.delete(projects).where(eq(projects.createdBy, existing[0].id));
      await db.delete(users).where(eq(users.id, existing[0].id));
    }

    // Create test user
    const [user] = await db.insert(users).values({
      email: testEmail,
      passwordHash: 'hashed-password-for-cleanup-test',
      name: 'Cleanup Test User',
      role: 'user',
    }).returning();
    testUserId = user.id;

    // Create test project
    const [project] = await db.insert(projects).values({
      name: 'Cleanup Test Project',
      location: 'Test Location',
      createdBy: testUserId,
    }).returning();
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(async () => {
    // Clear rate limit records for the test user before each test
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
  });

  afterEach(async () => {
    // Clear rate limit records for the test user after each test
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
  });

  it('should delete rate limit records older than 24 hours', async () => {
    // Arrange: Insert a record with windowStart 25 hours ago (expired)
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

    await db.insert(rateLimits).values({
      userId: testUserId,
      endpoint: 'POST /api/projects/:id/members/invite',
      projectId: testProjectId,
      requestCount: 5,
      windowStart: twentyFiveHoursAgo,
    });

    // Act: Run cleanup
    const deletedCount = await cleanupExpiredRateLimits();

    // Assert: The expired record should be deleted
    const remaining = await db.select()
      .from(rateLimits)
      .where(eq(rateLimits.userId, testUserId));

    expect(remaining).toHaveLength(0);
    expect(deletedCount).toBeGreaterThanOrEqual(1);
  });

  it('should NOT delete rate limit records newer than 24 hours', async () => {
    // Arrange: Insert a record with windowStart 1 hour ago (still valid)
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);

    await db.insert(rateLimits).values({
      userId: testUserId,
      endpoint: 'POST /api/projects/:id/members/invite',
      projectId: testProjectId,
      requestCount: 3,
      windowStart: oneHourAgo,
    });

    // Act: Run cleanup
    await cleanupExpiredRateLimits();

    // Assert: The recent record should still exist
    const remaining = await db.select()
      .from(rateLimits)
      .where(eq(rateLimits.userId, testUserId));

    expect(remaining).toHaveLength(1);
    expect(remaining[0].requestCount).toBe(3);
  });

  it('should return the count of deleted records', async () => {
    // Arrange: Insert multiple expired records
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    await db.insert(rateLimits).values([
      {
        userId: testUserId,
        endpoint: 'POST /api/projects/:id/members/invite',
        projectId: testProjectId,
        requestCount: 10,
        windowStart: thirtyHoursAgo,
      },
      {
        userId: testUserId,
        endpoint: 'PUT /api/projects/:id/members/:memberId',
        projectId: testProjectId,
        requestCount: 7,
        windowStart: fortyEightHoursAgo,
      },
    ]);

    // Act: Run cleanup
    const deletedCount = await cleanupExpiredRateLimits();

    // Assert: Both expired records should be deleted, count should reflect that
    expect(deletedCount).toBeGreaterThanOrEqual(2);

    const remaining = await db.select()
      .from(rateLimits)
      .where(eq(rateLimits.userId, testUserId));

    expect(remaining).toHaveLength(0);
  });

  it('should return 0 when there are no expired records to delete', async () => {
    // Arrange: Insert only a recent record
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    await db.insert(rateLimits).values({
      userId: testUserId,
      endpoint: 'POST /api/projects/:id/members/invite',
      projectId: testProjectId,
      requestCount: 1,
      windowStart: fiveMinutesAgo,
    });

    // Act: Run cleanup
    const deletedCount = await cleanupExpiredRateLimits();

    // Assert: Nothing should be deleted
    expect(deletedCount).toBe(0);

    const remaining = await db.select()
      .from(rateLimits)
      .where(eq(rateLimits.userId, testUserId));

    expect(remaining).toHaveLength(1);
  });

  it('should delete expired records while preserving recent records', async () => {
    // Arrange: Mix of expired and recent records
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    await db.insert(rateLimits).values([
      {
        userId: testUserId,
        endpoint: 'POST /api/projects/:id/members/invite',
        projectId: testProjectId,
        requestCount: 10,
        windowStart: twentyFiveHoursAgo,
      },
      {
        userId: testUserId,
        endpoint: 'PUT /api/projects/:id/members/:memberId',
        projectId: testProjectId,
        requestCount: 2,
        windowStart: thirtyMinutesAgo,
      },
    ]);

    // Act: Run cleanup
    const deletedCount = await cleanupExpiredRateLimits();

    // Assert: Only the expired record should be deleted
    expect(deletedCount).toBeGreaterThanOrEqual(1);

    const remaining = await db.select()
      .from(rateLimits)
      .where(eq(rateLimits.userId, testUserId));

    expect(remaining).toHaveLength(1);
    expect(remaining[0].endpoint).toBe('PUT /api/projects/:id/members/:memberId');
    expect(remaining[0].requestCount).toBe(2);
  });
});
