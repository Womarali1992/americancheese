import { describe, it, expect } from 'vitest';
import { SAFE_ERROR_MESSAGES } from '../../shared/constants/errors';
import { sanitizeMemberError } from '../utils/errorSanitizer';
import { addRandomDelay } from '../utils/timingAttackPrevention';
import { AuditLogger } from '../services/auditLogger';
import { createRateLimiter } from '../middleware/rateLimiter';
import { cleanupExpiredRateLimits } from '../services/rateLimitCleanup';
import { db } from '../db';
import { rateLimits, users, projects, projectMemberAuditLog } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Security Verification Tests - Phase 5
 *
 * These tests formally VERIFY that the three identified vulnerabilities
 * are fixed. Each test group maps to a specific security finding:
 *
 * SEC-01: Email Enumeration via Error Messages
 * SEC-02: Missing Audit Trail for Member Operations
 * SEC-03: No Rate Limiting Allows Abuse
 *
 * BUSINESS RULE:
 * The project member management system must prevent information leakage,
 * maintain a complete audit trail, and rate-limit sensitive operations
 * to meet security compliance requirements.
 */

// Mock request/response helpers
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

describe('SEC-01 VERIFIED: No Email Enumeration', () => {
  describe('Safe error message constants contain no identifying words', () => {
    it('should not contain words that reveal user existence or state', () => {
      const dangerousWords = [
        'exists',
        'exist',
        'registered',
        'not found',
        'found',
        'owner',
        'already a member',
        'already exists',
        'user not found',
        'no such user',
        'unknown user',
        'invalid user',
      ];

      const allMessages = Object.values(SAFE_ERROR_MESSAGES);

      for (const message of allMessages) {
        const lower = message.toLowerCase();
        for (const word of dangerousWords) {
          expect(lower).not.toContain(word);
        }
      }
    });
  });

  describe('sanitizeMemberError always returns the same message for any error', () => {
    it('should return identical invite message for SQL error, connection error, and business logic error', () => {
      const sqlError = new Error('relation "project_members" does not exist');
      const connError = new Error('ECONNREFUSED 127.0.0.1:5432');
      const bizError = new Error('User already exists as member');
      const genericError = new Error('Something unexpected happened');

      const results = [
        sanitizeMemberError(sqlError, 'invite'),
        sanitizeMemberError(connError, 'invite'),
        sanitizeMemberError(bizError, 'invite'),
        sanitizeMemberError(genericError, 'invite'),
      ];

      // All results must be identical
      const unique = new Set(results);
      expect(unique.size).toBe(1);
      expect(results[0]).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);
    });

    it('should return identical remove message regardless of error details', () => {
      const ownerError = new Error('Cannot remove project owner');
      const notFoundError = new Error('Member not found');
      const fkError = new Error('violates foreign key constraint');

      const results = [
        sanitizeMemberError(ownerError, 'remove'),
        sanitizeMemberError(notFoundError, 'remove'),
        sanitizeMemberError(fkError, 'remove'),
      ];

      const unique = new Set(results);
      expect(unique.size).toBe(1);
      expect(results[0]).toBe(SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED);
    });
  });

  describe('addRandomDelay produces measurable variance', () => {
    it('should produce different delay durations across calls', async () => {
      const durations: number[] = [];

      for (let i = 0; i < 15; i++) {
        const start = Date.now();
        await addRandomDelay(0, 100);
        durations.push(Date.now() - start);
      }

      // Calculate variance
      const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
      const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;

      // Variance must be greater than zero (indicates randomness)
      expect(variance).toBeGreaterThan(0);

      // There should be multiple distinct timing values
      const uniqueTimings = new Set(durations);
      expect(uniqueTimings.size).toBeGreaterThan(1);
    });
  });
});

