/**
 * Test script to verify software development preset creates tasks
 */

async function testSoftwareDevPreset() {
  const AUTH_TOKEN = 'cm-app-auth-token-123456';

  try {
    console.log('Testing software development preset...');

    // Create a test project with software development preset
    const projectData = {
      name: 'Test Software Development Project',
      location: 'Remote',
      startDate: '2024-01-01',
      endDate: '2024-06-01',
      description: 'Test project for software development preset',
      presetId: 'software-development',
      status: 'active',
      progress: 0
    };

    console.log('Creating project with software development preset...');
    console.log('Project data:', JSON.stringify(projectData, null, 2));

    const createResponse = await fetch('http://localhost:5000/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(projectData)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create project: ${createResponse.statusText} - ${errorText}`);
    }

    const createdProject = await createResponse.json();
    console.log(`Created project: ${createdProject.id} - ${createdProject.name}`);
    console.log('Full project response:', JSON.stringify(createdProject, null, 2));

    // Wait a moment for templates to load
    console.log('Waiting for templates to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if tasks were created
    console.log('Checking for created tasks...');
    const tasksResponse = await fetch(`http://localhost:5000/api/projects/${createdProject.id}/tasks`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!tasksResponse.ok) {
      throw new Error(`Failed to fetch tasks: ${tasksResponse.statusText}`);
    }

    const tasks = await tasksResponse.json();
    console.log(`Found ${tasks.length} tasks in the project`);

    // Check if categories were created
    const categoriesResponse = await fetch(`http://localhost:5000/api/projects/${createdProject.id}/categories`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!categoriesResponse.ok) {
      throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
    }

    const categories = await categoriesResponse.json();
    console.log(`Found ${categories.length} categories in the project`);

    // Log category breakdown
    const tier1Categories = categories.filter(cat => cat.type === 'tier1');
    const tier2Categories = categories.filter(cat => cat.type === 'tier2');

    console.log('Tier 1 Categories:');
    tier1Categories.forEach(cat => console.log(`  - ${cat.name}`));

    console.log('Tier 2 Categories:');
    tier2Categories.forEach(cat => console.log(`  - ${cat.name} (parent: ${tier1Categories.find(t1 => t1.id === cat.parentId)?.name || 'unknown'})`));

    // Log some task examples
    if (tasks.length > 0) {
      console.log('\nSample tasks:');
      tasks.slice(0, 10).forEach(task => {
        console.log(`  - ${task.title} (${task.templateId})`);
        console.log(`    Categories: ${task.tier1Category} > ${task.tier2Category}`);
      });
    }

    console.log('\nTest completed successfully!');
    console.log(`Project created with ${tier1Categories.length} tier1 categories, ${tier2Categories.length} tier2 categories, and ${tasks.length} tasks.`);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSoftwareDevPreset();
