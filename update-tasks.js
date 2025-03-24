// Update task templates in the database based on CSV data
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Extract Client from pg 
const { Client } = pg;

// Helper function to parse a CSV row into a task template object
function parseTaskFromCSV(row) {
  return {
    id: row.ID ? row.ID.trim() : '',
    title: row.Title ? row.Title.trim() : '',
    description: row.Description ? row.Description.trim() : '',
    tier1Category: row['Type (Tier 1 Category)'] ? row['Type (Tier 1 Category)'].trim().toLowerCase() : '',
    tier2Category: row['Category (Tier 2 Category) (1) 2'] ? row['Category (Tier 2 Category) (1) 2'].trim().toLowerCase() : '',
    // Extract category from the first word of the title
    category: row.Title ? row.Title.trim().split(' ')[0].toLowerCase() : 'general',
    // Default to 2 days if not a number
    estimatedDuration: 2
  };
}

// Function to fix categories for compatibility
function fixCategories(task) {
  // Fix category spellings
  if (task.tier1Category === 'seathing') {
    task.tier1Category = 'sheathing';
  }
  
  // Fix tier2Category names
  if (task.tier2Category === 'siding') {
    task.tier2Category = 'exteriors';
  }
  
  if (task.tier2Category === 'insulation') {
    task.tier2Category = 'barriers';
  }

  return task;
}

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
      
      // Load the CSV file
      const csvFilePath = path.join(__dirname, 'attached_assets', 'task templete.csv');
      console.log('Looking for CSV file at:', csvFilePath);
      const tasks = [];
      
      // Read the CSV file and process the data
      await new Promise((resolve, reject) => {
        createReadStream(csvFilePath)
          .pipe(csvParser())
          .on('data', (row) => {
            // Parse the row into a task template
            if (row.ID && row.Title) { // Skip empty rows
              const task = parseTaskFromCSV(row);
              // Fix category spellings
              const fixedTask = fixCategories(task);
              tasks.push(fixedTask);
              console.log(`Parsed task: ${fixedTask.id} - ${fixedTask.title}`);
            }
          })
          .on('end', () => {
            console.log(`Parsed ${tasks.length} tasks from CSV`);
            resolve();
          })
          .on('error', (error) => {
            reject(error);
          });
      });
      
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
            (title, description, status, start_date, end_date, project_id, completed, category, tier1_category, tier2_category) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
            task.tier2Category
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