/**
 * Migration script to add project_members table for project sharing
 */

export async function addProjectMembersTable(queryClient) {
  try {
    console.log('Checking for project_members table...');

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

    // Check if projects table has created_by column
    const createdByCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = 'created_by'
    `;

    const createdByResult = await queryClient.query(createdByCheckQuery);

    if (createdByResult.rows.length === 0) {
      console.log('Adding created_by column to projects table...');
      await queryClient.query(`
        ALTER TABLE projects
        ADD COLUMN created_by INTEGER REFERENCES users(id)
      `);
      console.log('created_by column added to projects table');
    } else {
      console.log('created_by column already exists in projects table');
    }

    // Check if project_members table already exists
    const tableCheckQuery = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'project_members'
    `;

    const result = await queryClient.query(tableCheckQuery);

    if (result.rows.length === 0) {
      console.log('Creating project_members table...');

      await queryClient.query(`
        CREATE TABLE project_members (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL DEFAULT 'viewer',
          invited_by INTEGER REFERENCES users(id),
          invited_email TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          invited_at TIMESTAMP NOT NULL DEFAULT NOW(),
          accepted_at TIMESTAMP
        )
      `);

      // Create index for faster lookups
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id)
      `);
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id)
      `);
      await queryClient.query(`
        CREATE INDEX IF NOT EXISTS idx_project_members_invited_email ON project_members(invited_email)
      `);

      console.log('Successfully created project_members table');
    } else {
      console.log('project_members table already exists');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating project_members table:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
