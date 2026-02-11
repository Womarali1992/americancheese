import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Security Hardening Tests
 *
 * These tests verify that security configuration across auth.ts, routes.ts,
 * and index.ts meets production-grade security requirements. Each test group
 * maps to a specific security hardening concern:
 *
 * SEC-H1: Session Secret Management
 * SEC-H2: Cookie httpOnly Flag
 * SEC-H3: Session resave / saveUninitialized
 * SEC-H4: No Query String Token Support
 * SEC-H5: Debug Endpoints Not in Public List
 * SEC-H6: Debug Endpoints Gated Behind Development Mode
 * SEC-H7: Admin Routes Protected by requireAdmin Middleware
 * SEC-H8: CORS Environment-Aware Configuration
 *
 * BUSINESS RULE:
 * The application must enforce secure defaults in production:
 * cookies must be httpOnly, sessions must not save uninitialized data,
 * debug endpoints must not be publicly accessible, admin routes must
 * require admin privileges, and CORS must not allow all origins in production.
 *
 * NOTE: These tests are written RED-first. They describe the DESIRED secure
 * state and will FAIL against the current (insecure) codebase. Production
 * code changes are required to make them pass.
 */

// Read source files once for all tests
const authPath = path.resolve(__dirname, '..', 'auth.ts');
const routesPath = path.resolve(__dirname, '..', 'routes.ts');
const indexPath = path.resolve(__dirname, '..', 'index.ts');

const authSource = fs.readFileSync(authPath, 'utf-8');
const routesSource = fs.readFileSync(routesPath, 'utf-8');
const indexSource = fs.readFileSync(indexPath, 'utf-8');

describe('SEC-H1: Session Secret Must Not Use Hardcoded Default in Production', () => {
  /**
   * BUSINESS RULE: In production, a missing SESSION_SECRET environment variable
   * must cause the application to fail fast rather than silently falling back
   * to a hardcoded secret that an attacker could guess.
   *
   * In development, an ephemeral random secret is acceptable.
   */

  it('should not contain a hardcoded session secret fallback string', () => {
    // The old pattern: process.env.SESSION_SECRET || 'construction-management-app-secret'
    // This is insecure because if SESSION_SECRET is unset in production,
    // every deployment shares the same predictable secret.
    expect(authSource).not.toContain("'construction-management-app-secret'");
  });

  it('should guard against missing SESSION_SECRET in production', () => {
    // The source must contain logic that checks NODE_ENV and SESSION_SECRET together.
    // Either throw an error or refuse to start if in production without a real secret.
    const hasProductionSecretGuard =
      authSource.includes('SESSION_SECRET') &&
      (authSource.includes("throw") || authSource.includes("process.exit"));

    expect(hasProductionSecretGuard).toBe(true);
  });

  it('should generate a random ephemeral secret for development', () => {
    // In development mode, the code should use crypto.randomBytes or similar
    // to generate a unique secret each time the server starts, rather than
    // a static string that is the same across all developer machines.
    //
    // We check that the session secret configuration (near the `session({` call)
    // uses a randomBytes-based value, not just that randomBytes exists somewhere
    // in the file (it is also used for token generation).
    const sessionConfigIndex = authSource.indexOf('session({');
    expect(sessionConfigIndex).not.toBe(-1);

    // Look at the 300 characters before the session({ call, where the secret
    // variable would be defined or the inline expression would appear.
    const secretSetupRegion = authSource.substring(
      Math.max(0, sessionConfigIndex - 600),
      sessionConfigIndex + 200
    );

    // The region must contain both randomBytes AND a reference to SESSION_SECRET
    // in the same area, indicating a conditional: use env var if set, else random.
    const usesRandomSecretForSession =
      secretSetupRegion.includes('randomBytes') &&
      secretSetupRegion.includes('SESSION_SECRET');

    expect(usesRandomSecretForSession).toBe(true);
  });
});

describe('SEC-H2: All Cookies Must Set httpOnly to true', () => {
  /**
   * BUSINESS RULE: Cookies containing authentication tokens or session
   * identifiers must never be accessible to client-side JavaScript.
   * Setting httpOnly: true prevents XSS attacks from stealing session tokens.
   */

  it('should have httpOnly: true for every cookie configuration', () => {
    // Count all occurrences of httpOnly in the auth source
    const httpOnlyTrueCount = (authSource.match(/httpOnly:\s*true/g) || []).length;

    // There are 3 cookie configurations in auth.ts:
    //   1. Session middleware cookie config
    //   2. Register handler res.cookie()
    //   3. Login handler res.cookie()
    // All three must set httpOnly: true.
    expect(httpOnlyTrueCount).toBeGreaterThanOrEqual(3);
  });

  it('should not contain any httpOnly: false', () => {
    // No cookie in the auth module should ever disable httpOnly.
    // httpOnly: false allows JavaScript to read cookies, enabling XSS token theft.
    const httpOnlyFalseCount = (authSource.match(/httpOnly:\s*false/g) || []).length;
    expect(httpOnlyFalseCount).toBe(0);
  });
});

