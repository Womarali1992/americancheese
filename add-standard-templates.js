/**
 * Script to add standard construction category templates
 * This will add the main tier1 categories and their common tier2 subcategories
 */

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

const standardTemplates = [
  // Tier 1 Categories
  { name: 'Structural', type: 'tier1', color: '#3b82f6', description: 'Foundation, framing, and core structural work', sortOrder: 1 },
  { name: 'Systems', type: 'tier1', color: '#8b5cf6', description: 'Electrical, plumbing, HVAC systems', sortOrder: 2 },
  { name: 'Sheathing', type: 'tier1', color: '#ec4899', description: 'Insulation, drywall, weatherproofing', sortOrder: 3 },
  { name: 'Finishings', type: 'tier1', color: '#10b981', description: 'Paint, flooring, fixtures, final touches', sortOrder: 4 },
];

const tier2Templates = [
  // Structural subcategories
  { name: 'Foundation', type: 'tier2', parentName: 'Structural', color: '#1e40af', description: 'Foundation and excavation work' },
  { name: 'Framing', type: 'tier2', parentName: 'Structural', color: '#2563eb', description: 'Structural framing and support' },
  { name: 'Roofing', type: 'tier2', parentName: 'Structural', color: '#3b82f6', description: 'Roof structure and materials' },
  
  // Systems subcategories
  { name: 'Electrical', type: 'tier2', parentName: 'Systems', color: '#7c3aed', description: 'Electrical wiring and fixtures' },
  { name: 'Plumbing', type: 'tier2', parentName: 'Systems', color: '#8b5cf6', description: 'Plumbing systems and fixtures' },
  { name: 'HVAC', type: 'tier2', parentName: 'Systems', color: '#a855f7', description: 'Heating, ventilation, and air conditioning' },
  
  // Sheathing subcategories
  { name: 'Insulation', type: 'tier2', parentName: 'Sheathing', color: '#db2777', description: 'Insulation materials and installation' },
  { name: 'Drywall', type: 'tier2', parentName: 'Sheathing', color: '#ec4899', description: 'Drywall installation and finishing' },
  { name: 'Windows', type: 'tier2', parentName: 'Sheathing', color: '#f472b6', description: 'Window installation and sealing' },
  
  // Finishings subcategories
  { name: 'Flooring', type: 'tier2', parentName: 'Finishings', color: '#059669', description: 'Floor materials and installation' },
  { name: 'Paint', type: 'tier2', parentName: 'Finishings', color: '#10b981', description: 'Interior and exterior painting' },
  { name: 'Fixtures', type: 'tier2', parentName: 'Finishings', color: '#34d399', description: 'Lighting and plumbing fixtures' },
];

async function addStandardTemplates() {
  try {
    console.log('Adding standard construction category templates...');
    
    // Check if templates already exist
    const existingTier1 = await sql`
      SELECT name FROM category_templates WHERE type = 'tier1' AND name = ANY(${standardTemplates.map(t => t.name)})
    `;
    
    if (existingTier1.length > 0) {
      console.log('Some standard templates already exist:', existingTier1.map(t => t.name));
      console.log('Skipping duplicates and adding only new ones...');
    }
    
    // Add tier1 categories that don't exist
    for (const template of standardTemplates) {
      const existing = await sql`
        SELECT id FROM category_templates WHERE name = ${template.name} AND type = 'tier1'
      `;
      
      if (existing.length === 0) {
        await sql`
          INSERT INTO category_templates (name, type, color, description, sort_order)
          VALUES (${template.name}, ${template.type}, ${template.color}, ${template.description}, ${template.sortOrder})
        `;
        console.log(`✓ Added tier1 category: ${template.name}`);
      } else {
        console.log(`- Skipped existing tier1 category: ${template.name}`);
      }
    }
    
    // Get tier1 category IDs for tier2 categories
    const tier1Ids = await sql`
      SELECT id, name FROM category_templates WHERE type = 'tier1'
    `;
    const tier1Map = Object.fromEntries(tier1Ids.map(t => [t.name, t.id]));
    
    // Add tier2 categories
    for (const template of tier2Templates) {
      const parentId = tier1Map[template.parentName];
      if (!parentId) {
        console.log(`- Skipped tier2 category ${template.name}: parent ${template.parentName} not found`);
        continue;
      }
      
      const existing = await sql`
        SELECT id FROM category_templates WHERE name = ${template.name} AND type = 'tier2' AND parent_id = ${parentId}
      `;
      
      if (existing.length === 0) {
        await sql`
          INSERT INTO category_templates (name, type, parent_id, color, description, sort_order)
          VALUES (${template.name}, ${template.type}, ${parentId}, ${template.color}, ${template.description}, 0)
        `;
        console.log(`✓ Added tier2 category: ${template.name} under ${template.parentName}`);
      } else {
        console.log(`- Skipped existing tier2 category: ${template.name}`);
      }
    }
    
    console.log('\n✅ Standard construction templates added successfully!');
    console.log('You can now use these in the admin panel to add them to your projects.');
    
  } catch (error) {
    console.error('Error adding standard templates:', error);
  } finally {
    await sql.end();
  }
}

// Run the script
addStandardTemplates();