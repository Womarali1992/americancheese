/**
 * Script to fix phantom categories and initialize proper template system
 * This script will:
 * 1. Initialize standard category templates 
 * 2. Clean up phantom categories
 * 3. Apply global theme defaults to projects
 */

import { db } from './server/db.ts';
import { 
  categoryTemplates, 
  projectCategories,
  projects,
  tasks,
  materials,
  labor
} from './shared/schema.ts';
import { eq, and, or } from 'drizzle-orm';

// Earth tone theme colors (default global theme)
const EARTH_TONE_THEME = {
  name: "Earth Tone",
  tier1: {
    structural: "#556b2f", // Olive green
    systems: "#445566",    // Steel blue
    sheathing: "#9b2c2c",  // Brick red
    finishings: "#8b4513", // Saddle brown
  },
  tier2: {
    foundation: "#047857", // Emerald
    framing: "#65a30d",    // Lime
    roofing: "#15803d",    // Green dark
    electrical: "#2563eb", // Blue
    plumbing: "#0891b2",   // Cyan
    hvac: "#0284c7",       // Sky blue
    insulation: "#b91c1c", // Red dark
    drywall: "#db2777",    // Pink
    windows: "#f59e0b",    // Amber
    flooring: "#a16207",   // Yellow darker
    paint: "#f97316",      // Orange
    fixtures: "#b45309",   // Amber dark
  }
};

/**
 * Standard construction category templates
 */
const STANDARD_CATEGORY_TEMPLATES = {
  tier1: [
    { name: 'Structural', color: EARTH_TONE_THEME.tier1.structural, description: 'Foundation, framing, and structural elements', sortOrder: 1 },
    { name: 'Systems', color: EARTH_TONE_THEME.tier1.systems, description: 'Electrical, plumbing, and HVAC systems', sortOrder: 2 },
    { name: 'Sheathing', color: EARTH_TONE_THEME.tier1.sheathing, description: 'Insulation, drywall, and exterior sheathing', sortOrder: 3 },
    { name: 'Finishings', color: EARTH_TONE_THEME.tier1.finishings, description: 'Flooring, paint, fixtures, and final touches', sortOrder: 4 }
  ],
  tier2: {
    'Structural': [
      { name: 'Foundation', color: EARTH_TONE_THEME.tier2.foundation, description: 'Foundation and excavation work' },
      { name: 'Framing', color: EARTH_TONE_THEME.tier2.framing, description: 'Structural framing and support' },
      { name: 'Roofing', color: EARTH_TONE_THEME.tier2.roofing, description: 'Roof structure and materials' }
    ],
    'Systems': [
      { name: 'Electrical', color: EARTH_TONE_THEME.tier2.electrical, description: 'Electrical wiring and fixtures' },
      { name: 'Plumbing', color: EARTH_TONE_THEME.tier2.plumbing, description: 'Plumbing systems and fixtures' },
      { name: 'HVAC', color: EARTH_TONE_THEME.tier2.hvac, description: 'Heating, ventilation, and air conditioning' }
    ],
    'Sheathing': [
      { name: 'Insulation', color: EARTH_TONE_THEME.tier2.insulation, description: 'Insulation materials and installation' },
      { name: 'Drywall', color: EARTH_TONE_THEME.tier2.drywall, description: 'Drywall installation and finishing' },
      { name: 'Windows', color: EARTH_TONE_THEME.tier2.windows, description: 'Window installation and sealing' }
    ],
    'Finishings': [
      { name: 'Flooring', color: EARTH_TONE_THEME.tier2.flooring, description: 'Floor materials and installation' },
      { name: 'Paint', color: EARTH_TONE_THEME.tier2.paint, description: 'Interior and exterior painting' },
      { name: 'Fixtures', color: EARTH_TONE_THEME.tier2.fixtures, description: 'Light fixtures and hardware' }
    ]
  }
};

/**
 * Initialize standard category templates in the database
 */
