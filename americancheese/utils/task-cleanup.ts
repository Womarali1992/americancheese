/**
 * Task Cleanup Utilities
 * 
 * This file contains utility functions for cleaning up and managing tasks,
 * including duplicate removal and orphaned task management.
 */

import { db } from '../server/db';
import { tasks } from '../shared/schema';
import { eq, and, isNotNull, sql } from 'drizzle-orm';

/**
 * Cleans up duplicate tasks that were created from the same template
 * Identifies and removes duplicate tasks (keeping only the first instance)
 * 
 * @returns {Promise<{success: boolean, removed: number, taskIds: number[], error?: string}>}
 */
export async function cleanupDuplicateTasks() {
  try {
    console.log("Starting duplicate task cleanup...");
    
    // Get all tasks that have a template_id
    const allTasks = await db.select().from(tasks).where(isNotNull(tasks.templateId));
    console.log(`Found ${allTasks.length} tasks with template_id values`);
    
    // Group tasks by project and template
    const taskGroups: Record<string, any[]> = {};
    
    allTasks.forEach(task => {
      const key = `${task.projectId}:${task.templateId}`;
      if (!taskGroups[key]) {
        taskGroups[key] = [];
      }
      taskGroups[key].push(task);
    });
    
    // Count duplicates
    let totalDuplicates = 0;
    Object.keys(taskGroups).forEach(key => {
      const group = taskGroups[key];
      if (group.length > 1) {
        totalDuplicates += (group.length - 1);
        console.log(`Found ${group.length} duplicates for project:template ${key}`);
      }
    });
    
    console.log(`Total duplicate tasks to remove: ${totalDuplicates}`);
    
    // Remove duplicates, keeping only the first task in each group
    if (totalDuplicates > 0) {
      const taskIdsToRemove: number[] = [];
      
      Object.keys(taskGroups).forEach(key => {
        const group = taskGroups[key];
        if (group.length > 1) {
          // Keep the first task (index 0), remove the rest
          for (let i = 1; i < group.length; i++) {
            taskIdsToRemove.push(group[i].id);
          }
        }
      });
      
      console.log(`Removing ${taskIdsToRemove.length} duplicate tasks...`);
      console.log('Task IDs to remove:', taskIdsToRemove);
      
      // Delete the duplicate tasks
      if (taskIdsToRemove.length > 0) {
        for (const id of taskIdsToRemove) {
          await db.delete(tasks).where(eq(tasks.id, id));
          console.log(`Deleted task ID ${id}`);
        }
      }
      
      console.log(`Successfully removed ${taskIdsToRemove.length} duplicate tasks`);
      return {
        success: true,
        removed: taskIdsToRemove.length,
        taskIds: taskIdsToRemove
      };
    } else {
      console.log("No duplicate tasks found");
      return {
        success: true,
        removed: 0,
        taskIds: []
      };
    }
  } catch (error) {
    console.error("Error during duplicate task cleanup:", error);
    return {
      success: false,
      removed: 0,
      taskIds: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Generates SQL queries for cleaning up duplicate tasks
 * This can be used when a more cautious approach is needed
 * 
 * @returns {Object} SQL queries for identifying and cleaning up duplicate tasks
 */
export function generateDuplicateCleanupSQL() {
  return {
    identify: `
WITH duplicates AS (
  SELECT 
    id, 
    template_id, 
    project_id,
    ROW_NUMBER() OVER(PARTITION BY template_id, project_id ORDER BY id) as row_num
  FROM tasks
  WHERE template_id IS NOT NULL
)
SELECT id, template_id, project_id 
FROM duplicates 
WHERE row_num > 1
ORDER BY template_id, project_id;
`,
    delete: `
DELETE FROM tasks
WHERE id IN (
  WITH duplicates AS (
    SELECT 
      id, 
      template_id, 
      project_id,
      ROW_NUMBER() OVER(PARTITION BY template_id, project_id ORDER BY id) as row_num
    FROM tasks
    WHERE template_id IS NOT NULL
  )
  SELECT id FROM duplicates WHERE row_num > 1
);
`,
    verify: `
SELECT template_id, project_id, COUNT(*) as count
FROM tasks
WHERE template_id IS NOT NULL
GROUP BY template_id, project_id
HAVING COUNT(*) > 1;
`
  };
}

/**
 * Finds and removes tasks that are orphaned (not associated with any existing project)
 * 
 * @returns {Promise<{success: boolean, removed: number, taskIds: number[], error?: string}>}
 */
export async function cleanupOrphanedTasks() {
  try {
    console.log("Starting orphaned task cleanup...");
    
    // Get all projects to check against
    const projects = await db.select({ id: tasks.projectId }).from(tasks).groupBy(tasks.projectId);
    const projectIds = projects.map(p => p.id);
    
    console.log(`Found ${projectIds.length} distinct project IDs`);
    
    // Find orphaned tasks (tasks with project_id that doesn't exist)
    const orphanedTasks = await db.select().from(tasks).where(
      sql`${tasks.projectId} NOT IN (${projectIds.join(',')})`
    );
    
    console.log(`Found ${orphanedTasks.length} orphaned tasks`);
    
    // Remove the orphaned tasks
    if (orphanedTasks.length > 0) {
      const taskIdsToRemove = orphanedTasks.map(task => task.id);
      
      console.log(`Removing ${taskIdsToRemove.length} orphaned tasks...`);
      console.log('Task IDs to remove:', taskIdsToRemove);
      
      // Delete the orphaned tasks
      for (const id of taskIdsToRemove) {
        await db.delete(tasks).where(eq(tasks.id, id));
        console.log(`Deleted orphaned task ID ${id}`);
      }
      
      console.log(`Successfully removed ${taskIdsToRemove.length} orphaned tasks`);
      return {
        success: true,
        removed: taskIdsToRemove.length,
        taskIds: taskIdsToRemove
      };
    } else {
      console.log("No orphaned tasks found");
      return {
        success: true,
        removed: 0,
        taskIds: []
      };
    }
  } catch (error) {
    console.error("Error during orphaned task cleanup:", error);
    return {
      success: false,
      removed: 0,
      taskIds: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}