/**
 * Migration script to add session_tokens and api_tokens tables for authentication
 */

export async function addAuthTokensTables(queryClient) {
  try {
    console.log('Checking for authentication token tables...');

    // First, ensure users table exists (required for foreign keys)
    const usersCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    `;

    const usersResult = await queryClient.query(usersCheckQuery);

    if (usersResult.rows.length === 0) {
      console.log('Creating users table...');
      await queryClient.query(`
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
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
    }

    // Check if session_tokens table already exists
    const sessionTokensCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'session_tokens'
    `;

    const sessionTokensResult = await queryClient.query(sessionTokensCheckQuery);

    if (sessionTokensResult.rows.length === 0) {
      console.log('Creating session_tokens table...');

      await queryClient.query(`
        CREATE TABLE session_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);

      // Create indexes for faster lookups
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token)
      `);
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id)
      `);
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens(expires_at)
      `);

      console.log('Successfully created session_tokens table');
    } else {
      console.log('session_tokens table already exists');
    }

    // Check if api_tokens table already exists
    const apiTokensCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'api_tokens'
    `;

    const apiTokensResult = await queryClient.query(apiTokensCheckQuery);

    if (apiTokensResult.rows.length === 0) {
      console.log('Creating api_tokens table...');

      await queryClient.query(`
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

      // Create indexes for faster lookups
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token)
      `);
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id)
      `);
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_api_tokens_is_active ON api_tokens(is_active)
      `);

      console.log('Successfully created api_tokens table');
    } else {
      console.log('api_tokens table already exists');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating authentication token tables:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
