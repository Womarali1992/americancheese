import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import {
  projects,
  tasks,
  contacts,
  expenses,
  materials,
  taskAttachments,
  labor,
  categoryTemplates,
  projectCategories,
  taskTemplates as dbTaskTemplates,
  globalSettings,
  subtasks,
  checklistItems,
  checklistItemComments,
  subtaskComments,
  sectionStates,
  sectionComments,
  users,
  projectMembers,
  sessionTokens,
  apiTokens,
  projectMemberAuditLog,
  rateLimits
} from '../shared/schema';

// Get database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10,
  min: 0,
  idleTimeoutMillis: 30000
};

if (!dbConfig.password) {
  console.warn('DB_PASSWORD is not defined in environment variables. The application will start with limited functionality.');
}

// Create a PostgreSQL client with robust error handling
let queryClient: any;
let db: any;

if (dbConfig.password && dbConfig.password !== 'password') {
  try {
    queryClient = new Pool(dbConfig);
    
    // Create drizzle database instance
    db = drizzle(queryClient, {
      schema: {
        projects,
        tasks,
        contacts,
        expenses,
        materials,
        taskAttachments,
        labor,
        categoryTemplates,
        projectCategories,
        taskTemplates: dbTaskTemplates,
        globalSettings,
        subtasks,
        checklistItems,
        checklistItemComments,
        subtaskComments,
        sectionStates,
        sectionComments,
        users,
        projectMembers,
        sessionTokens,
        apiTokens,
        projectMemberAuditLog,
        rateLimits
      }
    });
    
    console.log('Database connection established successfully.');
    console.log('DB Config:', { host: dbConfig.host, port: dbConfig.port, database: dbConfig.database, user: dbConfig.user });
  } catch (error) {
    console.error('Failed to establish database connection:', error);
    console.warn('The application will start with limited functionality.');
  }
} else {
  console.warn('PostgreSQL not configured. The application will start in demo mode without database functionality.');
  console.log('To enable database features:');
  console.log('1. Install PostgreSQL');
  console.log('2. Create a database named "project_management"');  
  console.log('3. Set the correct DB_PASSWORD in your .env file');
}

// Export the database instance
export { db };

// Import migrations
import { addSelectedTemplatesField } from './migrations/add-selected-templates.js';
import { addTaskTimeFields } from './migrations/add-task-time-fields.js';
import { addCalendarScheduleFields } from './migrations/add-calendar-schedule-fields.js';
import { addReferencedTaskIdsField } from './migrations/add-referenced-task-ids.js';
import { addProjectMembersTable } from './migrations/add-project-members.js';
import { addContactsCreatedBy } from './migrations/add-contacts-created-by.js';
import { addCategoryContext } from './migrations/add-category-context.js';
import { addAuthTokensTables } from './migrations/add-auth-tokens.js';
import { addRecurringCalendarFields } from './migrations/add-recurring-calendar-fields.js';
import { addSecurityTables } from './migrations/add-security-tables.js';

// Export a function to initialize the database and create tables
export async function initDatabase() {
  if (!queryClient) {
    console.log('Database not connected. Skipping database initialization.');
    return;
  }
  
  try {
    console.log('Initializing database...');
    
    // Check if tables exist and create them if they don't
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'projects'
    `;
    
    const result = await queryClient.query(tableCheckQuery);
    
    if (result.rows.length === 0) {
      console.log('Creating database tables...');
      
      // Create tables (We would normally use drizzle-kit for migrations, but this works for now)
      await queryClient.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          location TEXT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          progress INTEGER NOT NULL DEFAULT 0,
          hidden_categories TEXT[]
        )
      `);
      
      await queryClient.query(`
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
          material_ids TEXT[],
          template_id TEXT,
          estimated_cost DOUBLE PRECISION,
          actual_cost DOUBLE PRECISION
        )
      `);
      
      await queryClient.query(`
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
      `);
      
      await queryClient.query(`
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
      `);
      
      await queryClient.query(`
        CREATE TABLE IF NOT EXISTS materials (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          tier TEXT NOT NULL DEFAULT 'structural',
          tier2category TEXT,
          section TEXT,
          subsection TEXT,
          quantity INTEGER NOT NULL,
          supplier TEXT,
          supplier_id INTEGER,
          status TEXT NOT NULL DEFAULT 'ordered',
          is_quote BOOLEAN DEFAULT FALSE,
          project_id INTEGER NOT NULL,
          task_ids TEXT[],
          contact_ids TEXT[],
          unit TEXT,
          cost DOUBLE PRECISION,
          details TEXT,
          quote_date DATE,
          order_date DATE
        )
      `);
      
      await queryClient.query(`
        CREATE TABLE IF NOT EXISTS task_attachments (
          id SERIAL PRIMARY KEY,
          task_id INTEGER NOT NULL,
          file_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          file_content TEXT NOT NULL,
          uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
          notes TEXT,
          type TEXT NOT NULL DEFAULT 'document'
        )
      `);
      
      await queryClient.query(`
        CREATE TABLE IF NOT EXISTS labor (
          id SERIAL PRIMARY KEY,
          full_name TEXT NOT NULL,
          tier1_category TEXT NOT NULL,
          tier2_category TEXT NOT NULL,
          company TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          project_id INTEGER NOT NULL,
          task_id INTEGER,
          contact_id INTEGER,
          work_date DATE NOT NULL,
          task_description TEXT,
          area_of_work TEXT,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          start_time TEXT,
          end_time TEXT,
          total_hours DOUBLE PRECISION,
          labor_cost DOUBLE PRECISION,
          units_completed TEXT,
          material_ids TEXT[],
          status TEXT NOT NULL DEFAULT 'pending'
        )
      `);
      
      // Create admin tables for task templates and categories
      await queryClient.query(`
        CREATE TABLE IF NOT EXISTS template_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          parent_id INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      await queryClient.query(`
        CREATE TABLE IF NOT EXISTS task_templates (
          id SERIAL PRIMARY KEY,
          template_id TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          tier1_category_id INTEGER NOT NULL,
          tier2_category_id INTEGER NOT NULL,
          estimated_duration INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      console.log('Database tables created successfully.');
    } else {
      console.log('Database tables already exist.');
    }
    
    // Run migrations
    await addAuthTokensTables(queryClient); // Critical: Must run first for authentication
    await addSelectedTemplatesField(queryClient);
    await addTaskTimeFields(queryClient);
    await addCalendarScheduleFields(queryClient);
    await addReferencedTaskIdsField(queryClient);
    await addProjectMembersTable(queryClient);
    await addContactsCreatedBy(queryClient);
    await addCategoryContext(queryClient);
    await addRecurringCalendarFields(queryClient);
    await addSecurityTables(queryClient); // Security: audit logging and rate limiting

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}