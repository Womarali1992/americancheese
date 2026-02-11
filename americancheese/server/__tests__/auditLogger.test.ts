import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../db';
import { projectMemberAuditLog, projects, users } from '../../shared/schema';
import { AuditLogger } from '../services/auditLogger';
import { eq } from 'drizzle-orm';

describe('AuditLogger', () => {
  let auditLogger: AuditLogger;
  let testProjectId: number;
  let testUserId: number;

  beforeEach(async () => {
    auditLogger = new AuditLogger();

    // Clean up any stale test data first
    const existingUser = await db.select().from(users).where(eq(users.email, `audit-${process.pid}@test.com`));
    if (existingUser.length > 0) {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.performedBy, existingUser[0].id));
      await db.delete(projects).where(eq(projects.createdBy, existingUser[0].id));
      await db.delete(users).where(eq(users.id, existingUser[0].id));
    }

    // Create test user with unique email per process
    const [user] = await db.insert(users).values({
      email: `audit-${process.pid}@test.com`,
      passwordHash: 'hashed-password',
      name: 'Test Audit User',
      role: 'user',
    }).returning();
    testUserId = user.id;

    // Create test project
    const [project] = await db.insert(projects).values({
      name: 'Test Audit Project',
      location: 'Test Location',
      createdBy: testUserId,
    }).returning();
    testProjectId = project.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testProjectId) {
      await db.delete(projectMemberAuditLog).where(eq(projectMemberAuditLog.projectId, testProjectId));
      await db.delete(projects).where(eq(projects.id, testProjectId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe('logInvitation', () => {
    it('should create audit log entry with correct details', async () => {
      await auditLogger.logInvitation({
        projectId: testProjectId,
        performedBy: testUserId,
        targetUserEmail: 'invitee@test.com',
        role: 'viewer',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        projectId: testProjectId,
        action: 'invite',
        performedBy: testUserId,
        targetUserEmail: 'invitee@test.com',
        newValue: { role: 'viewer' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(logs[0].createdAt).toBeInstanceOf(Date);
    });

    it('should work without optional IP and user agent', async () => {
      await auditLogger.logInvitation({
        projectId: testProjectId,
        performedBy: testUserId,
        targetUserEmail: 'invitee@test.com',
        role: 'editor',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      expect(logs).toHaveLength(1);
      expect(logs[0].ipAddress).toBeNull();
      expect(logs[0].userAgent).toBeNull();
    });
  });

  describe('logRoleChange', () => {
    it('should capture old and new role values', async () => {
      const memberId = 999; // Mock member ID

      await auditLogger.logRoleChange({
        projectId: testProjectId,
        memberId,
        performedBy: testUserId,
        targetUserEmail: 'member@test.com',
        oldRole: 'viewer',
        newRole: 'editor',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/100',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        projectId: testProjectId,
        memberId,
        action: 'role_change',
        performedBy: testUserId,
        targetUserEmail: 'member@test.com',
        oldValue: { role: 'viewer' },
        newValue: { role: 'editor' },
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/100',
      });
    });
  });

  describe('logRemoval', () => {
    it('should record member removal with context', async () => {
      const memberId = 888;

      await auditLogger.logRemoval({
        projectId: testProjectId,
        memberId,
        performedBy: testUserId,
        targetUserEmail: 'removed@test.com',
        role: 'editor',
        ipAddress: '172.16.0.1',
        userAgent: 'Safari/15',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        projectId: testProjectId,
        memberId,
        action: 'remove',
        performedBy: testUserId,
        targetUserEmail: 'removed@test.com',
        oldValue: { role: 'editor' },
        ipAddress: '172.16.0.1',
        userAgent: 'Safari/15',
      });
    });
  });

  describe('logAcceptance', () => {
    it('should track invitation acceptance', async () => {
      const memberId = 777;

      await auditLogger.logAcceptance({
        projectId: testProjectId,
        memberId,
        performedBy: testUserId,
        targetUserEmail: 'acceptor@test.com',
        ipAddress: '192.168.2.1',
        userAgent: 'Firefox/95',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        projectId: testProjectId,
        memberId,
        action: 'accept',
        performedBy: testUserId,
        targetUserEmail: 'acceptor@test.com',
        ipAddress: '192.168.2.1',
        userAgent: 'Firefox/95',
      });
    });
  });

  describe('logDecline', () => {
    it('should track invitation decline', async () => {
      const memberId = 666;

      await auditLogger.logDecline({
        projectId: testProjectId,
        memberId,
        performedBy: testUserId,
        targetUserEmail: 'decliner@test.com',
        ipAddress: '10.10.10.1',
        userAgent: 'Edge/100',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      expect(logs).toHaveLength(1);
      expect(logs[0]).toMatchObject({
        projectId: testProjectId,
        memberId,
        action: 'decline',
        performedBy: testUserId,
        targetUserEmail: 'decliner@test.com',
        ipAddress: '10.10.10.1',
        userAgent: 'Edge/100',
      });
    });
  });

  describe('timestamp tracking', () => {
    it('should include timestamp for all operations', async () => {
      await auditLogger.logInvitation({
        projectId: testProjectId,
        performedBy: testUserId,
        targetUserEmail: 'timestamped@test.com',
        role: 'viewer',
      });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.projectId, testProjectId));

      // Verify timestamp exists and is a valid Date
      expect(logs[0].createdAt).toBeInstanceOf(Date);
      expect(logs[0].createdAt.getTime()).toBeGreaterThan(0);
    });
  });
});
