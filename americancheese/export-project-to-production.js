/**
 * Script to export a project from local database and generate SQL for production
 * Usage: node export-project-to-production.js --project-name "SuperX"
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, writeFileSync } from 'fs';

// Database connection - uses local DATABASE_URL
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });

async function exportProject(projectName) {
  try {
    console.log(`Exporting project: ${projectName}...`);
    
    // Find the project
    const projects = await queryClient`
      SELECT * FROM projects WHERE name = ${projectName}
    `;
    
    if (projects.length === 0) {
      console.error(`Project "${projectName}" not found in local database`);
      return;
    }
    
    const project = projects[0];
    console.log(`Found project: ${project.name} (ID: ${project.id})`);
    
    // Get all related data
    const tasks = await queryClient`
      SELECT * FROM tasks WHERE project_id = ${project.id}
    `;
    
    const subtasks = await queryClient`
      SELECT s.* FROM subtasks s
      INNER JOIN tasks t ON s.parent_task_id = t.id
      WHERE t.project_id = ${project.id}
    `;
    
    const materials = await queryClient`
      SELECT * FROM materials WHERE project_id = ${project.id}
    `;
    
    const labor = await queryClient`
      SELECT l.* FROM labor l
      INNER JOIN tasks t ON l.task_id = t.id
      WHERE t.project_id = ${project.id}
    `;
    
    const contacts = await queryClient`
      SELECT DISTINCT c.* FROM contacts c
      WHERE c.id IN (
        SELECT UNNEST(contact_ids) FROM tasks WHERE project_id = ${project.id}
        UNION
        SELECT UNNEST(contact_ids) FROM materials WHERE project_id = ${project.id}
      )
    `;
    
    const projectCategories = await queryClient`
      SELECT * FROM project_categories WHERE project_id = ${project.id}
    `;
    
    console.log(`Found:`);
    console.log(`  - ${tasks.length} tasks`);
    console.log(`  - ${subtasks.length} subtasks`);
    console.log(`  - ${materials.length} materials`);
    console.log(`  - ${labor.length} labor entries`);
    console.log(`  - ${contacts.length} contacts`);
    console.log(`  - ${projectCategories.length} project categories`);
    
    // Generate SQL for production
    let sql = `-- Export of project: ${project.name} (ID: ${project.id})\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;
    
    // Insert project (using ON CONFLICT to handle if it already exists)
    sql += `-- Insert project\n`;
    sql += `INSERT INTO projects (name, location, start_date, end_date, description, status, progress, hidden_categories, selected_templates, color_theme, use_global_theme, preset_id, structured_context)\n`;
    sql += `VALUES (\n`;
    sql += `  '${project.name.replace(/'/g, "''")}',\n`;
    sql += `  '${(project.location || '').replace(/'/g, "''")}',\n`;
    sql += `  '${project.start_date}',\n`;
    sql += `  '${project.end_date}',\n`;
    sql += `  ${project.description ? `'${project.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
    sql += `  '${project.status || 'active'}',\n`;
    sql += `  ${project.progress || 0},\n`;
    sql += `  ${project.hidden_categories ? `ARRAY[${project.hidden_categories.map(c => `'${c}'`).join(', ')}]` : 'NULL'},\n`;
    sql += `  ${project.selected_templates ? `ARRAY[${project.selected_templates.map(t => `'${t}'`).join(', ')}]` : 'NULL'},\n`;
    sql += `  ${project.color_theme ? `'${project.color_theme}'` : 'NULL'},\n`;
    sql += `  ${project.use_global_theme !== false},\n`;
    sql += `  '${project.preset_id || 'home-builder'}',\n`;
    sql += `  ${project.structured_context ? `'${project.structured_context.replace(/'/g, "''")}'` : 'NULL'}\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  name = EXCLUDED.name,\n`;
    sql += `  location = EXCLUDED.location,\n`;
    sql += `  start_date = EXCLUDED.start_date,\n`;
    sql += `  end_date = EXCLUDED.end_date,\n`;
    sql += `  description = EXCLUDED.description,\n`;
    sql += `  status = EXCLUDED.status,\n`;
    sql += `  progress = EXCLUDED.progress,\n`;
    sql += `  hidden_categories = EXCLUDED.hidden_categories,\n`;
    sql += `  selected_templates = EXCLUDED.selected_templates,\n`;
    sql += `  color_theme = EXCLUDED.color_theme,\n`;
    sql += `  use_global_theme = EXCLUDED.use_global_theme,\n`;
    sql += `  preset_id = EXCLUDED.preset_id,\n`;
    sql += `  structured_context = EXCLUDED.structured_context;\n\n`;
    
    // Get the new project ID (will be auto-generated, but we need to reference it)
    sql += `-- Get the project ID (adjust if needed)\n`;
    sql += `DO $$\n`;
    sql += `DECLARE\n`;
    sql += `  new_project_id INTEGER;\n`;
    sql += `BEGIN\n`;
    sql += `  SELECT id INTO new_project_id FROM projects WHERE name = '${project.name.replace(/'/g, "''")}' LIMIT 1;\n\n`;
    
    // Insert project categories
    if (projectCategories.length > 0) {
      sql += `  -- Insert project categories\n`;
      projectCategories.forEach(cat => {
        sql += `  INSERT INTO project_categories (project_id, name, type, description, parent_id, sort_order, color)\n`;
        sql += `  VALUES (new_project_id, '${cat.name.replace(/'/g, "''")}', '${cat.type}', ${cat.description ? `'${cat.description.replace(/'/g, "''")}'` : 'NULL'}, ${cat.parent_id || 'NULL'}, ${cat.sort_order || 0}, ${cat.color ? `'${cat.color}'` : 'NULL'})\n`;
        sql += `  ON CONFLICT DO NOTHING;\n`;
      });
      sql += `\n`;
    }
    
    // Note: Tasks, subtasks, materials, labor would need more complex handling
    // For now, just export the project structure
    sql += `END $$;\n\n`;
    
    sql += `-- Note: Tasks, subtasks, materials, and labor need to be exported separately\n`;
    sql += `-- or use the CSV export/import feature in the UI\n`;
    
    // Write SQL file
    const filename = `export-${project.name.toLowerCase().replace(/\s+/g, '-')}.sql`;
    writeFileSync(filename, sql);
    
    console.log(`\nSQL export written to: ${filename}`);
    console.log(`\nTo import to production:`);
    console.log(`1. Review the SQL file: ${filename}`);
    console.log(`2. Run on production: psql $DATABASE_URL -f ${filename}`);
    console.log(`\nOr use the CSV export/import feature in the UI for full data migration.`);
    
  } catch (error) {
    console.error('Error exporting project:', error);
  } finally {
    await queryClient.end();
  }
}

// Get project name from command line
const projectName = process.argv.find(arg => arg.startsWith('--project-name='))?.split('=')[1] || 
                   process.argv.find(arg => arg.startsWith('--name='))?.split('=')[1] ||
                   'SuperX';

exportProject(projectName);
