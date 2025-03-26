/**
 * Script to activate all task templates for all projects
 * This script will create tasks from all templates for every project in the system
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getAllTaskTemplates } from './shared/taskTemplates.js';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
import { projects, tasks } from './shared/schema.js';

// Create a Drizzle ORM instance
const db = drizzle(queryClient, { schema: { projects, tasks } });

async function main() {
  try {
    console.log('Starting task activation for all projects...');
    
    // Get all templates
    const allTemplates = getAllTaskTemplates();
    console.log(`Found ${allTemplates.length} task templates to process`);
    
    // Get all projects
    const allProjects = await db.select().from(projects);
    console.log(`Found ${allProjects.length} projects to process`);
    
    if (allProjects.length === 0) {
      console.log('No projects found, cannot add template tasks');
      return;
    }
    
    let totalTasksCreated = 0;
    
    // Process each project
    for (const project of allProjects) {
      console.log(`Processing project ${project.id}: ${project.name}`);
      
      // Get existing tasks for this project
      const existingTasks = await db.select().from(tasks).where(tasks.projectId.equals(project.id));
      
      // Track existing template IDs to avoid duplicates
      const existingTemplateIds = existingTasks
        .filter(task => task.templateId) // Using templateId as the JS property
        .map(task => task.templateId);
        
      console.log(`Project ${project.id} has tasks from ${existingTemplateIds.length} templates already`);
      
      // Filter templates to only include those that don't already have tasks
      const templatesToCreate = allTemplates.filter(
        template => !existingTemplateIds.includes(template.id)
      );
      
      console.log(`Creating ${templatesToCreate.length} new tasks from templates for project ${project.id}`);
      
      if (templatesToCreate.length === 0) {
        console.log(`Project ${project.id} already has all template tasks, skipping...`);
        continue;
      }
      
      // Use the project's start date for task dates
      const projectStartDate = new Date(project.startDate);
      
      // Create tasks from templates in a batch
      const taskBatch = templatesToCreate.map(template => {
        // Calculate end date by adding the estimated duration to the project's start date
        const taskEndDate = new Date(projectStartDate);
        taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
        
        return {
          title: template.title,
          description: template.description,
          status: "not_started",
          startDate: projectStartDate.toISOString().split('T')[0], // Use project start date
          endDate: taskEndDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          projectId: project.id,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          category: template.category,
          completed: false,
          assignedTo: null,
          contactIds: null,
          materialIds: null,
          materialsNeeded: null,
          templateId: template.id
        };
      });
      
      if (taskBatch.length > 0) {
        await db.insert(tasks).values(taskBatch);
        totalTasksCreated += taskBatch.length;
        console.log(`Created ${taskBatch.length} template tasks for project ${project.id}`);
      }
    }
    
    console.log(`Task activation completed successfully. Created ${totalTasksCreated} new tasks in total.`);
  } catch (error) {
    console.error('Error activating tasks from templates:', error);
  } finally {
    // Close the database connection
    await queryClient.end();
  }
}

// Execute the main function
main();