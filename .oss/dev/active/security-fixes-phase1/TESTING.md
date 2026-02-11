# Testing Strategy: Security Fixes Phase 1

**Feature:** Critical Security Vulnerabilities Fix
**Test Approach:** London TDD (Outside-In with Mocking)
**Coverage Goal:** 100% of new code

---

## Test Philosophy

Following **IRON LAW #2: Behavior Over Implementation**

Every test must answer:
1. **What USER BEHAVIOR does this verify?** → Security protection behaviors
2. **What BUSINESS RULE does this encode?** → No enumeration, full audit, rate limits
3. **Would this survive a complete rewrite?** → Yes, tests API behavior
4. **Is this readable to non-engineers?** → Yes, descriptive test names

---

## Test Categories

### 1. Unit Tests

#### Error Sanitization (`errorSanitizer.test.ts`)
```typescript
describe('Error Message Sanitization', () => {
  describe('USER BEHAVIOR: Attackers cannot enumerate emails', () => {
    test('returns same message for existing and non-existing users', () => {
      expect(SAFE_ERROR_MESSAGES.INVITATION_FAILED).toBe(
        'Unable to send invitation to this email address'
      );
      // BUSINESS RULE: Generic errors prevent enumeration
    });

    test('does not leak user information in error messages', () => {
      const messages = Object.values(SAFE_ERROR_MESSAGES);
      messages.forEach(msg => {
        expect(msg).not.toMatch(/exists|registered|found|owner/i);
      });
      // BUSINESS RULE: No sensitive info in errors
    });
  });
});
```

**Mocking Strategy:**
- ❌ Don't mock: Error constants (value objects)
- ✅ Do mock: Database calls in higher-level tests

---

#### Audit Logger (`auditLogger.test.ts`)
```typescript
describe('Audit Logger Service', () => {
  describe('USER BEHAVIOR: All member operations are logged for compliance', () => {
    let mockDb: MockDatabase;

    beforeEach(() => {
      mockDb = createMockDatabase();
    });

    test('logs member invitation with correct details', async () => {
      // ARRANGE
      const invitationData = {
        projectId: 1,
        performedBy: 123,
        targetUserEmail: 'test@example.com',
        role: 'viewer',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      // ACT
      await auditLogger.logInvitation(invitationData);

      // ASSERT
      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'invite',
          newValue: { role: 'viewer' },
        })
      );
      // BUSINESS RULE: Invitation creates audit log entry
    });

    test('logs role changes with old and new values', async () => {
      // BUSINESS RULE: Role changes show before/after state
      await auditLogger.logRoleChange({
        oldRole: 'viewer',
        newRole: 'editor',
        // ...
      });

      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValue: { role: 'viewer' },
          newValue: { role: 'editor' },
        })
      );
    });
  });
});
```

**Mocking Strategy:**
- ❌ Don't mock: AuditLogger service itself
- ✅ Do mock: Database insert operations
- ✅ Do mock: IP address capture in unit tests

---

#### Rate Limiter (`rateLimiter.test.ts`)
```typescript
describe('Rate Limiter Middleware', () => {
  describe('USER BEHAVIOR: Legitimate users can work, abusers are blocked', () => {
    let mockDb: MockDatabase;
    let mockReq: MockRequest;
    let mockRes: MockResponse;
    let next: jest.Mock;

    beforeEach(() => {
      mockDb = createMockDatabase();
      mockReq = createMockRequest({ userId: 123, projectId: 1 });
      mockRes = createMockResponse();
      next = jest.fn();
    });

    test('allows requests within limit', async () => {
      mockDb.select.mockResolvedValue([{ requestCount: 5 }]);

      await rateLimiter(mockReq, mockRes, next);

      expect(next).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
      // BUSINESS RULE: Up to 10 requests allowed
    });

    test('blocks 11th request in 15-minute window', async () => {
      mockDb.select.mockResolvedValue([{
        requestCount: 10,
        windowStart: new Date(Date.now() - 1000),
      }]);

      await rateLimiter(mockReq, mockRes, next);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(next).not.toHaveBeenCalled();
      // BUSINESS RULE: Max 10 requests per 15 minutes
    });

    test('resets counter after window expires', async () => {
      const oldWindowStart = new Date(Date.now() - 16 * 60 * 1000);
      mockDb.select.mockResolvedValue([{
        requestCount: 10,
        windowStart: oldWindowStart,
      }]);

      await rateLimiter(mockReq, mockRes, next);

      expect(mockDb.insert).toHaveBeenCalled(); // New window
      expect(next).toHaveBeenCalled();
      // BUSINESS RULE: Window resets after 15 minutes
    });

    test('includes rate limit headers', async () => {
      mockDb.select.mockResolvedValue([{
        requestCount: 7,
        windowStart: new Date(),
      }]);

      await rateLimiter(mockReq, mockRes, next);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '3');
      // BUSINESS RULE: Clients can track their usage
    });
  });
});
```

**Mocking Strategy:**
- ❌ Don't mock: Rate limiter middleware itself
- ✅ Do mock: Database queries, Express req/res
- ✅ Do mock: Current time for window calculations

