/**
 * Test script for idempotent task template population
 * This script tests the new implementation of the reset-task-templates endpoint
 */

const API_URL = 'http://localhost:5000';
const AUTH_TOKEN = 'cm-app-auth-token-123456';

// Function to test populating templates for a specific project
async function testPopulateTemplatesForProject(projectId) {
  try {
    console.log(`Testing template population for project ${projectId}...`);
    
    const response = await fetch(`${API_URL}/api/reset-task-templates?projectId=${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to populate templates: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
    
    console.log('\nRunning second test to verify idempotence...');
    
    // Make a second request to verify idempotent behavior
    const secondResponse = await fetch(`${API_URL}/api/reset-task-templates?projectId=${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({})
    });
    
    if (!secondResponse.ok) {
      const errorText = await secondResponse.text();
      throw new Error(`Failed on second attempt: ${secondResponse.status} ${secondResponse.statusText}\n${errorText}`);
    }
    
    const secondResult = await secondResponse.json();
    console.log('Second attempt result:', JSON.stringify(secondResult, null, 2));
    
    // Verify second run created 0 tasks (idempotent behavior)
    if (secondResult.tasksCreated === 0) {
      console.log('✅ Idempotent behavior confirmed! Second run created 0 tasks.');
    } else {
      console.log('⚠️ Warning: Second run created tasks, idempotence not working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error testing project-specific template population:', error.message);
  }
}

// Function to test populating templates for all projects
async function testPopulateTemplatesForAllProjects() {
  try {
    console.log('Testing template population for all projects...');
    
    const response = await fetch(`${API_URL}/api/reset-task-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to populate templates: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
    
    console.log('\nRunning second test to verify idempotence...');
    
    // Make a second request to verify idempotent behavior
    const secondResponse = await fetch(`${API_URL}/api/reset-task-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: JSON.stringify({})
    });
    
    if (!secondResponse.ok) {
      const errorText = await secondResponse.text();
      throw new Error(`Failed on second attempt: ${secondResponse.status} ${secondResponse.statusText}\n${errorText}`);
    }
    
    const secondResult = await secondResponse.json();
    console.log('Second attempt result:', JSON.stringify(secondResult, null, 2));
    
    // Check that each project in the second run had 0 tasks created
    const allIdempotent = secondResult.results.every(project => project.tasksCreated === 0);
    if (allIdempotent) {
      console.log('✅ Idempotent behavior confirmed! Second run created 0 tasks for all projects.');
    } else {
      console.log('⚠️ Warning: Second run created tasks for some projects, idempotence not working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error testing all-projects template population:', error.message);
  }
}

// First, fetch projects to get a valid project ID
async function getProjects() {
  try {
    const response = await fetch(`${API_URL}/api/projects`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
    }
    
    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    return [];
  }
}

// Main test function
async function runTests() {
  try {
    const projects = await getProjects();
    if (projects.length === 0) {
      console.error('No projects found to test with');
      return;
    }
    
    // Test with the first project
    const testProject = projects[0];
    console.log(`Found project to test with: ID ${testProject.id} - ${testProject.name}`);
    
    // Test project-specific endpoint
    await testPopulateTemplatesForProject(testProject.id);
    
    console.log('\n-----------------------------------\n');
    
    // Test all-projects endpoint
    await testPopulateTemplatesForAllProjects();
    
  } catch (error) {
    console.error('Error running tests:', error.message);
  }
}

// Run the tests
runTests();