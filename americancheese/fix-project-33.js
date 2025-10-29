// Quick fix for project 33 - remove all categories and apply workout preset
import { db } from './server/db.ts';
import { projectCategories } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import { WORKOUT_PRESET } from './shared/presets.ts';

async function fixProject33() {
  const projectId = 33;

  console.log('🔧 Fixing project 33 - removing mixed categories and applying workout preset');

  // Delete all existing categories for project 33
  const existingCategories = await db.select().from(projectCategories).where(eq(projectCategories.projectId, projectId));
  console.log(`Found ${existingCategories.length} existing categories to delete`);

  if (existingCategories.length > 0) {
    await db.delete(projectCategories).where(eq(projectCategories.projectId, projectId));
    console.log(`✅ Deleted ${existingCategories.length} categories`);
  }

  // Apply workout preset manually
  const preset = WORKOUT_PRESET;
  const defaultColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
  let categoriesCreated = 0;
  const categoryIdMap = new Map();

  // Create tier1 categories
  for (let i = 0; i < preset.categories.tier1.length; i++) {
    const tier1 = preset.categories.tier1[i];
    const color = defaultColors[i % defaultColors.length];

    const [tier1Category] = await db.insert(projectCategories).values({
      projectId,
      name: tier1.name,
      type: 'tier1',
      parentId: null,
      description: tier1.description,
      sortOrder: tier1.sortOrder,
      color: color,
      templateId: null
    }).returning();

    categoryIdMap.set(tier1.name, tier1Category.id);
    categoriesCreated++;
    console.log(`✅ Created tier1 category: ${tier1.name}`);
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
      const color = defaultColors[(j + 2) % defaultColors.length];

      await db.insert(projectCategories).values({
        projectId,
        name: tier2.name,
        type: 'tier2',
        parentId,
        description: tier2.description,
        color: color,
        templateId: null
      });

      categoriesCreated++;
      console.log(`✅ Created tier2 category: ${tier2.name} under ${tier1Name}`);
    }
  }

  console.log(`🎉 Fixed project 33! Created ${categoriesCreated} categories from workout preset.`);
}

fixProject33().catch(console.error);