async function initializeStandardTemplates() {
  console.log('Initializing standard category templates...');
  
  // First, create tier1 templates
  const tier1Map = {};
  
  for (const tier1Template of STANDARD_CATEGORY_TEMPLATES.tier1) {
    // Check if template already exists
    const existing = await db
      .select()
      .from(categoryTemplates)
      .where(and(
        eq(categoryTemplates.name, tier1Template.name),
        eq(categoryTemplates.type, 'tier1')
      ));
    
    if (existing.length === 0) {
      const [created] = await db
        .insert(categoryTemplates)
        .values({
          name: tier1Template.name,
          type: 'tier1',
          color: tier1Template.color,
          description: tier1Template.description,
          sortOrder: tier1Template.sortOrder
        })
        .returning();
      
      tier1Map[tier1Template.name] = created.id;
      console.log(`Created tier1 template: ${tier1Template.name}`);
    } else {
      tier1Map[tier1Template.name] = existing[0].id;
      console.log(`Tier1 template already exists: ${tier1Template.name}`);
    }
  }
  
  // Then create tier2 templates
  for (const [parentName, tier2Templates] of Object.entries(STANDARD_CATEGORY_TEMPLATES.tier2)) {
    const parentId = tier1Map[parentName];
    
    for (const tier2Template of tier2Templates) {
      const existing = await db
        .select()
        .from(categoryTemplates)
        .where(and(
          eq(categoryTemplates.name, tier2Template.name),
          eq(categoryTemplates.type, 'tier2'),
          eq(categoryTemplates.parentId, parentId)
        ));
      
      if (existing.length === 0) {
        await db
          .insert(categoryTemplates)
          .values({
            name: tier2Template.name,
            type: 'tier2',
            parentId: parentId,
            color: tier2Template.color,
            description: tier2Template.description,
            sortOrder: 0
          });
        
        console.log(`Created tier2 template: ${tier2Template.name} under ${parentName}`);
      } else {
        console.log(`Tier2 template already exists: ${tier2Template.name} under ${parentName}`);
      }
    }
  }
  
  console.log('Standard category templates initialized successfully');
}

/**
 * Load templates into a project with the current global theme
 */
async function loadTemplatesIntoProject(projectId) {
  console.log(`Loading templates into project ${projectId} with Earth Tone theme`);
  
  // Get all tier1 templates
  const tier1Templates = await db
    .select()
    .from(categoryTemplates)
    .where(eq(categoryTemplates.type, 'tier1'))
    .orderBy(categoryTemplates.sortOrder);
  
  const tier1Map = {};
  
  // Load tier1 categories
  for (const template of tier1Templates) {
    const existing = await db
      .select()
      .from(projectCategories)
      .where(and(
        eq(projectCategories.projectId, projectId),
        eq(projectCategories.name, template.name),
        eq(projectCategories.type, 'tier1')
      ));
    
    if (existing.length === 0) {
      // Apply theme colors based on template name
      let themeColor = template.color;
      const templateNameLower = template.name.toLowerCase();
      
      if (templateNameLower === 'structural') {
        themeColor = EARTH_TONE_THEME.tier1.structural;
      } else if (templateNameLower === 'systems') {
        themeColor = EARTH_TONE_THEME.tier1.systems;
      } else if (templateNameLower === 'sheathing') {
        themeColor = EARTH_TONE_THEME.tier1.sheathing;
      } else if (templateNameLower === 'finishings') {
        themeColor = EARTH_TONE_THEME.tier1.finishings;
      }
      
      const [created] = await db
        .insert(projectCategories)
        .values({
          projectId,
          name: template.name,
          type: 'tier1',
          color: themeColor,
          templateId: template.id,
          sortOrder: template.sortOrder || 0
        })
        .returning();
      
      tier1Map[template.id] = created.id;
      console.log(`Loaded tier1 category: ${template.name}`);
    } else {
      tier1Map[template.id] = existing[0].id;
      console.log(`Tier1 category already exists: ${template.name}`);
    }
  }
  
  // Load tier2 categories
  const tier2Templates = await db
    .select()
    .from(categoryTemplates)
    .where(eq(categoryTemplates.type, 'tier2'))
    .orderBy(categoryTemplates.name);
  
  for (const template of tier2Templates) {
    if (template.parentId && tier1Map[template.parentId]) {
      const existing = await db
        .select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, projectId),
          eq(projectCategories.name, template.name),
          eq(projectCategories.type, 'tier2'),
          eq(projectCategories.parentId, tier1Map[template.parentId])
        ));
      
      if (existing.length === 0) {
        // Apply theme colors based on template name
        let themeColor = template.color;
        const templateNameLower = template.name.toLowerCase();
        
        if (EARTH_TONE_THEME.tier2[templateNameLower]) {
          themeColor = EARTH_TONE_THEME.tier2[templateNameLower];
        }
        
        await db
          .insert(projectCategories)
          .values({
            projectId,
            name: template.name,
            type: 'tier2',
            parentId: tier1Map[template.parentId],
            color: themeColor,
            templateId: template.id,
            sortOrder: template.sortOrder || 0
          });
        
        console.log(`Loaded tier2 category: ${template.name}`);
      } else {
        console.log(`Tier2 category already exists: ${template.name}`);
      }
    }
  }
  
  console.log(`Templates loaded successfully into project ${projectId}`);
}

