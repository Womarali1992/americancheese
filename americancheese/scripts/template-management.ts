/**
 * Template Management CLI Script
 * 
 * This script provides command-line functionality for managing task templates
 * It uses the utility functions from utils/template-management.ts
 * 
 * Usage:
 *   npx tsx scripts/template-management.ts --migrate      # Migrate templates from source to database
 *   npx tsx scripts/template-management.ts --create [projectId]  # Create tasks from templates for a project
 *   npx tsx scripts/template-management.ts --reset [projectId]   # Reset template tasks for a project
 */

import { 
  migrateTemplatesToDatabase, 
  createTasksFromTemplates, 
  resetTaskTemplates 
} from '../utils/template-management';
import { db } from '../server/db';
import { projects } from '../shared/schema';

// Parse command line arguments
const args = process.argv.slice(2);
const shouldMigrate = args.includes('--migrate');
const shouldCreate = args.includes('--create');
const shouldReset = args.includes('--reset');

// Find project ID if provided
let projectId: number | null = null;
if (shouldCreate || shouldReset) {
  const projectIdArg = args.find(arg => !arg.startsWith('--'));
  if (projectIdArg) {
    projectId = parseInt(projectIdArg, 10);
  }
}

// Display help if no valid arguments provided
if (args.length === 0 || (args.includes('--help') || args.includes('-h'))) {
  console.log(`
Template Management Script

Options:
  --migrate             Migrate templates from source code to database
  --create [projectId]  Create tasks from templates for a specific project
  --reset [projectId]   Reset template tasks for a specific project
  --help, -h            Show this help message
  
Examples:
  npx tsx scripts/template-management.ts --migrate
  npx tsx scripts/template-management.ts --create 1
  npx tsx scripts/template-management.ts --reset 1
  `);
  process.exit(0);
}

async function main() {
  try {
    console.log('========== Template Management Script ==========');
    
    // Migrate templates if requested
    if (shouldMigrate) {
      console.log('\n===== Migrating templates from source code to database =====');
      const result = await migrateTemplatesToDatabase();
      
      if (result.success) {
        console.log(`✓ Successfully migrated templates to database`);
        console.log(`  Total templates: ${result.totalTemplates}`);
        console.log(`  Created: ${result.created}`);
        console.log(`  Updated: ${result.updated}`);
        console.log(`  Skipped: ${result.skipped}`);
        console.log(`  Tier1 categories: ${result.tier1Categories}`);
        console.log(`  Tier2 categories: ${result.tier2Categories}`);
      } else {
        console.error(`× Error during template migration: ${result.error}`);
      }
    }
    
    // Create tasks from templates for a project if requested
    if (shouldCreate) {
      if (!projectId) {
        // If no project ID was provided, list all projects
        console.log('\n===== Available Projects =====');
        const allProjects = await db.select().from(projects);
        
        if (allProjects.length === 0) {
          console.log('No projects found. Please create a project first.');
        } else {
          console.log('Project ID | Name | Location');
          console.log('-------------------------------');
          allProjects.forEach(project => {
            console.log(`${project.id} | ${project.name} | ${project.location}`);
          });
          console.log('\nRun the command again with a project ID: --create <projectId>');
        }
      } else {
        console.log(`\n===== Creating tasks from templates for project ${projectId} =====`);
        const result = await createTasksFromTemplates(projectId);
        
        if (result.success) {
          console.log(`✓ Successfully created tasks from templates`);
          console.log(`  Templates found: ${result.templatesFound}`);
          console.log(`  Tasks created: ${result.tasksCreated}`);
        } else {
          console.error(`× Error creating tasks from templates: ${result.error}`);
        }
      }
    }
    
    // Reset template tasks for a project if requested
    if (shouldReset) {
      if (!projectId) {
        // If no project ID was provided, list all projects
        console.log('\n===== Available Projects =====');
        const allProjects = await db.select().from(projects);
        
        if (allProjects.length === 0) {
          console.log('No projects found. Please create a project first.');
        } else {
          console.log('Project ID | Name | Location');
          console.log('-------------------------------');
          allProjects.forEach(project => {
            console.log(`${project.id} | ${project.name} | ${project.location}`);
          });
          console.log('\nRun the command again with a project ID: --reset <projectId>');
        }
      } else {
        console.log(`\n===== Resetting template tasks for project ${projectId} =====`);
        const result = await resetTaskTemplates(projectId);
        
        if (result.success) {
          console.log(`✓ Successfully reset template tasks`);
          console.log(`  Tasks deleted: ${result.tasksDeleted}`);
          console.log(`  Tasks created: ${result.tasksCreated}`);
        } else {
          console.error(`× Error resetting template tasks: ${result.error}`);
        }
      }
    }
    
    console.log('\n========== Template Management Complete ==========');
  } catch (error) {
    console.error('Error during template management:', error);
    process.exit(1);
  }
}

// Run the main function
main()
  .then(() => {
    console.log('Script execution completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error during script execution:', error);
    process.exit(1);
  });