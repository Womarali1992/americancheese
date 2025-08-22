/**
 * Migration script to add color field to template_categories table
 */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function addColorToCategories() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Adding color field to template_categories table...');

    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'template_categories' 
      AND column_name = 'color';
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    if (rows.length === 0) {
      // The color column doesn't exist, add it
      const addColumnQuery = `
        ALTER TABLE template_categories
        ADD COLUMN color TEXT;
      `;
      
      await pool.query(addColumnQuery);
      console.log('Color field added to template_categories table successfully');
    } else {
      console.log('Color field already exists in template_categories table');
    }
  } catch (error) {
    console.error('Error adding color field to template_categories table:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
addColorToCategories();