/**
 * Clean up phantom categories from the database
 */
async function cleanupPhantomCategories() {
  console.log('Starting cleanup of phantom categories...');
  
  // Find tasks with phantom tier1 categories
  const phantomTasks = await db
    .select()
    .from(tasks)
    .where(or(
      eq(tasks.tier1Category, 'structural'),
      eq(tasks.tier1Category, 'systems'),
      eq(tasks.tier1Category, 'sheathing'),
      eq(tasks.tier1Category, 'finishings')
    ));
  
  console.log(`Found ${phantomTasks.length} tasks with phantom tier1 categories`);
  
  // Find materials with phantom tier categories
  const phantomMaterials = await db
    .select()
    .from(materials)
    .where(or(
      eq(materials.tier, 'structural'),
      eq(materials.tier, 'systems'),
      eq(materials.tier, 'sheathing'),
      eq(materials.tier, 'finishings')
    ));
  
  console.log(`Found ${phantomMaterials.length} materials with phantom tier categories`);
  
  // Find labor with phantom tier categories
  const phantomLabor = await db
    .select()
    .from(labor)
    .where(or(
      eq(labor.tier1Category, 'structural'),
      eq(labor.tier1Category, 'systems'),
      eq(labor.tier1Category, 'sheathing'),
      eq(labor.tier1Category, 'finishings')
    ));
  
  console.log(`Found ${phantomLabor.length} labor entries with phantom tier1 categories`);
  
  // Map phantom categories to proper case
  const phantomCategoryMap = {
    'structural': 'Structural',
    'systems': 'Systems',
    'sheathing': 'Sheathing',
    'finishings': 'Finishings'
  };
  
  // Get all projects that might be affected
  const affectedProjects = new Set();
  phantomTasks.forEach(task => affectedProjects.add(task.projectId));
  phantomMaterials.forEach(material => affectedProjects.add(material.projectId));
  phantomLabor.forEach(labor => affectedProjects.add(labor.projectId));
  
  console.log(`Found ${affectedProjects.size} projects affected by phantom categories`);
  
  // For each affected project, ensure proper categories exist
  for (const projectId of Array.from(affectedProjects)) {
    console.log(`Fixing phantom categories for project ${projectId}`);
    await loadTemplatesIntoProject(projectId);
  }
  
  // Update tasks with proper tier1 categories
  for (const [phantom, proper] of Object.entries(phantomCategoryMap)) {
    const updateResult = await db
      .update(tasks)
      .set({ tier1Category: proper })
      .where(eq(tasks.tier1Category, phantom));
    console.log(`Updated tasks from ${phantom} to ${proper}`);
  }
  
  // Update materials with proper tier categories
  for (const [phantom, proper] of Object.entries(phantomCategoryMap)) {
    await db
      .update(materials)
      .set({ tier: proper.toLowerCase() })
      .where(eq(materials.tier, phantom));
    console.log(`Updated materials from ${phantom} to ${proper.toLowerCase()}`);
  }
  
  // Update labor with proper tier1 categories
  for (const [phantom, proper] of Object.entries(phantomCategoryMap)) {
    await db
      .update(labor)
      .set({ tier1Category: proper })
      .where(eq(labor.tier1Category, phantom));
    console.log(`Updated labor from ${phantom} to ${proper}`);
  }
  
  console.log('Phantom categories cleanup completed successfully');
}

/**
 * Main function to run the complete fix
 */
async function main() {
  try {
    console.log('Starting complete phantom categories fix...');
    
    // Step 1: Initialize standard templates
    await initializeStandardTemplates();
    
    // Step 2: Clean up phantom categories
    await cleanupPhantomCategories();
    
    console.log('\n✅ Complete phantom categories fix completed successfully!');
    console.log('\nSummary:');
    console.log('- Standard category templates initialized in database');
    console.log('- Phantom categories cleaned up and converted to proper case');
    console.log('- Projects now have proper category structures');
    console.log('- Global theme defaults applied');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during phantom categories fix:', error);
    process.exit(1);
  }
}

// Run the script
main();