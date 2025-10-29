// Simple script to check categories via API
async function checkCategories() {
  try {
    // First get all projects
    console.log('=== FETCHING PROJECTS ===');
    const projectsRes = await fetch('http://localhost:5000/api/projects');
    const projects = await projectsRes.json();

    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => {
      console.log(`  - ${p.id}: ${p.name}`);
    });

    // For each project, get its categories
    for (const project of projects) {
      console.log(`\n=== CATEGORIES FOR PROJECT: ${project.name} (ID: ${project.id}) ===`);

      try {
        const categoriesRes = await fetch(`http://localhost:5000/api/projects/${project.id}/categories/flat`);
        const categories = await categoriesRes.json();

        if (categories.length === 0) {
          console.log('  No categories found for this project');
          continue;
        }

        // Group by type
        const tier1 = categories.filter(c => c.type === 'tier1');
        const tier2 = categories.filter(c => c.type === 'tier2');

        console.log(`  Tier 1 Categories (${tier1.length}):`);
        tier1.forEach(c => {
          console.log(`    - ${c.name} (ID: ${c.id})`);

          // Find tier2 children
          const children = tier2.filter(t2 => t2.parentId === c.id);
          if (children.length > 0) {
            console.log(`      Subcategories:`);
            children.forEach(child => {
              console.log(`        - ${child.name} (ID: ${child.id})`);
            });
          }
        });

        // Check for orphaned tier2 (no parent)
        const orphaned = tier2.filter(t2 => !t2.parentId || !tier1.find(t1 => t1.id === t2.parentId));
        if (orphaned.length > 0) {
          console.log(`  Orphaned Tier 2 Categories (${orphaned.length}):`);
          orphaned.forEach(c => console.log(`    - ${c.name} (ID: ${c.id}, parentId: ${c.parentId})`));
        }
      } catch (error) {
        console.error(`  Error fetching categories: ${error.message}`);
      }
    }

    // Look for Orchestrator category across all projects
    console.log('\n=== SEARCHING FOR "ORCHESTRATOR" ===');
    let found = false;
    for (const project of projects) {
      const categoriesRes = await fetch(`http://localhost:5000/api/projects/${project.id}/categories/flat`);
      const categories = await categoriesRes.json();

      const orchestratorCats = categories.filter(c =>
        c.name.toLowerCase().includes('orchestrator')
      );

      if (orchestratorCats.length > 0) {
        found = true;
        console.log(`Found in project "${project.name}" (ID: ${project.id}):`);
        orchestratorCats.forEach(c => {
          console.log(`  - ${c.name} (Type: ${c.type}, ID: ${c.id}, ParentID: ${c.parentId})`);
        });
      }
    }

    if (!found) {
      console.log('No "Orchestrator" categories found in any project.');
      console.log('\nThe category you added on htxapt.com may not have been saved to the database.');
      console.log('You need to manually create it for your project using the admin interface or API.');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nMake sure the dev server is running on port 5000');
  }
}

checkCategories();
