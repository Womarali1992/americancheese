import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { projects, tasks, contacts, expenses, materials } from '../shared/schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in environment variables. Please add this secret in your deployment settings.');
}

// Create neon client and connect to DB (with the proper connection setup)
const sql = neon(databaseUrl);
// Configure the client with the proper pool setup
export const db = drizzle(sql, { schema: { projects, tasks, contacts, expenses, materials } });

// Export a function to initialize the database and create tables
export async function initDatabase() {
  try {
    console.log('Initializing database...');
    
    // Check if tables exist and create them if they don't
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'projects'
    `;
    
    const result = await sql(tableCheckQuery);
    
    if (result.length === 0) {
      console.log('Creating database tables...');
      
      // Create tables (We would normally use drizzle-kit for migrations, but this works for now)
      await sql`
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
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          project_id INTEGER NOT NULL,
          tier1_category TEXT NOT NULL DEFAULT 'Structural',
          tier2_category TEXT NOT NULL DEFAULT 'Foundation',
          category TEXT NOT NULL DEFAULT 'other',
          materials_needed TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status TEXT NOT NULL DEFAULT 'not_started',
          assigned_to TEXT,
          completed BOOLEAN DEFAULT FALSE,
          contact_ids TEXT[],
          material_ids TEXT[]
        )
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          company TEXT,
          phone TEXT,
          email TEXT,
          type TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          initials TEXT
        )
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS expenses (
          id SERIAL PRIMARY KEY,
          description TEXT NOT NULL,
          amount DOUBLE PRECISION NOT NULL,
          date DATE NOT NULL,
          category TEXT NOT NULL,
          project_id INTEGER NOT NULL,
          vendor TEXT,
          material_ids TEXT[],
          contact_ids TEXT[],
          status TEXT NOT NULL DEFAULT 'pending'
        )
      `;
      
      await sql`
        CREATE TABLE IF NOT EXISTS materials (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          quantity INTEGER NOT NULL,
          supplier TEXT,
          status TEXT NOT NULL DEFAULT 'ordered',
          project_id INTEGER NOT NULL,
          task_ids TEXT[],
          contact_ids TEXT[],
          unit TEXT,
          cost DOUBLE PRECISION
        )
      `;
      
      console.log('Database tables created successfully.');
    } else {
      console.log('Database tables already exist.');
    }
    
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}