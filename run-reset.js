/**
 * Script to execute the task template reset directly
 * This bypasses the need for an HTTP request and calls the reset function directly
 */

// Import the database connection
import { db } from './server/db.js';
import { getAllTaskTemplates } from './shared/taskTemplates.js';
import { eq } from 'drizzle-orm';
import { tasks } from './shared/schema.js';

async function resetTemplates() {
  try {
    console.log('Starting direct task template reset...');

    // Step 1: Delete all template-based tasks (those with a templateId)
    console.log('Deleting existing template-based tasks...');
    const deleteResult = await db.delete(tasks)
      .where(
        // Only delete tasks that have a templateId (template-based tasks)
        tasks.templateId.isNotNull()
      );
    
    console.log(`Deleted template-based tasks`);

    // Step 2: Get all projects to create fresh template tasks for
    console.log('Getting list of projects...');
    const projects = await db.query.projects.findMany();
    console.log(`Found ${projects.length} projects`);

    // Step 3: Get all templates
    const templates = getAllTaskTemplates();
    console.log(`Found ${templates.length} task templates`);

    // Step 4: Create fresh tasks from templates for each project
    let createdCount = 0;
    const createdTasksByProject = {};

    for (const project of projects) {
      console.log(`Processing project: ${project.name} (ID: ${project.id})`);
      const projectCreatedCount = await createTasksFromTemplates(project.id, templates);
      createdCount += projectCreatedCount;
      createdTasksByProject[project.name] = projectCreatedCount;
    }

    console.log('✅ Template reset completed successfully!');
    console.log(`Created ${createdCount} fresh tasks from templates`);
    
    console.log('\nTasks created by project:');
    Object.entries(createdTasksByProject).forEach(([project, count]) => {
      console.log(`  - ${project}: ${count} tasks`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting task templates:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0); // Make sure to exit when done
  }
}

async function createTasksFromTemplates(projectId, templates) {
  let count = 0;
  
  try {
    for (const template of templates) {
      const newTask = {
        title: template.title,
        description: template.description,
        status: 'not_started',
        startDate: new Date().toISOString().split('T')[0], // Today
        endDate: new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today + duration
        projectId: projectId,
        category: template.category,
        tier1Category: template.tier1Category,
        tier2Category: template.tier2Category,
        templateId: template.id,
        completed: false
      };
      
      await db.insert(tasks).values(newTask);
      count++;
    }
    
    return count;
  } catch (error) {
    console.error(`Error creating tasks for project ${projectId}:`, error.message);
    throw error;
  }
}

// Execute the reset
resetTemplates();

// Export needed for ESM modules
export {};