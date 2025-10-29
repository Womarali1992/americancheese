/**
 * Script to restore missing siding and insulation tasks
 * The cleanup of duplicate tasks removed some entries that need to be recreated
 */

import { db } from './server/db';
import { tasks } from './shared/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
  console.log('Starting restoration of missing tasks');
  
  // Task templates to recreate - based on taskTemplates.ts
  const sidingTemplates = [
    { id: 'SC1', title: 'Select Siding materials, color, and style; conduct bidding. (SC1)', category: 'siding', tier1Category: 'sheathing', tier2Category: 'siding' },
    { id: 'SC2', title: 'Order Windows/doors; verify dimensions and install correctly. (SC2)', category: 'siding', tier1Category: 'sheathing', tier2Category: 'siding' },
    { id: 'SC3', title: 'Oversee Siding install, trim, caulking, inspection, and payments. (SC3)', category: 'siding', tier1Category: 'sheathing', tier2Category: 'siding' },
    { id: 'SC4', title: 'Install Siding cornice; inspect, fix issues, and release retainage. (SC4)', category: 'siding', tier1Category: 'sheathing', tier2Category: 'siding' },
    { id: 'SC5', title: 'Arrange Siding trim painting and caulking. (SC5)', category: 'siding', tier1Category: 'sheathing', tier2Category: 'siding' }
  ];
  
  const insulationTemplates = [
    { id: 'IN1', title: 'Plan Insulation work and bidding – IN1', category: 'insulation', tier1Category: 'sheathing', tier2Category: 'insulation' },
    { id: 'IN3', title: 'Install Insulation in walls and bathrooms – IN3', category: 'insulation', tier1Category: 'sheathing', tier2Category: 'insulation' },
    { id: 'IN5', title: 'Install Insulation in floors and attic – IN5', category: 'insulation', tier1Category: 'sheathing', tier2Category: 'insulation' },
    { id: 'IN7', title: 'Inspect and correct Insulation work – IN7', category: 'insulation', tier1Category: 'sheathing', tier2Category: 'insulation' },
    { id: 'IN9', title: 'Finalize Insulation subcontractor payment – IN9', category: 'insulation', tier1Category: 'sheathing', tier2Category: 'insulation' }
  ];
  
  // Project IDs to add tasks for
  const projectIds = [6, 7]; // Add tasks for the main project IDs
  
  // Check existing tasks - don't add if template already exists for a project
  for (const projectId of projectIds) {
    console.log(`Checking tasks for project ${projectId}`);
    
    // Process siding templates
    for (const template of sidingTemplates) {
      // Check if template already exists for this project 
      const existingTask = await db.select()
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, projectId),
            eq(tasks.templateId, template.id)
          )
        );
        
      if (existingTask.length === 0) {
        // Template doesn't exist for this project, create it
        const now = new Date();
        const startDate = now.toISOString().split('T')[0];
        const endDate = new Date(now.setDate(now.getDate() + 14)).toISOString().split('T')[0];
        
        const newTask = {
          title: template.title,
          description: "",
          status: "not_started",
          startDate,
          endDate,
          projectId,
          completed: false,
          category: template.category,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          templateId: template.id
        };
        
        await db.insert(tasks).values(newTask);
        console.log(`Created siding task ${template.id} for project ${projectId}`);
      } else {
        console.log(`Siding task ${template.id} already exists for project ${projectId}`);
      }
    }
    
    // Process insulation templates
    for (const template of insulationTemplates) {
      // Check if template already exists for this project 
      const existingTask = await db.select()
        .from(tasks)
        .where(
          and(
            eq(tasks.projectId, projectId),
            eq(tasks.templateId, template.id)
          )
        );
        
      if (existingTask.length === 0) {
        // Template doesn't exist for this project, create it
        const now = new Date();
        const startDate = now.toISOString().split('T')[0];
        const endDate = new Date(now.setDate(now.getDate() + 14)).toISOString().split('T')[0];
        
        const newTask = {
          title: template.title,
          description: "",
          status: "not_started",
          startDate,
          endDate,
          projectId,
          completed: false,
          category: template.category,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          templateId: template.id
        };
        
        await db.insert(tasks).values(newTask);
        console.log(`Created insulation task ${template.id} for project ${projectId}`);
      } else {
        console.log(`Insulation task ${template.id} already exists for project ${projectId}`);
      }
    }
  }
  
  console.log('Task restoration complete');
}

main()
  .catch(e => {
    console.error('Error in task restoration:', e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });