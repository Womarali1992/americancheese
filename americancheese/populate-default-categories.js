/**
 * Script to populate flexible, editable categories for each project
 * This creates a customizable category system where each project can edit their own categories
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

// Default category suggestions (these can be edited by each project)
const defaultCategorySuggestions = [
  // Main project phases - customizable by each project
  { name: 'Planning & Design', type: 'tier1', color: '#6366f1', description: 'Initial planning, design, and preparation phase', sortOrder: 1, isEditable: true },
  { name: 'Foundation & Structure', type: 'tier1', color: '#8b5cf6', description: 'Foundation work and structural elements', sortOrder: 2, isEditable: true },
  { name: 'Systems & Infrastructure', type: 'tier1', color: '#ec4899', description: 'Core systems and infrastructure work', sortOrder: 3, isEditable: true },
  { name: 'Interior & Finishing', type: 'tier1', color: '#10b981', description: 'Interior work and final finishing touches', sortOrder: 4, isEditable: true },
  { name: 'Exterior & Landscaping', type: 'tier1', color: '#f59e0b', description: 'Exterior work and landscaping', sortOrder: 5, isEditable: true },
];

// Flexible subcategory suggestions - these can be customized per project
const flexibleSubcategorySuggestions = [
  // Planning & Design subcategories
  { name: 'Research & Analysis', type: 'tier2', parent: 'Planning & Design', color: '#4f46e5', description: 'Research, analysis, and feasibility studies', sortOrder: 1, isEditable: true },
  { name: 'Design & Engineering', type: 'tier2', parent: 'Planning & Design', color: '#6366f1', description: 'Design work and engineering calculations', sortOrder: 2, isEditable: true },
  { name: 'Permits & Approvals', type: 'tier2', parent: 'Planning & Design', color: '#7c3aed', description: 'Permits, approvals, and regulatory compliance', sortOrder: 3, isEditable: true },
  
  // Foundation & Structure subcategories
  { name: 'Site Preparation', type: 'tier2', parent: 'Foundation & Structure', color: '#7c2d12', description: 'Site clearing, grading, and preparation', sortOrder: 1, isEditable: true },
  { name: 'Foundation Work', type: 'tier2', parent: 'Foundation & Structure', color: '#92400e', description: 'Foundation construction and concrete work', sortOrder: 2, isEditable: true },
  { name: 'Structural Framework', type: 'tier2', parent: 'Foundation & Structure', color: '#a16207', description: 'Main structural framework and support', sortOrder: 3, isEditable: true },
  
  // Systems & Infrastructure subcategories
  { name: 'Electrical Systems', type: 'tier2', parent: 'Systems & Infrastructure', color: '#dc2626', description: 'Electrical wiring, panels, and fixtures', sortOrder: 1, isEditable: true },
  { name: 'Plumbing Systems', type: 'tier2', parent: 'Systems & Infrastructure', color: '#ea580c', description: 'Plumbing, water, and drainage systems', sortOrder: 2, isEditable: true },
  { name: 'HVAC Systems', type: 'tier2', parent: 'Systems & Infrastructure', color: '#d97706', description: 'Heating, ventilation, and air conditioning', sortOrder: 3, isEditable: true },
  { name: 'Technology & Data', type: 'tier2', parent: 'Systems & Infrastructure', color: '#059669', description: 'Technology infrastructure and data systems', sortOrder: 4, isEditable: true },
  
  // Interior & Finishing subcategories
  { name: 'Walls & Ceilings', type: 'tier2', parent: 'Interior & Finishing', color: '#0891b2', description: 'Interior walls, ceilings, and partitions', sortOrder: 1, isEditable: true },
  { name: 'Flooring & Surfaces', type: 'tier2', parent: 'Interior & Finishing', color: '#0d9488', description: 'Flooring, countertops, and surface finishes', sortOrder: 2, isEditable: true },
  { name: 'Fixtures & Hardware', type: 'tier2', parent: 'Interior & Finishing', color: '#059669', description: 'Plumbing fixtures, hardware, and accessories', sortOrder: 3, isEditable: true },
  { name: 'Paint & Finishes', type: 'tier2', parent: 'Interior & Finishing', color: '#65a30d', description: 'Painting, staining, and final finishes', sortOrder: 4, isEditable: true },
  
  // Exterior & Landscaping subcategories
  { name: 'Exterior Walls', type: 'tier2', parent: 'Exterior & Landscaping', color: '#16a34a', description: 'Exterior wall construction and finishes', sortOrder: 1, isEditable: true },
  { name: 'Roofing & Gutters', type: 'tier2', parent: 'Exterior & Landscaping', color: '#15803d', description: 'Roof installation and drainage systems', sortOrder: 2, isEditable: true },
  { name: 'Windows & Doors', type: 'tier2', parent: 'Exterior & Landscaping', color: '#166534', description: 'Exterior windows, doors, and openings', sortOrder: 3, isEditable: true },
  { name: 'Landscaping & Hardscape', type: 'tier2', parent: 'Exterior & Landscaping', color: '#15803d', description: 'Landscaping, hardscaping, and outdoor features', sortOrder: 4, isEditable: true },
];

async function populateFlexibleCategories() {
  try {
    console.log('Starting to populate flexible, editable categories for all projects...');
    
    // First, check if categories already exist
    const existingCategories = await sql`
      SELECT name, type FROM project_categories 
      WHERE type IN ('tier1', 'tier2')
      ORDER BY type, name
    `;
    
    if (existingCategories.length > 0) {
      console.log('Found existing categories:');
      existingCategories.forEach(cat => {
        console.log(`  ${cat.type}: ${cat.name}`);
      });
    } else {
      console.log('No existing categories found. Creating flexible category system...');
    }
    
    // Get all projects to populate categories for
    const projects = await sql`SELECT id, name FROM projects WHERE status = 'active'`;
    console.log(`Found ${projects.length} active projects to populate categories for`);
    
    for (const project of projects) {
      console.log(`\nProcessing project: ${project.name} (ID: ${project.id})`);
      
      // Create tier1 categories for this project (these can be edited)
      const tier1Ids = {};
      for (const template of defaultCategorySuggestions) {
        const [category] = await sql`
          INSERT INTO project_categories (project_id, name, type, color, description, sort_order, created_at, updated_at)
          VALUES (${project.id}, ${template.name}, ${template.type}, ${template.color}, ${template.description}, ${template.sortOrder}, NOW(), NOW())
          ON CONFLICT (project_id, name, type) DO UPDATE SET
            color = EXCLUDED.color,
            description = EXCLUDED.description,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
          RETURNING id, name
        `;
        
        tier1Ids[template.name] = category.id;
        console.log(`  Created/Updated tier1 category: ${category.name} (ID: ${category.id}) - EDITABLE`);
      }
      
      // Create tier2 categories for this project (these can also be edited)
      for (const template of flexibleSubcategorySuggestions) {
        const parentId = tier1Ids[template.parent];
        if (!parentId) {
          console.warn(`  Warning: Parent category '${template.parent}' not found for tier2 category '${template.name}'`);
          continue;
        }
        
        const [category] = await sql`
          INSERT INTO project_categories (project_id, name, type, parent_id, color, description, sort_order, created_at, updated_at)
          VALUES (${project.id}, ${template.name}, ${template.type}, ${parentId}, ${template.color}, ${template.description}, ${template.sortOrder}, NOW(), NOW())
          ON CONFLICT (project_id, name, type) DO UPDATE SET
            parent_id = EXCLUDED.parent_id,
            color = EXCLUDED.color,
            description = EXCLUDED.description,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW()
          RETURNING id, name
        `;
        
        console.log(`  Created/Updated tier2 category: ${category.name} (ID: ${category.id}) - EDITABLE`);
      }
      
      // Add a note about customizability
      console.log(`  ✅ Project "${project.name}" now has ${Object.keys(tier1Ids).length} editable tier1 categories and ${flexibleSubcategorySuggestions.length} editable tier2 categories`);
      console.log(`  💡 Project managers can now edit, rename, add, or remove these categories as needed for their specific project`);
    }
    
    console.log('\n✅ Successfully populated flexible, editable categories for all projects!');
    console.log('\n🔧 Key Features of this system:');
    console.log('  • Each project has its own customizable category set');
    console.log('  • Categories can be renamed, added, or removed per project');
    console.log('  • Colors and descriptions can be customized');
    console.log('  • Categories are organized in a logical hierarchy');
    console.log('  • Projects can add their own unique categories');
    
    // Verify the results
    const finalCount = await sql`
      SELECT type, COUNT(*) as count 
      FROM project_categories 
      GROUP BY type 
      ORDER BY type
    `;
    
    console.log('\nFinal category counts:');
    finalCount.forEach(row => {
      console.log(`  ${row.type}: ${row.count}`);
    });
    
    // Show sample of what was created
    const sampleCategories = await sql`
      SELECT pc.name, pc.type, pc.color, pc.description, p.name as project_name
      FROM project_categories pc
      JOIN projects p ON pc.project_id = p.id
      WHERE pc.type = 'tier1'
      ORDER BY p.name, pc.sort_order
      LIMIT 10
    `;
    
    console.log('\nSample of created categories:');
    sampleCategories.forEach(cat => {
      console.log(`  ${cat.project_name}: ${cat.name} (${cat.type}) - ${cat.description}`);
    });
    
  } catch (error) {
    console.error('❌ Error populating flexible categories:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
populateFlexibleCategories().catch(console.error);
