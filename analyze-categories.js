import { db } from './server/db.js';
import { tasks, materials, labor, projectCategories, categoryTemplates } from './shared/schema.js';

async function analyzeData() {
  console.log('=== ANALYZING EXISTING CATEGORY DATA ===\n');

  try {
    // Check tasks with legacy categories
    const tasksWithLegacy = await db.select({
      id: tasks.id,
      projectId: tasks.projectId,
      tier1Category: tasks.tier1Category,
      tier2Category: tasks.tier2Category,
      categoryId: tasks.categoryId
    }).from(tasks);

    console.log('Tasks with category data:');
    console.log('Total tasks:', tasksWithLegacy.length);
    const tasksWithTier1 = tasksWithLegacy.filter(t => t.tier1Category);
    const tasksWithTier2 = tasksWithLegacy.filter(t => t.tier2Category);
    const tasksWithCategoryId = tasksWithLegacy.filter(t => t.categoryId);
    console.log('Tasks with tier1Category:', tasksWithTier1.length);
    console.log('Tasks with tier2Category:', tasksWithTier2.length);
    console.log('Tasks with new categoryId:', tasksWithCategoryId.length);

    // Show unique tier1 categories
    const uniqueTier1 = [...new Set(tasksWithLegacy.filter(t => t.tier1Category).map(t => t.tier1Category))];
    console.log('Unique tier1 categories:', uniqueTier1);

    const uniqueTier2 = [...new Set(tasksWithLegacy.filter(t => t.tier2Category).map(t => t.tier2Category))];
    console.log('Unique tier2 categories (first 10):', uniqueTier2.slice(0, 10));

    // Check which projects are involved
    const projectsWithData = [...new Set(tasksWithLegacy.filter(t => t.tier1Category || t.tier2Category).map(t => t.projectId))];
    console.log('Projects with legacy category data:', projectsWithData);

    // Check materials
    const materialsWithLegacy = await db.select({
      id: materials.id,
      projectId: materials.projectId,
      tier: materials.tier,
      tier2Category: materials.tier2Category,
      categoryId: materials.categoryId
    }).from(materials);

    console.log('\nMaterials with category data:');
    console.log('Total materials:', materialsWithLegacy.length);
    const materialsWithTier = materialsWithLegacy.filter(m => m.tier);
    const materialsWithTier2 = materialsWithLegacy.filter(m => m.tier2Category);
    const materialsWithCategoryId = materialsWithLegacy.filter(m => m.categoryId);
    console.log('Materials with legacy tier:', materialsWithTier.length);
    console.log('Materials with tier2Category:', materialsWithTier2.length);
    console.log('Materials with new categoryId:', materialsWithCategoryId.length);

    // Check labor
    const laborWithLegacy = await db.select({
      id: labor.id,
      projectId: labor.projectId,
      tier1Category: labor.tier1Category,
      tier2Category: labor.tier2Category
    }).from(labor);

    console.log('\nLabor with category data:');
    console.log('Total labor entries:', laborWithLegacy.length);
    const laborWithTier1 = laborWithLegacy.filter(l => l.tier1Category);
    const laborWithTier2 = laborWithLegacy.filter(l => l.tier2Category);
    console.log('Labor with tier1Category:', laborWithTier1.length);
    console.log('Labor with tier2Category:', laborWithTier2.length);

    // Check existing projectCategories
    const existingProjectCategories = await db.select().from(projectCategories);
    console.log('\nExisting project categories:');
    console.log('Total project categories:', existingProjectCategories.length);
    const byProject = {};
    existingProjectCategories.forEach(cat => {
      if (!byProject[cat.projectId]) byProject[cat.projectId] = [];
      byProject[cat.projectId].push(cat);
    });
    console.log('Projects with existing categories:', Object.keys(byProject));

    // Check category templates
    const templates = await db.select().from(categoryTemplates);
    console.log('\nCategory templates:');
    console.log('Total templates:', templates.length);
    const tier1Templates = templates.filter(t => t.type === 'tier1');
    const tier2Templates = templates.filter(t => t.type === 'tier2');
    console.log('Tier1 templates:', tier1Templates.length);
    console.log('Tier2 templates:', tier2Templates.length);

    console.log('\n=== MIGRATION STRATEGY ===');
    console.log('1. Need to migrate', tasksWithTier1.length, 'tasks with legacy tier1Category');
    console.log('2. Need to migrate', materialsWithTier.length, 'materials with legacy tier');
    console.log('3. Need to migrate', laborWithTier1.length, 'labor entries with legacy tier1Category');
    console.log('4. Can consolidate', templates.length, 'category templates into projectCategories');
    console.log('5. Projects need category setup - affected projects:', [...new Set([...projectsWithData, ...Object.keys(byProject).map(Number)])]);

  } catch (error) {
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
  }

  process.exit(0);
}

analyzeData().catch(console.error);