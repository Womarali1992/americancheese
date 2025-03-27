/**
 * Script to create tasks from all templates for each project
 * This will automatically create task instances from all 105 templates
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getAllTaskTemplates } from './shared/taskTemplates.js';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
import { projects, tasks } from './shared/schema.js';
const db = drizzle(queryClient, { schema: { projects, tasks } });

async function main() {
  try {
    console.log('Fetching all projects...');
    const allProjects = await db.select().from(projects);
    console.log(`Found ${allProjects.length} projects`);

    // Get all templates
    const taskTemplates = getAllTaskTemplates();
    console.log(`Found ${taskTemplates.length} task templates`);

    // For each project, create tasks from templates
    for (const project of allProjects) {
      console.log(`Processing project: ${project.name} (ID: ${project.id})`);
      
      // Check for existing tasks for this project
      const existingTasks = await db.select().from(tasks).where({ projectId: project.id });
      console.log(`Project has ${existingTasks.length} existing tasks`);

      // Track existing template IDs to avoid duplicates
      // The database column is 'template_id' but Drizzle maps it to 'templateId' in JS objects
      const existingTemplateIds = existingTasks
        .filter(task => task.templateId) // JS property is templateId (camelCase)
        .map(task => task.templateId);
      
      console.log(`Project has tasks from ${existingTemplateIds.length} templates already`);
      console.log(`Existing template IDs: ${JSON.stringify(existingTemplateIds.slice(0, 5))}...`);

      // Filter templates to only include those that don't already have tasks
      const templatesToCreate = taskTemplates.filter(
        template => !existingTemplateIds.includes(template.id)
      );
      
      console.log(`Creating ${templatesToCreate.length} new tasks from templates for this project`);

      // Create tasks from remaining templates
      for (const template of templatesToCreate) {
        const today = new Date().toISOString().split('T')[0]; // Today as YYYY-MM-DD
        const endDate = new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]; // Today + estimated duration

        const newTask = {
          title: template.title,
          description: template.description,
          status: "not_started",
          startDate: today,
          endDate: endDate,
          projectId: project.id,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          category: template.category,
          templateId: template.id,
          completed: false
        };

        // Insert the task
        await db.insert(tasks).values(newTask);
        console.log(`Created task from template ${template.id}: ${template.title}`);
      }

      console.log(`Completed task creation for project ${project.name}`);
    }

    console.log('Task creation completed successfully');
  } catch (error) {
    console.error('Error creating tasks from templates:', error);
  } finally {
    // Close the database connection
    await queryClient.end();
  }
}

// Execute the main function
main();