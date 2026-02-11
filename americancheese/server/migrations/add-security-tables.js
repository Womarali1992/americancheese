/**
 * Migration script to add security-related tables for member management and rate limiting.
 *
 * Tables created:
 * 1. project_member_audit_log - Comprehensive audit trail for all member management operations
 *    - Tracks: invites, role changes, removals, accepts, declines
 *    - Stores: who performed the action, on whom, when, and from where (IP/user-agent)
 *    - JSONB fields for flexible before/after state tracking
 *
 * 2. rate_limits - Request rate limiting to prevent API abuse
 *    - Tracks: request counts per user/endpoint/project combination
 *    - Sliding window approach with window_start timestamp
 *    - Unique composite index ensures no duplicate entries
 *
 * This migration is idempotent and can be safely run multiple times.
 *
 * @param {Pool} queryClient - PostgreSQL connection pool
 * @returns {Promise<{success: boolean, error?: string}>} Migration result
 */
export async function addSecurityTables(queryClient) {
  try {
    console.log('Checking for security tables...');

    // ===============================================
    // SECTION 1: Project Member Audit Log Table
    // ===============================================

    // Check if project_member_audit_log table already exists
    const auditLogCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'project_member_audit_log'
    `;

    const auditLogResult = await queryClient.query(auditLogCheckQuery);

    if (auditLogResult.rows.length === 0) {
      console.log('Creating project_member_audit_log table...');

      // Create project_member_audit_log table
      // Purpose: Comprehensive audit trail for all member management operations
      // Note: member_id is nullable because it may not exist yet (e.g., invite to new user)
      await queryClient.query(`
        CREATE TABLE project_member_audit_log (
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

      // Create indexes for project_member_audit_log
      // These indexes optimize common query patterns:

      // Index on project_id - for filtering audit log by project
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON project_member_audit_log(project_id)
      `);

      // Index on performed_by - for filtering by user who performed the action
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON project_member_audit_log(performed_by)
      `);

      // Index on created_at DESC - for time-based queries (most recent first)
      // DESC order optimizes "recent activity" queries which are very common
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON project_member_audit_log(created_at DESC)
      `);

      // Index on action - for filtering by action type (invite, role_change, etc.)
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_action ON project_member_audit_log(action)
      `);

      console.log('Successfully created project_member_audit_log table');
    } else {
      console.log('project_member_audit_log table already exists');
    }

    // ===============================================
    // SECTION 2: Rate Limits Table
    // ===============================================

    // Check if rate_limits table already exists
    const rateLimitsCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'rate_limits'
    `;

    const rateLimitsResult = await queryClient.query(rateLimitsCheckQuery);

    if (rateLimitsResult.rows.length === 0) {
      console.log('Creating rate_limits table...');

      // Create rate_limits table
      // Purpose: Track API request counts per user/endpoint/project for rate limiting
      // Note: project_id is nullable because some endpoints aren't project-specific
      // Note: request_count defaults to 0 and increments with each request
      await queryClient.query(`
        CREATE TABLE rate_limits (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL,
          project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
          request_count INTEGER NOT NULL DEFAULT 0,
          window_start TIMESTAMP NOT NULL DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Create unique composite index - CRITICAL for preventing duplicate rate limit entries
      // This ensures only one rate limit entry per (user_id, endpoint, project_id) combination
      // COALESCE(project_id, -1) handles nullable project_id values in the unique constraint
      // Without this, you could have multiple NULL entries for the same user/endpoint
      await queryClient.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique_composite
        ON rate_limits(user_id, endpoint, COALESCE(project_id, -1))
      `);

      // Index on window_start - for cleanup of old records
      // Rate limit windows expire after a certain period, and this index
      // makes it efficient to find and delete expired entries
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start)
      `);

      console.log('Successfully created rate_limits table');
    } else {
      console.log('rate_limits table already exists');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating security tables:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Rollback function to remove security tables.
 *
 * This is the inverse of addSecurityTables() and can be used to:
 * - Roll back a failed migration
 * - Remove security features if needed
 * - Clean up test databases
 *
 * Safety features:
 * - Uses DROP TABLE IF EXISTS to be idempotent
 * - Uses CASCADE to automatically drop dependent objects
 * - Drops tables in reverse order of creation to respect dependencies
 * - Returns success/error status for monitoring
 *
 * @param {Pool} queryClient - PostgreSQL connection pool
 * @returns {Promise<{success: boolean, error?: string}>} Rollback result
 */
export async function removeSecurityTables(queryClient) {
  try {
    console.log('Removing security tables...');

    // Drop tables in reverse order to respect foreign key dependencies
    // Even though we use CASCADE, explicit ordering is a good practice

    // Drop rate_limits first (no tables depend on it)
    await queryClient.query(`
      DROP TABLE IF EXISTS rate_limits CASCADE
    `);

    // Drop project_member_audit_log second
    await queryClient.query(`
      DROP TABLE IF EXISTS project_member_audit_log CASCADE
    `);

    console.log('Successfully removed security tables');

    return { success: true };
  } catch (error) {
    console.error('Error removing security tables:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
