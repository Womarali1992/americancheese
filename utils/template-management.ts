/**
 * Template Management Utilities
 * 
 * This file contains utility functions for managing task templates,
 * including migration, creation, and reset functionality.
 */

import { db } from '../server/db';
import { tasks, taskTemplates, templateCategories } from '../shared/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

/**
 * Creates tasks from templates for a specific project
 * 
 * @param projectId - The ID of the project to create tasks for
 * @param templateIds - Optional array of template IDs to filter by (if not provided, all templates are used)
 * @returns Object with success status and counts
 */
export async function createTasksFromTemplates(projectId: number, templateIds?: string[]) {
  try {
    console.log(`Creating tasks from templates for project ${projectId}`);
    
    // Get all templates, or filter by provided template IDs
    let templates = await db.select().from(taskTemplates);
    
    if (templateIds && templateIds.length > 0) {
      templates = templates.filter(template => 
        templateIds.includes(template.templateId)
      );
    }
    
    console.log(`Found ${templates.length} templates to process`);
    
    // Get all existing tasks for this project that were created from templates
    const existingTasks = await db.select({
      templateId: tasks.templateId
    }).from(tasks).where(
      and(
        eq(tasks.projectId, projectId),
        isNotNull(tasks.templateId)
      )
    );
    
    // Create a set of existing template IDs for faster lookup
    const existingTemplateIds = new Set(existingTasks.map(task => task.templateId));
    console.log(`Project already has ${existingTemplateIds.size} template-based tasks`);
    
    // Filter out templates that already have tasks
    const templatesToCreate = templates.filter(template => 
      !existingTemplateIds.has(template.templateId)
    );
    
    console.log(`Creating ${templatesToCreate.length} new tasks from templates`);
    
    // Create tasks from templates
    const createdTasks = [];
    const today = new Date();
    const threeMonthsLater = new Date();
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    for (const template of templatesToCreate) {
      // Get tier1 and tier2 category names from IDs
      const tier1Category = await db.select().from(templateCategories)
        .where(eq(templateCategories.id, template.tier1CategoryId))
        .then(results => results[0]?.name || 'Structural');
      
      const tier2Category = await db.select().from(templateCategories)
        .where(eq(templateCategories.id, template.tier2CategoryId))
        .then(results => results[0]?.name || 'Foundation');
      
      // Create the task
      const result = await db.insert(tasks).values({
        title: template.title,
        description: template.description,
        projectId: projectId,
        tier1Category: tier1Category,
        tier2Category: tier2Category,
        templateId: template.templateId,
        startDate: today.toISOString().split('T')[0],
        endDate: threeMonthsLater.toISOString().split('T')[0],
        status: 'not_started',
        completed: false
      }).returning();
      
      if (result && result.length > 0) {
        createdTasks.push(result[0]);
        console.log(`Created task from template ${template.templateId}: ${template.title}`);
      }
    }
    
    return {
      success: true,
      templatesFound: templates.length,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    };
  } catch (error) {
    console.error("Error creating tasks from templates:", error);
    return {
      success: false,
      templatesFound: 0,
      tasksCreated: 0,
      tasks: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Resets task templates for a project by removing existing template-based
 * tasks and creating fresh ones from all available templates
 * 
 * @param projectId - The ID of the project to reset templates for
 * @returns Object with success status and counts
 */
export async function resetTaskTemplates(projectId: number) {
  try {
    console.log(`Resetting task templates for project ${projectId}`);
    
    // Step 1: Delete all existing template-based tasks for this project
    const deletedTasks = await db.delete(tasks)
      .where(
        and(
          eq(tasks.projectId, projectId),
          isNotNull(tasks.templateId)
        )
      ).returning();
    
    console.log(`Deleted ${deletedTasks.length} existing template-based tasks`);
    
    // Step 2: Create fresh tasks from all templates
    const creationResult = await createTasksFromTemplates(projectId);
    
    return {
      success: true,
      tasksDeleted: deletedTasks.length,
      tasksCreated: creationResult.tasksCreated,
      tasks: creationResult.tasks
    };
  } catch (error) {
    console.error("Error resetting task templates:", error);
    return {
      success: false,
      tasksDeleted: 0,
      tasksCreated: 0,
      tasks: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Extracts template data from source code file (taskTemplates.ts)
 * 
 * @returns Array of parsed template objects
 */
export async function extractTemplatesFromSourceCode() {
  try {
    const filePath = path.join(process.cwd(), 'shared', 'taskTemplates.ts');
    const sourceCode = await fs.readFile(filePath, 'utf-8');
    
    // Define regex patterns to find template arrays
    const templateArrayPattern = /const\s+(\w+)Tasks:\s+TaskTemplate\[\]\s+=\s+\[([\s\S]*?)\];/g;
    
    // Define regex to parse individual template objects
    const templateObjectPattern = /{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*tier1Category:\s*"([^"]+)",\s*tier2Category:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*estimatedDuration:\s*(\d+),?\s*}/g;
    
    const allTemplates = [];
    let match;
    
    // First extract all the template arrays
    while ((match = templateArrayPattern.exec(sourceCode)) !== null) {
      const arrayName = match[1];
      const arrayContent = match[2];
      
      // Now extract individual template objects from this array
      let templateMatch;
      const templateRegexForArray = new RegExp(templateObjectPattern);
      
      while ((templateMatch = templateRegexForArray.exec(arrayContent)) !== null) {
        allTemplates.push({
          templateId: templateMatch[1],
          title: templateMatch[2],
          description: templateMatch[3],
          tier1CategorySlug: templateMatch[4],
          tier2CategorySlug: templateMatch[5],
          category: templateMatch[6],
          estimatedDuration: parseInt(templateMatch[7], 10)
        });
      }
    }
    
    console.log(`Extracted ${allTemplates.length} templates from source code`);
    return allTemplates;
  } catch (error) {
    console.error(`Error extracting templates from source code: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/**
 * Migrates task templates from source code to database
 * This creates the necessary category tables and populates them
 * 
 * @returns Object with success status and counts
 */
export async function migrateTemplatesToDatabase() {
  try {
    console.log("Starting template migration from source code to database");
    
    // Step 1: Extract templates from source code
    const templates = await extractTemplatesFromSourceCode();
    
    if (templates.length === 0) {
      return {
        success: false,
        error: "No templates found in source code"
      };
    }
    
    // Step 2: Create category records if they don't exist
    const tier1Categories = new Set(templates.map(t => t.tier1CategorySlug));
    const tier2Categories = new Set(templates.map(t => t.tier2CategorySlug));
    
    console.log(`Found ${tier1Categories.size} tier1 categories and ${tier2Categories.size} tier2 categories`);
    
    // Create tier1 categories
    const tier1CategoryMap = new Map();
    
    for (const categorySlug of tier1Categories) {
      // Check if the category already exists
      const existingCategory = await db.select().from(templateCategories)
        .where(
          and(
            eq(templateCategories.type, 'tier1'),
            eq(templateCategories.name, categorySlug)
          )
        ).limit(1);
      
      if (existingCategory.length > 0) {
        tier1CategoryMap.set(categorySlug, existingCategory[0].id);
      } else {
        // Create new category
        const result = await db.insert(templateCategories).values({
          name: categorySlug,
          type: 'tier1'
        }).returning();
        
        if (result.length > 0) {
          tier1CategoryMap.set(categorySlug, result[0].id);
        }
      }
    }
    
    // Create tier2 categories and link to tier1
    const tier2CategoryMap = new Map();
    
    for (const template of templates) {
      const tier1Id = tier1CategoryMap.get(template.tier1CategorySlug);
      if (!tier1Id) continue;
      
      // Create a unique key for tier2 category to handle same name in different tier1 categories
      const tier2Key = `${template.tier1CategorySlug}:${template.tier2CategorySlug}`;
      
      if (!tier2CategoryMap.has(tier2Key)) {
        // Check if the category already exists
        const existingCategory = await db.select().from(templateCategories)
          .where(
            and(
              eq(templateCategories.type, 'tier2'),
              eq(templateCategories.name, template.tier2CategorySlug),
              eq(templateCategories.parentId, tier1Id)
            )
          ).limit(1);
        
        if (existingCategory.length > 0) {
          tier2CategoryMap.set(tier2Key, existingCategory[0].id);
        } else {
          // Create new category
          const result = await db.insert(templateCategories).values({
            name: template.tier2CategorySlug,
            type: 'tier2',
            parentId: tier1Id
          }).returning();
          
          if (result.length > 0) {
            tier2CategoryMap.set(tier2Key, result[0].id);
          }
        }
      }
    }
    
    console.log(`Created/found ${tier1CategoryMap.size} tier1 categories and ${tier2CategoryMap.size} tier2 categories`);
    
    // Step 3: Create task templates
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const template of templates) {
      const tier1Id = tier1CategoryMap.get(template.tier1CategorySlug);
      const tier2Key = `${template.tier1CategorySlug}:${template.tier2CategorySlug}`;
      const tier2Id = tier2CategoryMap.get(tier2Key);
      
      if (!tier1Id || !tier2Id) {
        console.log(`Skipping template ${template.templateId}: Missing category mapping`);
        skippedCount++;
        continue;
      }
      
      // Check if template already exists
      const existingTemplate = await db.select().from(taskTemplates)
        .where(eq(taskTemplates.templateId, template.templateId))
        .limit(1);
      
      if (existingTemplate.length > 0) {
        // Update existing template
        await db.update(taskTemplates)
          .set({
            title: template.title,
            description: template.description,
            tier1CategoryId: tier1Id,
            tier2CategoryId: tier2Id,
            estimatedDuration: template.estimatedDuration,
            updatedAt: new Date()
          })
          .where(eq(taskTemplates.id, existingTemplate[0].id));
        
        updatedCount++;
      } else {
        // Create new template
        await db.insert(taskTemplates).values({
          templateId: template.templateId,
          title: template.title,
          description: template.description,
          tier1CategoryId: tier1Id,
          tier2CategoryId: tier2Id,
          estimatedDuration: template.estimatedDuration
        });
        
        createdCount++;
      }
    }
    
    console.log(`Template migration complete: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`);
    
    return {
      success: true,
      totalTemplates: templates.length,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
      tier1Categories: tier1CategoryMap.size,
      tier2Categories: tier2CategoryMap.size
    };
  } catch (error) {
    console.error("Error migrating templates to database:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}