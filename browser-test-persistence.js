/**
 * Browser Console Test for Persistent Project Selection
 * 
 * Instructions:
 * 1. Open browser developer console (F12)
 * 2. Copy and paste this entire script into the console
 * 3. Press Enter to run the test
 */

async function testPersistentProjectSelection() {
  console.log('=== Testing Persistent Project Selection ===');
  
  try {
    // First, create a test project
    console.log('1. Creating test project...');
    const createResponse = await fetch('/api/projects', {
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

    if (!createResponse.ok) {
      throw new Error(`Failed to create project: ${await createResponse.text()}`);
    }

    const project = await createResponse.json();
    console.log('✓ Created test project:', project);

    // Test setting the selected project
    console.log('2. Setting selected project...');
    const setResponse = await fetch('/api/user/selected-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId: project.id })
    });

    if (!setResponse.ok) {
      throw new Error(`Failed to set selected project: ${await setResponse.text()}`);
    }

    console.log('✓ Selected project set successfully');

    // Test getting the selected project
    console.log('3. Retrieving selected project...');
    const getResponse = await fetch('/api/user/selected-project');
    
    if (!getResponse.ok) {
      throw new Error(`Failed to get selected project: ${await getResponse.text()}`);
    }

    const selectedProject = await getResponse.json();
    console.log('✓ Retrieved selected project:', selectedProject);

    // Verify the selection persisted
    if (selectedProject.projectId === project.id) {
      console.log('✅ SUCCESS: Project selection is working correctly!');
      console.log('');
      console.log('Now test the persistence by:');
      console.log('1. Refreshing the page (F5)');
      console.log('2. Navigating to different pages');
      console.log('3. The selected project should remain active');
      console.log('4. Try logging out - the selection should be cleared');
    } else {
      console.log('❌ FAILED: Selected project ID does not match');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  console.log('=== Test Complete ===');
}

// Run the test
testPersistentProjectSelection();