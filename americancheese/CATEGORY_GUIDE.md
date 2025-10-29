# Category System Guide

## How Categories Work

Categories in this application are **PROJECT-SPECIFIC**. Each project has its own set of categories stored in the `project_categories` table.

## Your "Orchestrator Agent" Category

Your custom "Orchestrator Agent" category exists in:

**Project ID: 78**
**Project Name: "HTXAPT.COM WORKFLOW AGENT"**

### Category Structure:
- **Tier 1 (Main Category):** Orchestrator Agent
  - **Tier 2 (Subcategory):** Orchestrator Agent Prompt

## How to Use This Category

### Creating a Task with "Orchestrator Agent" Category:

1. Click "Add Task" or open the task creation dialog
2. **IMPORTANT:** Select **"HTXAPT.COM WORKFLOW AGENT"** from the Project dropdown
3. Wait for categories to load (you'll see console logs)
4. The "Main Category" dropdown will now show: **"Orchestrator Agent"**
5. Select "Orchestrator Agent"
6. The "Subcategory" dropdown will show: **"Orchestrator Agent Prompt"**
7. Select "Orchestrator Agent Prompt"
8. Fill in the rest of the task details and create

## Why Categories Don't Show for Other Projects

If you select a different project (like "Fururistic" or "Omar Work Out"), you'll see DIFFERENT categories because each project has its own category set.

For example:
- **Project: "Fururistic"** → Categories: Push, Pull, Legs, Cardio
- **Project: "Omar Work Out"** → Categories: Push, Pull, Legs, Cardio
- **Project: "HTXAPT.COM WORKFLOW AGENT"** → Categories: Orchestrator Agent

## Adding "Orchestrator Agent" to Other Projects

If you want to use the "Orchestrator Agent" category in a different project, you have two options:

### Option 1: Manually Add via API
```javascript
// POST to /api/projects/{projectId}/categories
{
  "name": "Orchestrator Agent",
  "type": "tier1",
  "parentId": null,
  "sortOrder": 0
}

// Then add the subcategory
{
  "name": "Orchestrator Agent Prompt",
  "type": "tier2",
  "parentId": {tier1_id_from_previous_response},
  "sortOrder": 0
}
```

### Option 2: Create a Custom Preset
1. Go to Admin → Project Templates
2. Create a new preset called "Agent Workflow"
3. Add your categories to the preset
4. Apply the preset to any new project

## Current Project Category Summary

Based on the database, here are all your projects and their categories:

| Project ID | Project Name | Main Categories |
|------------|--------------|----------------|
| 78 | HTXAPT.COM WORKFLOW AGENT | Orchestrator Agent |
| 74 | HTXapt.com Agents | Orchestrator Agent (duplicate), Structural, Systems, Finishings |
| 73 | HTXapt Agents | Education, Points of Interest, Commute/Transportation, Lifestyle |
| 60 | Fururistic | Push, Pull, Legs, Cardio |
| ... | ... | ... |

## Debugging Tips

If categories don't appear:
1. Check the browser console (F12) for logs
2. Look for: "Current Project ID: X"
3. Look for: "Tier 1 Categories: [...]"
4. Make sure the project ID matches the project you want
5. Check that categories exist in the database for that project
