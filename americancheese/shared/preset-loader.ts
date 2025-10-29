/**
 * Preset Loader: Creates projectCategories from presets
 *
 * This module replaces the complex template system with a simple preset-based approach.
 * It creates projectCategories records directly from preset definitions.
 */

import { db } from '../server/db.ts';
import { projectCategories, projects } from './schema.ts';
import {
  HOME_BUILDER_PRESET,
  SOFTWARE_DEVELOPMENT_PRESET,
  STANDARD_CONSTRUCTION_PRESET,
  WORKOUT_PRESET,
  DIGITAL_MARKETING_PRESET,
  AVAILABLE_PRESETS,
  type CategoryPreset
} from './presets.ts';
import { eq } from 'drizzle-orm';
// Note: Theme functions removed to avoid server/client dependencies
// Colors will be handled by the frontend

// Use the centrally defined AVAILABLE_PRESETS from presets.ts

/**
 * Get a preset by ID
 */
export function getPresetById(presetId: string): CategoryPreset | null {
  return AVAILABLE_PRESETS[presetId] || null;
}

/**
 * Get all available presets
 */
export function getAvailablePresets(): CategoryPreset[] {
  return Object.values(AVAILABLE_PRESETS);
}

/**
 * Apply a preset to a project by creating projectCategories
 * Set replaceExisting to true to replace existing categories
 */
export async function applyPresetToProject(projectId: number, presetId: string, replaceExisting: boolean = false): Promise<{
  success: boolean;
  categoriesCreated: number;
  error?: string;
}> {
  try {
    const preset = getPresetById(presetId);
    if (!preset) {
      return { success: false, categoriesCreated: 0, error: `Preset '${presetId}' not found` };
    }

    console.log(`🔧 Applying preset '${preset.name}' to project ${projectId}${replaceExisting ? ' (replacing existing categories)' : ''}`);
    console.log(`🔧 DEBUG: replaceExisting parameter = ${replaceExisting}`);

    // Check if project already has categories
    const existingCategories = await db.select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, projectId));

    if (existingCategories.length > 0) {
      if (!replaceExisting) {
        console.log(`⚠️ Project ${projectId} already has ${existingCategories.length} categories, skipping preset application`);
        return { success: true, categoriesCreated: 0 };
      } else {
        console.log(`🗑️ Project ${projectId} has ${existingCategories.length} existing categories, replacing with preset '${preset.name}'`);
        // Delete existing categories
        await db.delete(projectCategories)
          .where(eq(projectCategories.projectId, projectId));
        console.log(`✅ Deleted ${existingCategories.length} existing categories from project ${projectId}`);
      }
    }

    let categoriesCreated = 0;
    const categoryIdMap = new Map<string, number>(); // Map category name to id for parent references

    // Don't set colors here - let the frontend theme system handle colors
    // This allows the project theme to apply properly

    // Create tier1 categories first
    for (let i = 0; i < preset.categories.tier1.length; i++) {
      const tier1 = preset.categories.tier1[i];
      console.log(`📝 Creating tier1 category: ${tier1.name} (theme will provide colors)`);

      const [tier1Category] = await db.insert(projectCategories).values({
        projectId,
        name: tier1.name,
        type: 'tier1',
        parentId: null,
        description: tier1.description,
        sortOrder: tier1.sortOrder,
        color: null, // No color - let theme system handle it
        templateId: null // Will be set if using actual templates, for presets we use null
      }).returning();

      categoryIdMap.set(tier1.name, tier1Category.id);
      categoriesCreated++;
    }

    // Create tier2 categories
    for (const [tier1Name, tier2List] of Object.entries(preset.categories.tier2)) {
      const parentId = categoryIdMap.get(tier1Name);
      if (!parentId) {
        console.warn(`Parent category '${tier1Name}' not found for tier2 categories`);
        continue;
      }

      for (let j = 0; j < tier2List.length; j++) {
        const tier2 = tier2List[j];
        console.log(`📝 Creating tier2 category: ${tier2.name} under ${tier1Name} (theme will provide colors)`);

        const [tier2Category] = await db.insert(projectCategories).values({
          projectId,
          name: tier2.name,
          type: 'tier2',
          parentId,
          description: tier2.description,
          color: null, // No color - let theme system handle it
          templateId: null // Will be set if using actual templates, for presets we use null
        }).returning();

        categoryIdMap.set(tier2.name, tier2Category.id);
        categoriesCreated++;
      }
    }

    // Update project to record which preset was applied and set recommended theme
    const updateData: any = { presetId };
    if (preset.recommendedTheme) {
      updateData.colorTheme = preset.recommendedTheme;
      updateData.useGlobalTheme = false;
      console.log(`🎨 Setting project theme to recommended theme: ${preset.recommendedTheme}`);
    }
    
    await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId));

    console.log(`Successfully applied preset '${preset.name}' to project ${projectId}: ${categoriesCreated} categories created`);

    return { success: true, categoriesCreated };

  } catch (error) {
    console.error(`Error applying preset to project ${projectId}:`, error);
    return {
      success: false,
      categoriesCreated: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Apply preset to project during project creation
 */
export async function initializeProjectWithPreset(projectId: number, presetId: string = 'home-builder'): Promise<void> {
  console.log(`Initializing project ${projectId} with preset '${presetId}'`);

  const result = await applyPresetToProject(projectId, presetId);
  if (!result.success) {
    console.error(`Failed to initialize project ${projectId} with preset:`, result.error);
    throw new Error(`Failed to apply preset: ${result.error}`);
  }
}

/**
 * Get project categories as a hierarchical structure
 */
export async function getProjectCategoryHierarchy(projectId: number) {
  const categories = await db.select()
    .from(projectCategories)
    .where(eq(projectCategories.projectId, projectId));

  // Build hierarchy
  const tier1Categories = categories.filter((c: any) => c.type === 'tier1').sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const tier2Categories = categories.filter((c: any) => c.type === 'tier2');

  return tier1Categories.map((tier1: any) => ({
    ...tier1,
    children: tier2Categories
      .filter((tier2: any) => tier2.parentId === tier1.id)
      .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }));
}

/**
 * Find category by name in project
 */
export async function findProjectCategoryByName(projectId: number, categoryName: string, type?: 'tier1' | 'tier2') {
  const whereConditions = [
    eq(projectCategories.projectId, projectId),
    eq(projectCategories.name, categoryName)
  ];

  if (type) {
    whereConditions.push(eq(projectCategories.type, type));
  }

  const category = await db.select()
    .from(projectCategories)
    .where(whereConditions[0])
    .limit(1);

  return category[0] || null;
}

/**
 * Helper to get category ID for legacy migration
 */
export async function getCategoryIdForLegacyData(
  projectId: number,
  tier1Category?: string | null,
  tier2Category?: string | null
): Promise<number | null> {
  if (!tier1Category && !tier2Category) return null;

  // Prefer tier2 (more specific) over tier1
  if (tier2Category) {
    const tier2Cat = await findProjectCategoryByName(projectId, tier2Category, 'tier2');
    if (tier2Cat) return tier2Cat.id;
  }

  if (tier1Category) {
    const tier1Cat = await findProjectCategoryByName(projectId, tier1Category, 'tier1');
    if (tier1Cat) return tier1Cat.id;
  }

  return null;
}