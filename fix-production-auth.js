/**
 * Production Fix Script: Add Missing Authentication Tables
 *
 * This script adds the session_tokens and api_tokens tables that are
 * required for authentication but were missing from the production database.
 *
 * Run this on your production server:
 *   node fix-production-auth.js
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

async function fixProductionAuth() {
  const client = new Pool(dbConfig);

  try {
    console.log('🔧 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log('');

    // Test connection
    await client.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Ensure users table exists
    console.log('📋 Checking users table...');
    const usersCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (usersCheck.rows.length === 0) {
      console.log('   Creating users table...');
      await client.query(`
        CREATE TABLE users (
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
      console.log('   ✅ Users table created');
    } else {
      console.log('   ✅ Users table exists');
    }
    console.log('');

    // Create session_tokens table
    console.log('📋 Checking session_tokens table...');
    const sessionTokensCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'session_tokens'
    `);

    if (sessionTokensCheck.rows.length === 0) {
      console.log('   Creating session_tokens table...');
      await client.query(`
        CREATE TABLE session_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens(expires_at)`);

      console.log('   ✅ session_tokens table created with indexes');
    } else {
      console.log('   ✅ session_tokens table already exists');
    }
    console.log('');

    // Create api_tokens table
    console.log('📋 Checking api_tokens table...');
    const apiTokensCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'api_tokens'
    `);

    if (apiTokensCheck.rows.length === 0) {
      console.log('   Creating api_tokens table...');
      await client.query(`
        CREATE TABLE api_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          token TEXT NOT NULL UNIQUE,
          token_prefix TEXT NOT NULL,
          last_used_at TIMESTAMP,
          expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          revoked_at TIMESTAMP
        )
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id)`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_api_tokens_is_active ON api_tokens(is_active)`);

      console.log('   ✅ api_tokens table created with indexes');
    } else {
      console.log('   ✅ api_tokens table already exists');
    }
    console.log('');

    console.log('🎉 SUCCESS! Authentication tables are now in place.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your production server');
    console.log('2. Users can now log in and their sessions will persist');
    console.log('3. Projects and tasks should now load correctly');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixProductionAuth().catch(console.error);
