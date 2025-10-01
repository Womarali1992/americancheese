// Debug script to test materials creation
// Run this with: node debug-materials.js

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMaterialsCreation() {
  try {
    console.log('Testing materials API endpoints...\n');

    // Test 1: Check if server is running
    try {
      const healthCheck = await fetch('http://localhost:5000/api/projects');
      console.log('✅ Server is running on port 5000');
      console.log(`Status: ${healthCheck.status}`);
    } catch (error) {
      console.log('❌ Server is not running on port 5000');
      console.log('Please start the server with: npm run dev');
      return;
    }

    // Test 2: Check if we can fetch projects
    try {
      const projectsResponse = await fetch('http://localhost:5000/api/projects');
      const projects = await projectsResponse.json();
      console.log(`✅ Found ${projects.length} projects`);
      
      if (projects.length === 0) {
        console.log('⚠️ No projects found. You need at least one project to create materials.');
        return;
      }
      
      const testProject = projects[0];
      console.log(`Using test project: "${testProject.name}" (ID: ${testProject.id})`);

      // Test 3: Try to create a simple material
      const testMaterial = {
        name: "Test Material " + new Date().getTime(),
        type: "Building Materials",
        category: "Lumber & Composites",
        tier: "structural",
        tier2Category: "framing",
        quantity: 1,
        supplier: "Test Supplier",
        status: "ordered",
        projectId: testProject.id,
        taskIds: [],
        contactIds: [],
        unit: "pieces",
        cost: 10.50,
        details: "Test material created by debug script"
      };

      console.log('\n📝 Attempting to create material...');
      console.log('Material data:', JSON.stringify(testMaterial, null, 2));

      const createResponse = await fetch('http://localhost:5000/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMaterial)
      });

      console.log(`\nResponse status: ${createResponse.status}`);
      
      if (createResponse.ok) {
        const createdMaterial = await createResponse.json();
        console.log('✅ Material created successfully!');
        console.log('Created material ID:', createdMaterial.id);
      } else {
        const errorText = await createResponse.text();
        console.log('❌ Failed to create material');
        console.log('Error response:', errorText);
      }

    } catch (error) {
      console.log('❌ Error during material creation test:', error.message);
    }

  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testMaterialsCreation();