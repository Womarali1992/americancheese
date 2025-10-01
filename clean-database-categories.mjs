import { AVAILABLE_PRESETS } from './shared/presets.ts';

// Extract all valid category names from current presets
const validCategoryNames = new Set();

Object.values(AVAILABLE_PRESETS).forEach(preset => {
  // Add tier1 categories
  preset.categories.tier1.forEach(category => {
    validCategoryNames.add(category.name);
  });

  // Add tier2 categories
  Object.values(preset.categories.tier2).forEach(tier2Categories => {
    tier2Categories.forEach(category => {
      validCategoryNames.add(category.name);
    });
  });
});

console.log('Valid categories from presets:');
console.log(Array.from(validCategoryNames).sort());

// Categories to delete (not in any current preset)
const categoriesToDelete = [
  'Activation & Conversion',
  'Acquisition',
  'Awareness',
  'Retention & Advocacy',
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4',
  // Add more as needed
];

console.log('\\nCategories that should be deleted:');
console.log(categoriesToDelete);

console.log('\\nScript ready to clean database categories.');
console.log('The categories listed above will be removed from the database.');