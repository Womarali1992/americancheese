# TDD Implementation Plan: Security Fixes Phase 1

**Feature:** Critical Security Fixes for Profile Sharing System
**Date Created:** 2026-02-11
**Estimated Duration:** 1-2 days
**Methodology:** London TDD (Outside-In with Mocking)

---

## Executive Summary

This plan implements three critical security vulnerabilities identified in code review:
- **SEC-01:** Generic error messages to prevent email enumeration
- **SEC-02:** Transaction isolation and audit logging for member operations
- **SEC-03:** Rate limiting to prevent abuse

**Test-First Approach:** Every task begins with writing a failing test (RED), then implementing minimal code to pass (GREEN), then refactoring (REFACTOR).

---

## Phase 1: Database Schema & Migrations (Foundation)

**Goal:** Create the data structures needed for audit logging and rate limiting.

### Task 1.1: Create Audit Log Schema
**Type:** Schema Design
**Duration:** 30 minutes
**Agent:** `database-optimizer`

#### RED: Write Failing Schema Test
```typescript
// americancheese/server/__tests__/schema.test.ts
describe('Audit Log Schema', () => {
  test('should have project_member_audit_log table with correct columns', async () => {
    const tableInfo = await db.select().from(information_schema.columns)
      .where(eq(information_schema.columns.table_name, 'project_member_audit_log'));

    expect(tableInfo).toContainColumn('id');
    expect(tableInfo).toContainColumn('project_id');
    expect(tableInfo).toContainColumn('member_id');
    expect(tableInfo).toContainColumn('action');
    expect(tableInfo).toContainColumn('performed_by');
    expect(tableInfo).toContainColumn('target_user_email');
    expect(tableInfo).toContainColumn('old_value');
    expect(tableInfo).toContainColumn('new_value');
    expect(tableInfo).toContainColumn('ip_address');
    expect(tableInfo).toContainColumn('user_agent');
    expect(tableInfo).toContainColumn('created_at');
  });
});
```

#### GREEN: Implement Minimal Schema
```typescript
// americancheese/shared/schema.ts
export const projectMemberAuditLog = pgTable("project_member_audit_log", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: 'cascade' }),
  memberId: integer("member_id"),
  action: text("action").notNull(), // 'invite', 'role_change', 'remove', 'accept', 'decline'
  performedBy: integer("performed_by").notNull().references(() => users.id),
  targetUserEmail: text("target_user_email").notNull(),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectMemberAuditLogSchema = createInsertSchema(projectMemberAuditLog);
export type ProjectMemberAuditLog = typeof projectMemberAuditLog.$inferSelect;
export type InsertProjectMemberAuditLog = z.infer<typeof insertProjectMemberAuditLogSchema>;
```

#### REFACTOR: Add Indexes
```typescript
// Add indexes for common queries
CREATE INDEX idx_audit_log_project_id ON project_member_audit_log(project_id);
CREATE INDEX idx_audit_log_performed_by ON project_member_audit_log(performed_by);
CREATE INDEX idx_audit_log_created_at ON project_member_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON project_member_audit_log(action);
```

**Acceptance Criteria:**
- ✅ Schema test passes
- ✅ Migration creates table successfully
- ✅ Indexes created on project_id, performed_by, created_at, action
- ✅ Foreign keys enforce referential integrity

---

### Task 1.2: Create Rate Limit Schema
**Type:** Schema Design
**Duration:** 30 minutes
**Agent:** `database-optimizer`

#### RED: Write Failing Schema Test
```typescript
describe('Rate Limit Schema', () => {
  test('should have rate_limits table with correct columns', async () => {
    const tableInfo = await db.select().from(information_schema.columns)
      .where(eq(information_schema.columns.table_name, 'rate_limits'));

    expect(tableInfo).toContainColumn('id');
    expect(tableInfo).toContainColumn('user_id');
    expect(tableInfo).toContainColumn('endpoint');
    expect(tableInfo).toContainColumn('project_id');
    expect(tableInfo).toContainColumn('request_count');
    expect(tableInfo).toContainColumn('window_start');
    expect(tableInfo).toContainColumn('created_at');
  });
});
```

