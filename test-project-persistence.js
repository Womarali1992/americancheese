/**
 * Script to create a test project and verify persistent project selection
 */

async function createTestProject() {
  try {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Project for Persistence',
        location: '123 Test Street',
        description: 'A test project to verify persistent selection functionality',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'active',
        progress: 0
      })
    });

    if (response.ok) {
      const project = await response.json();
      console.log('Created test project:', project);
      return project;
    } else {
      console.error('Failed to create project:', await response.text());
    }
  } catch (error) {
    console.error('Error creating project:', error);
  }
}

async function testProjectSelection(projectId) {
  try {
    // Test setting selected project
    const setResponse = await fetch('/api/user/selected-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId })
    });

    if (setResponse.ok) {
      console.log('Successfully set selected project:', projectId);
      
      // Test getting selected project
      const getResponse = await fetch('/api/user/selected-project');
      if (getResponse.ok) {
        const result = await getResponse.json();
        console.log('Retrieved selected project:', result);
        return result;
      }
    }
  } catch (error) {
    console.error('Error testing project selection:', error);
  }
}

async function runTest() {
  console.log('=== Testing Persistent Project Selection ===');
  
  // Create a test project
  const project = await createTestProject();
  if (!project) {
    console.error('Failed to create test project');
    return;
  }

  // Test setting and getting the selection
  await testProjectSelection(project.id);
  
  console.log('=== Test Complete ===');
  console.log('Now you can:');
  console.log('1. Select the test project in the dropdown');
  console.log('2. Navigate to different pages');
  console.log('3. Refresh the page');
  console.log('4. The selection should persist until logout');
}

// Run the test
runTest();