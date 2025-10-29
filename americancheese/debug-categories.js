import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { projectCategories, projects } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

// Database connection
const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function debugCategories() {
  try {
    console.log('=== PROJECTS ===');
    const allProjects = await db.select().from(projects);
    allProjects.forEach(p => {
      console.log(`ID: ${p.id}, Name: ${p.name}`);
    });

    console.log('\n=== PROJECT CATEGORIES ===');
    const allCategories = await db.select().from(projectCategories);

    if (allCategories.length === 0) {
      console.log('No categories found in the database!');
    } else {
      // Group by project
      const byProject = {};
      allCategories.forEach(cat => {
        if (!byProject[cat.projectId]) {
          byProject[cat.projectId] = [];
        }
        byProject[cat.projectId].push(cat);
      });

      for (const [projectId, categories] of Object.entries(byProject)) {
        const project = allProjects.find(p => p.id === parseInt(projectId));
        console.log(`\nProject: ${project?.name || 'Unknown'} (ID: ${projectId})`);

        // Show tier1 categories
        const tier1 = categories.filter(c => c.type === 'tier1');
        console.log('  Tier 1 Categories:');
        tier1.forEach(c => console.log(`    - ${c.name} (ID: ${c.id})`));

        // Show tier2 for each tier1
        tier1.forEach(t1 => {
          const tier2 = categories.filter(c => c.type === 'tier2' && c.parentId === t1.id);
          if (tier2.length > 0) {
            console.log(`    └─ Tier 2 under "${t1.name}":`);
            tier2.forEach(t2 => console.log(`       - ${t2.name} (ID: ${t2.id})`));
          }
        });
      }
    }

    // Check for "Orchestrator" category
    console.log('\n=== SEARCHING FOR "ORCHESTRATOR" CATEGORIES ===');
    const orchestratorCats = allCategories.filter(c =>
      c.name.toLowerCase().includes('orchestrator')
    );

    if (orchestratorCats.length === 0) {
      console.log('No "Orchestrator" categories found.');
      console.log('\nTo add it, you need to:');
      console.log('1. Choose a project ID from the list above');
      console.log('2. Create the category using the API or admin interface');
    } else {
      console.log('Found Orchestrator categories:');
      orchestratorCats.forEach(c => {
        const project = allProjects.find(p => p.id === c.projectId);
        console.log(`  - "${c.name}" (Type: ${c.type}, Project: ${project?.name})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugCategories();
