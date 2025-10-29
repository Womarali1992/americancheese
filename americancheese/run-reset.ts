/**
 * Script to reset task templates using the REST API endpoint
 * 
 * Run with: npx tsx run-reset.ts
 */

// Create a function to make the API request using the fetch API
async function resetTaskTemplates() {
  try {
    console.log('Starting task template reset via API...');
    
    const AUTH_TOKEN = 'cm-app-auth-token-123456';
    const BASE_URL = 'http://localhost:3000'; // Modify as needed for your environment
    
    // Make the API call to reset templates
    const response = await fetch(`${BASE_URL}/api/reset-task-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Template reset completed successfully!');
    
    if (result.deletedCount) {
      console.log(`Deleted ${result.deletedCount} existing template tasks`);
    }
    
    if (result.createdCount) {
      console.log(`Created ${result.createdCount} fresh tasks from templates`);
    }
    
    if (result.projectsProcessed) {
      console.log(`Processed ${result.projectsProcessed} projects`);
    }
    
    if (result.createdTasksByProject) {
      console.log('\nTasks created by project:');
      Object.entries(result.createdTasksByProject).forEach(([project, count]) => {
        console.log(`  - ${project}: ${count} tasks`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error resetting task templates:', error.message);
    throw error;
  }
}

// Run the function
async function main() {
  try {
    await resetTaskTemplates();
    console.log('Task template reset script completed successfully');
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Execute
main();