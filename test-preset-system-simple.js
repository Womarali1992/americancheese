/**
 * Simple test script to verify the preset system structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Preset System Structure...\n');

// Test 1: Check if preset file exists
const presetFile = path.join(__dirname, 'shared', 'presets.ts');
if (fs.existsSync(presetFile)) {
  console.log('✅ Preset file exists');

  // Read the file content to verify structure
  const content = fs.readFileSync(presetFile, 'utf8');

  // Test 2: Check if Home Builder preset is defined
  if (content.includes('HOME_BUILDER_PRESET')) {
    console.log('✅ Home Builder preset is defined');
  } else {
    console.log('❌ Home Builder preset not found');
  }

  // Test 3: Check if expected categories are present
  const expectedCategories = ['Permitting', 'Structural', 'Systems', 'Finishings'];
  let categoriesFound = 0;

  expectedCategories.forEach(category => {
    if (content.includes(`'${category}'`)) {
      categoriesFound++;
      console.log(`✅ Category "${category}" found`);
    } else {
      console.log(`❌ Category "${category}" not found`);
    }
  });

  if (categoriesFound === expectedCategories.length) {
    console.log('✅ All expected categories present');
  }

  // Test 4: Check if preset registry exists
  if (content.includes('AVAILABLE_PRESETS')) {
    console.log('✅ Preset registry exists');
  } else {
    console.log('❌ Preset registry not found');
  }

  // Test 5: Check if default preset is set
  if (content.includes("DEFAULT_PRESET_ID = 'home-builder'")) {
    console.log('✅ Default preset is set to Home Builder');
  } else {
    console.log('❌ Default preset not properly configured');
  }

} else {
  console.log('❌ Preset file not found');
}

console.log('\n🎉 Basic preset structure test completed!');
