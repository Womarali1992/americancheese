/**
 * Script to clean up orphaned tasks
 * 
 * This script identifies and deletes tasks that are not associated with any existing project.
 * These orphaned tasks can occur when a project is deleted but its tasks remain in the database.
 */

import { db } from './server/db.js';
import { tasks, projects } from './shared/schema.js';
import { eq, sql, not, inArray } from 'drizzle-orm';

/**
 * Finds and removes tasks that are orphaned (not associated with any existing project)
 * @returns {Promise<{success: boolean, removed: number, taskIds: number[], error?: string}>}
 */
async function cleanupOrphanedTasks() {
  try {
    // Get all existing project IDs
    const existingProjects = await db.select({ id: projects.id }).from(projects);
    const projectIds = existingProjects.map(project => project.id);

    // Find tasks that have a projectId that doesn't exist in the projects table
    let orphanedTasks = [];
    
    if (projectIds.length > 0) {
      try {
        // If we have projects, find tasks whose projectId is not in the list
        orphanedTasks = await db
          .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title })
          .from(tasks)
          .where(
            sql`${tasks.projectId} NOT IN (${projectIds.join(',')})`
          );
      } catch (queryError) {
        console.error('Query error:', queryError);
        // Fallback using simpler query
        const allTasks = await db
          .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title })
          .from(tasks);
        
        orphanedTasks = allTasks.filter(task => !projectIds.includes(task.projectId));
      }
    } else {
      // If no projects exist, all tasks are orphaned
      orphanedTasks = await db
        .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title })
        .from(tasks);
    }

    // Extract the IDs of orphaned tasks
    const orphanedTaskIds = orphanedTasks.map(task => task.id);
    
    // If there are no orphaned tasks, return early
    if (orphanedTaskIds.length === 0) {
      return {
        success: true,
        removed: 0,
        taskIds: []
      };
    }

    // Delete the orphaned tasks
    if (orphanedTaskIds.length > 0) {
      try {
        // Use SQL query for deleting tasks with specific IDs
        await db.delete(tasks).where(
          sql`${tasks.id} IN (${orphanedTaskIds.join(',')})`
        );
      } catch (deleteError) {
        console.error('Delete query error:', deleteError);
        // Delete each task individually as fallback
        for (const taskId of orphanedTaskIds) {
          await db.delete(tasks).where(eq(tasks.id, taskId));
        }
      }
    }

    // Return the count and IDs of removed tasks
    return {
      success: true,
      removed: orphanedTaskIds.length,
      taskIds: orphanedTaskIds
    };
  } catch (error) {
    console.error('Error cleaning up orphaned tasks:', error);
    return {
      success: false,
      removed: 0,
      taskIds: [],
      error: error.message || String(error)
    };
  }
}

// Export the function for use in the API
export { cleanupOrphanedTasks };

// Run the script directly
console.log('Starting orphaned task cleanup...');
try {
  const result = await cleanupOrphanedTasks();
  
  if (result.success) {
    console.log(`Successfully removed ${result.removed} orphaned tasks`);
    if (result.removed > 0) {
      console.log('Task IDs:', result.taskIds);
    }
  } else {
    console.error('Failed to clean up orphaned tasks:', result.error);
  }
} catch (error) {
  console.error('Error running cleanup script:', error);
}