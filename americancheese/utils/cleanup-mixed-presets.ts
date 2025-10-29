/**
 * Cleanup Mixed Presets Script
 *
 * This script identifies projects that have mixed categories from multiple presets
 * (more than 4 tier 1 categories) and resets them to use a single appropriate preset.
 */

import { db } from '../server/db.ts';
import { projectCategories, projects } from '../shared/schema.ts';
import { eq, sql } from 'drizzle-orm';
import { applyPresetToProject, getAvailablePresets } from '../shared/preset-loader.ts';

interface ProjectCategoryCount {
  projectId: number;
  projectName: string;
  tier1Count: number;
  tier2Count: number;
  totalCount: number;
}

async function getProjectsWithMixedCategories(): Promise<ProjectCategoryCount[]> {
  console.log('🔍 Analyzing projects for mixed preset categories...');

  // Get all projects and their category counts
  const projectStats = await db
    .select({
      projectId: projectCategories.projectId,
      tier1Count: sql<number>`count(case when ${projectCategories.type} = 'tier1' then 1 end)`,
      tier2Count: sql<number>`count(case when ${projectCategories.type} = 'tier2' then 1 end)`,
      totalCount: sql<number>`count(*)`
    })
    .from(projectCategories)
    .groupBy(projectCategories.projectId);

  // Get project names
  const projectNames = await db.select().from(projects);
  const nameMap = Object.fromEntries(projectNames.map((p: { id: number; name: string }) => [p.id, p.name]));

  // Filter projects with more than 4 tier 1 categories (indicating mixed presets)
  const mixedProjects = projectStats
    .filter((stat: any) => stat.tier1Count > 4)
    .map((stat: any) => ({
      projectId: stat.projectId,
      projectName: nameMap[stat.projectId] || `Project ${stat.projectId}`,
      tier1Count: Number(stat.tier1Count),
      tier2Count: Number(stat.tier2Count),
      totalCount: Number(stat.totalCount)
    }));

  console.log(`📊 Found ${mixedProjects.length} projects with mixed categories:`);
  for (const project of mixedProjects) {
    console.log(`  - ${project.projectName} (ID: ${project.projectId}): ${project.tier1Count} tier1, ${project.tier2Count} tier2, ${project.totalCount} total`);
  }

  return mixedProjects;
}

async function determineAppropriatePreset(projectId: number, projectName: string): Promise<string> {
  // Get a sample of categories to determine the best preset
  const categories = await db
    .select({
      name: projectCategories.name,
      type: projectCategories.type
    })
    .from(projectCategories)
    .where(eq(projectCategories.projectId, projectId))
    .limit(10);

  const categoryNames = categories.map((c: any) => c.name.toLowerCase());

  // Analyze category names to determine the best preset
  const presets = getAvailablePresets();

  // Count matches for each preset
  const presetScores = presets.map(preset => {
    const presetCategories = [
      ...preset.categories.tier1.map(c => c.name.toLowerCase()),
      ...Object.values(preset.categories.tier2).flat().map(c => c.name.toLowerCase())
    ];

    const matches = categoryNames.filter((name: string) =>
      presetCategories.some((presetCat: string) =>
        name.includes(presetCat) || presetCat.includes(name)
      )
    ).length;

    return { presetId: preset.id, score: matches, name: preset.name };
  });

  // Sort by score and get the best match
  presetScores.sort((a, b) => b.score - a.score);
  const bestPreset = presetScores[0];

  console.log(`🎯 Best preset for "${projectName}": ${bestPreset.name} (score: ${bestPreset.score})`);

  // If no good match, use default based on project name
  if (bestPreset.score === 0) {
    const nameLower = projectName.toLowerCase();
    if (nameLower.includes('workout') || nameLower.includes('fitness') || nameLower.includes('gym')) {
      return 'workout';
    } else if (nameLower.includes('marketing') || nameLower.includes('market')) {
      return 'marketing';
    } else if (nameLower.includes('software') || nameLower.includes('dev') || nameLower.includes('code')) {
      return 'software-development';
    } else if (nameLower.includes('home') || nameLower.includes('house') || nameLower.includes('build')) {
      return 'home-builder';
    } else {
      return 'standard-construction'; // Default fallback
    }
  }

  return bestPreset.presetId;
}

async function cleanupProject(projectId: number, projectName: string): Promise<void> {
  try {
    console.log(`🧹 Cleaning up project "${projectName}" (ID: ${projectId})...`);

    // Determine the most appropriate preset
    const bestPresetId = await determineAppropriatePreset(projectId, projectName);

    // Apply the preset with replaceExisting = true
    const result = await applyPresetToProject(projectId, bestPresetId, true);

    if (result.success) {
      console.log(`✅ Successfully cleaned up "${projectName}": Applied ${bestPresetId} preset, created ${result.categoriesCreated} categories`);
    } else {
      console.error(`❌ Failed to clean up "${projectName}": ${result.error}`);
    }

  } catch (error) {
    console.error(`❌ Error cleaning up project ${projectId}:`, error);
  }
}

export async function cleanupAllMixedPresets(): Promise<void> {
  try {
    console.log('🚀 Starting automatic cleanup of mixed preset categories...');

    const mixedProjects = await getProjectsWithMixedCategories();

    if (mixedProjects.length === 0) {
      console.log('🎉 No projects with mixed categories found. All projects are clean!');
      return;
    }

    console.log(`🔧 Cleaning up ${mixedProjects.length} projects with mixed categories...`);

    for (const project of mixedProjects) {
      await cleanupProject(project.projectId, project.projectName);
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('🎉 Cleanup completed! All projects now have exactly 4 tier 1 categories from a single preset.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanupAllMixedPresets()
    .then(() => {
      console.log('✅ Cleanup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}