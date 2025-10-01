import { db } from './server/db.ts';
import { categoryTemplates } from './shared/schema.ts';
import { eq } from 'drizzle-orm';

try {
  console.log('Cleaning up non-construction categories...');

  // List of construction-related categories that should remain
  const constructionCategories = [
    'Structural', 'Systems', 'Sheathing', 'Finishings', 'Permitting',
    'Foundation', 'Framing', 'Roofing', 'Electrical', 'Plumbing', 'HVAC',
    'Insulation', 'Drywall', 'Windows', 'Flooring', 'Paint', 'Fixtures', 'Landscaping',
    'Building Permits', 'Utility Permits', 'Inspections', 'Documentation'
  ];

  // Get all categories first
  const allCategories = await db.select().from(categoryTemplates);
  console.log('Current categories:', allCategories.map(c => c.name));

  // Delete non-construction categories
  for (const category of allCategories) {
    if (!constructionCategories.includes(category.name)) {
      console.log(`Deleting non-construction category: ${category.name}`);
      await db.delete(categoryTemplates).where(eq(categoryTemplates.id, category.id));
    }
  }

  // Show remaining categories
  const remainingCategories = await db.select().from(categoryTemplates);
  console.log('Remaining categories:', remainingCategories.map(c => c.name));

  console.log('Category cleanup completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Error during cleanup:', error);
  process.exit(1);
}