import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { projectMemberAuditLog, projects, users, rateLimits } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { AuditLogger } from '../services/auditLogger';
import { cleanupExpiredRateLimits } from '../services/rateLimitCleanup';
import { sanitizeMemberError } from '../utils/errorSanitizer';
import { createRateLimiter } from '../middleware/rateLimiter';
import { SAFE_ERROR_MESSAGES } from '../../shared/constants/errors';

/**
 * Security Integration Tests - Phase 5
 *
 * These tests verify that security components work TOGETHER correctly:
 * 1. Audit trail completeness across multiple operations
 * 2. Rate limiter + cleanup service interaction
 * 3. Error sanitizer consistency across error types
 * 4. Rate limit header progression through request lifecycle
 *
 * BEHAVIOR UNDER TEST:
 * When multiple security components interact (audit logging during
 * rate-limited operations, cleanup preserving active records, error
 * sanitization across all failure modes), the system must maintain
 * its security guarantees end-to-end.
 */

// Mock request/response helpers (same pattern as rateLimiter.test.ts)
function createMockReq(
  userId: number,
  projectId: number,
): Partial<Request> {
  return {
    session: { userId },
    params: { id: projectId.toString() },
    route: { path: 'POST /api/projects/:id/members/invite' },
  };
}

function createMockRes(): Partial<Response> & {
  statusCode?: number;
  headers: Record<string, string>;
  jsonData?: Record<string, unknown>;
} {
  const headers: Record<string, string> = {};
  const res: ReturnType<typeof createMockRes> = {
    headers,
    setHeader: ((name: string, value: string) => {
      headers[name] = value;
      return res;
    }) as Response['setHeader'],
    status: ((code: number) => {
      res.statusCode = code;
      return res;
    }) as unknown as Response['status'],
    json: ((data: Record<string, unknown>) => {
      res.jsonData = data;
      return res;
    }) as unknown as Response['json'],
  };
  return res;
}

