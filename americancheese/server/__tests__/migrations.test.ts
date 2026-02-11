import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import pkg from 'pg';
const { Pool } = pkg;

// Import the migration functions that we're about to create
import { addSecurityTables, removeSecurityTables } from '../migrations/add-security-tables.js';

describe('Security Tables Migration', () => {
  let testClient: any;

  beforeAll(async () => {
    // Use a test database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'project_management',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    };

    testClient = new Pool(dbConfig);

    // Ensure users and projects tables exist (required for foreign keys)
    await testClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        company TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login_at TIMESTAMP
      )
    `);

    await testClient.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        progress INTEGER NOT NULL DEFAULT 0
      )
    `);
  });

  afterAll(async () => {
    // Recreate security tables (they may have been dropped by removeSecurityTables tests)
    // Other test files depend on these tables existing
    await addSecurityTables(testClient);
    await testClient.end();
  });

  describe('addSecurityTables', () => {
    it('should exist as a function', () => {
      expect(typeof addSecurityTables).toBe('function');
    });

    it('should create project_member_audit_log table without errors', async () => {
      // Clean up first
      await testClient.query('DROP TABLE IF EXISTS rate_limits CASCADE');
      await testClient.query('DROP TABLE IF EXISTS project_member_audit_log CASCADE');

      // Run migration
      const result = await addSecurityTables(testClient);

      expect(result.success).toBe(true);

      // Verify table exists
      const tableCheck = await testClient.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'project_member_audit_log'
      `);

      expect(tableCheck.rows.length).toBe(1);
    });

    it('should create rate_limits table without errors', async () => {
      // Verify table exists
      const tableCheck = await testClient.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rate_limits'
      `);

      expect(tableCheck.rows.length).toBe(1);
    });

    it('should be idempotent - can run multiple times without errors', async () => {
      // Run migration again
      const result1 = await addSecurityTables(testClient);
      expect(result1.success).toBe(true);

      // Run it a third time
      const result2 = await addSecurityTables(testClient);
      expect(result2.success).toBe(true);

      // Verify still only one table
      const tableCheck = await testClient.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'project_member_audit_log'
      `);

      expect(tableCheck.rows.length).toBe(1);
    });

    it('should create all required columns in project_member_audit_log', async () => {
      const columnsCheck = await testClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'project_member_audit_log'
        ORDER BY ordinal_position
      `);

      const columns = columnsCheck.rows.map((row: any) => row.column_name);

      expect(columns).toContain('id');
      expect(columns).toContain('project_id');
      expect(columns).toContain('member_id');
      expect(columns).toContain('action');
      expect(columns).toContain('performed_by');
      expect(columns).toContain('target_user_email');
      expect(columns).toContain('old_value');
      expect(columns).toContain('new_value');
      expect(columns).toContain('ip_address');
      expect(columns).toContain('user_agent');
      expect(columns).toContain('created_at');
    });

    it('should create all required columns in rate_limits', async () => {
      const columnsCheck = await testClient.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rate_limits'
        ORDER BY ordinal_position
      `);

      const columns = columnsCheck.rows.map((row: any) => row.column_name);

      expect(columns).toContain('id');
      expect(columns).toContain('user_id');
      expect(columns).toContain('endpoint');
      expect(columns).toContain('project_id');
      expect(columns).toContain('request_count');
      expect(columns).toContain('window_start');
      expect(columns).toContain('created_at');
    });

    it('should create indexes for project_member_audit_log', async () => {
      const indexCheck = await testClient.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'project_member_audit_log'
      `);

      const indexes = indexCheck.rows.map((row: any) => row.indexname);

      expect(indexes).toContain('idx_audit_log_project_id');
      expect(indexes).toContain('idx_audit_log_performed_by');
      expect(indexes).toContain('idx_audit_log_created_at');
      expect(indexes).toContain('idx_audit_log_action');
    });

    it('should create indexes for rate_limits including unique composite index', async () => {
      const indexCheck = await testClient.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'rate_limits'
      `);

      const indexes = indexCheck.rows.map((row: any) => row.indexname);

      expect(indexes).toContain('idx_rate_limits_unique_composite');
      expect(indexes).toContain('idx_rate_limits_window_start');
    });

    it('should have foreign key constraints', async () => {
      // Check project_member_audit_log foreign keys
      const auditFkCheck = await testClient.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'project_member_audit_log'
          AND tc.constraint_type = 'FOREIGN KEY'
      `);

      expect(auditFkCheck.rows.length).toBeGreaterThan(0);

      // Check rate_limits foreign keys
      const rateFkCheck = await testClient.query(`
        SELECT
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'rate_limits'
          AND tc.constraint_type = 'FOREIGN KEY'
      `);

      expect(rateFkCheck.rows.length).toBeGreaterThan(0);
    });
  });

  describe('removeSecurityTables', () => {
    it('should exist as a function', () => {
      expect(typeof removeSecurityTables).toBe('function');
    });

    it('should successfully remove both tables', async () => {
      // Ensure tables exist first
      await addSecurityTables(testClient);

      // Run rollback
      const result = await removeSecurityTables(testClient);
      expect(result.success).toBe(true);

      // Verify tables are gone
      const auditTableCheck = await testClient.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'project_member_audit_log'
      `);

      const rateLimitTableCheck = await testClient.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'rate_limits'
      `);

      expect(auditTableCheck.rows.length).toBe(0);
      expect(rateLimitTableCheck.rows.length).toBe(0);
    });

    it('should be idempotent - can run multiple times without errors', async () => {
      // Run rollback multiple times
      const result1 = await removeSecurityTables(testClient);
      expect(result1.success).toBe(true);

      const result2 = await removeSecurityTables(testClient);
      expect(result2.success).toBe(true);
    });
  });
});
