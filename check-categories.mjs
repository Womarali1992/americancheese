import { db } from './server/db.ts';
import { categoryTemplates } from './shared/schema.ts';

try {
  const categories = await db.select().from(categoryTemplates);
  console.log('Current categories:', JSON.stringify(categories, null, 2));
  process.exit(0);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}