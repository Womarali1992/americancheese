import { describe, it, expect } from 'vitest';
import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import * as schema from '../../shared/schema.js';

describe('Project Member Audit Log Schema', () => {
  it('should have project_member_audit_log table with correct columns', () => {
    // This test verifies that the audit log table exists and has all required columns
    const auditLogTable = (schema as any).projectMemberAuditLog;

    // Verify table exists
    expect(auditLogTable).toBeDefined();
    expect(auditLogTable[Symbol.for('drizzle:Name')]).toBe('project_member_audit_log');

    // Verify all required columns exist
    const columns = auditLogTable[Symbol.for('drizzle:Columns')];
    expect(columns).toBeDefined();

    // Check required columns (using camelCase property names from Drizzle)
    expect(columns.id).toBeDefined();
    expect(columns.projectId).toBeDefined();
    expect(columns.memberId).toBeDefined();
    expect(columns.action).toBeDefined();
    expect(columns.performedBy).toBeDefined();
    expect(columns.targetUserEmail).toBeDefined();
    expect(columns.oldValue).toBeDefined();
    expect(columns.newValue).toBeDefined();
    expect(columns.ipAddress).toBeDefined();
    expect(columns.userAgent).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it('should have correct column types', () => {
    const auditLogTable = (schema as any).projectMemberAuditLog;
    const columns = auditLogTable[Symbol.for('drizzle:Columns')];

    // Verify column types
    expect(columns.id.dataType).toBe('number');
    expect(columns.projectId.dataType).toBe('number');
    expect(columns.memberId.dataType).toBe('number');
    expect(columns.action.dataType).toBe('string');
    expect(columns.performedBy.dataType).toBe('number');
    expect(columns.targetUserEmail.dataType).toBe('string');
    expect(columns.oldValue.dataType).toBe('json');
    expect(columns.newValue.dataType).toBe('json');
    expect(columns.ipAddress.dataType).toBe('string');
    expect(columns.userAgent.dataType).toBe('string');
    expect(columns.createdAt.dataType).toBe('date');
  });

  it('should have correct nullable constraints', () => {
    const auditLogTable = (schema as any).projectMemberAuditLog;
    const columns = auditLogTable[Symbol.for('drizzle:Columns')];

    // Non-nullable columns
    expect(columns.id.notNull).toBe(true);
    expect(columns.projectId.notNull).toBe(true);
    expect(columns.action.notNull).toBe(true);
    expect(columns.performedBy.notNull).toBe(true);
    expect(columns.targetUserEmail.notNull).toBe(true);
    expect(columns.createdAt.notNull).toBe(true);

    // Nullable columns (Drizzle sets notNull to false, not undefined)
    expect(columns.memberId.notNull).toBe(false);
    expect(columns.oldValue.notNull).toBe(false);
    expect(columns.newValue.notNull).toBe(false);
    expect(columns.ipAddress.notNull).toBe(false);
    expect(columns.userAgent.notNull).toBe(false);
  });

  it('should have primary key on id column', () => {
    const auditLogTable = (schema as any).projectMemberAuditLog;
    const columns = auditLogTable[Symbol.for('drizzle:Columns')];

    expect(columns.id.primary).toBe(true);
  });

  it('should export insert schema and types', () => {
    // Verify the insert schema exists
    expect((schema as any).insertProjectMemberAuditLogSchema).toBeDefined();

    // Verify types are properly inferred (TypeScript will catch this at compile time)
    // This is a runtime check that the export exists
    expect(typeof (schema as any).insertProjectMemberAuditLogSchema).toBe('object');
  });
});

describe('Rate Limits Schema', () => {
  it('should have rate_limits table with correct columns', () => {
    // This test verifies that the rate_limits table exists and has all required columns
    const rateLimitsTable = (schema as any).rateLimits;

    // Verify table exists
    expect(rateLimitsTable).toBeDefined();
    expect(rateLimitsTable[Symbol.for('drizzle:Name')]).toBe('rate_limits');

    // Verify all required columns exist
    const columns = rateLimitsTable[Symbol.for('drizzle:Columns')];
    expect(columns).toBeDefined();

    // Check required columns (using camelCase property names from Drizzle)
    expect(columns.id).toBeDefined();
    expect(columns.userId).toBeDefined();
    expect(columns.endpoint).toBeDefined();
    expect(columns.projectId).toBeDefined();
    expect(columns.requestCount).toBeDefined();
    expect(columns.windowStart).toBeDefined();
    expect(columns.createdAt).toBeDefined();
  });

  it('should have correct column types', () => {
    const rateLimitsTable = (schema as any).rateLimits;
    const columns = rateLimitsTable[Symbol.for('drizzle:Columns')];

    // Verify column types
    expect(columns.id.dataType).toBe('number');
    expect(columns.userId.dataType).toBe('number');
    expect(columns.endpoint.dataType).toBe('string');
    expect(columns.projectId.dataType).toBe('number');
    expect(columns.requestCount.dataType).toBe('number');
    expect(columns.windowStart.dataType).toBe('date');
    expect(columns.createdAt.dataType).toBe('date');
  });

  it('should have correct nullable constraints', () => {
    const rateLimitsTable = (schema as any).rateLimits;
    const columns = rateLimitsTable[Symbol.for('drizzle:Columns')];

    // Non-nullable columns
    expect(columns.id.notNull).toBe(true);
    expect(columns.userId.notNull).toBe(true);
    expect(columns.endpoint.notNull).toBe(true);
    expect(columns.requestCount.notNull).toBe(true);
    expect(columns.windowStart.notNull).toBe(true);
    expect(columns.createdAt.notNull).toBe(true);

    // Nullable columns (projectId should be nullable)
    expect(columns.projectId.notNull).toBe(false);
  });

  it('should have default value for request_count', () => {
    const rateLimitsTable = (schema as any).rateLimits;
    const columns = rateLimitsTable[Symbol.for('drizzle:Columns')];

    // request_count should have a default value of 0
    expect(columns.requestCount.default).toBeDefined();
  });

  it('should have primary key on id column', () => {
    const rateLimitsTable = (schema as any).rateLimits;
    const columns = rateLimitsTable[Symbol.for('drizzle:Columns')];

    expect(columns.id.primary).toBe(true);
  });

  it('should export insert schema and types', () => {
    // Verify the insert schema exists
    expect((schema as any).insertRateLimitSchema).toBeDefined();

    // Verify types are properly inferred (TypeScript will catch this at compile time)
    // This is a runtime check that the export exists
    expect(typeof (schema as any).insertRateLimitSchema).toBe('object');
  });
});
