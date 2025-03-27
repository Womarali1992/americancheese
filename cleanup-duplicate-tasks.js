/**
 * Script to clean up duplicate tasks from templates
 * This script will identify and remove duplicate tasks that were created from the same template
 */

import { db } from './server/db.js';
import { tasks } from './shared/schema.js';
import { eq, and, isNotNull } from 'drizzle-orm';

async function main() {
  console.log("Starting duplicate task cleanup...");
  
  // Get all tasks that have a template_id
  const allTasks = await db.select().from(tasks).where(isNotNull(tasks.template_id));
  console.log(`Found ${allTasks.length} tasks with template_id values`);
  
  // Group tasks by project and template
  const taskGroups = {};
  
  allTasks.forEach(task => {
    const key = `${task.project_id}:${task.template_id}`;
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
    const taskIdsToRemove = [];
    
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
  } else {
    console.log("No duplicate tasks found");
  }
}

main()
  .then(() => {
    console.log("Duplicate task cleanup completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during duplicate task cleanup:", error);
    process.exit(1);
  });