import { db } from './server/db.js';
import { projects, projectCategories } from './shared/schema.js';

async function findProject() {
  try {
    const allProjects = await db.select().from(projects);
    console.log('All projects:');
    allProjects.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}`));

    const helloProject = allProjects.find(p =>
      p.name.toLowerCase().includes('hello') ||
      p.name.toLowerCase().includes('workout')
    );
    if (helloProject) {
      console.log('\nFound Hello Workout project:', helloProject);
    } else {
      console.log('\nNo Hello Workout project found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

findProject();