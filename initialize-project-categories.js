/**
 * Initialize categories for existing projects
 * Run this if projects load but have no categories
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

// Default category structure
const defaultCategories = {
  tier1: [
    { name: 'Structural', sortOrder: 1 },
    { name: 'Systems', sortOrder: 2 },
    { name: 'Sheathing', sortOrder: 3 },
    { name: 'Finishings', sortOrder: 4 }
  ],
  tier2: {
    'Structural': [
      { name: 'Foundation', sortOrder: 1 },
      { name: 'Framing', sortOrder: 2 }
    ],
    'Systems': [
      { name: 'Electrical', sortOrder: 1 },
      { name: 'Plumbing', sortOrder: 2 },
      { name: 'HVAC', sortOrder: 3 }
    ],
    'Sheathing': [
      { name: 'Exterior', sortOrder: 1 },
      { name: 'Interior', sortOrder: 2 }
    ],
    'Finishings': [
      { name: 'Flooring', sortOrder: 1 },
      { name: 'Paint', sortOrder: 2 },
      { name: 'Trim', sortOrder: 3 }
    ]
  }
};

async function initializeCategories() {
  try {
    console.log('🔍 Checking for projects without categories...\n');

    // Get all projects
    const projects = await pool.query('SELECT id, name FROM projects ORDER BY id');
    console.log(`Found ${projects.rows.length} total projects\n`);

    if (projects.rows.length === 0) {
      console.log('No projects found. Nothing to do.');
      return;
    }

    // Check each project for categories
    for (const project of projects.rows) {
      const catCount = await pool.query(
        'SELECT COUNT(*) as count FROM project_categories WHERE project_id = $1',
        [project.id]
      );

      const count = parseInt(catCount.rows[0].count);

      if (count === 0) {
        console.log(`📋 Project "${project.name}" (ID: ${project.id}) has NO categories. Initializing...`);

        // Insert tier1 categories
        for (const tier1 of defaultCategories.tier1) {
          const result = await pool.query(
            `INSERT INTO project_categories (project_id, name, type, sort_order, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             RETURNING id`,
            [project.id, tier1.name, 'tier1', tier1.sortOrder]
          );

          const tier1Id = result.rows[0].id;

          // Insert tier2 subcategories
          const tier2List = defaultCategories.tier2[tier1.name] || [];
          for (const tier2 of tier2List) {
            await pool.query(
              `INSERT INTO project_categories (project_id, name, type, parent_id, sort_order, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
              [project.id, tier2.name, 'tier2', tier1Id, tier2.sortOrder]
            );
          }
        }

        // Verify
        const newCount = await pool.query(
          'SELECT COUNT(*) as count FROM project_categories WHERE project_id = $1',
          [project.id]
        );
        console.log(`   ✅ Added ${newCount.rows[0].count} categories\n`);
      } else {
        console.log(`✅ Project "${project.name}" (ID: ${project.id}) already has ${count} categories`);
      }
    }

    console.log('\n🎉 Done! All projects now have categories.');
    console.log('\nNext steps:');
    console.log('1. Restart your server if not already done');
    console.log('2. Refresh the dashboard - categories should now appear!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initializeCategories();