#### GREEN: Implement Minimal Schema
```typescript
// americancheese/shared/schema.ts
export const rateLimits = pgTable("rate_limits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text("endpoint").notNull(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  requestCount: integer("request_count").notNull().default(0),
  windowStart: timestamp("window_start").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRateLimitSchema = createInsertSchema(rateLimits);
export type RateLimit = typeof rateLimits.$inferSelect;
export type InsertRateLimit = z.infer<typeof insertRateLimitSchema>;
```

#### REFACTOR: Add Indexes and Cleanup Logic
```typescript
// Add composite index for lookups
CREATE UNIQUE INDEX idx_rate_limits_user_endpoint_project
  ON rate_limits(user_id, endpoint, project_id);

// Add cleanup for old records (> 24 hours)
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
```

**Acceptance Criteria:**
- ✅ Schema test passes
- ✅ Migration creates table successfully
- ✅ Unique composite index prevents duplicate entries
- ✅ Cleanup index allows efficient deletion of old records

---

### Task 1.3: Create Database Migrations
**Type:** Migration
**Duration:** 30 minutes
**Agent:** `database-admin`

#### RED: Write Failing Migration Test
```typescript
describe('Security Migrations', () => {
  test('should apply audit log migration without errors', async () => {
    await expect(runMigration('add-audit-log')).resolves.not.toThrow();
  });

  test('should apply rate limit migration without errors', async () => {
    await expect(runMigration('add-rate-limits')).resolves.not.toThrow();
  });
});
```

#### GREEN: Create Migration Files
```javascript
// americancheese/server/migrations/add-security-tables.js
export async function addSecurityTables(db) {
  // Create audit log table
  await db.query(`
    CREATE TABLE IF NOT EXISTS project_member_audit_log (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      member_id INTEGER,
      action TEXT NOT NULL,
      performed_by INTEGER NOT NULL REFERENCES users(id),
      target_user_email TEXT NOT NULL,
      old_value JSONB,
      new_value JSONB,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create indexes for audit log
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON project_member_audit_log(project_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON project_member_audit_log(performed_by)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON project_member_audit_log(created_at DESC)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_log_action ON project_member_audit_log(action)`);

  // Create rate limits table
  await db.query(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      request_count INTEGER NOT NULL DEFAULT 0,
      window_start TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Create indexes for rate limits
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint_project ON rate_limits(user_id, endpoint, project_id)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start)`);
}
```

#### REFACTOR: Add Rollback Support
```javascript
export async function removeSecurityTables(db) {
  await db.query('DROP TABLE IF EXISTS rate_limits CASCADE');
  await db.query('DROP TABLE IF EXISTS project_member_audit_log CASCADE');
}
```

**Acceptance Criteria:**
- ✅ Migration runs successfully on clean database
- ✅ Migration is idempotent (can run multiple times)
- ✅ Rollback function works correctly
- ✅ All indexes are created

---

## Phase 2: Error Message Sanitization (SEC-01)

**Goal:** Prevent email enumeration through generic error messages.

### Task 2.1: Create Error Constants
**Type:** Configuration
**Duration:** 15 minutes
**Agent:** `backend-architect`

#### RED: Write Failing Test
```typescript
// americancheese/server/__tests__/errorMessages.test.ts
describe('Error Message Sanitization', () => {
  test('should have generic message for user existence checks', () => {
    expect(SAFE_ERROR_MESSAGES.USER_EXISTS).toBe(SAFE_ERROR_MESSAGES.USER_NOT_FOUND);
    expect(SAFE_ERROR_MESSAGES.ALREADY_MEMBER).toBe(SAFE_ERROR_MESSAGES.USER_NOT_FOUND);
  });

  test('should not leak user information', () => {
    const messages = Object.values(SAFE_ERROR_MESSAGES);
    messages.forEach(msg => {
      expect(msg).not.toContain('user exists');
      expect(msg).not.toContain('already registered');
      expect(msg).not.toContain('not found');
    });
  });
});
```

#### GREEN: Create Error Constants
```typescript
// americancheese/shared/constants/errors.ts
export const SAFE_ERROR_MESSAGES = {
  // Generic message for all user-related invitation failures
  INVITATION_FAILED: "Unable to send invitation to this email address",
  INVALID_EMAIL: "Invalid email address format",
  UNAUTHORIZED: "You don't have permission to perform this action",
  RATE_LIMITED: "Too many requests. Please try again later.",
  MEMBER_UPDATE_FAILED: "Unable to update member",
  MEMBER_REMOVE_FAILED: "Unable to remove member",
} as const;

