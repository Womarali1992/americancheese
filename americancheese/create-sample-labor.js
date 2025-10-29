/**
 * Script to create sample labor entries for testing
 * This will add labor entries for each project's tasks
 */

import { db } from './server/db.js';
import { labor } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.log("Creating sample labor entries...");
    
    // Get all projects
    const projects = await db.query.projects.findMany();
    
    // Get all tasks
    const tasks = await db.query.tasks.findMany();
    
    // Get all contacts
    const contacts = await db.query.contacts.findMany();
    
    if (contacts.length === 0) {
      console.log("No contacts found. Please create contacts first.");
      return;
    }
    
    // Get existing labor
    const existingLabor = await db.query.labor.findMany();
    
    if (existingLabor.length > 0) {
      console.log(`Found ${existingLabor.length} existing labor entries. Skipping creation.`);
      return;
    }
    
    let createdCount = 0;
    
    // For each project
    for (const project of projects) {
      // Get tasks for this project
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      // Only process a few tasks per project (first 3 for testing)
      const tasksToProcess = projectTasks.slice(0, 3);
      
      console.log(`Processing ${tasksToProcess.length} tasks for project ${project.id} - ${project.name}`);
      
      for (const task of tasksToProcess) {
        // Create 1-2 labor entries per task
        const laborCount = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < laborCount; i++) {
          // Get a random contact
          const randomContact = contacts[Math.floor(Math.random() * contacts.length)];
          
          // Calculate random hours between 4 and 20
          const hours = (Math.floor(Math.random() * 16) + 4);
          
          // Calculate labor cost ($25-$75 per hour)
          const hourlyRate = Math.floor(Math.random() * 50) + 25;
          const laborCost = hours * hourlyRate;
          
          // Create today's date and a date 5 days in the future
          const today = new Date();
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 5);
          
          // Format dates as ISO strings but take only the date part
          const startDateStr = today.toISOString().split('T')[0];
          const endDateStr = futureDate.toISOString().split('T')[0];
          
          // Create the labor entry
          await db.insert(labor).values({
            fullName: randomContact.name,
            tier1Category: task.tier1Category || "Structural",
            tier2Category: task.tier2Category || "Framing",
            company: randomContact.company || "ABC Construction",
            phone: randomContact.phone,
            email: randomContact.email,
            projectId: project.id,
            taskId: task.id,
            contactId: randomContact.id,
            workDate: startDateStr,
            taskDescription: `Work on ${task.title}`,
            areaOfWork: task.category || "General",
            startDate: startDateStr,
            endDate: endDateStr,
            startTime: "08:00",
            endTime: "17:00",
            totalHours: hours,
            laborCost: laborCost,
            unitsCompleted: `${Math.floor(Math.random() * 100) + 50} sq ft`,
            materialIds: [],
            status: "in_progress"
          });
          
          createdCount++;
        }
      }
    }
    
    console.log(`Successfully created ${createdCount} labor entries.`);
    
  } catch (error) {
    console.error("Error creating sample labor:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());