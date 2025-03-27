/**
 * Script to clean up orphaned tasks
 * 
 * This script will:
 * 1. Delete all tasks that are not associated with any existing project
 * 2. Provide a summary of how many tasks were removed
 */

import { db } from './server/db.js';
import { tasks, projects } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function cleanupOrphanedTasks() {
  try {
    console.log('Starting cleanup of orphaned tasks...');
    
    // Get all existing projects
    const allProjects = await db.select().from(projects);
    const projectIds = allProjects.map(project => project.id);
    
    // Get all tasks
    const allTasks = await db.select().from(tasks);
    console.log(`Found ${allTasks.length} total tasks in the database`);
    
    if (projectIds.length === 0) {
      console.log('No projects exist, all tasks are orphaned');
      
      // Delete all tasks since there are no projects
      const deletedCount = await db.delete(tasks).returning();
      console.log(`Deleted ${deletedCount.length} orphaned tasks from the database`);
      
      return {
        success: true,
        deletedCount: deletedCount.length,
        message: 'All tasks have been removed since no projects exist'
      };
    }
    
    // Find tasks that have projectId not in the list of valid project IDs
    const orphanedTasks = allTasks.filter(task => !projectIds.includes(task.projectId));
    console.log(`Found ${orphanedTasks.length} orphaned tasks with no valid project`);
    
    if (orphanedTasks.length === 0) {
      console.log('No orphaned tasks found, all tasks have valid project IDs');
      return {
        success: true,
        deletedCount: 0,
        message: 'No orphaned tasks found'
      };
    }
    
    // Delete orphaned tasks one by one
    let deletedCount = 0;
    for (const task of orphanedTasks) {
      await db.delete(tasks).where(eq(tasks.id, task.id));
      deletedCount++;
      
      if (deletedCount % 10 === 0) {
        console.log(`Deleted ${deletedCount} out of ${orphanedTasks.length} orphaned tasks...`);
      }
    }
    
    console.log(`Successfully deleted ${deletedCount} orphaned tasks`);
    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} orphaned tasks`
    };
    
  } catch (error) {
    console.error('Error cleaning up orphaned tasks:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to clean up orphaned tasks'
    };
  }
}

// Execute the cleanup function
cleanupOrphanedTasks()
  .then(result => {
    console.log('Cleanup completed!');
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error during cleanup:', error);
    process.exit(1);
  });