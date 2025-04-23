/**
 * Script to create a sample project for testing
 */
 
import { db } from './server/db.js';
import { projects } from './shared/schema.js';

async function createSampleProject() {
  try {
    console.log('Creating sample project...');
    
    // Check if we already have projects
    const existingProjects = await db.select().from(projects);
    
    if (existingProjects.length > 0) {
      console.log('Projects already exist, skipping creation');
      return;
    }
    
    // Create a sample project
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    const result = await db.insert(projects).values({
      name: 'Sample Residential Project',
      location: '123 Main Street, Anytown, CA',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      description: 'A sample residential construction project',
      status: 'active',
      progress: 10,
      selectedTemplates: []
    }).returning();
    
    console.log('Sample project created:', result[0]);
    
  } catch (error) {
    console.error('Error creating sample project:', error);
  } finally {
    console.log('Done');
    process.exit(0);
  }
}

createSampleProject();