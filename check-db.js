import { db } from './server/db.js';
import { projects, projectCategories, categoryTemplates } from './shared/schema.js';

async function checkData() {
  try {
    console.log('=== PROJECTS ===');
    const projectsData = await db.select().from(projects);
    console.log(JSON.stringify(projectsData, null, 2));

    console.log('\n=== PROJECT CATEGORIES ===');
    const projectCats = await db.select().from(projectCategories);
    console.log(JSON.stringify(projectCats, null, 2));

    console.log('\n=== GLOBAL CATEGORY TEMPLATES ===');
    const globalCats = await db.select().from(categoryTemplates);
    console.log(JSON.stringify(globalCats, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkData();
