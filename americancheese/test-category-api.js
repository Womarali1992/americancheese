// Test the category API endpoint that the frontend uses
async function testCategoryAPI() {
  const projectId = 78; // HTXAPT.COM WORKFLOW AGENT project

  console.log(`Testing category API for project ${projectId}...`);
  console.log(`URL: http://localhost:5000/api/projects/${projectId}/categories/flat\n`);

  try {
    const response = await fetch(`http://localhost:5000/api/projects/${projectId}/categories/flat`);

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers));

    if (!response.ok) {
      console.error('Response not OK:', await response.text());
      return;
    }

    const data = await response.json();
    console.log('\nRaw Response Data:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n=== Analysis ===');
    console.log('Total categories:', data.length);

    const tier1 = data.filter(c => c.type === 'tier1');
    const tier2 = data.filter(c => c.type === 'tier2');

    console.log('Tier 1 categories:', tier1.length);
    tier1.forEach(c => {
      console.log(`  - ID: ${c.id}, Name: "${c.name}", Type: ${c.type}`);
    });

    console.log('Tier 2 categories:', tier2.length);
    tier2.forEach(c => {
      console.log(`  - ID: ${c.id}, Name: "${c.name}", Type: ${c.type}, ParentID: ${c.parentId}`);
    });

    // Test what the frontend hook would do
    console.log('\n=== Frontend Hook Simulation ===');
    const tier1Names = tier1.map(cat => cat.name || cat.label);
    console.log('Tier 1 names for dropdown:', tier1Names);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCategoryAPI();
