import type { Express, Request, Response } from "express";
import { db } from "./db";
import { tasks, projects, materials, taskAttachments, checklistItems } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import OpenAI from "openai";

// In-memory webhook registry (in production, store in database)
interface WebhookRegistration {
  id: string;
  url: string;
  events: string[];
  projectId?: number; // Optional: filter to specific project
  active: boolean;
  secret?: string; // Optional secret for signature verification
  createdAt: Date;
}

const webhookRegistry: Map<string, WebhookRegistration> = new Map();

// Content templates for different task categories
const contentTemplates: Record<string, {
  checklistItems?: string[];
  materialsNeeded?: string;
  suggestedDeliverables?: string[];
}> = {
  // Creative Strategy - Audience & Job To Be Done
  "Audience & Job To Be Done": {
    checklistItems: [
      "Research and document customer segments",
      "Conduct customer interviews (3-5 minimum)",
      "Analyze competitor customer base",
      "Create segment profiles with personas",
      "Validate segments with sales/customer success",
      "Document decision criteria and buying triggers"
    ],
    materialsNeeded: "Customer interview templates, Survey tools (Typeform/Google Forms), CRM data access, Competitor research tools",
    suggestedDeliverables: ["Customer Segment Matrix", "Persona Documents", "Pain Point Map", "Trigger Event List"]
  },
  "Offer Design": {
    checklistItems: [
      "Define core value proposition",
      "Create offer tier structure",
      "Design risk reversal elements",
      "Calculate pricing and margins",
      "Create offer comparison matrix",
      "Test offer messaging with prospects"
    ],
    materialsNeeded: "Pricing calculator, Competitor offer analysis, Landing page builder, A/B testing tools",
    suggestedDeliverables: ["Offer Matrix", "Pricing Sheet", "Landing Page Copy", "Comparison Table"]
  },
  "Angle Library": {
    checklistItems: [
      "Research top-performing competitor angles",
      "List all unique selling points",
      "Create hook variations (5 per angle)",
      "Document proof elements for each angle",
      "Test angles with focus group or ads",
      "Rank angles by conversion potential"
    ],
    materialsNeeded: "Ad spy tools, Creative testing platform, Copy templates, Swipe file access",
    suggestedDeliverables: ["Angle Swipe File", "Hook Variations Doc", "Proof Asset Library"]
  },
  "Creative Brief": {
    checklistItems: [
      "Complete audience section",
      "Define single-minded message",
      "Outline creative format requirements",
      "List required proof assets",
      "Create shot-by-shot script",
      "Get stakeholder approval"
    ],
    materialsNeeded: "Creative brief template, Brand guidelines, Asset library access, Approval workflow tool",
    suggestedDeliverables: ["Creative Brief Document", "Script Outline", "Shot List", "Asset Checklist"]
  },
  // Marketing / GTM
  "Positioning & Messaging": {
    checklistItems: [
      "Conduct competitive positioning analysis",
      "Define unique value proposition",
      "Create messaging framework",
      "Develop taglines and headlines",
      "Test messaging with target audience",
      "Document brand voice guidelines"
    ],
    materialsNeeded: "Positioning canvas template, Message testing tools, Brand guidelines document, Competitor messaging audit",
    suggestedDeliverables: ["Positioning Statement", "Messaging Framework", "Brand Voice Guide", "Tagline Options"]
  },
  "Demand Gen & Acquisition": {
    checklistItems: [
      "Map customer acquisition channels",
      "Set up tracking and attribution",
      "Create lead magnets and CTAs",
      "Build landing pages",
      "Set up email nurture sequences",
      "Launch and optimize campaigns"
    ],
    materialsNeeded: "Marketing automation platform, Landing page builder, Analytics tools, Ad platforms access, CRM integration",
    suggestedDeliverables: ["Channel Strategy Doc", "Campaign Briefs", "Landing Pages", "Email Sequences", "Performance Dashboard"]
  },
  "Pricing & Packaging": {
    checklistItems: [
      "Research competitor pricing",
      "Analyze customer willingness to pay",
      "Design pricing tiers",
      "Create feature bundling matrix",
      "Test pricing with sales team",
      "Document pricing strategy"
    ],
    materialsNeeded: "Pricing research tools, Survey tools, Spreadsheet for modeling, Competitor pricing database",
    suggestedDeliverables: ["Pricing Strategy Doc", "Price List", "Feature Matrix", "ROI Calculator"]
  },
  "Launch & Analytics": {
    checklistItems: [
      "Create launch timeline",
      "Set up analytics and tracking",
      "Prepare launch communications",
      "Train sales and support teams",
      "Execute launch campaign",
      "Monitor and report on KPIs"
    ],
    materialsNeeded: "Project management tool, Analytics platform, Communication templates, Training materials",
    suggestedDeliverables: ["Launch Plan", "Analytics Dashboard", "Training Deck", "Post-Launch Report"]
  },
  // Content Types
  "Renter Guides": {
    checklistItems: [
      "Research topic thoroughly",
      "Outline guide structure",
      "Write first draft",
      "Add visuals and examples",
      "Edit and proofread",
      "Format for distribution",
      "Set up download/access tracking"
    ],
    materialsNeeded: "Content management system, Design tools (Canva/Figma), Stock images, SEO tools",
    suggestedDeliverables: ["PDF Guide", "Web Version", "Downloadable Checklist", "Social Snippets"]
  },
  "Video Scripts": {
    checklistItems: [
      "Research hook patterns",
      "Write script outline",
      "Draft full script with timing",
      "Create B-roll shot list",
      "Review with stakeholders",
      "Final script approval"
    ],
    materialsNeeded: "Script template, Video editing software reference, B-roll library, Teleprompter app",
    suggestedDeliverables: ["Full Script Doc", "Shot List", "Timing Breakdown", "B-Roll Requirements"]
  },
  "Social Media Content": {
    checklistItems: [
      "Research trending topics and formats",
      "Create content calendar",
      "Design post templates",
      "Write copy variations",
      "Schedule content",
      "Set up engagement monitoring"
    ],
    materialsNeeded: "Social media scheduling tool, Design templates, Analytics access, Hashtag research tools",
    suggestedDeliverables: ["Content Calendar", "Post Templates", "Caption Library", "Hashtag Strategy"]
  }
};

