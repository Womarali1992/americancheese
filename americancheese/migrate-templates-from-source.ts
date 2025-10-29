/**
 * Script to migrate all task templates from shared/taskTemplates.ts to the database
 * 
 * Run with: npx tsx migrate-templates-from-source.ts
 */

import { taskTemplates, getAllTaskTemplates } from './shared/taskTemplates';
import fetch from 'node-fetch';

async function main() {
  const AUTH_TOKEN = 'cm-app-auth-token-123456';

  try {
    console.log('Starting template migration process...');
    console.log(`Found ${getAllTaskTemplates().length} templates to migrate.`);
    
    // Fetch existing template categories
    console.log('Fetching existing template categories...');
    const categoriesResponse = await fetch('http://localhost:5000/api/admin/template-categories', {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (!categoriesResponse.ok) {
      throw new Error(`Failed to fetch categories: ${categoriesResponse.statusText}`);
    }
    
    const existingCategories = await categoriesResponse.json();
    console.log(`Found ${existingCategories.length} existing categories.`);
    
    // Create categories if they don't exist
    const tier1Categories = ['structural', 'systems', 'sheathing', 'finishings'];
    const tier2Categories: Record<string, string[]> = {
      'structural': ['foundation', 'framing', 'roofing'],
      'systems': ['plumbing', 'hvac', 'electrical'],
      'sheathing': ['exteriors', 'drywall', 'barriers'],
      'finishings': ['landscaping', 'trim', 'cabinentry', 'flooring']
    };
    
    const categoryMap: Record<string, { id: number, subcategories: Record<string, number> }> = {};
    
    // Create/get tier1 categories
    for (const tier1 of tier1Categories) {
      let tier1Category = existingCategories.find((cat: any) => 
        cat.type === 'tier1' && cat.name.toLowerCase() === tier1
      );
      
      if (!tier1Category) {
        console.log(`Creating tier1 category: ${tier1}`);
        const response = await fetch('http://localhost:5000/api/admin/template-categories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: tier1.charAt(0).toUpperCase() + tier1.slice(1),
            type: 'tier1'
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create tier1 category ${tier1}: ${response.statusText}`);
        }
        
        tier1Category = await response.json();
      }
      
      categoryMap[tier1] = { id: tier1Category.id, subcategories: {} };
      
      // Create/get tier2 categories
      for (const tier2 of tier2Categories[tier1]) {
        let tier2Category = existingCategories.find((cat: any) => 
          cat.type === 'tier2' && 
          cat.name.toLowerCase() === tier2 && 
          cat.parentId === tier1Category.id
        );
        
        if (!tier2Category) {
          console.log(`Creating tier2 category: ${tier2} under ${tier1}`);
          const response = await fetch('http://localhost:5000/api/admin/template-categories', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: tier2.charAt(0).toUpperCase() + tier2.slice(1),
              type: 'tier2',
              parentId: tier1Category.id
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create tier2 category ${tier2}: ${response.statusText}`);
          }
          
          tier2Category = await response.json();
        }
        
        categoryMap[tier1].subcategories[tier2] = tier2Category.id;
      }
    }
    
    // Fetch existing templates to avoid duplicates
    console.log('Fetching existing templates...');
    const templatesResponse = await fetch('http://localhost:5000/api/admin/task-templates', {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    if (!templatesResponse.ok) {
      throw new Error(`Failed to fetch templates: ${templatesResponse.statusText}`);
    }
    
    const existingTemplates = await templatesResponse.json();
    const existingTemplateIds = new Set(existingTemplates.map((t: any) => t.templateId));
    
    console.log(`Found ${existingTemplates.length} existing templates.`);
    
    // Create templates
    let created = 0;
    let skipped = 0;
    
    for (const tier1 in taskTemplates) {
      const tier1Id = categoryMap[tier1].id;
      
      for (const tier2 in taskTemplates[tier1]) {
        const tier2Id = categoryMap[tier1].subcategories[tier2];
        const templates = taskTemplates[tier1][tier2];
        
        for (const template of templates) {
          if (existingTemplateIds.has(template.id)) {
            console.log(`Skipping existing template: ${template.id} - ${template.title}`);
            skipped++;
            continue;
          }
          
          console.log(`Creating template: ${template.id} - ${template.title}`);
          
          const response = await fetch('http://localhost:5000/api/admin/task-templates', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AUTH_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              templateId: template.id,
              title: template.title,
              description: template.description,
              tier1CategoryId: tier1Id,
              tier2CategoryId: tier2Id,
              estimatedDuration: template.estimatedDuration
            })
          });
          
          if (!response.ok) {
            console.error(`Failed to create template ${template.id}: ${response.statusText}`);
            console.error(await response.text());
            continue;
          }
          
          created++;
          
          // Add a small delay to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`Created: ${created} templates`);
    console.log(`Skipped: ${skipped} templates (already existed)`);
    console.log(`Total: ${created + skipped} templates processed`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

main();