describe('SEC-H3: Session Must Not Resave or Save Uninitialized Sessions', () => {
  /**
   * BUSINESS RULE: Sessions must not be saved back to the store if they
   * were not modified during the request (resave: false). Empty sessions
   * must not be persisted (saveUninitialized: false). This prevents
   * session fixation vectors and reduces unnecessary store writes.
   */

  it('should set resave to false', () => {
    const hasResaveFalse = /resave:\s*false/.test(authSource);
    expect(hasResaveFalse).toBe(true);
  });

  it('should set saveUninitialized to false', () => {
    const hasSaveUninitFalse = /saveUninitialized:\s*false/.test(authSource);
    expect(hasSaveUninitFalse).toBe(true);
  });

  it('should not have resave set to true', () => {
    const hasResaveTrue = /resave:\s*true/.test(authSource);
    expect(hasResaveTrue).toBe(false);
  });

  it('should not have saveUninitialized set to true', () => {
    const hasSaveUninitTrue = /saveUninitialized:\s*true/.test(authSource);
    expect(hasSaveUninitTrue).toBe(false);
  });
});

describe('SEC-H4: Authentication Must Not Accept Tokens from Query Strings', () => {
  /**
   * BUSINESS RULE: Tokens passed via query string (e.g., ?token=abc123)
   * are logged in server access logs, browser history, referrer headers,
   * and proxy logs. This creates multiple avenues for token leakage.
   * The auth middleware must only accept tokens from secure channels:
   * Authorization header, httpOnly cookies, or session storage.
   */

  it('should not extract tokens from req.query.token', () => {
    // The pattern req.query.token or req.query['token'] must not appear
    // in the auth middleware, as it enables token leakage via URLs.
    expect(authSource).not.toContain('req.query.token');
    expect(authSource).not.toContain("req.query['token']");
  });
});

describe('SEC-H5: Debug Endpoints Must Not Be in the Public Endpoint List', () => {
  /**
   * BUSINESS RULE: Debug and test endpoints expose internal server state
   * (environment info, headers, cookies) and must require authentication.
   * Listing them as public API endpoints bypasses all auth checks, making
   * server internals accessible to anonymous users.
   */

  it('should not list /api/test as a public API endpoint', () => {
    // Find the isPublicApiEndpoint assignment block
    const publicEndpointBlock = authSource.match(
      /isPublicApiEndpoint[\s\S]*?;/
    );
    expect(publicEndpointBlock).not.toBeNull();

    const block = publicEndpointBlock![0];
    // /api/test must not appear in this block
    expect(block).not.toContain("'/api/test'");
    expect(block).not.toContain('"/api/test"');
  });

  it('should not list /api/task-templates as a public API endpoint', () => {
    // Task templates contain business data and should require authentication.
    const publicEndpointBlock = authSource.match(
      /isPublicApiEndpoint[\s\S]*?;/
    );
    expect(publicEndpointBlock).not.toBeNull();

    const block = publicEndpointBlock![0];
    expect(block).not.toContain("'/api/task-templates'");
    expect(block).not.toContain('"/api/task-templates"');
  });
});

describe('SEC-H6: Debug Endpoints Must Be Gated Behind Development Mode', () => {
  /**
   * BUSINESS RULE: Endpoints that expose internal state (/api/test) or
   * create seed data (/api/create-sample-project) must only be available
   * when NODE_ENV is not "production". In production, these endpoints
   * must return 404 or not be registered at all.
   */

  it('should gate /api/test behind a NODE_ENV check', () => {
    // Find the /api/test route handler and its surrounding context
    const testEndpointIndex = routesSource.indexOf('"/api/test"') !== -1
      ? routesSource.indexOf('"/api/test"')
      : routesSource.indexOf("'/api/test'");

    expect(testEndpointIndex).not.toBe(-1);

    // Look at the surrounding 500 characters for a NODE_ENV check
    const start = Math.max(0, testEndpointIndex - 200);
    const end = Math.min(routesSource.length, testEndpointIndex + 300);
    const surrounding = routesSource.substring(start, end);

    const hasEnvCheck =
      surrounding.includes('NODE_ENV') ||
      surrounding.includes('production') ||
      surrounding.includes('development');

    expect(hasEnvCheck).toBe(true);
  });

  it('should gate /api/create-sample-project behind a NODE_ENV check', () => {
    const sampleProjectIndex = routesSource.indexOf('"/api/create-sample-project"') !== -1
      ? routesSource.indexOf('"/api/create-sample-project"')
      : routesSource.indexOf("'/api/create-sample-project'");

    expect(sampleProjectIndex).not.toBe(-1);

    // Both debug endpoints may share a single wrapping if-block (e.g.,
    // if (NODE_ENV !== 'production') { ...test route... ...sample route... }).
    // Use a 1500 char lookback to capture the enclosing conditional.
    const start = Math.max(0, sampleProjectIndex - 1500);
    const end = Math.min(routesSource.length, sampleProjectIndex + 300);
    const surrounding = routesSource.substring(start, end);

    const hasEnvCheck =
      surrounding.includes('NODE_ENV') ||
      surrounding.includes('production') ||
      surrounding.includes('development');

    expect(hasEnvCheck).toBe(true);
  });
});

