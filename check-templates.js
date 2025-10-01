import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function checkTemplates() {
  try {
    console.log('🔍 Checking task templates...\n');
    
    // Check task templates
    const templates = await sql`SELECT COUNT(*) as count FROM task_templates`;
    console.log(`📋 Task templates count: ${templates[0].count}`);
    
    if (templates[0].count > 0) {
      const sampleTemplates = await sql`
        SELECT template_id, title, tier1_category_id, tier2_category_id 
        FROM task_templates 
        LIMIT 5
      `;
      
      console.log('\n📝 Sample task templates:');
      sampleTemplates.forEach(t => {
        console.log(`  - ${t.title} (ID: ${t.template_id})`);
        console.log(`    Categories: ${t.tier1_category_id} > ${t.tier2_category_id}`);
      });
      
      // Check if category IDs are valid
      console.log('\n🔗 Checking category references...');
      for (const template of sampleTemplates) {
        try {
          const tier1Cat = await sql`SELECT name FROM project_categories WHERE id = ${template.tier1_category_id}`;
          const tier2Cat = await sql`SELECT name FROM project_categories WHERE id = ${template.tier2_category_id}`;
          
          console.log(`  Template ${template.template_id}:`);
          console.log(`    Tier1: ${tier1Cat.length > 0 ? tier1Cat[0].name : 'NOT FOUND'} (ID: ${template.tier1_category_id})`);
          console.log(`    Tier2: ${tier2Cat.length > 0 ? tier2Cat[0].name : 'NOT FOUND'} (ID: ${template.tier2_category_id})`);
        } catch (e) {
          console.log(`  Error checking template ${template.template_id}:`, e.message);
        }
      }
    }
    
    // Check if there are any projects that should have tasks
    console.log('\n🏗️ Checking projects and their categories...');
    const projects = await sql`SELECT id, name FROM projects WHERE status = 'active'`;
    
    for (const project of projects) {
      const projectCategories = await sql`
        SELECT COUNT(*) as count 
        FROM project_categories 
        WHERE project_id = ${project.id}
      `;
      
      console.log(`  Project "${project.name}" (ID: ${project.id}):`);
      console.log(`    Categories: ${projectCategories[0].count}`);
      
      // Check if this project has any tasks
      const projectTasks = await sql`
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE project_id = ${project.id}
      `;
      
      console.log(`    Tasks: ${projectTasks[0].count}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking templates:', error);
  } finally {
    await sql.end();
  }
}

checkTemplates();
