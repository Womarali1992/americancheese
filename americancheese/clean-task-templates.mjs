import { AVAILABLE_PRESETS } from './shared/presets.ts';

// Extract all valid tier1 categories from current presets
const validTier1Categories = new Set();

Object.values(AVAILABLE_PRESETS).forEach(preset => {
  preset.categories.tier1.forEach(category => {
    validTier1Categories.add(category.name);
  });
});

console.log('Valid tier1 categories from current presets:');
console.log(Array.from(validTier1Categories).sort());

// These are the categories we should keep in task templates
const validCategories = Array.from(validTier1Categories);

console.log('\nValid categories:');
validCategories.forEach(cat => console.log(`- ${cat}`));

console.log('\nNext step: Filter taskTemplates.ts to only include tasks with these tier1Categories.');