import { db } from '../db';
import { projectMemberAuditLog, type ProjectMemberAuditLog } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';

interface AuditLogParams {
  projectId: number;
  performedBy: number;
  targetUserEmail: string;
  ipAddress?: string;
  userAgent?: string;
}

interface InvitationLogParams extends AuditLogParams {
  role: string;
}

interface RoleChangeLogParams extends AuditLogParams {
  memberId: number;
  oldRole: string;
  newRole: string;
}

interface RemovalLogParams extends AuditLogParams {
  memberId: number;
  role: string;
}

interface GetLogsParams {
  projectId?: number;
  memberId?: number;
  performedBy?: number;
  action?: string;
  limit?: number;
}

/**
 * Audit Logger Service
 *
 * Provides comprehensive audit logging for all project member operations.
 * Tracks who did what, when, and from where (IP address, user agent).
 *
 * Security Features:
 * - Immutable audit trail (insert-only, no updates/deletes)
 * - Captures old and new values for changes
 * - Records requester context (IP, user agent)
 * - Timestamp tracking for all operations
 *
 * Part of SEC-02: Missing Audit Trail fix
 */
export class AuditLogger {
  /**
   * Log a member invitation
   *
   * @param params - Invitation parameters including role, target email, and context
   * @throws Error if database insert fails
   */
  async logInvitation(params: InvitationLogParams): Promise<void> {
    try {
      await db.insert(projectMemberAuditLog).values({
        projectId: params.projectId,
        action: 'invite',
        performedBy: params.performedBy,
        targetUserEmail: params.targetUserEmail,
        newValue: { role: params.role },
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log invitation:', error);
      throw new Error('Audit log failed: Unable to record invitation');
    }
  }

  /**
   * Log a role change operation
   *
   * @param params - Role change parameters including old/new roles and member context
   * @throws Error if database insert fails
   */
  async logRoleChange(params: RoleChangeLogParams): Promise<void> {
    try {
      await db.insert(projectMemberAuditLog).values({
        projectId: params.projectId,
        memberId: params.memberId,
        action: 'role_change',
        performedBy: params.performedBy,
        targetUserEmail: params.targetUserEmail,
        oldValue: { role: params.oldRole },
        newValue: { role: params.newRole },
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log role change:', error);
      throw new Error('Audit log failed: Unable to record role change');
    }
  }

  /**
   * Log a member removal operation
   *
   * @param params - Removal parameters including member context and role
   * @throws Error if database insert fails
   */
  async logRemoval(params: RemovalLogParams): Promise<void> {
    try {
      await db.insert(projectMemberAuditLog).values({
        projectId: params.projectId,
        memberId: params.memberId,
        action: 'remove',
        performedBy: params.performedBy,
        targetUserEmail: params.targetUserEmail,
        oldValue: { role: params.role },
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log removal:', error);
      throw new Error('Audit log failed: Unable to record member removal');
    }
  }

  /**
   * Log invitation acceptance
   *
   * @param params - Acceptance parameters including member context
   * @throws Error if database insert fails
   */
  async logAcceptance(params: AuditLogParams & { memberId: number }): Promise<void> {
    try {
      await db.insert(projectMemberAuditLog).values({
        projectId: params.projectId,
        memberId: params.memberId,
        action: 'accept',
        performedBy: params.performedBy,
        targetUserEmail: params.targetUserEmail,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log acceptance:', error);
      throw new Error('Audit log failed: Unable to record invitation acceptance');
    }
  }

  /**
   * Log invitation decline
   *
   * @param params - Decline parameters including member context
   * @throws Error if database insert fails
   */
  async logDecline(params: AuditLogParams & { memberId: number }): Promise<void> {
    try {
      await db.insert(projectMemberAuditLog).values({
        projectId: params.projectId,
        memberId: params.memberId,
        action: 'decline',
        performedBy: params.performedBy,
        targetUserEmail: params.targetUserEmail,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });
    } catch (error) {
      console.error('Failed to log decline:', error);
      throw new Error('Audit log failed: Unable to record invitation decline');
    }
  }

  /**
   * Retrieve audit logs with optional filtering
   *
   * @param params - Filter parameters (projectId, memberId, performedBy, action, limit)
   * @returns Array of audit log entries, sorted by most recent first
   * @throws Error if database query fails
   *
   * @example
   * // Get all logs for a project
   * const logs = await auditLogger.getLogs({ projectId: 123 });
   *
   * @example
   * // Get recent role changes
   * const changes = await auditLogger.getLogs({ action: 'role_change', limit: 10 });
   */
  async getLogs(params: GetLogsParams = {}): Promise<ProjectMemberAuditLog[]> {
    try {
      let query = db.select().from(projectMemberAuditLog);

      // Apply filters
      const conditions = [];
      if (params.projectId) {
        conditions.push(eq(projectMemberAuditLog.projectId, params.projectId));
      }
      if (params.memberId) {
        conditions.push(eq(projectMemberAuditLog.memberId, params.memberId));
      }
      if (params.performedBy) {
        conditions.push(eq(projectMemberAuditLog.performedBy, params.performedBy));
      }
      if (params.action) {
        conditions.push(eq(projectMemberAuditLog.action, params.action));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      // Order by most recent first
      query = query.orderBy(desc(projectMemberAuditLog.createdAt)) as any;

      // Apply limit if specified
      if (params.limit) {
        query = query.limit(params.limit) as any;
      }

      return await query;
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw new Error('Unable to retrieve audit logs');
    }
  }
}

/**
 * Singleton instance of the audit logger
 * Use this instance throughout the application for consistent audit logging
 */
export const auditLogger = new AuditLogger();
