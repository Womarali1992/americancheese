/**
 * Template Management Utilities
 * 
 * This module provides utility functions for managing task templates,
 * category templates, and project template loading
 */

import { db } from '../server/db';
import { 
  categoryTemplates, 
  taskTemplates, 
  projectCategories,
  projects,
  tasks,
  materials,
  labor,
  type Task,
  type Material,
  type Labor
} from '../shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { EARTH_TONE_THEME, type ColorTheme } from '../client/src/lib/color-themes';

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
export async function initializeStandardTemplates(): Promise<void> {
  try {
    console.log('Initializing standard category templates...');
    
    // First, create tier1 templates
    const tier1Map: Record<string, number> = {};
    
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
  } catch (error) {
    console.error('Error initializing standard templates:', error);
    throw error;
  }
}

/**
 * Load templates into a project with the current global theme
 */
export async function loadTemplatesIntoProject(projectId: number, theme: ColorTheme = EARTH_TONE_THEME): Promise<void> {
  try {
    console.log(`Loading templates into project ${projectId} with theme: ${theme.name}`);
    
    // Get all tier1 templates
    const tier1Templates = await db
      .select()
      .from(categoryTemplates)
      .where(eq(categoryTemplates.type, 'tier1'))
      .orderBy(categoryTemplates.sortOrder);
    
    const tier1Map: Record<number, number> = {};
    
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
          themeColor = theme.tier1.structural;
        } else if (templateNameLower === 'systems') {
          themeColor = theme.tier1.systems;
        } else if (templateNameLower === 'sheathing') {
          themeColor = theme.tier1.sheathing;
        } else if (templateNameLower === 'finishings') {
          themeColor = theme.tier1.finishings;
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
          
          if (theme.tier2[templateNameLower]) {
            themeColor = theme.tier2[templateNameLower];
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
  } catch (error) {
    console.error('Error loading templates into project:', error);
    throw error;
  }
}

/**
 * Clean up phantom categories from the database
 */
export async function cleanupPhantomCategories(): Promise<void> {
  try {
    console.log('Starting cleanup of phantom categories...');
    
    // Find tasks with phantom tier1 categories that don't exist in project_categories
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
    
    // We'll preserve the data by updating the categories to proper case and ensuring
    // project categories exist for any projects that reference these phantom categories
    
    const phantomCategoryMap: Record<string, string> = {
      'structural': 'Structural',
      'systems': 'Systems',
      'sheathing': 'Sheathing',
      'finishings': 'Finishings'
    };
    
    // Get all projects that might be affected
    const affectedProjects = new Set<number>();
    phantomTasks.forEach((task: Task) => affectedProjects.add(task.projectId));
    phantomMaterials.forEach((material: Material) => affectedProjects.add(material.projectId));
    phantomLabor.forEach((labor: Labor) => affectedProjects.add(labor.projectId));
    
    console.log(`Found ${affectedProjects.size} projects affected by phantom categories`);
    
    // For each affected project, ensure proper categories exist
    for (const projectId of Array.from(affectedProjects)) {
      console.log(`Fixing phantom categories for project ${projectId}`);
      await loadTemplatesIntoProject(projectId);
    }
    
    // Update tasks with proper tier1 categories
    for (const [phantom, proper] of Object.entries(phantomCategoryMap)) {
      await db
        .update(tasks)
        .set({ tier1Category: proper })
        .where(eq(tasks.tier1Category, phantom));
    }
    
    // Update materials with proper tier categories
    for (const [phantom, proper] of Object.entries(phantomCategoryMap)) {
      await db
        .update(materials)
        .set({ tier: proper.toLowerCase() })
        .where(eq(materials.tier, phantom));
    }
    
    // Update labor with proper tier1 categories
    for (const [phantom, proper] of Object.entries(phantomCategoryMap)) {
      await db
        .update(labor)
        .set({ tier1Category: proper })
        .where(eq(labor.tier1Category, phantom));
    }
    
    console.log('Phantom categories cleanup completed successfully');
  } catch (error) {
    console.error('Error cleaning up phantom categories:', error);
    throw error;
  }
}

/**
 * Apply global theme defaults to a project
 */
export async function applyGlobalThemeToProject(projectId: number, theme: ColorTheme = EARTH_TONE_THEME): Promise<void> {
  try {
    console.log(`Applying global theme "${theme.name}" to project ${projectId}`);
    
    // Update project categories with theme colors
    const projectCats = await db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, projectId));
    
    for (const category of projectCats) {
      let themeColor = category.color;
      const categoryNameLower = category.name.toLowerCase();
      
      if (category.type === 'tier1') {
        if (categoryNameLower === 'structural') {
          themeColor = theme.tier1.structural;
        } else if (categoryNameLower === 'systems') {
          themeColor = theme.tier1.systems;
        } else if (categoryNameLower === 'sheathing') {
          themeColor = theme.tier1.sheathing;
        } else if (categoryNameLower === 'finishings') {
          themeColor = theme.tier1.finishings;
        }
      } else if (category.type === 'tier2') {
        if (theme.tier2[categoryNameLower]) {
          themeColor = theme.tier2[categoryNameLower];
        }
      }
      
      if (themeColor !== category.color) {
        await db
          .update(projectCategories)
          .set({ color: themeColor })
          .where(eq(projectCategories.id, category.id));
        
        console.log(`Updated color for ${category.name}: ${themeColor}`);
      }
    }
    
    console.log(`Global theme applied successfully to project ${projectId}`);
  } catch (error) {
    console.error('Error applying global theme to project:', error);
    throw error;
  }
}