/**
 * Script to apply the preset_id column migration manually
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'americancheese',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
};

async function applyMigration() {
  const client = new Client(dbConfig);

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Checking if preset_id column exists...');
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'projects' AND column_name = 'preset_id';
    `;

    const result = await client.query(checkColumnQuery);

    if (result.rows.length > 0) {
      console.log('preset_id column already exists. Migration already applied.');
      return;
    }

    console.log('Applying migration: Adding preset_id column to projects table...');
    const migrationQuery = `
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS preset_id TEXT DEFAULT 'home-builder';
    `;

    await client.query(migrationQuery);
    console.log('Migration applied successfully!');

  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the migration
applyMigration().catch(console.error);
