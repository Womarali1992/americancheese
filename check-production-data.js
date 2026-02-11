/**
 * Production Diagnostic Script
 * Checks why categories and tasks aren't loading
 */

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkProductionData() {
  try {
    console.log('🔍 Checking production database...\n');

    // 1. Check which tables exist
    console.log('📋 Checking tables...');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('projects', 'project_categories', 'template_categories', 'tasks', 'task_categories')
      ORDER BY table_name
    `);

    console.log('   Existing tables:');
    const existingTables = tables.rows.map(r => r.table_name);
    existingTables.forEach(t => console.log('   ✅', t));

    const missingTables = ['projects', 'project_categories', 'template_categories', 'tasks', 'task_categories']
      .filter(t => !existingTables.includes(t));
    if (missingTables.length > 0) {
      console.log('\n   ❌ Missing tables:');
      missingTables.forEach(t => console.log('   ❌', t));
    }
    console.log('');

    // 2. Check projects
    if (existingTables.includes('projects')) {
      const projectCount = await pool.query('SELECT COUNT(*) as count FROM projects');
      console.log('📊 Projects:', projectCount.rows[0].count);

      if (projectCount.rows[0].count > 0) {
        const sampleProject = await pool.query('SELECT id, name, status FROM projects LIMIT 1');
        console.log('   Sample:', sampleProject.rows[0]);
      }
      console.log('');
    }

    // 3. Check project_categories
    if (existingTables.includes('project_categories')) {
      const catCount = await pool.query('SELECT COUNT(*) as count FROM project_categories');
      console.log('📊 Project Categories:', catCount.rows[0].count);

      if (catCount.rows[0].count > 0) {
        const sample = await pool.query(`
          SELECT project_id, name, type, parent_id
          FROM project_categories
          LIMIT 3
        `);
        console.log('   Sample categories:');
        sample.rows.forEach(r => console.log('   -', r));
      } else {
        console.log('   ⚠️  No categories found! This is likely the issue.');
      }
      console.log('');
    } else {
      console.log('❌ project_categories table is MISSING!\n');
    }

    // 4. Check tasks
    if (existingTables.includes('tasks')) {
      const taskCount = await pool.query('SELECT COUNT(*) as count FROM tasks');
      console.log('📊 Tasks:', taskCount.rows[0].count);

      if (taskCount.rows[0].count > 0) {
        const sample = await pool.query(`
          SELECT id, title, project_id, tier1_category, tier2_category
          FROM tasks
          LIMIT 3
        `);
        console.log('   Sample tasks:');
        sample.rows.forEach(r => console.log(`   - [${r.id}] ${r.title} (${r.tier1_category}/${r.tier2_category})`));

        // Check if tasks have valid categories
        const invalidCats = await pool.query(`
          SELECT COUNT(*) as count FROM tasks
          WHERE tier1_category IS NULL OR tier2_category IS NULL
        `);
        if (parseInt(invalidCats.rows[0].count) > 0) {
          console.log(`   ⚠️  ${invalidCats.rows[0].count} tasks have NULL categories`);
        }
      }
      console.log('');
    }

    // 5. Check task_categories junction table
    if (existingTables.includes('task_categories')) {
      const junctionCount = await pool.query('SELECT COUNT(*) as count FROM task_categories');
      console.log('📊 Task-Category Links:', junctionCount.rows[0].count);
      console.log('');
    }

    // 6. Suggest fixes
    console.log('🔧 DIAGNOSIS:\n');

    if (!existingTables.includes('project_categories')) {
      console.log('❌ ISSUE: project_categories table is missing');
      console.log('   FIX: Run database migrations');
      console.log('   Command: cd americancheese && npm run db:push\n');
    } else {
      const catCount = await pool.query('SELECT COUNT(*) as count FROM project_categories');
      if (parseInt(catCount.rows[0].count) === 0) {
        console.log('❌ ISSUE: project_categories table exists but is empty');
        console.log('   This means projects have no categories defined');
        console.log('   FIX: You need to initialize categories for each project\n');
        console.log('   Would you like me to create a script to populate categories?');
      }
    }

    if (existingTables.includes('tasks')) {
      const taskCount = await pool.query('SELECT COUNT(*) as count FROM tasks');
      if (parseInt(taskCount.rows[0].count) === 0) {
        console.log('ℹ️  No tasks exist yet - this is normal for a new project\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

checkProductionData();
