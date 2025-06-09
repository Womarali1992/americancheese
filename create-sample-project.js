/**
 * Script to create a sample project using the storage interface
 */

import { storage } from './server/storage.js';

async function createSampleProject() {
  try {
    console.log('Creating sample project for testing persistent selection...');
    
    const project = await storage.createProject({
      name: 'Demo House Construction',
      location: '123 Main Street, Anytown, USA',
      description: 'A demonstration project for testing persistent project selection functionality',
      startDate: '2025-01-15',
      endDate: '2025-08-15',
      status: 'active',
      progress: 25
    });

    console.log('Sample project created successfully:', project);
    return project;
  } catch (error) {
    console.error('Error creating sample project:', error);
  }
}

createSampleProject();