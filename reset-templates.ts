/**
 * Script to reset task templates for all projects
 * This script works directly with the database using Drizzle
 * 
 * To run: npx tsx reset-templates.ts
 */

import { db } from './server/db';
import { tasks } from './shared/schema';
import { getAllTaskTemplates } from './shared/taskTemplates';

async function resetTemplates() {
  try {
    console.log('Starting database task template reset...');

    // Step 1: Delete all template-based tasks
    console.log('Deleting existing template-based tasks...');
    await db.delete(tasks).where(
      // Filter where templateId is not null (meaning it's a template-based task)
      // We'll use the fact that we know template IDs are strings, so we check for not equals to null
      tasks.templateId.isNot(null)
    );
    console.log('Deleted existing template-based tasks');

    // Step 2: Get all projects
    console.log('Getting list of projects...');
    const projects = await db.query.projects.findMany();
    console.log(`Found ${projects.length} projects`);

    // Step 3: Get all templates
    const templates = getAllTaskTemplates();
    console.log(`Found ${templates.length} task templates`);

    // Step 4: Create fresh tasks from templates for each project
    let createdCount = 0;
    const createdTasksByProject: Record<string, number> = {};

    for (const project of projects) {
      console.log(`Processing project: ${project.name} (ID: ${project.id})`);
      let projectCreatedCount = 0;

      for (const template of templates) {
        const newTask = {
          title: template.title,
          description: template.description,
          status: 'not_started',
          startDate: new Date().toISOString().split('T')[0], // Today
          endDate: new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today + duration
          projectId: project.id,
          category: template.category,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          templateId: template.id,
          completed: false
        };
        
        await db.insert(tasks).values(newTask);
        projectCreatedCount++;
        createdCount++;
      }

      createdTasksByProject[project.name] = projectCreatedCount;
    }

    console.log('✅ Template reset completed successfully!');
    console.log(`Created ${createdCount} fresh tasks from templates`);
    
    console.log('\nTasks created by project:');
    Object.entries(createdTasksByProject).forEach(([project, count]) => {
      console.log(`  - ${project}: ${count} tasks`);
    });
    
  } catch (error) {
    console.error('❌ Error resetting task templates:', error);
  } finally {
    process.exit(0); // Make sure the script exits when done
  }
}

// Execute the reset
resetTemplates();