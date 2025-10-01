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
  type Labor,
  type ProjectCategory
} from '../shared/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { EARTH_TONE_THEME, COLOR_THEMES, type ColorTheme } from '../client/src/lib/color-themes';
import { getPresetById, type CategoryPreset, DEFAULT_PRESET_ID, AVAILABLE_PRESETS } from '../shared/presets';
import { getAllTaskTemplates, type TaskTemplate } from '../shared/taskTemplates';

/**
 * Generate a color shade variation of a base color
 * @param baseColor - The base color in hex format (e.g., "#FF0000")
 * @param index - The index of this variation (0-based)
 * @param totalCount - Total number of variations needed
 * @returns A hex color string that's a shade/tint of the base color
 */
function generateColorShade(baseColor: string, index: number, totalCount: number): string {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Generate variation by adjusting brightness
  // First variation is the original, others are lighter/darker
  let factor: number;
  
  if (index === 0) {
    factor = 1.0; // Original color
  } else {
    // Create variations by going lighter and darker alternately
    const step = 0.3 / Math.max(1, totalCount - 1); // Distribute variations across 30% range
    if (index % 2 === 1) {
      // Odd indices go lighter
      factor = 1.0 + (Math.ceil(index / 2) * step);
    } else {
      // Even indices go darker  
      factor = 1.0 - ((index / 2) * step);
    }
  }
  
  // Ensure factor stays in reasonable bounds
  factor = Math.max(0.4, Math.min(1.6, factor));
  
  // Apply factor and clamp to 0-255
  const newR = Math.round(Math.max(0, Math.min(255, r * factor)));
  const newG = Math.round(Math.max(0, Math.min(255, g * factor)));
  const newB = Math.round(Math.max(0, Math.min(255, b * factor)));
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Standard construction category templates
 */
const STANDARD_CATEGORY_TEMPLATES = {
  tier1: [
    { name: 'Structural', color: EARTH_TONE_THEME.tier1.subcategory1, description: 'Foundation, framing, and structural elements', sortOrder: 1 },
    { name: 'Systems', color: EARTH_TONE_THEME.tier1.subcategory2, description: 'Electrical, plumbing, and HVAC systems', sortOrder: 2 },
    { name: 'Sheathing', color: EARTH_TONE_THEME.tier1.subcategory4, description: 'Insulation, drywall, and exterior sheathing', sortOrder: 3 },
    { name: 'Finishings', color: EARTH_TONE_THEME.tier1.subcategory3, description: 'Flooring, paint, fixtures, and final touches', sortOrder: 4 }
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
 * Load templates into a project based on selected preset
 */
export async function loadTemplatesIntoProject(
  projectId: number,
  theme: ColorTheme = EARTH_TONE_THEME,
  presetId: string = DEFAULT_PRESET_ID
): Promise<void> {
  try {
    console.log(`Loading templates into project ${projectId} with preset: ${presetId} and theme: ${theme.name}`);
    console.log(`Available presets:`, Object.keys(AVAILABLE_PRESETS));

    const preset = getPresetById(presetId);
    if (!preset) {
      console.error(`Preset not found: ${presetId}. Available presets:`, Object.keys(AVAILABLE_PRESETS));
      throw new Error(`Preset not found: ${presetId}`);
    }

    console.log(`Found preset: ${preset.name} with ${preset.categories.tier1.length} tier1 categories`);

    const tier1Map: Record<string, number> = {};

    // Load tier1 categories from preset
    for (const tier1Category of preset.categories.tier1) {
      const existing = await db
        .select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, projectId),
          eq(projectCategories.name, tier1Category.name),
          eq(projectCategories.type, 'tier1')
        ));

      if (existing.length === 0) {
        // Apply theme colors based on category name
        let themeColor = getThemeColorForCategory(tier1Category.name, theme, 'tier1');

        const [created] = await db
          .insert(projectCategories)
          .values({
            projectId,
            name: tier1Category.name,
            type: 'tier1',
            color: themeColor,
            description: tier1Category.description,
            sortOrder: tier1Category.sortOrder
          })
          .returning();

        tier1Map[tier1Category.name] = created.id;
        console.log(`Loaded tier1 category: ${tier1Category.name}`);
      } else {
        // Update existing category with new theme color
        let themeColor = getThemeColorForCategory(tier1Category.name, theme, 'tier1');
        
        await db
          .update(projectCategories)
          .set({ color: themeColor })
          .where(eq(projectCategories.id, existing[0].id));
          
        tier1Map[tier1Category.name] = existing[0].id;
        console.log(`Tier1 category already exists, updated color: ${tier1Category.name} -> ${themeColor}`);
      }
    }

    // Load tier2 categories from preset
    for (const [parentName, tier2Categories] of Object.entries(preset.categories.tier2)) {
      const parentId = tier1Map[parentName];
      if (!parentId) {
        console.warn(`Parent category not found: ${parentName}`);
        continue;
      }

      for (const tier2Category of tier2Categories) {
        const existing = await db
          .select()
          .from(projectCategories)
          .where(and(
            eq(projectCategories.projectId, projectId),
            eq(projectCategories.name, tier2Category.name),
            eq(projectCategories.type, 'tier2'),
            eq(projectCategories.parentId, parentId)
          ));

        if (existing.length === 0) {
          // Apply theme colors based on category name
          let themeColor = getThemeColorForCategory(tier2Category.name, theme, 'tier2');

          await db
            .insert(projectCategories)
            .values({
              projectId,
              name: tier2Category.name,
              type: 'tier2',
              parentId: parentId,
              color: themeColor,
              description: tier2Category.description,
              sortOrder: 0
            });

          console.log(`Loaded tier2 category: ${tier2Category.name} under ${parentName}`);
        } else {
          // Update existing category with new theme color
          let themeColor = getThemeColorForCategory(tier2Category.name, theme, 'tier2');
          
          await db
            .update(projectCategories)
            .set({ color: themeColor })
            .where(eq(projectCategories.id, existing[0].id));
            
          console.log(`Tier2 category already exists, updated color: ${tier2Category.name} under ${parentName} -> ${themeColor}`);
        }
      }
    }

    // Load tasks from task templates that match the preset categories
    const allTaskTemplates = getAllTaskTemplates();
    let tasksCreated = 0;
    
    for (const taskTemplate of allTaskTemplates) {
      // Find matching tier1 and tier2 categories in the project (case-insensitive)
      const matchingTier1 = await db
        .select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, projectId),
          sql`lower(${projectCategories.name}) = lower(${taskTemplate.tier1Category})`,
          eq(projectCategories.type, 'tier1')
        ));

      if (matchingTier1.length === 0) {
        continue; // Skip if tier1 category doesn't exist
      }

      const matchingTier2 = await db
        .select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, projectId),
          sql`lower(${projectCategories.name}) = lower(${taskTemplate.tier2Category})`,
          eq(projectCategories.type, 'tier2'),
          eq(projectCategories.parentId, matchingTier1[0].id)
        ));

      if (matchingTier2.length === 0) {
        continue; // Skip if tier2 category doesn't exist
      }

      // Check if task already exists
      const existingTask = await db
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.projectId, projectId),
          eq(tasks.templateId, taskTemplate.id)
        ));

      if (existingTask.length === 0) {
        // Calculate start and end dates based on estimated duration
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + taskTemplate.estimatedDuration);

        await db.insert(tasks).values({
          title: taskTemplate.title,
          description: taskTemplate.description,
          projectId: projectId,
          tier1Category: taskTemplate.tier1Category,
          tier2Category: taskTemplate.tier2Category,
          category: taskTemplate.category,
          startDate: startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
          endDate: endDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
          status: 'not_started',
          completed: false,
          templateId: taskTemplate.id,
          sortOrder: tasksCreated
        });

        tasksCreated++;
        console.log(`Created task: ${taskTemplate.title} (${taskTemplate.id})`);
      }
    }

    console.log(`Templates loaded successfully into project ${projectId} using preset: ${presetId}`);
    console.log(`Created ${tasksCreated} tasks from templates`);
  } catch (error) {
    console.error('Error loading templates into project:', error);
    throw error;
  }
}