export type SafeErrorMessage = typeof SAFE_ERROR_MESSAGES[keyof typeof SAFE_ERROR_MESSAGES];
```

#### REFACTOR: Add Error Sanitizer Utility
```typescript
// americancheese/server/utils/errorSanitizer.ts
export function sanitizeMemberError(error: Error, context: 'invite' | 'update' | 'remove'): string {
  // Never expose internal error messages
  console.error('Member operation error:', error);

  switch (context) {
    case 'invite':
      return SAFE_ERROR_MESSAGES.INVITATION_FAILED;
    case 'update':
      return SAFE_ERROR_MESSAGES.MEMBER_UPDATE_FAILED;
    case 'remove':
      return SAFE_ERROR_MESSAGES.MEMBER_REMOVE_FAILED;
  }
}
```

**Acceptance Criteria:**
- ✅ All error messages are generic
- ✅ No information leakage about user existence
- ✅ Tests verify message consistency

---

### Task 2.2: Update Invitation Endpoint
**Type:** Backend API
**Duration:** 45 minutes
**Agent:** `backend-architect`

#### RED: Write Failing Test
```typescript
describe('POST /api/projects/:id/members/invite - Security', () => {
  test('should return same error for existing user as non-existing user', async () => {
    const existingUserResponse = await request(app)
      .post('/api/projects/1/members/invite')
      .send({ email: 'existing@example.com', role: 'viewer' });

    const nonExistingUserResponse = await request(app)
      .post('/api/projects/1/members/invite')
      .send({ email: 'nonexisting@example.com', role: 'viewer' });

    expect(existingUserResponse.body.message).toBe(nonExistingUserResponse.body.message);
  });

  test('should return same error for project owner as other users', async () => {
    const ownerResponse = await request(app)
      .post('/api/projects/1/members/invite')
      .send({ email: 'owner@example.com', role: 'viewer' });

    expect(ownerResponse.body.message).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);
  });
});
```

#### GREEN: Update Route Handler
```typescript
// americancheese/server/routes.ts
app.post("/api/projects/:id/members/invite", async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const { email, role } = req.body;

    // Validate access
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const access = await storage.getUserProjectAccess?.(userId, projectId);
    if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
      return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
    }

    // Validate input
    const result = inviteProjectMemberSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: SAFE_ERROR_MESSAGES.INVALID_EMAIL });
    }

    const normalizedEmail = email.toLowerCase();

    // Check for existing user - but don't leak information
    const existingUser = await db.select().from(users)
      .where(eq(users.email, normalizedEmail));

    const project = await storage.getProject(projectId);

    // SECURITY: Use same error message for all failure cases
    if (existingUser.length > 0 && existingUser[0].id === project?.createdBy) {
      return res.status(400).json({ message: SAFE_ERROR_MESSAGES.INVITATION_FAILED });
    }

    // Attempt to create invitation
    const member = await storage.inviteProjectMember?.(projectId, email, role, userId);
    res.status(201).json(member);

  } catch (error: any) {
    console.error("Error inviting project member:", error);

    // SECURITY: Sanitize all error messages
    if (error.message?.includes('already a member')) {
      return res.status(400).json({ message: SAFE_ERROR_MESSAGES.INVITATION_FAILED });
    }

    res.status(500).json({ message: sanitizeMemberError(error, 'invite') });
  }
});
```

#### REFACTOR: Add Timing Attack Prevention
```typescript
// Add random delay to prevent timing-based enumeration
async function addRandomDelay() {
  const delay = Math.random() * 100; // 0-100ms
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Use before returning error responses
await addRandomDelay();
return res.status(400).json({ message: SAFE_ERROR_MESSAGES.INVITATION_FAILED });
```

**Acceptance Criteria:**
- ✅ All error messages are generic
- ✅ Timing attack prevention implemented
- ✅ Tests verify no information leakage
- ✅ Existing functionality preserved

---

## Phase 3: Audit Logging (SEC-02 Part 1)

**Goal:** Log all member management operations for security auditing.

### Task 3.1: Create Audit Logger Service
**Type:** Service Layer
**Duration:** 1 hour
**Agent:** `backend-architect`

#### RED: Write Failing Test
```typescript
// americancheese/server/__tests__/auditLogger.test.ts
describe('Audit Logger Service', () => {
  test('should log member invitation', async () => {
    await auditLogger.logInvitation({
      projectId: 1,
      performedBy: 123,
      targetUserEmail: 'test@example.com',
      role: 'viewer',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    });

    const logs = await db.select().from(projectMemberAuditLog)
      .where(eq(projectMemberAuditLog.action, 'invite'));

    expect(logs).toHaveLength(1);
    expect(logs[0].projectId).toBe(1);
    expect(logs[0].targetUserEmail).toBe('test@example.com');
  });

  test('should log role changes with old and new values', async () => {
    await auditLogger.logRoleChange({
      projectId: 1,
      memberId: 456,
      performedBy: 123,
      targetUserEmail: 'member@example.com',
      oldRole: 'viewer',
      newRole: 'editor',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    });

    const logs = await db.select().from(projectMemberAuditLog)
      .where(eq(projectMemberAuditLog.action, 'role_change'));

    expect(logs[0].oldValue).toEqual({ role: 'viewer' });
    expect(logs[0].newValue).toEqual({ role: 'editor' });
  });
});
```

#### GREEN: Implement Audit Logger
```typescript
// americancheese/server/middleware/auditLogger.ts
import { db } from './db';
import { projectMemberAuditLog } from '../shared/schema';

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

export class AuditLogger {
  async logInvitation(params: InvitationLogParams): Promise<void> {
    await db.insert(projectMemberAuditLog).values({
      projectId: params.projectId,
      action: 'invite',
      performedBy: params.performedBy,
      targetUserEmail: params.targetUserEmail,
      newValue: { role: params.role },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  async logRoleChange(params: RoleChangeLogParams): Promise<void> {
    await db.insert(projectMemberAuditLog).values({
      projectId: params.projectId,
      memberId: params.memberId,
      action: 'role_change',
      performedBy: params.performedBy,
      targetUserEmail: params.targetUserEmail,
      oldValue: { role: params.oldRole },
      newValue: { role: params.newRole },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  async logRemoval(params: RemovalLogParams): Promise<void> {
    await db.insert(projectMemberAuditLog).values({
      projectId: params.projectId,
      memberId: params.memberId,
      action: 'remove',
      performedBy: params.performedBy,
      targetUserEmail: params.targetUserEmail,
      oldValue: { role: params.role },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  async logAcceptance(params: AuditLogParams & { memberId: number }): Promise<void> {
    await db.insert(projectMemberAuditLog).values({
      projectId: params.projectId,
      memberId: params.memberId,
      action: 'accept',
      performedBy: params.performedBy,
      targetUserEmail: params.targetUserEmail,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  async logDecline(params: AuditLogParams & { memberId: number }): Promise<void> {
    await db.insert(projectMemberAuditLog).values({
      projectId: params.projectId,
      memberId: params.memberId,
      action: 'decline',
      performedBy: params.performedBy,
      targetUserEmail: params.targetUserEmail,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }
}

export const auditLogger = new AuditLogger();
```

#### REFACTOR: Add IP/User Agent Capture Middleware
```typescript
// americancheese/server/middleware/requestContext.ts
export function captureRequestContext(req: Request, res: Response, next: NextFunction) {
  // Capture IP address (handle proxies)
  const ipAddress = req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
    || req.headers['x-real-ip']?.toString()
    || req.socket.remoteAddress
    || 'unknown';

  // Capture user agent
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Attach to request object
  (req as any).context = { ipAddress, userAgent };

  next();
}

// Apply globally
app.use(captureRequestContext);
```

**Acceptance Criteria:**
- ✅ All member operations are logged
- ✅ IP address and user agent captured
- ✅ Old/new values stored for changes
- ✅ Tests verify logging accuracy

---

### Task 3.2: Add Transaction Isolation (SEC-02 Part 2)
**Type:** Backend API
**Duration:** 1.5 hours
**Agent:** `backend-architect`

#### RED: Write Failing Test
```typescript
describe('PUT /api/projects/:id/members/:memberId - Transaction Safety', () => {
  test('should rollback role change if audit log fails', async () => {
    // Mock audit logger to fail
    jest.spyOn(auditLogger, 'logRoleChange').mockRejectedValue(new Error('DB error'));

    const response = await request(app)
      .put('/api/projects/1/members/456')
      .send({ role: 'admin' });

    expect(response.status).toBe(500);

    // Verify role was NOT changed
    const member = await db.select().from(projectMembers)
      .where(eq(projectMembers.id, 456));

    expect(member[0].role).toBe('viewer'); // Original role
  });

  test('should prevent concurrent role updates', async () => {
    // Start two concurrent updates
    const update1 = request(app)
      .put('/api/projects/1/members/456')
      .send({ role: 'admin' });

    const update2 = request(app)
      .put('/api/projects/1/members/456')
      .send({ role: 'editor' });

    const [response1, response2] = await Promise.all([update1, update2]);

    // One should succeed, one should fail with conflict
    const statuses = [response1.status, response2.status].sort();
    expect(statuses).toEqual([200, 409]); // One success, one conflict
  });
});
```

#### GREEN: Implement Transaction Wrapper
```typescript
// americancheese/server/routes.ts
app.put("/api/projects/:id/members/:memberId", async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const { role } = req.body;
    const userId = req.session?.userId!;
    const { ipAddress, userAgent } = (req as any).context;

    // Validate permissions
    const access = await storage.getUserProjectAccess?.(userId, projectId);
    if (!access || (access.role !== 'owner' && access.role !== 'admin')) {
      return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
    }

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // 1. Lock row for update (prevents concurrent modifications)
      const memberRows = await tx.select()
        .from(projectMembers)
        .where(eq(projectMembers.id, memberId))
        .for('update');

      if (memberRows.length === 0 || memberRows[0].projectId !== projectId) {
        throw new Error('Member not found');
      }

      const member = memberRows[0];

      // 2. Validate role change rules
      if (role === 'owner' && access.role !== 'owner') {
        throw new Error('Only owner can assign owner role');
      }

      if (member.userId === userId && role === 'owner') {
        throw new Error('Cannot promote yourself to owner');
      }

      // 3. Update role
      const updated = await tx.update(projectMembers)
        .set({ role })
        .where(eq(projectMembers.id, memberId))
        .returning();

      // 4. Write audit log (in same transaction)
      await tx.insert(projectMemberAuditLog).values({
        projectId,
        memberId,
        action: 'role_change',
        performedBy: userId,
        targetUserEmail: member.invitedEmail,
        oldValue: { role: member.role },
        newValue: { role },
        ipAddress,
        userAgent,
      });

      return updated[0];
    });

    res.json(result);

  } catch (error: any) {
    console.error("Error updating project member:", error);

    if (error.message?.includes('not found')) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (error.message?.includes('owner') || error.message?.includes('promote')) {
      return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
    }

    res.status(500).json({ message: sanitizeMemberError(error, 'update') });
  }
});
```

#### REFACTOR: Extract Transaction Logic
```typescript
// americancheese/server/services/memberService.ts
export class MemberService {
  async updateMemberRoleWithAudit(params: {
    projectId: number;
    memberId: number;
    newRole: string;
    performedBy: number;
    performerRole: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return db.transaction(async (tx) => {
      // Lock, validate, update, audit - all in one transaction
      // ... implementation ...
    });
  }
}
```

**Acceptance Criteria:**
- ✅ All updates wrapped in transactions
- ✅ Row-level locking prevents race conditions
- ✅ Audit log writes are atomic with updates
- ✅ Transaction rollback works correctly
- ✅ Tests verify concurrent update handling

---

## Phase 4: Rate Limiting (SEC-03)

**Goal:** Prevent abuse through request rate limiting.

### Task 4.1: Create Rate Limiter Middleware
**Type:** Middleware
**Duration:** 1.5 hours
**Agent:** `backend-architect`

#### RED: Write Failing Test
```typescript
// americancheese/server/__tests__/rateLimiter.test.ts
describe('Rate Limiter Middleware', () => {
  test('should allow requests within limit', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/api/projects/1/members/invite')
        .send({ email: `user${i}@example.com`, role: 'viewer' });

      expect(response.status).not.toBe(429);
    }
  });

  test('should block 11th request within 15 minute window', async () => {
    // Send 10 allowed requests
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/projects/1/members/invite')
        .send({ email: `user${i}@example.com`, role: 'viewer' });
    }

    // 11th should be rate limited
    const response = await request(app)
      .post('/api/projects/1/members/invite')
      .send({ email: 'user11@example.com', role: 'viewer' });

    expect(response.status).toBe(429);
    expect(response.body.message).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
  });

  test('should include rate limit headers', async () => {
    const response = await request(app)
      .post('/api/projects/1/members/invite')
      .send({ email: 'test@example.com', role: 'viewer' });

    expect(response.headers['x-ratelimit-limit']).toBe('10');
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
  });

  test('should reset after window expires', async () => {
    // Send 10 requests
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/projects/1/members/invite')
        .send({ email: `user${i}@example.com`, role: 'viewer' });
    }

    // Fast-forward time by 15 minutes
    jest.advanceTimersByTime(15 * 60 * 1000);

    // Should allow requests again
    const response = await request(app)
      .post('/api/projects/1/members/invite')
      .send({ email: 'newuser@example.com', role: 'viewer' });

    expect(response.status).not.toBe(429);
  });
});
```

#### GREEN: Implement Rate Limiter
```typescript
// americancheese/server/middleware/rateLimiter.ts
import { db } from '../db';
import { rateLimits } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  scope: 'per-user' | 'per-user-per-project';
}

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

export function createRateLimiter(endpoint: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const config = RATE_LIMIT_CONFIGS[endpoint];
    if (!config) {
      return next(); // No rate limit configured
    }

    const userId = req.session?.userId;
    if (!userId) {
      return next(); // Let auth middleware handle
    }

    const projectId = config.scope === 'per-user-per-project'
      ? parseInt(req.params.id)
      : null;

    try {
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Get or create rate limit record
      const existing = await db.select()
        .from(rateLimits)
        .where(and(
          eq(rateLimits.userId, userId),
          eq(rateLimits.endpoint, endpoint),
          projectId ? eq(rateLimits.projectId, projectId) : undefined
        ));

      let record = existing[0];

      if (!record || new Date(record.windowStart) < windowStart) {
        // Create new window
        if (record) {
          await db.delete(rateLimits).where(eq(rateLimits.id, record.id));
        }

        [record] = await db.insert(rateLimits).values({
          userId,
          endpoint,
          projectId,
          requestCount: 1,
          windowStart: now,
        }).returning();
      } else {
        // Increment counter
        if (record.requestCount >= config.maxRequests) {
          // Rate limit exceeded
          const resetTime = new Date(record.windowStart.getTime() + config.windowMs);

          res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
          res.setHeader('X-RateLimit-Remaining', '0');
          res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000).toString());
          res.setHeader('Retry-After', Math.ceil((resetTime.getTime() - now.getTime()) / 1000).toString());

          return res.status(429).json({
            message: SAFE_ERROR_MESSAGES.RATE_LIMITED,
            retryAfter: Math.ceil((resetTime.getTime() - now.getTime()) / 1000),
          });
        }

        [record] = await db.update(rateLimits)
          .set({ requestCount: record.requestCount + 1 })
          .where(eq(rateLimits.id, record.id))
          .returning();
      }

      // Set rate limit headers
      const remaining = Math.max(0, config.maxRequests - record.requestCount);
      const resetTime = new Date(record.windowStart.getTime() + config.windowMs);

      res.setHeader('X-RateLimit-Limit', config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(resetTime.getTime() / 1000).toString());

      next();

    } catch (error) {
      console.error('Rate limiter error:', error);
      next(); // Fail open - don't block on rate limiter errors
    }
  };
}
```

#### REFACTOR: Apply to Routes
```typescript
// americancheese/server/routes.ts
app.post(
  "/api/projects/:id/members/invite",
  createRateLimiter('POST /api/projects/:id/members/invite'),
  async (req: Request, res: Response) => {
    // ... handler
  }
);

app.put(
  "/api/projects/:id/members/:memberId",
  createRateLimiter('PUT /api/projects/:id/members/:memberId'),
  async (req: Request, res: Response) => {
    // ... handler
  }
);

app.delete(
  "/api/projects/:id/members/:memberId",
  createRateLimiter('DELETE /api/projects/:id/members/:memberId'),
  async (req: Request, res: Response) => {
    // ... handler
  }
);
```

**Acceptance Criteria:**
- ✅ Rate limits enforced on all member endpoints
- ✅ Rate limit headers included in responses
- ✅ Window resets after configured time
- ✅ Tests verify rate limiting behavior
- ✅ Fail-open behavior (don't block on errors)

---

### Task 4.2: Add Cleanup Job for Old Rate Limit Records
**Type:** Background Job
**Duration:** 30 minutes
**Agent:** `backend-architect`

#### RED: Write Failing Test
```typescript
describe('Rate Limit Cleanup', () => {
  test('should delete records older than 24 hours', async () => {
    // Create old record
    const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
    await db.insert(rateLimits).values({
      userId: 123,
      endpoint: 'test',
      windowStart: oldDate,
      requestCount: 1,
    });

    await cleanupOldRateLimits();

    const remaining = await db.select().from(rateLimits);
    expect(remaining).toHaveLength(0);
  });
});
```

#### GREEN: Implement Cleanup Function
```typescript
// americancheese/server/jobs/rateLimitCleanup.ts
export async function cleanupOldRateLimits() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const deleted = await db.delete(rateLimits)
    .where(lt(rateLimits.windowStart, cutoff))
    .returning();

  console.log(`Cleaned up ${deleted.length} old rate limit records`);
  return deleted.length;
}

// Schedule cleanup every hour
setInterval(cleanupOldRateLimits, 60 * 60 * 1000);
```

**Acceptance Criteria:**
- ✅ Old records deleted automatically
- ✅ Cleanup runs on schedule
- ✅ Tests verify deletion logic

---

## Phase 5: Integration & Testing

**Goal:** Ensure all security fixes work together correctly.

### Task 5.1: Integration Tests
**Type:** Testing
**Duration:** 1 hour
**Agent:** `test-engineer`

#### Tests to Write
```typescript
// americancheese/server/__tests__/memberSecurity.integration.test.ts
describe('Member Security - Integration', () => {
  describe('Complete member lifecycle with audit trail', () => {
    test('should log all operations in correct order', async () => {
      // 1. Invite member
      await request(app).post('/api/projects/1/members/invite')
        .send({ email: 'newmember@example.com', role: 'viewer' });

      // 2. Accept invitation
      await request(app).post('/api/invitations/1/accept');

      // 3. Update role
      await request(app).put('/api/projects/1/members/1')
        .send({ role: 'editor' });

      // 4. Remove member
      await request(app).delete('/api/projects/1/members/1');

      // Verify audit trail
      const logs = await db.select().from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.targetUserEmail, 'newmember@example.com'))
        .orderBy(projectMemberAuditLog.createdAt);

      expect(logs).toHaveLength(4);
      expect(logs[0].action).toBe('invite');
      expect(logs[1].action).toBe('accept');
      expect(logs[2].action).toBe('role_change');
      expect(logs[3].action).toBe('remove');
    });
  });

  describe('Rate limiting with error message sanitization', () => {
    test('should rate limit with generic error message', async () => {
      // Send 11 requests
      for (let i = 0; i <= 10; i++) {
        const response = await request(app)
          .post('/api/projects/1/members/invite')
          .send({ email: `user${i}@example.com`, role: 'viewer' });

        if (i < 10) {
          expect(response.status).not.toBe(429);
        } else {
          expect(response.status).toBe(429);
          expect(response.body.message).toBe(SAFE_ERROR_MESSAGES.RATE_LIMITED);
        }
      }
    });
  });

  describe('Transaction rollback on audit failure', () => {
    test('should rollback member update if audit log fails', async () => {
      // This is tested in unit tests with mocking
    });
  });
});
```

**Acceptance Criteria:**
- ✅ All integration tests pass
- ✅ Audit trail correctly captures full lifecycle
- ✅ Rate limiting works with error sanitization
- ✅ Transaction rollback verified

---

### Task 5.2: Security Testing
**Type:** Security Testing
**Duration:** 1 hour
**Agent:** `security-auditor`

#### Security Test Cases
```typescript
// americancheese/server/__tests__/security.test.ts
describe('Security Vulnerabilities - Fixed', () => {
  describe('SEC-01: Email Enumeration Prevention', () => {
    test('cannot determine if email exists through error messages', async () => {
      const responses = await Promise.all([
        request(app).post('/api/projects/1/members/invite')
          .send({ email: 'exists@example.com', role: 'viewer' }),
        request(app).post('/api/projects/1/members/invite')
          .send({ email: 'notexists@example.com', role: 'viewer' }),
        request(app).post('/api/projects/1/members/invite')
          .send({ email: 'owner@example.com', role: 'viewer' }),
      ]);

      // All should have same error message
      const messages = responses.map(r => r.body.message);
      expect(new Set(messages).size).toBe(1);
    });

    test('timing attack prevention', async () => {
      const timings: number[] = [];

      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await request(app).post('/api/projects/1/members/invite')
          .send({ email: `user${i}@example.com`, role: 'viewer' });
        timings.push(Date.now() - start);
      }

      // Verify variance in response times (due to random delay)
      const variance = calculateVariance(timings);
      expect(variance).toBeGreaterThan(10); // Some variance expected
    });
  });

  describe('SEC-02: Transaction Isolation', () => {
    test('prevents privilege escalation through race conditions', async () => {
      // Concurrent attempts to promote self
      const attempts = Array(5).fill(null).map(() =>
        request(app).put('/api/projects/1/members/1')
          .send({ role: 'owner' })
      );

      const results = await Promise.all(attempts);

      // All should fail
      results.forEach(r => {
        expect(r.status).toBe(403);
      });
    });
  });

  describe('SEC-03: Rate Limiting', () => {
    test('prevents spam/abuse attacks', async () => {
      const responses = await Promise.all(
        Array(20).fill(null).map((_, i) =>
          request(app).post('/api/projects/1/members/invite')
            .send({ email: `spam${i}@example.com`, role: 'viewer' })
        )
      );

      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

**Acceptance Criteria:**
- ✅ No email enumeration possible
- ✅ No timing attacks possible
- ✅ No privilege escalation possible
- ✅ Rate limiting prevents abuse

---

## Phase 6: Documentation & Deployment

### Task 6.1: Update API Documentation
**Type:** Documentation
**Duration:** 30 minutes

**Update:**
- Error response formats
- Rate limit headers
- Audit log schema
- Security considerations

### Task 6.2: Create Deployment Checklist
**Type:** Documentation
**Duration:** 15 minutes

**Checklist:**
- [ ] Run database migrations on staging
- [ ] Verify audit logs are being written
- [ ] Test rate limits don't block legitimate users
- [ ] Monitor error logs for 24 hours
- [ ] Run security tests on production
- [ ] Document rollback procedure

---

## Summary

### Total Effort Estimate
- **Database Migrations:** 1.5 hours
- **Error Sanitization:** 1 hour
- **Audit Logging:** 2.5 hours
- **Rate Limiting:** 2 hours
- **Integration Testing:** 1 hour
- **Security Testing:** 1 hour
- **Documentation:** 45 minutes

**Total: ~10 hours (1.25 days)**

### Test Coverage Goals
- Unit tests: 100% coverage of new code
- Integration tests: All member lifecycle paths
- Security tests: All identified vulnerabilities

### Success Metrics
1. ✅ SEC-01: No email enumeration via error messages
2. ✅ SEC-02: 100% of member updates have audit trail
3. ✅ SEC-03: Rate limiting blocks >10 requests per 15 min
4. ✅ All tests passing (unit, integration, security)
5. ✅ No production incidents related to these changes

---

## Next Steps

1. **Review this plan** - Ensure all stakeholders agree
2. **Run `/oss:build`** - Execute the plan with strict TDD
3. **Run `/oss:test`** - Verify all tests pass
4. **Run `/oss:ship`** - Deploy to production

**Note:** Follow IRON LAW #1 strictly - NO code without tests first!
