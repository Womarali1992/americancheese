import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

async function checkDatabaseState() {
  try {
    console.log('🔍 Checking database state...\n');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Available tables:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    console.log('\n📊 Data counts:');
    
    // Check projects
    try {
      const projects = await sql`SELECT COUNT(*) as count FROM projects`;
      console.log(`  Projects: ${projects[0].count}`);
      
      if (projects[0].count > 0) {
        const sampleProjects = await sql`SELECT id, name, status FROM projects LIMIT 3`;
        console.log('  Sample projects:');
        sampleProjects.forEach(p => console.log(`    - ${p.name} (ID: ${p.id}, Status: ${p.status})`));
      }
    } catch (e) {
      console.log('  Projects table: Error -', e.message);
    }
    
    // Check project_categories
    try {
      const categories = await sql`SELECT COUNT(*) as count FROM project_categories`;
      console.log(`  Project categories: ${categories[0].count}`);
      
      if (categories[0].count > 0) {
        const sampleCategories = await sql`SELECT name, type, project_id FROM project_categories LIMIT 5`;
        console.log('  Sample categories:');
        sampleCategories.forEach(c => console.log(`    - ${c.name} (${c.type}, Project: ${c.project_id})`));
      }
    } catch (e) {
      console.log('  Project categories table: Error -', e.message);
    }
    
    // Check tasks
    try {
      const tasks = await sql`SELECT COUNT(*) as count FROM tasks`;
      console.log(`  Tasks: ${tasks[0].count}`);
      
      if (tasks[0].count > 0) {
        const sampleTasks = await sql`SELECT title, project_id, tier1_category, tier2_category FROM tasks LIMIT 3`;
        console.log('  Sample tasks:');
        sampleTasks.forEach(t => console.log(`    - ${t.title} (Project: ${t.project_id}, Categories: ${t.tier1_category} > ${t.tier2_category})`));
      }
    } catch (e) {
      console.log('  Tasks table: Error -', e.message);
    }
    
    // Check if new categories table exists
    try {
      const newCategories = await sql`SELECT COUNT(*) as count FROM categories`;
      console.log(`  New categories: ${newCategories[0].count}`);
    } catch (e) {
      console.log('  New categories table: Does not exist');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await sql.end();
  }
}

checkDatabaseState();
