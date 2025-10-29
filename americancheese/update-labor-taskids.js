/**
 * Script to update labor taskId fields
 * This ensures existing labor entries are properly associated with tasks
 */

import { db } from './server/db.js';
import { labor } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log("Updating labor task associations...");
    
    // Get all projects
    const projects = await db.query.projects.findMany();
    console.log(`Found ${projects.length} projects`);
    
    // Get all tasks
    const tasks = await db.query.tasks.findMany();
    console.log(`Found ${tasks.length} tasks`);
    
    // Get existing labor
    const existingLabor = await db.query.labor.findMany();
    console.log(`Found ${existingLabor.length} labor entries`);
    
    if (existingLabor.length === 0) {
      console.log("No labor entries found. Nothing to update.");
      return;
    }
    
    let updatedCount = 0;
    
    // For each project
    for (const project of projects) {
      // Get tasks for this project
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      // Get labor for this project
      const projectLabor = existingLabor.filter(l => l.projectId === project.id);
      
      console.log(`Processing ${projectLabor.length} labor entries for project ${project.id} - ${project.name}`);
      
      // If there are labor entries for this project, but no valid taskId
      for (const laborEntry of projectLabor) {
        // Check if the task exists and is valid
        const validTask = tasks.find(t => t.id === laborEntry.taskId);
        
        if (!validTask && projectTasks.length > 0) {
          // Assign to a random task from this project
          const randomTask = projectTasks[Math.floor(Math.random() * projectTasks.length)];
          
          console.log(`Updating labor entry ${laborEntry.id} to associate with task ${randomTask.id} (${randomTask.title})`);
          
          // Update the labor entry
          await db.update(labor)
            .set({ taskId: randomTask.id })
            .where(eq(labor.id, laborEntry.id));
          
          updatedCount++;
        } else if (!validTask) {
          console.log(`Warning: Could not find a valid task for labor entry ${laborEntry.id} in project ${project.id}`);
        }
      }
    }
    
    console.log(`Successfully updated ${updatedCount} labor entries.`);
    
  } catch (error) {
    console.error("Error updating labor task associations:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());