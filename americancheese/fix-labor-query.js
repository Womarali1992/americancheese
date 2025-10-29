/**
 * Script to debug labor queries and fix filtering issues
 */
import { db } from './server/db.js';
import { labor, tasks } from './shared/schema.js';
import { eq, inArray } from 'drizzle-orm';

async function main() {
  try {
    console.log("Debugging labor queries...");
    
    // Get all labor entries
    const allLabor = await db.query.labor.findMany();
    console.log(`Found ${allLabor.length} labor entries`);
    
    if (allLabor.length === 0) {
      console.log("No labor entries found.");
      return;
    }
    
    for (const laborEntry of allLabor) {
      console.log(`Labor entry ${laborEntry.id}:`);
      console.log(`  - Task ID: ${laborEntry.taskId}`);
      console.log(`  - Project ID: ${laborEntry.projectId}`);
      console.log(`  - Full Name: ${laborEntry.fullName}`);
      
      // Check if the task exists
      if (laborEntry.taskId) {
        const task = await db.query.tasks.findFirst({
          where: eq(tasks.id, laborEntry.taskId)
        });
        
        if (task) {
          console.log(`  - Associated with task: ${task.title} (ID: ${task.id})`);
        } else {
          console.log(`  - Task with ID ${laborEntry.taskId} not found in database!`);
        }
      } else {
        console.log(`  - No task ID assigned`);
      }
    }

    // Now test the API route logic directly by filtering labor for each task
    console.log("\nTesting /api/tasks/:taskId/labor route logic...");

    // Get all tasks that have labor assigned
    const tasksWithLabor = [...new Set(allLabor.map(l => l.taskId).filter(Boolean))];
    console.log(`Testing ${tasksWithLabor.length} tasks with labor assigned`);
    
    for (const taskId of tasksWithLabor) {
      console.log(`\nChecking labor for task ${taskId}:`);
      
      // Approach 1: Direct query where taskId equals the given taskId
      const directTaskLabor = await db.query.labor.findMany({
        where: eq(labor.taskId, taskId)
      });
      console.log(`  - Direct query found ${directTaskLabor.length} labor entries`);
      
      // Approach 2: Filter from all labor (how the component is trying to do it)
      const filteredLabor = allLabor.filter(l => l.taskId === taskId);
      console.log(`  - Filtering from all labor found ${filteredLabor.length} labor entries`);
      
      // Find the difference between approaches
      if (directTaskLabor.length !== filteredLabor.length) {
        console.log(`  - DISCREPANCY FOUND: direct query and filtering give different results!`);
      }
    }
    
  } catch (error) {
    console.error("Error debugging labor queries:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());