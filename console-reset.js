/**
 * Task Template Reset Script
 * 
 * Instructions:
 * 1. Copy the entire contents of this file
 * 2. Open your web application in a browser
 * 3. Make sure you're logged in
 * 4. Open the browser's developer console (F12 or right-click -> Inspect -> Console)
 * 5. Paste this code into the console and press Enter
 * 6. The script will execute and reset all task templates
 */

(async function() {
  try {
    console.log('Starting task template reset...');
    
    const response = await fetch('/api/reset-task-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reset task templates: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ Template reset completed successfully!');
    console.log(`Result: ${JSON.stringify(result, null, 2)}`);
    
    // Log the details
    if (result.message) {
      console.log(`Message: ${result.message}`);
    }
    
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
    
    console.log('\nTask template reset completed! Refresh the page to see updated tasks.');
    
  } catch (error) {
    console.error('❌ Error resetting task templates:', error);
  }
})();