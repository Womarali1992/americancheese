# Design: Security Fixes Phase 1

**Feature:** Critical Security Vulnerabilities Fix
**Date:** 2026-02-11
**Status:** Approved

---

## Problem Statement

Code review identified three critical security vulnerabilities in the profile sharing system:

1. **SEC-01:** Email enumeration via error messages
2. **SEC-02:** Race conditions and missing audit trail in member updates
3. **SEC-03:** No rate limiting allows abuse

---

## Design Decisions

### 1. Error Message Sanitization (SEC-01)

**Decision:** Generic error messages for all member invitation failures

**Rationale:**
- Prevents attackers from discovering valid email addresses
- Eliminates timing-based enumeration attacks
- Maintains user experience while improving security

**Implementation:**
- Centralized error constants in `shared/constants/errors.ts`
- Error sanitization utility for consistent responses
- Random delay (0-100ms) to prevent timing attacks

**Trade-offs:**
- ✅ Strong security against enumeration
- ❌ Less specific error messages for legitimate users
- ✅ Minimal impact on UX

---

### 2. Audit Logging with Transaction Isolation (SEC-02)

**Decision:** Database transactions with row-level locking + audit log table

**Rationale:**
- Prevents race conditions through pessimistic locking
- Atomic operations ensure audit logs match actual changes
- Full audit trail for security investigations and compliance

**Database Schema:**
```sql
project_member_audit_log:
  - id (serial)
  - project_id (indexed)
  - member_id
  - action (invite, role_change, remove, accept, decline)
  - performed_by (indexed)
  - target_user_email
  - old_value (jsonb)
  - new_value (jsonb)
  - ip_address
  - user_agent
  - created_at (indexed DESC)
```

**Transaction Pattern:**
```typescript
db.transaction(async (tx) => {
  1. SELECT ... FOR UPDATE (lock row)
  2. Validate permissions
  3. UPDATE member
  4. INSERT audit log
  // All or nothing - rollback on any failure
});
```

**Trade-offs:**
- ✅ Strong consistency and auditability
- ✅ Prevents concurrent modification issues
- ❌ Slight performance overhead from locking
- ❌ Increased database storage for audit logs

**Retention Policy:** 90 days (standard compliance)

---

### 3. Rate Limiting (SEC-03)

**Decision:** PostgreSQL-based rate limiting with configurable limits per endpoint

**Rationale:**
- Prevents abuse and spam attacks
- Simple implementation using existing database
- Per-user-per-project granularity for fair limits
- Standard rate limit headers for API clients

**Database Schema:**
```sql
rate_limits:
  - id (serial)
  - user_id (indexed)
  - endpoint (indexed)
  - project_id (indexed, nullable)
  - request_count
  - window_start (indexed)
  - created_at

  UNIQUE INDEX: (user_id, endpoint, project_id)
```

**Rate Limit Configuration:**
- POST /api/projects/:id/members/invite: 10 requests / 15 minutes
- PUT /api/projects/:id/members/:memberId: 20 requests / 15 minutes
- DELETE /api/projects/:id/members/:memberId: 20 requests / 15 minutes

**Response Headers:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1644523200
Retry-After: 300
```

**Trade-offs:**
- ✅ Simple, uses existing infrastructure (PostgreSQL)
- ✅ Per-user-per-project fairness
- ❌ Not as fast as Redis-based solution
- ✅ Fail-open behavior (don't block on errors)
- ❌ Database storage grows (mitigated by cleanup job)

**Future Optimization:** Consider Redis for high-traffic scenarios

---

## Architecture Decisions

### Database Transaction Strategy
- **Chosen:** Pessimistic locking (SELECT FOR UPDATE)
- **Rejected:** Optimistic locking (version fields)
- **Reason:** Clear failure mode, simpler error handling

### Audit Log Storage
- **Chosen:** JSONB for old/new values
- **Rejected:** Separate columns per field
- **Reason:** Flexible schema, supports future changes

### Rate Limit Storage
- **Chosen:** PostgreSQL
- **Rejected:** Redis, In-memory
- **Reason:** Simplicity, persistence, uses existing DB

### Error Response Format
- **Chosen:** Simple `{ message: "..." }` format
- **Rejected:** RFC 7807 Problem Details
- **Reason:** Consistency with existing API

---

## Security Considerations

### Email Enumeration Prevention
- Generic error messages for all cases
- Random delay (0-100ms) prevents timing attacks
- Email normalization (lowercase) before checks

### Audit Trail Integrity
- Audit logs written in same transaction as changes
- Cannot be modified (append-only pattern)
- IP address and user agent captured for forensics

### Rate Limit Bypass Prevention
- Applied before authorization checks
- Stored in database (not client-side)
- Cleanup job prevents storage overflow
- Fail-open to avoid blocking legitimate users on errors

---

## Performance Considerations

### Database Indexes
```sql
-- Audit log indexes
CREATE INDEX idx_audit_log_project_id ON project_member_audit_log(project_id);
CREATE INDEX idx_audit_log_performed_by ON project_member_audit_log(performed_by);
CREATE INDEX idx_audit_log_created_at ON project_member_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON project_member_audit_log(action);

-- Rate limit indexes
CREATE UNIQUE INDEX idx_rate_limits_user_endpoint_project ON rate_limits(user_id, endpoint, project_id);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
```

### Query Optimization
- Use composite indexes for multi-column lookups
- Partition audit log table by month if needed
- Cleanup job runs hourly to prevent bloat

### Transaction Deadlock Prevention
- Acquire locks in consistent order (by ID)
- Keep transactions short
- Clear error messages for conflicts

---

## Testing Strategy

### Unit Tests
- Error message sanitization utility
- Audit logger service methods
- Rate limiter logic and window calculations
- Transaction rollback scenarios

### Integration Tests
- Complete member lifecycle with audit trail
- Concurrent update handling
- Rate limit enforcement across requests
- Error message consistency

### Security Tests
- Email enumeration attempts
- Timing attack resistance
- Privilege escalation attempts
- Spam/abuse prevention

### Performance Tests
- Transaction throughput
- Rate limiter overhead
- Audit log write performance

---

## Rollback Plan

If issues arise in production:

1. **Immediate:** Disable rate limiting middleware
2. **Quick:** Revert to previous error messages
3. **Full:** Rollback database migrations

**Monitoring:**
- Watch error rates for 24 hours
- Monitor database connection pool
- Track rate limit header responses
- Check audit log write failures

---

## Future Enhancements (Out of Scope)

- [ ] Redis-based rate limiting for better performance
- [ ] Email notifications for security events
- [ ] Admin dashboard for viewing audit logs
- [ ] Real-time security alerts
- [ ] IP-based blocking for repeated violations
- [ ] Role-based rate limit adjustments
- [ ] Audit log retention policies and archival
- [ ] Backfill historical audit logs

---

## References

- Code Review: `/oss:review` output
- OWASP Top 10: A01:2021 – Broken Access Control
- OWASP Top 10: A07:2021 – Identification and Authentication Failures

---

**Approved by:** Code Review
**Implementation tracked in:** PROGRESS.md
**Detailed plan in:** PLAN.md
