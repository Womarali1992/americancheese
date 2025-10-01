/**
 * Simple test script to verify admin preset functionality files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Admin Preset Functionality Files...\n');

// Test 1: Check if shared preset file exists and has correct structure
const presetFile = path.join(__dirname, 'shared', 'presets.ts');
if (fs.existsSync(presetFile)) {
  console.log('✅ Shared presets file exists');

  const content = fs.readFileSync(presetFile, 'utf8');

  // Check for key components
  const checks = [
    { name: 'HOME_BUILDER_PRESET export', pattern: 'export const HOME_BUILDER_PRESET' },
    { name: 'CategoryPreset type', pattern: 'export interface CategoryPreset' },
    { name: 'getPresetById function', pattern: 'export function getPresetById' },
    { name: 'getPresetOptions function', pattern: 'export function getPresetOptions' },
    { name: 'DEFAULT_PRESET_ID', pattern: 'DEFAULT_PRESET_ID = \'home-builder\'' },
    { name: 'Permitting category', pattern: 'Permitting' },
    { name: 'Structural category', pattern: 'Structural' },
    { name: 'Systems category', pattern: 'Systems' },
    { name: 'Finishings category', pattern: 'Finishings' }
  ];

  checks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} not found`);
    }
  });

} else {
  console.log('❌ Shared presets file not found');
}

// Test 2: Check if admin templates file has preset functionality
const adminTemplatesFile = path.join(__dirname, 'client', 'src', 'pages', 'admin', 'project-templates.tsx');
if (fs.existsSync(adminTemplatesFile)) {
  console.log('\n✅ Admin templates file exists');

  const content = fs.readFileSync(adminTemplatesFile, 'utf8');

  const adminChecks = [
    { name: 'Preset import', pattern: 'import.*getPresetById.*from \'@shared/presets\'' },
    { name: 'Load Preset button', pattern: 'Load Preset' },
    { name: 'Preset dialog', pattern: 'Preset Selection Dialog' },
    { name: 'handlePresetSelect function', pattern: 'handlePresetSelect' },
    { name: 'loadPresetCategoriesMutation', pattern: 'loadPresetCategoriesMutation' },
    { name: 'Wand2 icon import', pattern: 'Wand2' }
  ];

  adminChecks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} not found`);
    }
  });

} else {
  console.log('\n❌ Admin templates file not found');
}

// Test 3: Check if server routes have preset endpoint
const serverRoutesFile = path.join(__dirname, 'server', 'routes.ts');
if (fs.existsSync(serverRoutesFile)) {
  console.log('\n✅ Server routes file exists');

  const content = fs.readFileSync(serverRoutesFile, 'utf8');

  const routeChecks = [
    { name: 'Preset categories endpoint', pattern: '/api/projects/:projectId/load-preset-categories' },
    { name: 'loadTemplatesIntoProject import', pattern: 'loadTemplatesIntoProject' },
    { name: 'Preset ID handling', pattern: 'presetId' }
  ];

  routeChecks.forEach(check => {
    if (content.includes(check.pattern)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} not found`);
    }
  });

} else {
  console.log('\n❌ Server routes file not found');
}

console.log('\n🎉 Admin preset functionality files test completed!');
