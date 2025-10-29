/**
 * Task Cleanup CLI Script
 * 
 * This script provides command-line functionality for cleaning up tasks
 * It uses the utility functions from utils/task-cleanup.ts
 * 
 * Usage:
 *   npx tsx scripts/cleanup-tasks.ts --duplicates   # Clean up duplicate tasks
 *   npx tsx scripts/cleanup-tasks.ts --orphaned     # Clean up orphaned tasks
 *   npx tsx scripts/cleanup-tasks.ts --all          # Clean up both duplicates and orphaned tasks
 *   npx tsx scripts/cleanup-tasks.ts --sql          # Print SQL queries for manual cleanup
 */

import { cleanupDuplicateTasks, cleanupOrphanedTasks, generateDuplicateCleanupSQL } from '../utils/task-cleanup';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldCleanupDuplicates = args.includes('--duplicates') || args.includes('--all');
const shouldCleanupOrphaned = args.includes('--orphaned') || args.includes('--all');
const shouldPrintSQL = args.includes('--sql');

// Display help if no valid arguments provided
if (args.length === 0 || (args.includes('--help') || args.includes('-h'))) {
  console.log(`
Task Cleanup Script

Options:
  --duplicates    Clean up duplicate tasks
  --orphaned      Clean up orphaned tasks
  --all           Clean up both duplicates and orphaned tasks
  --sql           Print SQL queries for manual cleanup
  --help, -h      Show this help message
  `);
  process.exit(0);
}

async function main() {
  try {
    console.log('========== Task Cleanup Script ==========');
    
    // Print SQL queries if requested
    if (shouldPrintSQL) {
      console.log('\n===== SQL Queries for Manual Cleanup =====');
      const sql = generateDuplicateCleanupSQL();
      
      console.log('\n-- STEP 1: Identify duplicate tasks');
      console.log(sql.identify);
      
      console.log('\n-- STEP 2: Delete duplicate tasks (after reviewing results from step 1)');
      console.log(sql.delete);
      
      console.log('\n-- STEP 3: Verify there are no more duplicates');
      console.log(sql.verify);
      
      console.log('\nThese queries can be executed manually in a database management tool.');
      console.log('Always review the results of STEP 1 before executing STEP 2.');
    }
    
    // Clean up duplicate tasks if requested
    if (shouldCleanupDuplicates) {
      console.log('\n===== Cleaning up duplicate tasks =====');
      const result = await cleanupDuplicateTasks();
      
      if (result.success) {
        console.log(`✓ Successfully removed ${result.removed} duplicate tasks`);
        if (result.removed > 0) {
          console.log(`Task IDs removed: ${result.taskIds.join(', ')}`);
        }
      } else {
        console.error(`× Error during duplicate task cleanup: ${result.error}`);
      }
    }
    
    // Clean up orphaned tasks if requested
    if (shouldCleanupOrphaned) {
      console.log('\n===== Cleaning up orphaned tasks =====');
      const result = await cleanupOrphanedTasks();
      
      if (result.success) {
        console.log(`✓ Successfully removed ${result.removed} orphaned tasks`);
        if (result.removed > 0) {
          console.log(`Task IDs removed: ${result.taskIds.join(', ')}`);
        }
      } else {
        console.error(`× Error during orphaned task cleanup: ${result.error}`);
      }
    }
    
    console.log('\n========== Task Cleanup Complete ==========');
  } catch (error) {
    console.error('Error during task cleanup:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script execution completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during script execution:', error);
    process.exit(1);
  });