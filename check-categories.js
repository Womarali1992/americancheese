import { db } from './server/db.js';
import { categoryTemplates, projectCategories } from './shared/schema.js';

async function checkCategories() {
  try {
    const templates = await db.select().from(categoryTemplates);
    console.log('Global templates:', templates.length);
    console.log('Templates:', templates.map(t => ({ id: t.id, name: t.name, type: t.type })));

    const projects = await db.select().from(projectCategories);
    console.log('Project categories:', projects.length);
    console.log('Project categories:', projects.map(p => ({ id: p.id, name: p.name, type: p.type, projectId: p.projectId })));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkCategories();