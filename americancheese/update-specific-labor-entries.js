/**
 * Script to update specific labor entries for tasks 3637, 3695, and 3671
 * These are the three tasks that should have labor entries visible
 */

import { db } from './server/db.js';
import { labor } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log("Updating specific labor entries...");
    
    // Define the specific task IDs that need labor entries
    const targetTaskIds = [3637, 3695, 3671];
    
    // Get existing labor entries
    const existingLabor = await db.query.labor.findMany();
    console.log(`Found ${existingLabor.length} labor entries`);
    
    if (existingLabor.length === 0) {
      console.log("No labor entries found. Please create labor entries first.");
      return;
    }
    
    // Update each entry to ensure it's properly associated with the right task
    let updatedCount = 0;
    
    // Update labor entry ID 4 to associate with task 3637
    const labor4 = existingLabor.find(l => l.id === 4);
    if (labor4) {
      console.log(`Updating labor ID 4 to associate with task 3637`);
      await db.update(labor)
        .set({ taskId: 3637 })
        .where(eq(labor.id, 4));
      updatedCount++;
    } else {
      console.log("Labor entry ID 4 not found");
    }
    
    // Update labor entry ID 2 to associate with task 3695
    const labor2 = existingLabor.find(l => l.id === 2);
    if (labor2) {
      console.log(`Updating labor ID 2 to associate with task 3695`);
      await db.update(labor)
        .set({ taskId: 3695 })
        .where(eq(labor.id, 2));
      updatedCount++;
    } else {
      console.log("Labor entry ID 2 not found");
    }
    
    // Update labor entry ID 3 to associate with task 3671
    const labor3 = existingLabor.find(l => l.id === 3);
    if (labor3) {
      console.log(`Updating labor ID 3 to associate with task 3671`);
      await db.update(labor)
        .set({ taskId: 3671 })
        .where(eq(labor.id, 3));
      updatedCount++;
    } else {
      console.log("Labor entry ID 3 not found");
    }
    
    console.log(`Successfully updated ${updatedCount} labor entries.`);
    
    // Check database after updates
    const updatedLabor = await db.query.labor.findMany();
    for (const entry of updatedLabor) {
      console.log(`Labor ID ${entry.id} - Task ID: ${entry.taskId}`);
    }
    
  } catch (error) {
    console.error("Error updating labor entries:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());