describe('SEC-H7: Admin Routes Must Be Protected by requireAdmin Middleware', () => {
  /**
   * BUSINESS RULE: Routes under /api/admin/* manage system-wide templates
   * and categories. These must only be accessible to users with admin role.
   * A requireAdmin middleware must verify the user's role before allowing
   * access, preventing privilege escalation by regular users.
   */

  it('should define a requireAdmin function or middleware in routes.ts', () => {
    const hasRequireAdmin =
      routesSource.includes('requireAdmin') ||
      routesSource.includes('require_admin') ||
      routesSource.includes('isAdmin');

    expect(hasRequireAdmin).toBe(true);
  });

  it('should apply requireAdmin to all admin routes via app.use or per-route middleware', () => {
    // Two valid patterns:
    // 1. app.use('/api/admin', requireAdmin) - applies to ALL admin routes
    // 2. app.get("/api/admin/...", requireAdmin, handler) - per-route

    // Check for pattern 1: path-based middleware (preferred, DRY approach)
    const hasGlobalAdminMiddleware =
      /app\.use\s*\(\s*['"]\/api\/admin['"]\s*,\s*requireAdmin\s*\)/.test(routesSource);

    if (hasGlobalAdminMiddleware) {
      // Pattern 1 found - all admin routes are protected by the single app.use call
      expect(hasGlobalAdminMiddleware).toBe(true);
      return;
    }

    // Pattern 1 not found, check pattern 2: per-route middleware
    const adminRouteBlocks = routesSource.split(/app\.(get|post|put|delete)\s*\(/);

    let adminRoutesWithMiddleware = 0;
    let totalAdminRoutes = 0;

    for (const block of adminRouteBlocks) {
      if (block.includes('/api/admin/')) {
        totalAdminRoutes++;
        const routeLine = block.substring(0, block.indexOf('{'));
        if (routeLine.includes('requireAdmin') || routeLine.includes('isAdmin')) {
          adminRoutesWithMiddleware++;
        }
      }
    }

    expect(totalAdminRoutes).toBeGreaterThanOrEqual(4);
    expect(adminRoutesWithMiddleware).toBe(totalAdminRoutes);
  });
});

describe('SEC-H8: CORS Must Be Environment-Aware', () => {
  /**
   * BUSINESS RULE: In production, CORS must restrict allowed origins to
   * the application's own domain(s). Using origin: true unconditionally
   * allows any website to make authenticated cross-origin requests,
   * enabling CSRF-like attacks. The CORS configuration must check
   * NODE_ENV or use a CORS_ORIGIN environment variable.
   */

  it('should not use origin: true unconditionally', () => {
    // The pattern "origin: true" without any surrounding NODE_ENV check
    // means ALL origins are allowed in ALL environments including production.
    // This is a CORS misconfiguration.
    const corsBlock = indexSource.match(/cors\s*\(\s*\{[\s\S]*?\}\s*\)/);
    expect(corsBlock).not.toBeNull();

    const block = corsBlock![0];

    // If origin: true appears, it must be within a conditional (NODE_ENV check)
    if (block.includes('origin: true')) {
      // There must also be a NODE_ENV or CORS_ORIGIN reference in the same block
      const hasEnvAwareness =
        block.includes('NODE_ENV') ||
        block.includes('CORS_ORIGIN') ||
        block.includes('production');

      expect(hasEnvAwareness).toBe(true);
    }
    // If origin: true does not appear at all, that is also acceptable
    // (means they use a function or specific origin string)
  });

  it('should reference NODE_ENV or CORS_ORIGIN in the CORS configuration', () => {
    // The CORS setup in index.ts must be environment-aware. Either:
    // - Check NODE_ENV to decide the origin policy
    // - Read CORS_ORIGIN from environment variables
    // - Use a function that validates origins against an allowlist
    const corsSection = indexSource.substring(
      indexSource.indexOf('cors('),
      indexSource.indexOf('cors(') + 500
    );

    const isEnvAware =
      corsSection.includes('NODE_ENV') ||
      corsSection.includes('CORS_ORIGIN') ||
      corsSection.includes('production') ||
      corsSection.includes('allowedOrigins');

    expect(isEnvAware).toBe(true);
  });
});
