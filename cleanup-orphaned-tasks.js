/**
 * Script to clean up orphaned tasks
 * 
 * This script identifies and deletes tasks that are not associated with any existing project.
 * These orphaned tasks can occur when a project is deleted but its tasks remain in the database.
 */

const { db } = require('./server/db');
const { tasks, projects } = require('./shared/schema');
const { eq, sql, not, inArray } = require('drizzle-orm');

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
      // If we have projects, find tasks whose projectId is not in the list
      orphanedTasks = await db
        .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title })
        .from(tasks)
        .where(not(inArray(tasks.projectId, projectIds)));
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
    await db.delete(tasks).where(inArray(tasks.id, orphanedTaskIds));

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
module.exports = {
  cleanupOrphanedTasks
};

// Allow this script to be run directly
if (require.main === module) {
  (async () => {
    try {
      console.log('Starting orphaned task cleanup...');
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
    } finally {
      process.exit(0);
    }
  })();
}