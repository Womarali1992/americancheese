/**
 * Script to clean up duplicate tasks from templates
 * This script will identify and remove duplicate tasks that were created from the same template
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { desc, sql } from 'drizzle-orm';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
import { tasks } from './shared/schema.ts';
const db = drizzle(queryClient, { schema: { tasks } });

async function main() {
  try {
    console.log('Starting duplicate task cleanup...');
    
    // Get all tasks with template IDs
    const allTasks = await db.select().from(tasks).where(sql`template_id IS NOT NULL`);
    console.log(`Found ${allTasks.length} tasks with template IDs`);
    
    // Group tasks by project ID and template ID
    const taskGroups = {};
    
    allTasks.forEach(task => {
      const key = `${task.projectId}-${task.templateId}`;
      if (!taskGroups[key]) {
        taskGroups[key] = [];
      }
      taskGroups[key].push(task);
    });
    
    // Count how many duplicate groups we have
    const duplicateGroups = Object.keys(taskGroups).filter(key => taskGroups[key].length > 1);
    console.log(`Found ${duplicateGroups.length} groups with duplicate tasks`);
    
    // For each group with more than one task, keep only the newest one
    let deletedTasks = 0;
    
    for (const key of duplicateGroups) {
      const group = taskGroups[key];
      
      // Sort by ID descending (higher ID = newer task)
      group.sort((a, b) => b.id - a.id);
      
      // Keep the first (newest) task, delete the rest
      const [keep, ...duplicates] = group;
      
      console.log(`Keeping task ID ${keep.id} (${keep.title}) from template ${keep.templateId}`);
      console.log(`Deleting ${duplicates.length} duplicate tasks: ${duplicates.map(d => d.id).join(', ')}`);
      
      // Delete duplicate tasks
      for (const dup of duplicates) {
        await db.delete(tasks).where(sql`id = ${dup.id}`);
        deletedTasks++;
      }
    }
    
    console.log(`Cleanup completed successfully. Deleted ${deletedTasks} duplicate tasks.`);
  } catch (error) {
    console.error('Error cleaning up duplicate tasks:', error);
  } finally {
    // Close the database connection
    await queryClient.end();
  }
}

// Execute the main function
main();