/**
 * Helper function to get appropriate theme color for a category
 */
function getThemeColorForCategory(categoryName: string, theme: ColorTheme, type: 'tier1' | 'tier2'): string {
  const categoryNameLower = categoryName.toLowerCase();

  if (type === 'tier1') {
    // Construction categories
    if (categoryNameLower === 'structural' || categoryNameLower === 'permitting') {
      return theme.tier1.subcategory1;
    } else if (categoryNameLower === 'systems') {
      return theme.tier1.subcategory2;
    } else if (categoryNameLower === 'sheathing') {
      return theme.tier1.subcategory4;
    } else if (categoryNameLower === 'finishings') {
      return theme.tier1.subcategory3;
    }
    // Software development categories  
    else if (categoryNameLower === 'software engineering') {
      return '#2563eb'; // Blue - for development/technical
    } else if (categoryNameLower === 'product management') {
      return '#7c3aed'; // Purple - for strategy/planning
    } else if (categoryNameLower === 'design / ux') {
      return '#ec4899'; // Pink - for design/creativity
    } else if (categoryNameLower === 'marketing / go-to-market (gtm)') {
      return '#ea580c'; // Orange - for marketing/growth
    }
  } else if (type === 'tier2') {
    if (theme.tier2[categoryNameLower as keyof typeof theme.tier2]) {
      return theme.tier2[categoryNameLower as keyof typeof theme.tier2];
    }
    // Software development tier2 categories get slightly lighter versions
    const parentName = categoryName.toLowerCase();
    if (parentName.includes('devops') || parentName.includes('architecture') || parentName.includes('application') || parentName.includes('quality')) {
      return '#60a5fa'; // Light blue
    } else if (parentName.includes('strategy') || parentName.includes('discovery') || parentName.includes('roadmap') || parentName.includes('delivery')) {
      return '#a78bfa'; // Light purple
    } else if (parentName.includes('research') || parentName.includes('ui/ux') || parentName.includes('visual') || parentName.includes('interaction')) {
      return '#f472b6'; // Light pink
    } else if (parentName.includes('positioning') || parentName.includes('demand') || parentName.includes('pricing') || parentName.includes('launch')) {
      return '#fb923c'; // Light orange
    }
  }

  // Default fallback colors
  return type === 'tier1' ? '#64748b' : '#94a3b8';
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
export async function applyGlobalThemeToProject(projectId: number, themeInput: ColorTheme | string = EARTH_TONE_THEME): Promise<{ success: boolean; categoriesUpdated?: number; error?: string }> {
  try {
    // Resolve theme input to a ColorTheme object
    let theme: ColorTheme;
    
    if (typeof themeInput === 'string') {
      // Try to find theme by name
      const normalizedThemeName = themeInput.toLowerCase().replace(/\s+/g, '-');
      if (COLOR_THEMES[normalizedThemeName]) {
        theme = COLOR_THEMES[normalizedThemeName];
      } else {
        // Fallback: try to find by exact match or partial match
        const matchingTheme = Object.entries(COLOR_THEMES).find(([key, themeObj]) => 
          key === themeInput || 
          themeObj.name === themeInput ||
          key.includes(themeInput.toLowerCase()) ||
          themeInput.toLowerCase().includes(key)
        );
        
        if (matchingTheme) {
          theme = matchingTheme[1];
        } else {
          console.warn(`Theme "${themeInput}" not found, using default Earth Tone theme`);
          theme = EARTH_TONE_THEME;
        }
      }
    } else {
      // Theme object was passed directly
      theme = themeInput;
    }
    
    console.log(`Applying global theme "${theme.name}" to project ${projectId}`);
    
    // Update project categories with theme colors
    const projectCats = await db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, projectId));
    
    // Process tier1 categories first
    const tier1Categories = projectCats.filter((cat: ProjectCategory) => cat.type === 'tier1');
    const tier2Categories = projectCats.filter((cat: ProjectCategory) => cat.type === 'tier2');
    
    // Update tier1 categories first
    for (const category of tier1Categories) {
      let themeColor = category.color;
      console.log(`Processing tier1 category: "${category.name}" (current color: ${category.color})`);
      
      if (category.type === 'tier1') {
        // Apply theme colors based on category position/order, not name
        const projectTier1Categories = projectCats
          .filter((cat: ProjectCategory) => cat.type === 'tier1')
          .sort((a: ProjectCategory, b: ProjectCategory) => (a.sortOrder || 0) - (b.sortOrder || 0)); // Sort by sortOrder if available
        const categoryIndex = projectTier1Categories.findIndex((cat: ProjectCategory) => cat.id === category.id);
        
        const subcategoryColors = [
          theme.tier1.subcategory1,
          theme.tier1.subcategory2,
          theme.tier1.subcategory3,
          theme.tier1.subcategory4,
          theme.tier1.subcategory5
        ];
        
        // Use modulo to wrap around if there are more categories than colors
        themeColor = subcategoryColors[categoryIndex % subcategoryColors.length] || theme.tier1.default;
        console.log(`Using position-based color ${categoryIndex + 1} for tier1 category "${category.name}": ${themeColor}`);
      }
      
      if (themeColor !== category.color) {
        await db
          .update(projectCategories)
          .set({ color: themeColor })
          .where(eq(projectCategories.id, category.id));
        
        console.log(`Updated tier1 color for ${category.name}: ${themeColor}`);
      }
    }
    
    // Refresh category data after tier1 updates to get the latest colors
    const updatedProjectCats = await db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, projectId));
    
    // Update tier2 categories second (after tier1 colors are updated)
    for (const category of tier2Categories) {
      let themeColor = category.color;
      console.log(`Processing tier2 category: "${category.name}" (current color: ${category.color})`);
      
      // Apply tier2 colors as shades of the parent tier1 category
      const parentTier1 = updatedProjectCats.find((cat: ProjectCategory) => cat.type === 'tier1' && cat.id === category.parentId);
      
      if (parentTier1 && parentTier1.color) {
        const siblingTier2Categories = tier2Categories
          .filter((cat: ProjectCategory) => cat.parentId === category.parentId)
          .sort((a: ProjectCategory, b: ProjectCategory) => (a.sortOrder || 0) - (b.sortOrder || 0)); // Sort by sortOrder if available
        const categoryIndex = siblingTier2Categories.findIndex((cat: ProjectCategory) => cat.id === category.id);
        
        // Generate color variations of the parent tier1 color
        themeColor = generateColorShade(parentTier1.color, categoryIndex, siblingTier2Categories.length);
        console.log(`Using tier2 shade ${categoryIndex + 1}/${siblingTier2Categories.length} of parent color ${parentTier1.color} for category "${category.name}": ${themeColor}`);
      }
      
      if (themeColor !== category.color) {
        await db
          .update(projectCategories)
          .set({ color: themeColor })
          .where(eq(projectCategories.id, category.id));
        
        console.log(`Updated tier2 color for ${category.name}: ${themeColor}`);
      }
    }
    
    console.log(`Global theme applied successfully to project ${projectId}`);
    return { success: true, categoriesUpdated: projectCats.length };
  } catch (error) {
    console.error('Error applying global theme to project:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}