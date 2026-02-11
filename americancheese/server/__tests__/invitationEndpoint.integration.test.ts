import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import { SAFE_ERROR_MESSAGES } from '../../shared/constants/errors';
import { db } from '../db';
import { users, projects, projectMembers } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { registerRoutes } from '../routes';
import { sessionMiddleware, authMiddleware } from '../auth';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';

/**
 * Integration Tests for SEC-01: Email Enumeration Prevention
 * Task 2.2: Update Invitation Endpoint
 *
 * RED PHASE: These tests MUST FAIL before updating the endpoint
 * GREEN PHASE: These tests MUST PASS after updating the endpoint
 *
 * SECURITY REQUIREMENT:
 * The invitation endpoint must return IDENTICAL error messages for:
 * - Project owner invitation attempts
 * - Self-invitation attempts
 * - Already-member invitation attempts
 * - Any other failure scenarios
 *
 * This prevents attackers from enumerating valid user emails by observing
 * different error messages.
 */

let app: Express;
let server: any;
let ownerUserId: number;
let adminUserId: number;
let memberUserId: number;
let testProjectId: number;
let adminSessionCookie: string;

describe('Invitation Endpoint Email Enumeration Prevention (Integration)', () => {
  beforeAll(async () => {
    // Setup test Express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(sessionMiddleware);
    app.use(authMiddleware);

    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('testpassword', 10);

    const [owner] = await db.insert(users).values({
      email: 'test-owner@example.com',
      password: hashedPassword,
      name: 'Test Owner'
    }).returning();
    ownerUserId = owner.id;

    const [admin] = await db.insert(users).values({
      email: 'test-admin@example.com',
      password: hashedPassword,
      name: 'Test Admin'
    }).returning();
    adminUserId = admin.id;

    const [member] = await db.insert(users).values({
      email: 'test-member@example.com',
      password: hashedPassword,
      name: 'Test Member'
    }).returning();
    memberUserId = member.id;

    // Create test project
    const [project] = await db.insert(projects).values({
      name: 'Security Test Project',
      createdBy: ownerUserId
    }).returning();
    testProjectId = project.id;

    // Add admin member
    await db.insert(projectMembers).values({
      projectId: testProjectId,
      userId: adminUserId,
      role: 'admin'
    });

    // Add regular member
    await db.insert(projectMembers).values({
      projectId: testProjectId,
      userId: memberUserId,
      role: 'viewer'
    });

    // Login as admin to get session
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test-admin@example.com', password: 'testpassword' });

    // Extract session cookie
    adminSessionCookie = loginRes.headers['set-cookie']?.[0] || '';
  });

  afterEach(async () => {
    // Cleanup in reverse order of creation
    try {
      await db.delete(projectMembers).where(eq(projectMembers.projectId, testProjectId));
      await db.delete(projects).where(eq(projects.id, testProjectId));
      await db.delete(users).where(eq(users.id, memberUserId));
      await db.delete(users).where(eq(users.id, adminUserId));
      await db.delete(users).where(eq(users.id, ownerUserId));
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });

  describe('ERROR Messages MUST Be Identical (Email Enumeration Prevention)', () => {
    /**
     * RED PHASE: This test WILL FAIL because the endpoint currently returns:
     * "This user is already the owner of this project"
     *
     * GREEN PHASE: This test WILL PASS after updating to return:
     * SAFE_ERROR_MESSAGES.INVITATION_FAILED
     */
    it('FAIL: should return generic message when inviting project owner', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/members/invite`)
        .set('Cookie', adminSessionCookie)
        .send({
          email: 'test-owner@example.com',
          role: 'viewer'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);
      expect(response.body.message).toBe("Unable to send invitation to this email address");

      // MUST NOT leak that user is owner
      expect(response.body.message.toLowerCase()).not.toContain('owner');
      expect(response.body.message.toLowerCase()).not.toContain('already');
    });

    /**
     * RED PHASE: This test WILL FAIL because the endpoint currently returns:
     * "You cannot invite yourself"
     *
     * GREEN PHASE: This test WILL PASS after updating to return:
     * SAFE_ERROR_MESSAGES.INVITATION_FAILED
     */
    it('FAIL: should return generic message when inviting self', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/members/invite`)
        .set('Cookie', adminSessionCookie)
        .send({
          email: 'test-admin@example.com',
          role: 'editor'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);

      // MUST NOT reveal self-invitation
      expect(response.body.message.toLowerCase()).not.toContain('yourself');
      expect(response.body.message.toLowerCase()).not.toContain('you cannot');
    });

    /**
     * RED PHASE: This test WILL FAIL because the endpoint currently returns
     * the raw error message (e.g., "User is already a member")
     *
     * GREEN PHASE: This test WILL PASS after updating to use safe error message
     */
    it('FAIL: should return generic message when inviting existing member', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/members/invite`)
        .set('Cookie', adminSessionCookie)
        .send({
          email: 'test-member@example.com',
          role: 'editor'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);

      // MUST NOT leak membership status
      expect(response.body.message.toLowerCase()).not.toContain('member');
      expect(response.body.message.toLowerCase()).not.toContain('already');
    });

    /**
     * CRITICAL: All error scenarios MUST return the SAME message
     * This prevents email enumeration by observing response differences
     */
    it('FAIL: all error scenarios must return identical message', async () => {
      const scenarios = [
        {
          name: 'owner',
          email: 'test-owner@example.com',
          role: 'viewer'
        },
        {
          name: 'self',
          email: 'test-admin@example.com',
          role: 'editor'
        },
        {
          name: 'existing member',
          email: 'test-member@example.com',
          role: 'editor'
        }
      ];

      const responses = await Promise.all(
        scenarios.map(scenario =>
          request(app)
            .post(`/api/projects/${testProjectId}/members/invite`)
            .set('Cookie', adminSessionCookie)
            .send({ email: scenario.email, role: scenario.role })
        )
      );

      // All should return 400
      responses.forEach((res, idx) => {
        expect(res.status).toBe(400);
      });

      // All messages MUST be identical
      const messages = responses.map(r => r.body.message);
      const uniqueMessages = new Set(messages);

      expect(uniqueMessages.size).toBe(1);
      expect(uniqueMessages.has(SAFE_ERROR_MESSAGES.INVITATION_FAILED)).toBe(true);
    });
  });

  describe('Timing Attack Prevention', () => {
    /**
     * RED PHASE: This test WILL FAIL because no random delay is added
     * GREEN PHASE: This test WILL PASS after adding addRandomDelay()
     */
    it('FAIL: should have timing variance to prevent timing attacks', async () => {
      const timings: number[] = [];

      // Make 20 requests with same scenario
      for (let i = 0; i < 20; i++) {
        const start = Date.now();
        await request(app)
          .post(`/api/projects/${testProjectId}/members/invite`)
          .set('Cookie', adminSessionCookie)
          .send({
            email: 'test-owner@example.com',
            role: 'viewer'
          });
        const end = Date.now();
        timings.push(end - start);
      }

      // Calculate variance
      const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance = timings.reduce((sum, time) => {
        return sum + Math.pow(time - mean, 2);
      }, 0) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Standard deviation should be > 0 (indicating timing variance)
      // If all responses take exactly the same time, attacker could use timing
      expect(stdDev).toBeGreaterThan(0);

      // Additionally, with 0-100ms random delay, we expect reasonable variance
      // Allow for some tolerance due to system timing
      expect(variance).toBeGreaterThan(1);
    });

    /**
     * Different scenarios should NOT have consistently different timings
     * This would allow attacker to distinguish scenarios by timing alone
     */
    it('FAIL: different scenarios should not have predictable timing differences', async () => {
      const ownerTimings: number[] = [];
      const memberTimings: number[] = [];

      // Measure timings for different scenarios
      for (let i = 0; i < 10; i++) {
        // Time owner invitation
        const ownerStart = Date.now();
        await request(app)
          .post(`/api/projects/${testProjectId}/members/invite`)
          .set('Cookie', adminSessionCookie)
          .send({ email: 'test-owner@example.com', role: 'viewer' });
        ownerTimings.push(Date.now() - ownerStart);

        // Time member invitation
        const memberStart = Date.now();
        await request(app)
          .post(`/api/projects/${testProjectId}/members/invite`)
          .set('Cookie', adminSessionCookie)
          .send({ email: 'test-member@example.com', role: 'editor' });
        memberTimings.push(Date.now() - memberStart);
      }

      // Calculate means
      const ownerMean = ownerTimings.reduce((a, b) => a + b, 0) / ownerTimings.length;
      const memberMean = memberTimings.reduce((a, b) => a + b, 0) / memberTimings.length;

      // Calculate standard deviations
      const ownerStdDev = Math.sqrt(
        ownerTimings.reduce((sum, t) => sum + Math.pow(t - ownerMean, 2), 0) / ownerTimings.length
      );
      const memberStdDev = Math.sqrt(
        memberTimings.reduce((sum, t) => sum + Math.pow(t - memberMean, 2), 0) / memberTimings.length
      );

      // Difference in means should be within combined standard deviations
      // This ensures timing doesn't reliably distinguish scenarios
      const difference = Math.abs(ownerMean - memberMean);
      const combinedStdDev = ownerStdDev + memberStdDev;

      // Allow 2x combined std dev for statistical variation
      expect(difference).toBeLessThan(combinedStdDev * 2);
    });
  });

  describe('Functionality Preservation (Must Not Break)', () => {
    /**
     * These tests verify that security fixes don't break legitimate functionality
     */
    it('should still require authentication', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/members/invite`)
        .send({
          email: 'newuser@example.com',
          role: 'viewer'
        });
      // No session cookie

      expect(response.status).toBe(401);
    });

    it('should still validate email format', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProjectId}/members/invite`)
        .set('Cookie', adminSessionCookie)
        .send({
          email: 'not-a-valid-email',
          role: 'viewer'
        });

      expect(response.status).toBe(400);
      // Email format validation can be specific (doesn't leak user info)
    });

    it('should still check permissions (non-admin cannot invite)', async () => {
      // Login as member (viewer role)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test-member@example.com', password: 'testpassword' });

      const memberCookie = loginRes.headers['set-cookie']?.[0] || '';

      const response = await request(app)
        .post(`/api/projects/${testProjectId}/members/invite`)
        .set('Cookie', memberCookie)
        .send({
          email: 'newuser@example.com',
          role: 'viewer'
        });

      expect(response.status).toBe(403);
    });
  });
});
