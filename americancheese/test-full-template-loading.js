/**
 * Test script to test the full template loading function
 */

import 'dotenv/config';
import { loadTemplatesIntoProject } from './utils/template-management.ts';

async function testFullTemplateLoading() {
  try {
    console.log('🧪 Testing full template loading function...\n');
    
    const projectId = 1;
    const presetId = 'home-builder';
    
    console.log(`📋 Loading templates into project ${projectId} with preset: ${presetId}`);
    
    // Load templates into project
    await loadTemplatesIntoProject(projectId, undefined, presetId);
    
    console.log(`✅ Template loading completed successfully!`);
    
  } catch (error) {
    console.error('❌ Error testing template loading:', error);
  }
}

// Run the test function
testFullTemplateLoading().catch(console.error);
