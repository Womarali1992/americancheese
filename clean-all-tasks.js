/**
 * Script to clean up all tasks from the database
 * This script will delete all tasks from the database, giving you a clean slate
 */

// Use ES module imports as the project is configured with "type": "module"
import { db } from './server/db.js';
import { tasks } from './shared/schema.js';

async function main() {
  console.log('Starting task cleanup process...');
  
  try {
    // Delete all tasks from the database
    const deletedTasks = await db.delete(tasks);
    
    console.log('All tasks have been deleted from the database.');
    console.log('You can now start fresh with manually created tasks.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error deleting tasks:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});