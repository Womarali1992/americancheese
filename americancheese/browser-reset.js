// Browser-based script to reset task templates using fetch
// Copy and paste this script into your browser's console when logged into the application

async function resetTaskTemplates() {
  try {
    console.log('Starting task template reset...');
    
    const AUTH_TOKEN = 'cm-app-auth-token-123456';
    
    const response = await fetch('/api/reset-task-templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      throw new Error(`Failed to reset task templates: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Reset completed successfully!');
    console.log('Response:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Error resetting task templates:', error);
    throw error;
  }
}

// Run the reset
resetTaskTemplates()
  .then(data => {
    console.log('Task templates have been reset for all projects!');
    if (data.deletedCount) {
      console.log(`Deleted ${data.deletedCount} existing template tasks`);
    }
    if (data.createdCount) {
      console.log(`Created ${data.createdCount} fresh tasks from templates`);
    }
  })
  .catch(error => {
    console.error('Reset failed:', error);
  });