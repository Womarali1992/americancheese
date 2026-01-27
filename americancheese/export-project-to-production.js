/**
 * Script to export a project from local database and generate SQL for production
 * Usage: node export-project-to-production.js --project-name "SuperX"
 */

import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync, writeFileSync } from 'fs';

// Database connection - uses local DATABASE_URL
const queryClient = postgres(process.env.DATABASE_URL || {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'project_management',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
}, { max: 1 });

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
      WHERE c.id::text IN (
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

    // Insert tasks
    if (tasks.length > 0) {
      sql += `  -- Insert tasks\n`;
      tasks.forEach(task => {
        sql += `  INSERT INTO tasks (title, description, project_id, tier1_category, tier2_category, category, materials_needed, start_date, end_date, status, assigned_to, completed, contact_ids, material_ids, template_id, estimated_cost, actual_cost, parent_task_id, sort_order, calendar_active, calendar_start_date, calendar_end_date, calendar_start_time, calendar_end_time, start_time, end_time)\n`;
        sql += `  VALUES (\n`;
        sql += `    '${task.title.replace(/'/g, "''")}',\n`;
        sql += `    ${task.description ? `'${task.description.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `    new_project_id,\n`;
        sql += `    ${task.tier1_category ? `'${task.tier1_category.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `    ${task.tier2_category ? `'${task.tier2_category.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `    '${task.category || 'other'}',\n`;
        sql += `    ${task.materials_needed ? `'${task.materials_needed.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `    '${task.start_date}',\n`;
        sql += `    '${task.end_date}',\n`;
        sql += `    '${task.status || 'not_started'}',\n`;
        sql += `    ${task.assigned_to ? `'${task.assigned_to.replace(/'/g, "''")}'` : 'NULL'},\n`;
        sql += `    ${task.completed || false},\n`;
        sql += `    ${task.contact_ids ? `ARRAY[${task.contact_ids.map(id => `'${id}'`).join(', ')}]` : 'NULL'},\n`;
        sql += `    ${task.material_ids ? `ARRAY[${task.material_ids.map(id => `'${id}'`).join(', ')}]` : 'NULL'},\n`;
        sql += `    ${task.template_id ? `'${task.template_id}'` : 'NULL'},\n`;
        sql += `    ${task.estimated_cost || 'NULL'},\n`;
        sql += `    ${task.actual_cost || 'NULL'},\n`;
        sql += `    ${task.parent_task_id || 'NULL'},\n`;
        sql += `    ${task.sort_order || 0},\n`;
        sql += `    ${task.calendar_active || false},\n`;
        sql += `    ${task.calendar_start_date ? `'${task.calendar_start_date}'` : 'NULL'},\n`;
        sql += `    ${task.calendar_end_date ? `'${task.calendar_end_date}'` : 'NULL'},\n`;
        sql += `    ${task.calendar_start_time ? `'${task.calendar_start_time}'` : 'NULL'},\n`;
        sql += `    ${task.calendar_end_time ? `'${task.calendar_end_time}'` : 'NULL'},\n`;
        sql += `    ${task.start_time ? `'${task.start_time}'` : 'NULL'},\n`;
        sql += `    ${task.end_time ? `'${task.end_time}'` : 'NULL'}\n`;
        sql += `  ) ON CONFLICT DO NOTHING;\n`;
      });
      sql += `\n`;
    }

    // Insert subtasks
    if (subtasks.length > 0) {
      sql += `  -- Insert subtasks\n`;
      subtasks.forEach(sub => {
        sql += `  INSERT INTO subtasks (parent_task_id, title, description, completed, sort_order, assigned_to, start_date, end_date, status, estimated_cost, actual_cost, calendar_active, calendar_start_date, calendar_end_date, calendar_start_time, calendar_end_time, start_time, end_time)\n`;
        sql += `  SELECT id, '${sub.title.replace(/'/g, "''")}', ${sub.description ? `'${sub.description.replace(/'/g, "''")}'` : 'NULL'}, ${sub.completed || false}, ${sub.sort_order || 0}, ${sub.assigned_to ? `'${sub.assigned_to.replace(/'/g, "''")}'` : 'NULL'}, ${sub.start_date ? `'${sub.start_date}'` : 'NULL'}, ${sub.end_date ? `'${sub.end_date}'` : 'NULL'}, '${sub.status || 'not_started'}', ${sub.estimated_cost || 'NULL'}, ${sub.actual_cost || 'NULL'}, ${sub.calendar_active || false}, ${sub.calendar_start_date ? `'${sub.calendar_start_date}'` : 'NULL'}, ${sub.calendar_end_date ? `'${sub.calendar_end_date}'` : 'NULL'}, ${sub.calendar_start_time ? `'${sub.calendar_start_time}'` : 'NULL'}, ${sub.calendar_end_time ? `'${sub.calendar_end_time}'` : 'NULL'}, ${sub.start_time ? `'${sub.start_time}'` : 'NULL'}, ${sub.end_time ? `'${sub.end_time}'` : 'NULL'}\n`;
        sql += `  FROM tasks WHERE project_id = new_project_id AND title = (SELECT title FROM tasks WHERE id = ${sub.parent_task_id}) LIMIT 1\n`;
        sql += `  ON CONFLICT DO NOTHING;\n`;
      });
      sql += `\n`;
    }
    
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