---

### 2. Integration Tests

#### Complete Member Lifecycle (`memberSecurity.integration.test.ts`)
```typescript
describe('Member Security - Integration', () => {
  describe('USER BEHAVIOR: Full member lifecycle is audited', () => {
    let testProject: Project;
    let testUser: User;

    beforeEach(async () => {
      // Use real database (test DB)
      await cleanDatabase();
      testProject = await createTestProject();
      testUser = await createTestUser();
    });

    test('logs all operations in correct order', async () => {
      // ACT: Perform full lifecycle
      const inviteRes = await request(app)
        .post(`/api/projects/${testProject.id}/members/invite`)
        .send({ email: 'newmember@example.com', role: 'viewer' });
      expect(inviteRes.status).toBe(201);

      const memberId = inviteRes.body.id;

      const acceptRes = await request(app)
        .post(`/api/invitations/${memberId}/accept`);
      expect(acceptRes.status).toBe(200);

      const updateRes = await request(app)
        .put(`/api/projects/${testProject.id}/members/${memberId}`)
        .send({ role: 'editor' });
      expect(updateRes.status).toBe(200);

      const removeRes = await request(app)
        .delete(`/api/projects/${testProject.id}/members/${memberId}`);
      expect(removeRes.status).toBe(204);

      // ASSERT: Verify audit trail
      const logs = await db.select()
        .from(projectMemberAuditLog)
        .where(eq(projectMemberAuditLog.targetUserEmail, 'newmember@example.com'))
        .orderBy(projectMemberAuditLog.createdAt);

      expect(logs).toHaveLength(4);
      expect(logs.map(l => l.action)).toEqual([
        'invite',
        'accept',
        'role_change',
        'remove'
      ]);
      // BUSINESS RULE: Complete audit trail exists
    });

    test('audit log includes IP address and user agent', async () => {
      await request(app)
        .post(`/api/projects/${testProject.id}/members/invite`)
        .set('User-Agent', 'Test Client/1.0')
        .set('X-Forwarded-For', '203.0.113.1')
        .send({ email: 'test@example.com', role: 'viewer' });

      const logs = await db.select()
        .from(projectMemberAuditLog)
        .limit(1);

      expect(logs[0].userAgent).toContain('Test Client');
      expect(logs[0].ipAddress).toBe('203.0.113.1');
      // BUSINESS RULE: Audit logs capture request context
    });
  });

  describe('USER BEHAVIOR: Concurrent updates are handled safely', () => {
    test('prevents race conditions in role updates', async () => {
      const memberId = await createTestMember();

      // ACT: Concurrent updates
      const [result1, result2] = await Promise.all([
        request(app)
          .put(`/api/projects/${testProject.id}/members/${memberId}`)
          .send({ role: 'admin' }),
        request(app)
          .put(`/api/projects/${testProject.id}/members/${memberId}`)
          .send({ role: 'editor' }),
      ]);

      // ASSERT: One succeeds, one fails (or both succeed with different results)
      const statuses = [result1.status, result2.status].sort();
      expect(statuses[0]).toBeLessThan(400); // At least one success

      // Verify final state is consistent
      const member = await db.select()
        .from(projectMembers)
        .where(eq(projectMembers.id, memberId));

      expect(['admin', 'editor']).toContain(member[0].role);
      // BUSINESS RULE: No corrupted data from race conditions
    });
  });
});
```

**Mocking Strategy:**
- ❌ Don't mock: Database, HTTP layer
- ✅ Do use: Test database with cleanup
- ✅ Do use: Test fixtures for consistent data

---

### 3. Security Tests

