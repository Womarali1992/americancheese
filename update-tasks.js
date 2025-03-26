// Update task templates in the database based on CSV data
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// First run the CSV processor to update taskTemplates.ts file
console.log('Running CSV template processor...');
import('./process-csv-templates.js')
  .then(() => console.log('CSV templates processed successfully'))
  .catch(err => {
    console.error('Error processing CSV templates:', err);
    console.error('Stack trace:', err.stack);
  });

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Extract Client from pg 
const { Client } = pg;

async function updateTasks() {
  console.log('Connecting to database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');

    // First, get existing tasks to preserve ids
    const result = await client.query('SELECT id FROM tasks');
    const existingTaskIds = result.rows.map(row => row.id);
    
    if (existingTaskIds.length > 0) {
      console.log(`Found ${existingTaskIds.length} existing tasks`);
      
      // Import the updated taskTemplates after they've been processed
      const { getAllTaskTemplates } = await import('./shared/taskTemplates.js');
      const tasks = getAllTaskTemplates();
      
      // Delete existing tasks
      console.log('Deleting existing tasks...');
      await client.query('DELETE FROM tasks');
      console.log('Deleted existing tasks');
      
      // Reset the sequence
      await client.query(`ALTER SEQUENCE tasks_id_seq RESTART WITH 1`);
      
      // Insert new tasks
      console.log('Inserting new tasks...');
      for (const task of tasks) {
        if (task.id && task.title) {
          const query = `
            INSERT INTO tasks 
            (title, description, status, start_date, end_date, project_id, completed, category, tier1_category, tier2_category, template_id) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          `;
          
          const values = [
            task.title,
            task.description,
            'not_started',
            new Date().toISOString(),
            new Date(Date.now() + task.estimatedDuration * 24 * 60 * 60 * 1000).toISOString(),
            1, // Default project ID
            false,
            task.category,
            task.tier1Category,
            task.tier2Category,
            task.id // Store the template ID to identify template-based tasks
          ];
          
          await client.query(query, values);
          console.log(`Inserted task: ${task.title}`);
        }
      }
      
      console.log('Tasks updated successfully');
    } else {
      console.log('No existing tasks found');
    }
  } catch (error) {
    console.error('Error updating task templates:', error);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the update
updateTasks();