describe('Security Integration Tests', () => {
  let testUserId: number;
  let testProjectId: number;
  const testEmail = `secint-${process.pid}@test.com`;

  beforeAll(async () => {
    // Clean up stale test data from previous runs
    const existing = await db.select().from(users).where(eq(users.email, testEmail));
    if (existing.length > 0) {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.performedBy, existing[0].id));
      await db.delete(rateLimits).where(eq(rateLimits.userId, existing[0].id));
      await db.delete(projects).where(eq(projects.createdBy, existing[0].id));
      await db.delete(users).where(eq(users.id, existing[0].id));
    }

    // Create test user
    const [user] = await db.insert(users).values({
      email: testEmail,
      passwordHash: 'hashed-password-for-integration-test',
      name: 'Security Integration Test User',
      role: 'user',
    }).returning();
    testUserId = user.id;

    // Create test project
    const [project] = await db.insert(projects).values({
      name: 'Security Integration Test Project',
      location: 'Test Location',
      createdBy: testUserId,
    }).returning();
    testProjectId = project.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe('Audit Trail Completeness', () => {
    beforeEach(async () => {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
    });

    afterEach(async () => {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
    });

    it('should maintain complete audit trail across invite, role_change, and remove operations', async () => {
      const auditLogger = new AuditLogger();

      // Step 1: Invite a member
      await auditLogger.logInvitation({
        projectId: testProjectId,
        performedBy: testUserId,
        targetUserEmail: `invited-${process.pid}@test.com`,
        role: 'viewer',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
      });

      // Step 2: Change their role
      await auditLogger.logRoleChange({
        projectId: testProjectId,
        memberId: 100,
        performedBy: testUserId,
        targetUserEmail: `invited-${process.pid}@test.com`,
        oldRole: 'viewer',
        newRole: 'editor',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
      });

      // Step 3: Remove the member
      await auditLogger.logRemoval({
        projectId: testProjectId,
        memberId: 100,
        performedBy: testUserId,
        targetUserEmail: `invited-${process.pid}@test.com`,
        role: 'editor',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
      });

      // Verify: All three operations are recorded in chronological order
      const logs = await auditLogger.getLogs({ projectId: testProjectId });

      expect(logs).toHaveLength(3);

      // getLogs returns most recent first (DESC), so reverse for chronological
      const chronological = [...logs].reverse();

      expect(chronological[0].action).toBe('invite');
      expect(chronological[1].action).toBe('role_change');
      expect(chronological[2].action).toBe('remove');

      // Verify all logs share the same project and performer
      for (const log of chronological) {
        expect(log.projectId).toBe(testProjectId);
        expect(log.performedBy).toBe(testUserId);
        expect(log.targetUserEmail).toBe(`invited-${process.pid}@test.com`);
        expect(log.createdAt).toBeInstanceOf(Date);
      }

      // Verify the role_change captured both old and new values
      expect(chronological[1].oldValue).toEqual({ role: 'viewer' });
      expect(chronological[1].newValue).toEqual({ role: 'editor' });
    });
  });

  describe('Rate Limiter + Cleanup Interaction', () => {
    beforeEach(async () => {
      await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    });

    afterEach(async () => {
      await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    });

    it('should preserve active rate limit records while removing only expired ones after cleanup', async () => {
      // Create an expired record (25 hours old)
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await db.insert(rateLimits).values({
        userId: testUserId,
        endpoint: 'POST /api/projects/:id/members/invite',
        projectId: testProjectId,
        requestCount: 10,
        windowStart: twentyFiveHoursAgo,
      });

      // Create an active record (5 minutes old)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      await db.insert(rateLimits).values({
        userId: testUserId,
        endpoint: 'PUT /api/projects/:id/members/:memberId',
        projectId: testProjectId,
        requestCount: 3,
        windowStart: fiveMinutesAgo,
      });

      // Verify both records exist before cleanup
      const beforeCleanup = await db.select()
        .from(rateLimits)
        .where(eq(rateLimits.userId, testUserId));
      expect(beforeCleanup).toHaveLength(2);

      // Run cleanup
      const deletedCount = await cleanupExpiredRateLimits();

      // Verify only the expired record was removed
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      const afterCleanup = await db.select()
        .from(rateLimits)
        .where(eq(rateLimits.userId, testUserId));
      expect(afterCleanup).toHaveLength(1);

      // The surviving record should be the active one
      expect(afterCleanup[0].endpoint).toBe('PUT /api/projects/:id/members/:memberId');
      expect(afterCleanup[0].requestCount).toBe(3);
    });
  });

  describe('Error Sanitizer Consistency', () => {
    it('should return the same generic message regardless of internal error details', () => {
      // Simulate various internal error types that could leak information
      const internalErrors = [
        new Error('relation "users" does not exist'),
        new Error('duplicate key value violates unique constraint'),
        new Error('ECONNREFUSED 127.0.0.1:5432'),
        new Error('User alice@company.com already exists in project'),
        new Error('Cannot remove owner bob@company.com'),
        new Error('SSL connection has been closed unexpectedly'),
        new Error('Query read timeout'),
      ];

      const inviteResults = internalErrors.map(err => sanitizeMemberError(err, 'invite'));
      const updateResults = internalErrors.map(err => sanitizeMemberError(err, 'update'));
      const removeResults = internalErrors.map(err => sanitizeMemberError(err, 'remove'));

      // All invite errors should produce the same message
      const uniqueInviteMessages = new Set(inviteResults);
      expect(uniqueInviteMessages.size).toBe(1);
      expect(inviteResults[0]).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);

      // All update errors should produce the same message
      const uniqueUpdateMessages = new Set(updateResults);
      expect(uniqueUpdateMessages.size).toBe(1);
      expect(updateResults[0]).toBe(SAFE_ERROR_MESSAGES.MEMBER_UPDATE_FAILED);

      // All remove errors should produce the same message
      const uniqueRemoveMessages = new Set(removeResults);
      expect(uniqueRemoveMessages.size).toBe(1);
      expect(removeResults[0]).toBe(SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED);
    });
  });

  describe('Rate Limit Headers Progression', () => {
    beforeEach(async () => {
      await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    });

    afterEach(async () => {
      await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    });

    it('should show decreasing remaining count then 429 with Retry-After when limit exceeded', async () => {
      const middleware = createRateLimiter('POST /api/projects/:id/members/invite');

      // Make requests up to the limit, tracking headers
      const remainingValues: string[] = [];

      for (let i = 0; i < 10; i++) {
        const req = createMockReq(testUserId, testProjectId) as Request;
        const res = createMockRes() as Response;
        const next = (() => {}) as NextFunction;

        await middleware(req, res, next);

        // Should not be blocked yet
        expect(res.statusCode).toBeUndefined();
        remainingValues.push(res.headers['X-RateLimit-Remaining']);
      }

      // Verify remaining count decreased from 9 to 0
      expect(remainingValues[0]).toBe('9');
      expect(remainingValues[9]).toBe('0');
      for (let i = 0; i < remainingValues.length - 1; i++) {
        expect(parseInt(remainingValues[i], 10)).toBeGreaterThan(
          parseInt(remainingValues[i + 1], 10)
        );
      }

      // 11th request should be blocked with 429
      const req = createMockReq(testUserId, testProjectId) as Request;
      const res = createMockRes() as Response;
      const next = (() => {}) as NextFunction;

      await middleware(req, res, next);

      expect(res.statusCode).toBe(429);
      expect(res.headers['Retry-After']).toBeDefined();
      expect(parseInt(res.headers['Retry-After'], 10)).toBeGreaterThan(0);
      expect(res.headers['X-RateLimit-Remaining']).toBe('0');
      expect(res.jsonData?.message).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
    });
  });
});