describe('SEC-02 VERIFIED: Audit Trail for All Operations', () => {
  describe('AuditLogger has methods for all 5 operation types', () => {
    it('should expose logInvitation, logRoleChange, logRemoval, logAcceptance, and logDecline', () => {
      const auditLogger = new AuditLogger();

      expect(typeof auditLogger.logInvitation).toBe('function');
      expect(typeof auditLogger.logRoleChange).toBe('function');
      expect(typeof auditLogger.logRemoval).toBe('function');
      expect(typeof auditLogger.logAcceptance).toBe('function');
      expect(typeof auditLogger.logDecline).toBe('function');
    });

    it('should also expose getLogs for retrieval', () => {
      const auditLogger = new AuditLogger();
      expect(typeof auditLogger.getLogs).toBe('function');
    });
  });

  describe('Audit log entries include all required fields', () => {
    const testEmail = `secver-audit-${process.pid}@test.com`;
    let testUserId: number;
    let testProjectId: number;

    beforeAll(async () => {
      // Clean up stale data
      const existing = await db.select().from(users).where(eq(users.email, testEmail));
      if (existing.length > 0) {
        await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.performedBy, existing[0].id));
        await db.delete(projects).where(eq(projects.createdBy, existing[0].id));
        await db.delete(users).where(eq(users.id, existing[0].id));
      }

      const [user] = await db.insert(users).values({
        email: testEmail,
        passwordHash: 'hashed-password-for-secver',
        name: 'Security Verification Audit User',
        role: 'user',
      }).returning();
      testUserId = user.id;

      const [project] = await db.insert(projects).values({
        name: 'Security Verification Audit Project',
        location: 'Test Location',
        createdBy: testUserId,
      }).returning();
      testProjectId = project.id;
    });

    afterAll(async () => {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
      await db.delete(projects).where(eq(projects.id, testProjectId));
      await db.delete(users).where(eq(users.id, testUserId));
    });

    beforeEach(async () => {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
    });

    afterEach(async () => {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
    });

    it('should record projectId, performedBy, targetUserEmail, action, and createdAt on every audit entry', async () => {
      const auditLogger = new AuditLogger();

      await auditLogger.logInvitation({
        projectId: testProjectId,
        performedBy: testUserId,
        targetUserEmail: `target-${process.pid}@test.com`,
        role: 'editor',
        ipAddress: '10.0.0.1',
        userAgent: 'VerificationAgent/1.0',
      });

      const logs = await auditLogger.getLogs({ projectId: testProjectId });

      expect(logs).toHaveLength(1);
      const entry = logs[0];

      // All required fields must be present and non-null
      expect(entry.projectId).toBe(testProjectId);
      expect(entry.performedBy).toBe(testUserId);
      expect(entry.targetUserEmail).toBe(`target-${process.pid}@test.com`);
      expect(entry.action).toBe('invite');
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.createdAt.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Transaction wrapper exists in routes.ts for member operations', () => {
    it('should contain db.transaction calls for member management endpoints', () => {
      // Read the routes.ts file and verify it contains db.transaction
      const routesPath = path.resolve(__dirname, '..', 'routes.ts');
      const routesContent = fs.readFileSync(routesPath, 'utf-8');

      // Must use db.transaction for atomicity
      const transactionMatches = routesContent.match(/db\.transaction/g);
      expect(transactionMatches).not.toBeNull();
      expect(transactionMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('SEC-03 VERIFIED: Rate Limiting Prevents Abuse', () => {
  const testEmail = `secver-rate-${process.pid}@test.com`;
  let testUserId: number;
  let testProjectId: number;

  beforeAll(async () => {
    // Clean up stale data
    const existing = await db.select().from(users).where(eq(users.email, testEmail));
    if (existing.length > 0) {
      await db.delete(rateLimits).where(eq(rateLimits.userId, existing[0].id));
      await db.delete(projects).where(eq(projects.createdBy, existing[0].id));
      await db.delete(users).where(eq(users.id, existing[0].id));
    }

    const [user] = await db.insert(users).values({
      email: testEmail,
      passwordHash: 'hashed-password-for-secver-rate',
      name: 'Security Verification Rate User',
      role: 'user',
    }).returning();
    testUserId = user.id;

    const [project] = await db.insert(projects).values({
      name: 'Security Verification Rate Project',
      location: 'Test Location',
      createdBy: testUserId,
    }).returning();
    testProjectId = project.id;
  });

  afterAll(async () => {
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  beforeEach(async () => {
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
  });

  afterEach(async () => {
    await db.delete(rateLimits).where(eq(rateLimits.userId, testUserId));
  });

  describe('Rate limiter blocks after limit reached', () => {
    it('should block the 11th invitation request within a 15-minute window', async () => {
      const middleware = createRateLimiter('POST /api/projects/:id/members/invite');

      // Make 10 successful requests
      for (let i = 0; i < 10; i++) {
        const req = createMockReq(testUserId, testProjectId) as Request;
        const res = createMockRes() as Response;
        const next = (() => {}) as NextFunction;
        await middleware(req, res, next);
        expect(res.statusCode).toBeUndefined();
      }

      // 11th request should be blocked
      const req = createMockReq(testUserId, testProjectId) as Request;
      const res = createMockRes() as Response;
      const next = (() => {}) as NextFunction;
      await middleware(req, res, next);

      expect(res.statusCode).toBe(429);
    });
  });

  describe('Rate limiter returns correct 429 status and safe error message', () => {
    it('should return 429 status with RATE_LIMITED safe message and retryAfter', async () => {
      const middleware = createRateLimiter('POST /api/projects/:id/members/invite');

      // Exhaust the limit
      for (let i = 0; i < 10; i++) {
        const req = createMockReq(testUserId, testProjectId) as Request;
        const res = createMockRes() as Response;
        const next = (() => {}) as NextFunction;
        await middleware(req, res, next);
      }

      // Make the blocked request
      const req = createMockReq(testUserId, testProjectId) as Request;
      const res = createMockRes() as Response;
      const next = (() => {}) as NextFunction;
      await middleware(req, res, next);

      expect(res.statusCode).toBe(429);
      expect(res.jsonData?.message).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
      expect(typeof res.jsonData?.retryAfter).toBe('number');
      expect(res.jsonData?.retryAfter as number).toBeGreaterThan(0);
    });
  });

  describe('Cleanup removes only expired records', () => {
    it('should remove records older than 24 hours while keeping recent ones', async () => {
      // Insert expired record (30 hours old)
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
      await db.insert(rateLimits).values({
        userId: testUserId,
        endpoint: 'POST /api/projects/:id/members/invite',
        projectId: testProjectId,
        requestCount: 10,
        windowStart: thirtyHoursAgo,
      });

      // Insert recent record (10 minutes old)
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      await db.insert(rateLimits).values({
        userId: testUserId,
        endpoint: 'PUT /api/projects/:id/members/:memberId',
        projectId: testProjectId,
        requestCount: 5,
        windowStart: tenMinutesAgo,
      });

      // Run cleanup
      const deleted = await cleanupExpiredRateLimits();
      expect(deleted).toBeGreaterThanOrEqual(1);

      // Only the recent record should remain
      const remaining = await db.select()
        .from(rateLimits)
        .where(eq(rateLimits.userId, testUserId));

      expect(remaining).toHaveLength(1);
      expect(remaining[0].endpoint).toBe('PUT /api/projects/:id/members/:memberId');
      expect(remaining[0].requestCount).toBe(5);
    });
  });
});