export function registerAutomationRoutes(app: Express): void {
  // ==================== WEBHOOK REGISTRY ====================

  // Register a new webhook
  app.post("/api/webhooks/register", async (req: Request, res: Response) => {
    try {
      const { url, events, projectId, secret } = req.body;

      if (!url || !events || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({
          error: "URL and events array are required"
        });
      }

      const validEvents = [
        "task.created", "task.updated", "task.completed", "task.deleted",
        "material.created", "material.updated",
        "project.created", "project.updated",
        "checklist.completed"
      ];

      const invalidEvents = events.filter(e => !validEvents.includes(e));
      if (invalidEvents.length > 0) {
        return res.status(400).json({
          error: `Invalid events: ${invalidEvents.join(", ")}`,
          validEvents
        });
      }

      const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const webhook: WebhookRegistration = {
        id,
        url,
        events,
        projectId: projectId ? parseInt(projectId) : undefined,
        active: true,
        secret,
        createdAt: new Date()
      };

      webhookRegistry.set(id, webhook);

      res.status(201).json({
        message: "Webhook registered successfully",
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          projectId: webhook.projectId,
          active: webhook.active
        }
      });
    } catch (error) {
      console.error("Error registering webhook:", error);
      res.status(500).json({ error: "Failed to register webhook" });
    }
  });

  // List all webhooks
  app.get("/api/webhooks", async (req: Request, res: Response) => {
    try {
      const webhooks = Array.from(webhookRegistry.values()).map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        projectId: w.projectId,
        active: w.active,
        createdAt: w.createdAt
      }));

      res.json({ webhooks });
    } catch (error) {
      console.error("Error listing webhooks:", error);
      res.status(500).json({ error: "Failed to list webhooks" });
    }
  });

  // Delete a webhook
  app.delete("/api/webhooks/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      if (!webhookRegistry.has(id)) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      webhookRegistry.delete(id);
      res.json({ message: "Webhook deleted successfully" });
    } catch (error) {
      console.error("Error deleting webhook:", error);
      res.status(500).json({ error: "Failed to delete webhook" });
    }
  });

  // Toggle webhook active state
  app.patch("/api/webhooks/:id/toggle", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const webhook = webhookRegistry.get(id);

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      webhook.active = !webhook.active;
      res.json({
        message: `Webhook ${webhook.active ? 'activated' : 'deactivated'}`,
        active: webhook.active
      });
    } catch (error) {
      console.error("Error toggling webhook:", error);
      res.status(500).json({ error: "Failed to toggle webhook" });
    }
  });

  // Test webhook (send test payload)
  app.post("/api/webhooks/:id/test", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const webhook = webhookRegistry.get(id);

      if (!webhook) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      const testPayload = {
        event: "webhook.test",
        timestamp: new Date().toISOString(),
        data: {
          message: "This is a test webhook payload",
          webhookId: id
        }
      };

      const result = await triggerWebhook(webhook, testPayload);
      res.json({
        message: "Test webhook sent",
        success: result.success,
        response: result.response
      });
    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json({ error: "Failed to test webhook" });
    }
  });

  // ==================== CONTENT GENERATION ====================

  // Auto-generate content for a task based on its category
  app.post("/api/tasks/:taskId/generate-content", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { generateChecklist = true, generateMaterials = true } = req.body;

      // Get the task
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const tier2Category = task.tier2Category;
      const template = tier2Category ? contentTemplates[tier2Category] : null;

      const results: {
        checklistItems?: number;
        materialsUpdated?: boolean;
        suggestedDeliverables?: string[];
      } = {};

      // Generate checklist items
      if (generateChecklist && template?.checklistItems) {
        const existingItems = await db.select().from(checklistItems).where(eq(checklistItems.taskId, taskId));

        if (existingItems.length === 0) {
          // Add checklist items from template
          const itemsToInsert = template.checklistItems.map((title, index) => ({
            taskId,
            title,
            completed: false,
            sortOrder: index
          }));

          await db.insert(checklistItems).values(itemsToInsert);
          results.checklistItems = itemsToInsert.length;
        } else {
          results.checklistItems = 0; // Already has items
        }
      }

      // Update materials needed
      if (generateMaterials && template?.materialsNeeded && !task.materialsNeeded) {
        await db.update(tasks)
          .set({ materialsNeeded: template.materialsNeeded })
          .where(eq(tasks.id, taskId));
        results.materialsUpdated = true;
      }

      // Return suggested deliverables
      if (template?.suggestedDeliverables) {
        results.suggestedDeliverables = template.suggestedDeliverables;
      }

      res.json({
        message: "Content generated successfully",
        taskId,
        category: tier2Category,
        results
      });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // Bulk generate content for all tasks in a project
  app.post("/api/projects/:projectId/generate-all-content", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { generateChecklist = true, generateMaterials = true, onlyEmpty = true } = req.body;

      // Get project
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Get all tasks for project
      const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));

      const results = {
        tasksProcessed: 0,
        checklistItemsCreated: 0,
        materialsUpdated: 0,
        errors: [] as string[]
      };

      for (const task of projectTasks) {
        const tier2Category = task.tier2Category;
        const template = tier2Category ? contentTemplates[tier2Category] : null;

        if (!template) continue;

        try {
          // Generate checklist items
          if (generateChecklist && template.checklistItems) {
            const existingItems = await db.select().from(checklistItems).where(eq(checklistItems.taskId, task.id));

            if (!onlyEmpty || existingItems.length === 0) {
              if (existingItems.length === 0) {
                const itemsToInsert = template.checklistItems.map((title, index) => ({
                  taskId: task.id,
                  title,
                  completed: false,
                  sortOrder: index
                }));

                await db.insert(checklistItems).values(itemsToInsert);
                results.checklistItemsCreated += itemsToInsert.length;
              }
            }
          }

          // Update materials needed
          if (generateMaterials && template.materialsNeeded) {
            if (!onlyEmpty || !task.materialsNeeded) {
              await db.update(tasks)
                .set({ materialsNeeded: template.materialsNeeded })
                .where(eq(tasks.id, task.id));
              results.materialsUpdated++;
            }
          }

          results.tasksProcessed++;
        } catch (taskError) {
          results.errors.push(`Task ${task.id}: ${taskError}`);
        }
      }

      // Trigger webhook for bulk content generation
      await triggerEvent("project.content_generated", {
        projectId,
        projectName: project.name,
        results
      });

      res.json({
        message: "Bulk content generation completed",
        projectId,
        results
      });
    } catch (error) {
      console.error("Error in bulk content generation:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  // ==================== AI CONTENT GENERATION ====================

  // Generate AI content for a task using project context
  app.post("/api/tasks/:taskId/ai-generate", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { outputType = "full", saveToTask = true } = req.body;

      // Check for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({
          error: "OpenAI API key not configured. Add OPENAI_API_KEY to environment."
        });
      }

      // Get the task
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get the project with context
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Parse the structured context
      let projectContext: any = {};
      if (project.structuredContext) {
        try {
          projectContext = JSON.parse(project.structuredContext);
        } catch (e) {
          console.error("Failed to parse project context:", e);
        }
      }

      // Build context sections
      const contextSections = projectContext.sections || [];
      const missionSection = contextSections.find((s: any) => s.type === "mission");
      const scopeSection = contextSections.find((s: any) => s.type === "scope");

      const contextText = `
PROJECT: ${project.name}
LOCATION: ${project.location}

${missionSection ? `MISSION:\n${missionSection.content}\n` : ""}
${scopeSection ? `SCOPE:\n${scopeSection.content}\n` : ""}
`;

      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: openaiApiKey });

      // Build the prompt based on task type
      const systemPrompt = `You are an expert marketing content creator. You have deep knowledge of:
- Trigger event marketing (capturing urgency moments)
- Apartment locating and rental industry
- Digital marketing, social media, and video content
- Creative strategy and offer design

Use the project context provided to create highly relevant, actionable content.
Be specific and practical. Include examples where helpful.
Format your output in clean markdown.`;

      const userPrompt = `
PROJECT CONTEXT:
${contextText}

TASK TO COMPLETE:
Title: ${task.title}
Category: ${task.tier1Category} / ${task.tier2Category}
Description: ${task.description || "No description provided"}

Please create the complete deliverable content for this task.
${outputType === "outline" ? "Provide a detailed outline only." : ""}
${outputType === "full" ? "Provide the full, production-ready content." : ""}
${outputType === "brief" ? "Provide a concise summary and key points." : ""}

Make sure the content:
1. Aligns with the project mission and scope
2. Uses trigger event marketing principles
3. Is specific to the apartment/rental industry
4. Is actionable and ready to use
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      });

      const generatedContent = completion.choices[0]?.message?.content || "";

      // Optionally save to task
      if (saveToTask && generatedContent) {
        // Create an attachment with the generated content
        const fileName = `${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-generated.md`;
        const fileContent = Buffer.from(generatedContent).toString('base64');

        await db.insert(taskAttachments).values({
          taskId,
          fileName,
          fileType: 'text/markdown',
          fileSize: Buffer.byteLength(generatedContent),
          fileContent,
          type: 'document',
          notes: `AI-generated content (${outputType}) - ${new Date().toISOString()}`
        });
      }

      res.json({
        message: "Content generated successfully",
        taskId,
        taskTitle: task.title,
        outputType,
        saved: saveToTask,
        content: generatedContent,
        tokensUsed: completion.usage?.total_tokens || 0
      });
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });

  // Bulk AI generate content for multiple tasks
  app.post("/api/projects/:projectId/ai-generate-all", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const {
        taskIds, // Optional: specific task IDs to process
        outputType = "full",
        saveToTask = true,
        categories // Optional: filter by tier2 categories
      } = req.body;

      // Check for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({
          error: "OpenAI API key not configured. Add OPENAI_API_KEY to environment."
        });
      }

      // Get the project with context
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Parse the structured context
      let projectContext: any = {};
      if (project.structuredContext) {
        try {
          projectContext = JSON.parse(project.structuredContext);
        } catch (e) {
          console.error("Failed to parse project context:", e);
        }
      }

      // Get tasks
      let projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));

      // Filter if specific taskIds provided
      if (taskIds && Array.isArray(taskIds) && taskIds.length > 0) {
        projectTasks = projectTasks.filter(t => taskIds.includes(t.id));
      }

      // Filter by categories if provided
      if (categories && Array.isArray(categories) && categories.length > 0) {
        projectTasks = projectTasks.filter(t => categories.includes(t.tier2Category));
      }

      // Build context
      const contextSections = projectContext.sections || [];
      const missionSection = contextSections.find((s: any) => s.type === "mission");
      const scopeSection = contextSections.find((s: any) => s.type === "scope");

      const contextText = `
PROJECT: ${project.name}
LOCATION: ${project.location}

${missionSection ? `MISSION:\n${missionSection.content}\n` : ""}
${scopeSection ? `SCOPE:\n${scopeSection.content}\n` : ""}
`;

      // Initialize OpenAI
      const openai = new OpenAI({ apiKey: openaiApiKey });

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        totalTokens: 0,
        tasks: [] as { id: number; title: string; status: string; error?: string }[]
      };

      // Process each task
      for (const task of projectTasks) {
        try {
          const systemPrompt = `You are an expert marketing content creator specializing in trigger event marketing for the apartment/rental industry.`;

          const userPrompt = `
PROJECT CONTEXT:
${contextText}

TASK:
Title: ${task.title}
Category: ${task.tier1Category} / ${task.tier2Category}
Description: ${task.description || "No description"}

Create ${outputType === "brief" ? "a concise summary with key points" : outputType === "outline" ? "a detailed outline" : "the complete, production-ready content"} for this task. Use trigger event marketing principles. Be specific to apartment/rental industry.`;

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 3000,
            temperature: 0.7
          });

          const generatedContent = completion.choices[0]?.message?.content || "";
          results.totalTokens += completion.usage?.total_tokens || 0;

          if (saveToTask && generatedContent) {
            const fileName = `${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-generated.md`;
            const fileContent = Buffer.from(generatedContent).toString('base64');

            await db.insert(taskAttachments).values({
              taskId: task.id,
              fileName,
              fileType: 'text/markdown',
              fileSize: Buffer.byteLength(generatedContent),
              fileContent,
              type: 'document',
              notes: `AI-generated content (${outputType}) - ${new Date().toISOString()}`
            });
          }

          results.successful++;
          results.tasks.push({ id: task.id, title: task.title, status: "success" });

        } catch (taskError) {
          results.failed++;
          results.tasks.push({
            id: task.id,
            title: task.title,
            status: "failed",
            error: taskError instanceof Error ? taskError.message : String(taskError)
          });
        }

        results.processed++;
      }

      // Trigger webhook
      await triggerEvent("project.ai_content_generated", {
        projectId,
        projectName: project.name,
        results: {
          processed: results.processed,
          successful: results.successful,
          failed: results.failed
        }
      });

      res.json({
        message: "Bulk AI content generation completed",
        projectId,
        projectName: project.name,
        results
      });
    } catch (error) {
      console.error("Error in bulk AI content generation:", error);
      res.status(500).json({ error: "Failed to generate AI content" });
    }
  });

  // Preview AI generation for a task (without saving)
  app.get("/api/tasks/:taskId/ai-preview", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);

      // Get the task
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get the project with context
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Parse context
      let projectContext: any = {};
      if (project.structuredContext) {
        try {
          projectContext = JSON.parse(project.structuredContext);
        } catch (e) {}
      }

      const contextSections = projectContext.sections || [];
      const missionSection = contextSections.find((s: any) => s.type === "mission");
      const scopeSection = contextSections.find((s: any) => s.type === "scope");

      res.json({
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          tier1Category: task.tier1Category,
          tier2Category: task.tier2Category
        },
        projectContext: {
          name: project.name,
          location: project.location,
          hasMission: !!missionSection,
          hasScope: !!scopeSection,
          missionPreview: missionSection?.content?.substring(0, 200) + "...",
          scopePreview: scopeSection?.content?.substring(0, 200) + "..."
        },
        estimatedTokens: Math.ceil((task.description?.length || 0) / 4) + 500,
        readyForGeneration: !!(missionSection || scopeSection)
      });
    } catch (error) {
      console.error("Error previewing AI generation:", error);
      res.status(500).json({ error: "Failed to preview" });
    }
  });

  // ==================== TASK AUTOMATION TRIGGERS ====================

  // Manually trigger task event (for testing n8n workflows)
  app.post("/api/tasks/:taskId/trigger-event", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { event } = req.body;

      if (!event) {
        return res.status(400).json({ error: "Event type is required" });
      }

      const validEvents = ["task.created", "task.updated", "task.completed"];
      if (!validEvents.includes(event)) {
        return res.status(400).json({
          error: `Invalid event. Valid events: ${validEvents.join(", ")}`
        });
      }

      // Get the task
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get the project
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));

      const payload = {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          tier1Category: task.tier1Category,
          tier2Category: task.tier2Category,
          startDate: task.startDate,
          endDate: task.endDate,
          completed: task.completed,
          templateId: task.templateId
        },
        project: project ? {
          id: project.id,
          name: project.name,
          location: project.location
        } : null
      };

      const triggeredWebhooks = await triggerEvent(event, payload, task.projectId);

      res.json({
        message: "Event triggered successfully",
        event,
        taskId,
        webhooksTriggered: triggeredWebhooks
      });
    } catch (error) {
      console.error("Error triggering event:", error);
      res.status(500).json({ error: "Failed to trigger event" });
    }
  });

  // ==================== N8N WORKFLOW ENDPOINTS ====================

  // Get task data formatted for n8n
  app.get("/api/n8n/tasks/:taskId", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);

      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Get related data
      const [project] = await db.select().from(projects).where(eq(projects.id, task.projectId));
      const taskChecklist = await db.select().from(checklistItems).where(eq(checklistItems.taskId, taskId));
      const taskMaterials = task.materialIds && task.materialIds.length > 0
        ? await db.select().from(materials).where(
            sql`${materials.id} = ANY(${task.materialIds}::int[])`
          )
        : [];

      // Format for n8n consumption
      res.json({
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          tier1Category: task.tier1Category,
          tier2Category: task.tier2Category,
          startDate: task.startDate,
          endDate: task.endDate,
          completed: task.completed,
          materialsNeeded: task.materialsNeeded,
          estimatedCost: task.estimatedCost,
          actualCost: task.actualCost,
          templateId: task.templateId
        },
        project: project ? {
          id: project.id,
          name: project.name,
          location: project.location,
          status: project.status
        } : null,
        checklist: taskChecklist.map(item => ({
          id: item.id,
          title: item.title,
          completed: item.completed,
          section: item.section
        })),
        materials: taskMaterials.map(m => ({
          id: m.id,
          name: m.name,
          quantity: m.quantity,
          cost: m.cost,
          status: m.status
        })),
        metadata: {
          checklistProgress: taskChecklist.length > 0
            ? Math.round((taskChecklist.filter(i => i.completed).length / taskChecklist.length) * 100)
            : 0,
          totalMaterialsCost: taskMaterials.reduce((sum, m) => sum + (m.cost || 0) * m.quantity, 0)
        }
      });
    } catch (error) {
      console.error("Error fetching task for n8n:", error);
      res.status(500).json({ error: "Failed to fetch task data" });
    }
  });

  // Get all tasks for a project formatted for n8n
  app.get("/api/n8n/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { status, category } = req.query;

      let query = db.select().from(tasks).where(eq(tasks.projectId, projectId));

      const projectTasks = await query;

      // Filter by status if provided
      let filteredTasks = projectTasks;
      if (status) {
        filteredTasks = filteredTasks.filter(t => t.status === status);
      }
      if (category) {
        filteredTasks = filteredTasks.filter(t => t.tier2Category === category);
      }

      // Get project info
      const [project] = await db.select().from(projects).where(eq(projects.id, projectId));

      res.json({
        project: project ? {
          id: project.id,
          name: project.name,
          location: project.location,
          status: project.status,
          progress: project.progress
        } : null,
        tasks: filteredTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          tier1Category: t.tier1Category,
          tier2Category: t.tier2Category,
          startDate: t.startDate,
          endDate: t.endDate,
          completed: t.completed,
          templateId: t.templateId
        })),
        summary: {
          total: filteredTasks.length,
          notStarted: filteredTasks.filter(t => t.status === "not_started").length,
          inProgress: filteredTasks.filter(t => t.status === "in_progress").length,
          completed: filteredTasks.filter(t => t.status === "completed" || t.completed).length,
          byCategory: Object.entries(
            filteredTasks.reduce((acc, t) => {
              const cat = t.tier2Category || "uncategorized";
              acc[cat] = (acc[cat] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([category, count]) => ({ category, count }))
        }
      });
    } catch (error) {
      console.error("Error fetching project tasks for n8n:", error);
      res.status(500).json({ error: "Failed to fetch project tasks" });
    }
  });

  // Receive content from n8n and attach to task
  app.post("/api/n8n/tasks/:taskId/content", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { content, contentType, fileName, updateDescription } = req.body;

      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const results: {
        attachmentCreated?: boolean;
        descriptionUpdated?: boolean;
      } = {};

      // If content is provided as text, create an attachment
      if (content && fileName) {
        const fileContent = Buffer.from(content).toString('base64');

        await db.insert(taskAttachments).values({
          taskId,
          fileName: fileName || `generated-content-${Date.now()}.txt`,
          fileType: contentType || 'text/plain',
          fileSize: Buffer.byteLength(content),
          fileContent,
          type: 'document',
          notes: 'Generated by n8n workflow'
        });

        results.attachmentCreated = true;
      }

      // Optionally update task description
      if (updateDescription && content) {
        const newDescription = task.description
          ? `${task.description}\n\n---\n\n${content}`
          : content;

        await db.update(tasks)
          .set({ description: newDescription })
          .where(eq(tasks.id, taskId));

        results.descriptionUpdated = true;
      }

      // Trigger webhook
      await triggerEvent("task.content_added", {
        taskId,
        taskTitle: task.title,
        projectId: task.projectId,
        contentType,
        fileName
      });

      res.json({
        message: "Content added to task",
        taskId,
        results
      });
    } catch (error) {
      console.error("Error adding content to task:", error);
      res.status(500).json({ error: "Failed to add content to task" });
    }
  });

  // Update task status from n8n
  app.patch("/api/n8n/tasks/:taskId/status", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { status, completed } = req.body;

      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      const updateData: { status?: string; completed?: boolean } = {};
      if (status) updateData.status = status;
      if (completed !== undefined) updateData.completed = completed;

      await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

      // Trigger appropriate webhook
      const event = completed || status === "completed" ? "task.completed" : "task.updated";
      await triggerEvent(event, {
        taskId,
        taskTitle: task.title,
        projectId: task.projectId,
        previousStatus: task.status,
        newStatus: status || task.status,
        completed: completed ?? task.completed
      });

      res.json({
        message: "Task status updated",
        taskId,
        status: status || task.status,
        completed: completed ?? task.completed
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ error: "Failed to update task status" });
    }
  });

  console.log("✅ Automation routes registered");
}

// Helper function to trigger webhooks
async function triggerWebhook(
  webhook: WebhookRegistration,
  payload: Record<string, unknown>
): Promise<{ success: boolean; response?: string; error?: string }> {
  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(webhook.secret ? { "X-Webhook-Secret": webhook.secret } : {})
      },
      body: JSON.stringify({
        ...payload,
        webhookId: webhook.id,
        timestamp: new Date().toISOString()
      })
    });

    const responseText = await response.text();
    return {
      success: response.ok,
      response: responseText
    };
  } catch (error) {
    console.error(`Webhook ${webhook.id} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Helper function to trigger event across all matching webhooks
async function triggerEvent(
  event: string,
  data: Record<string, unknown>,
  projectId?: number
): Promise<number> {
  const matchingWebhooks = Array.from(webhookRegistry.values()).filter(
    w => w.active &&
         w.events.includes(event) &&
         (!w.projectId || w.projectId === projectId)
  );

  let triggered = 0;
  for (const webhook of matchingWebhooks) {
    const result = await triggerWebhook(webhook, { event, data });
    if (result.success) triggered++;
  }

  return triggered;
}

// Export the trigger function for use in other routes
export { triggerEvent };
