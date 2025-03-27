/**
 * Script to reset task templates for all projects or a specific project
 * This script will:
 * 1. Delete all existing template-based tasks 
 * 2. Create fresh tasks from templates
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:3000'; // Change this if your app is running on a different port
const AUTH_TOKEN = 'cm-app-auth-token-123456';

// Optional: If you want to reset for a specific project, set the ID here (or leave as null for all projects)
const PROJECT_ID = null; 

async function resetTaskTemplates() {
  try {
    console.log('Starting task template reset...');
    
    const endpoint = `${API_URL}/api/reset-task-templates`;
    const body = PROJECT_ID ? { projectId: PROJECT_ID } : {};
    
    console.log(`Making request to ${endpoint}`);
    console.log('Request body:', JSON.stringify(body));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reset task templates: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Template reset completed successfully!');
    console.log(`Deleted ${data.deletedCount} existing template tasks`);
    console.log(`Created ${data.createdCount} fresh tasks from templates`);
    
    if (data.projectsProcessed) {
      console.log(`Processed ${data.projectsProcessed} projects`);
    }
    
    if (data.createdTasksByProject) {
      console.log('\nTasks created by project:');
      Object.entries(data.createdTasksByProject).forEach(([project, count]) => {
        console.log(`  - ${project}: ${count} tasks`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error resetting task templates:', error.message);
  }
}

// Execute the function
resetTaskTemplates();