#### Email Enumeration Prevention (`security.test.ts`)
```typescript
describe('Security Vulnerabilities - Fixed', () => {
  describe('SEC-01: Email Enumeration Prevention', () => {
    describe('USER BEHAVIOR: Attackers cannot discover valid emails', () => {
      test('returns same error for existing and non-existing emails', async () => {
        // ARRANGE: Create one existing user
        await createTestUser({ email: 'exists@example.com' });

        // ACT: Try to invite both existing and non-existing
        const responses = await Promise.all([
          request(app).post('/api/projects/1/members/invite')
            .send({ email: 'exists@example.com', role: 'viewer' }),
          request(app).post('/api/projects/1/members/invite')
            .send({ email: 'notexists@example.com', role: 'viewer' }),
        ]);

        // ASSERT: Identical error messages
        expect(responses[0].body.message).toBe(responses[1].body.message);
        expect(responses[0].body.message).toBe(SAFE_ERROR_MESSAGES.INVITATION_FAILED);
        // SECURITY RULE: No information leakage
      });

      test('prevents timing attacks', async () => {
        const timings: number[] = [];

        // ACT: Measure response times
        for (let i = 0; i < 20; i++) {
          const start = Date.now();
          await request(app).post('/api/projects/1/members/invite')
            .send({ email: `user${i}@example.com`, role: 'viewer' });
          timings.push(Date.now() - start);
        }

        // ASSERT: Response times have variance (due to random delay)
        const mean = timings.reduce((a, b) => a + b) / timings.length;
        const variance = timings.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / timings.length;

        expect(variance).toBeGreaterThan(10);
        // SECURITY RULE: Timing variance prevents enumeration
      });
    });
  });

  describe('SEC-02: Transaction Isolation', () => {
    describe('USER BEHAVIOR: Privilege escalation is prevented', () => {
      test('admin cannot promote self to owner', async () => {
        const admin = await createTestAdmin();

        const response = await request(app)
          .put(`/api/projects/1/members/${admin.memberId}`)
          .send({ role: 'owner' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(SAFE_ERROR_MESSAGES.UNAUTHORIZED);
        // SECURITY RULE: Only owner can assign owner role
      });

      test('audit log write failure rolls back member update', async () => {
        // ARRANGE: Mock audit logger to fail
        jest.spyOn(auditLogger, 'logRoleChange')
          .mockRejectedValue(new Error('Audit log failed'));

        const member = await createTestMember({ role: 'viewer' });

        // ACT
        const response = await request(app)
          .put(`/api/projects/1/members/${member.id}`)
          .send({ role: 'editor' });

        expect(response.status).toBe(500);

        // ASSERT: Role was NOT changed
        const updated = await db.select()
          .from(projectMembers)
          .where(eq(projectMembers.id, member.id));

        expect(updated[0].role).toBe('viewer'); // Still original
        // SECURITY RULE: Atomic operations (update + audit)
      });
    });
  });

  describe('SEC-03: Rate Limiting', () => {
    describe('USER BEHAVIOR: Abuse is prevented while allowing legitimate use', () => {
      test('blocks spam attacks', async () => {
        const responses = await Promise.all(
          Array(15).fill(null).map((_, i) =>
            request(app).post('/api/projects/1/members/invite')
              .send({ email: `spam${i}@example.com`, role: 'viewer' })
          )
        );

        const rateLimited = responses.filter(r => r.status === 429);
        expect(rateLimited.length).toBeGreaterThanOrEqual(5);
        // SECURITY RULE: Max 10 requests per 15 minutes
      });

      test('legitimate user can continue after window reset', async () => {
        // ARRANGE: Use up rate limit
        await Promise.all(
          Array(10).fill(null).map((_, i) =>
            request(app).post('/api/projects/1/members/invite')
              .send({ email: `user${i}@example.com`, role: 'viewer' })
          )
        );

        // Verify we're rate limited
        let response = await request(app)
          .post('/api/projects/1/members/invite')
          .send({ email: 'blocked@example.com', role: 'viewer' });
        expect(response.status).toBe(429);

        // ACT: Fast-forward time 15 minutes
        await advanceTime(15 * 60 * 1000);

        // ASSERT: Can make requests again
        response = await request(app)
          .post('/api/projects/1/members/invite')
          .send({ email: 'allowed@example.com', role: 'viewer' });
        expect(response.status).not.toBe(429);
        // BUSINESS RULE: Window resets after 15 minutes
      });
    });
  });
});
```

**Mocking Strategy:**
- ❌ Don't mock: Security logic (test the real thing)
- ✅ Do mock: Time (for window reset tests)
- ✅ Do use: Real database for integration

---

## Test Data Management

### Test Fixtures
```typescript
// test/fixtures.ts
export async function createTestProject(overrides = {}) {
  const defaults = {
    name: 'Test Project',
    location: 'Test Location',
    createdBy: testUser.id,
  };
  return db.insert(projects).values({ ...defaults, ...overrides }).returning();
}

export async function createTestMember(overrides = {}) {
  const defaults = {
    projectId: testProject.id,
    invitedEmail: 'member@example.com',
    role: 'viewer',
    status: 'accepted',
  };
  return db.insert(projectMembers).values({ ...defaults, ...overrides }).returning();
}
```

### Database Cleanup
```typescript
export async function cleanDatabase() {
  await db.delete(projectMemberAuditLog);
  await db.delete(rateLimits);
  await db.delete(projectMembers);
  await db.delete(projects);
  await db.delete(users);
}
```

---

## Coverage Goals

### Unit Tests
- **Target:** 100% coverage of new code
- **Focus:** Business logic, error handling, edge cases

### Integration Tests
- **Target:** All happy paths + critical error paths
- **Focus:** End-to-end workflows, database interactions

### Security Tests
- **Target:** All identified vulnerabilities
- **Focus:** Attack scenarios, privilege escalation, enumeration

---

## Test Execution

### Local Development
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run security tests
npm run test:security

# Coverage report
npm run test:coverage
```

### CI/CD Pipeline
```yaml
- Run unit tests (fail fast)
- Run integration tests
- Run security tests
- Generate coverage report
- Require 100% coverage of new code
```

---

## Success Criteria

✅ All unit tests pass
✅ All integration tests pass
✅ All security tests pass
✅ 100% coverage of new code
✅ No security vulnerabilities detected
✅ No flaky tests (all pass 10 times in a row)

---

**Last Updated:** 2026-02-11
