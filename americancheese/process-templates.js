// Process CSV template file and update database
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Helper function to parse a CSV row into a task template object
function parseTaskFromCSV(row) {
  return {
    id: row.ID ? row.ID.trim() : '',
    title: row.Title ? row.Title.trim() : '',
    description: row.Description ? row.Description.trim() : '',
    tier1Category: row['Type (Tier 1 Category)'] ? row['Type (Tier 1 Category)'].trim().toLowerCase() : '',
    tier2Category: row['Category (Tier 2 Category) (1) 2'] ? row['Category (Tier 2 Category) (1) 2'].trim().toLowerCase() : '',
    // Extract category from the first word of the title or fallback to tier2 category
    category: row.Title ? 
      (row.Title.trim().split(' ')[0].toLowerCase() || 
       row['Category (Tier 2 Category) (1) 2'].trim().toLowerCase()) 
      : 'general',
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
  
  if (task.tier1Category === 'Seathing') {
    task.tier1Category = 'sheathing';
  }
  
  // Fix tier2Category names
  if (task.tier2Category === 'siding') {
    task.tier2Category = 'exteriors';
  }
  
  if (task.tier2Category === 'insulation') {
    task.tier2Category = 'barriers';
  }
  
  if (task.tier2Category === 'cabinentry') {
    task.tier2Category = 'cabinets';
  }

  return task;
}

async function processTemplates() {
  console.log('Starting template processing...');
  
  // Try both potential paths for the CSV file
  let csvFilePath = path.join(__dirname, 'attached_assets', 'tasktemplete.csv');
  if (!fs.existsSync(csvFilePath)) {
    csvFilePath = './attached_assets/tasktemplete.csv';
    console.log('Trying alternate path for CSV file:', csvFilePath);
  }
  console.log('Looking for CSV file at:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }
  
  const tasks = [];
  
  // Read the CSV file and process the data
  await new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Debug the row data 
        console.log('CSV row data:', row);
        
        // Parse the row into a task template
        if (row.ID && row.Title) { // Skip empty rows
          const task = parseTaskFromCSV(row);
          // Fix category spellings
          const fixedTask = fixCategories(task);
          tasks.push(fixedTask);
          console.log(`Parsed task: ${fixedTask.id} - ${fixedTask.title}`);
        } else {
          console.log('Skipping row - missing ID or Title:', row);
        }
      })
      .on('end', () => {
        console.log(`Parsed ${tasks.length} tasks from CSV`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      });
  });
  
  console.log('CSV processing completed!');
  
  // Connect to database and update tasks
  console.log('Connecting to database...');
  
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');

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
  } catch (error) {
    console.error('Error updating task templates:', error);
    console.error(error.stack);
  } finally {
    await client.end();
    console.log('Disconnected from database');
  }
}

// Run the process
processTemplates()
  .then(() => console.log('Template processing complete'))
  .catch(err => console.error('Error in template processing:', err));