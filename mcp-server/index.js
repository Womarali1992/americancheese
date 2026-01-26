#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from multiple possible locations
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try loading from americancheese subdirectory first, then parent
dotenv.config({ path: join(__dirname, "../americancheese/.env") });
dotenv.config({ path: join(__dirname, "../.env") });

const { Pool } = pg;

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "project_management",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  max: 5,
});

// Helper function to execute queries
async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Create MCP server
const server = new Server(
  {
    name: "american-cheese-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ==================== QUICK START TOOLS ====================
      {
        name: "quick_setup_project",
        description: "Create a new project AND apply a category preset in one step. Returns the project with its categories ready to use.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name" },
            presetId: { type: "string", description: "Preset: ai-agent, software-development, home-builder, marketing-sales, workout, etc." },
            location: { type: "string", description: "Project location (default: 'Remote')" },
            description: { type: "string", description: "Project description" },
          },
          required: ["name", "presetId"],
        },
      },
      {
        name: "get_project_overview",
        description: "Get EVERYTHING about a project in one call: project details, all categories (tier1 + tier2), and task counts by category. Use this first to understand a project.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
          },
          required: ["projectId"],
        },
      },
      {
        name: "add_tasks_batch",
        description: "Create multiple tasks at once. Each task needs title, tier1Category, and tier2Category. Dates default to today + 7 days if not provided.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            tasks: {
              type: "array",
              description: "Array of tasks to create",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Task title" },
                  tier1Category: { type: "string", description: "Tier1 category name" },
                  tier2Category: { type: "string", description: "Tier2 category name" },
                  description: { type: "string", description: "Task description" },
                  status: { type: "string", description: "Status: not_started, in_progress, completed, blocked" },
                },
                required: ["title", "tier1Category", "tier2Category"],
              },
            },
          },
          required: ["projectId", "tasks"],
        },
      },

      // ==================== PROJECT TOOLS ====================
      {
        name: "list_projects",
        description: "List all projects with optional status filter. Returns project id, name, location, status, progress, start/end dates, and description.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              description: "Filter by status: active, completed, on_hold, cancelled",
            },
            limit: {
              type: "number",
              description: "Maximum number of projects to return (default: 50)",
            },
          },
        },
      },
      {
        name: "get_project",
        description: "Get detailed information about a specific project by ID, including all fields like color theme, preset, hidden categories, and selected templates.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The project ID",
            },
          },
          required: ["id"],
        },
      },
      {
        name: "create_project",
        description: "Create a new construction project",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name" },
            location: { type: "string", description: "Project location" },
            description: { type: "string", description: "Project description" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            status: { type: "string", description: "Status: active, completed, on_hold, cancelled" },
            presetId: { type: "string", description: "Category preset ID (e.g., home-builder, commercial)" },
          },
          required: ["name", "location"],
        },
      },
      {
        name: "update_project",
        description: "Update an existing project",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The project ID to update" },
            name: { type: "string", description: "Project name" },
            location: { type: "string", description: "Project location" },
            description: { type: "string", description: "Project description" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            status: { type: "string", description: "Status: active, completed, on_hold, cancelled" },
            progress: { type: "number", description: "Progress percentage (0-100)" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_project",
        description: "Delete a project and all its associated data (tasks, materials, labor, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The project ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== TASK TOOLS ====================
      {
        name: "list_tasks",
        description: "List tasks with optional filters. Returns task id, title, description, status, dates, category info, and costs.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Filter by project ID" },
            status: { type: "string", description: "Filter by status: not_started, in_progress, completed, blocked" },
            tier1Category: { type: "string", description: "Filter by tier1 category (e.g., structural, systems, sheathing, finishings)" },
            tier2Category: { type: "string", description: "Filter by tier2 category (e.g., foundation, framing, electrical, plumbing)" },
            completed: { type: "boolean", description: "Filter by completion status" },
            limit: { type: "number", description: "Maximum number of tasks to return (default: 100)" },
          },
        },
      },
      {
        name: "get_task",
        description: "Get detailed information about a specific task by ID, including all fields, assigned contacts, materials, and template reference.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The task ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_task",
        description: "Create a new task within a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID this task belongs to" },
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task description" },
            tier1Category: { type: "string", description: "Tier1 category: structural, systems, sheathing, finishings" },
            tier2Category: { type: "string", description: "Tier2 category: foundation, framing, electrical, plumbing, etc." },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            status: { type: "string", description: "Status: not_started, in_progress, completed, blocked" },
            assignedTo: { type: "string", description: "Person assigned to this task" },
            estimatedCost: { type: "number", description: "Estimated cost for the task" },
            materialsNeeded: { type: "string", description: "List of materials needed" },
          },
          required: ["projectId", "title", "startDate", "endDate"],
        },
      },
      {
        name: "update_task",
        description: "Update an existing task",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The task ID to update" },
            title: { type: "string", description: "Task title" },
            description: { type: "string", description: "Task description" },
            tier1Category: { type: "string", description: "Tier1 category" },
            tier2Category: { type: "string", description: "Tier2 category" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            status: { type: "string", description: "Status: not_started, in_progress, completed, blocked" },
            completed: { type: "boolean", description: "Mark task as completed" },
            assignedTo: { type: "string", description: "Person assigned to this task" },
            estimatedCost: { type: "number", description: "Estimated cost" },
            actualCost: { type: "number", description: "Actual cost after completion" },
            calendarActive: { type: "boolean", description: "Whether to show this task on the calendar" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_task",
        description: "Delete a task and its associated subtasks, checklist items, and attachments",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The task ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== SUBTASK TOOLS ====================
      {
        name: "list_subtasks",
        description: "List subtasks for a parent task",
        inputSchema: {
          type: "object",
          properties: {
            parentTaskId: { type: "number", description: "The parent task ID" },
          },
          required: ["parentTaskId"],
        },
      },
      {
        name: "create_subtask",
        description: "Create a new subtask under a parent task",
        inputSchema: {
          type: "object",
          properties: {
            parentTaskId: { type: "number", description: "The parent task ID" },
            title: { type: "string", description: "Subtask title" },
            description: { type: "string", description: "Subtask description" },
            assignedTo: { type: "string", description: "Person assigned" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            estimatedCost: { type: "number", description: "Estimated cost" },
          },
          required: ["parentTaskId", "title"],
        },
      },
      {
        name: "update_subtask",
        description: "Update an existing subtask",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The subtask ID" },
            title: { type: "string", description: "Subtask title" },
            description: { type: "string", description: "Subtask description" },
            completed: { type: "boolean", description: "Completion status" },
            status: { type: "string", description: "Status" },
            assignedTo: { type: "string", description: "Person assigned" },
            estimatedCost: { type: "number", description: "Estimated cost" },
            actualCost: { type: "number", description: "Actual cost" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_subtask",
        description: "Delete a subtask",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The subtask ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== MATERIAL TOOLS ====================
      {
        name: "list_materials",
        description: "List materials with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Filter by project ID" },
            status: { type: "string", description: "Filter by status: ordered, quoted, delivered, used" },
            tier2Category: { type: "string", description: "Filter by tier2 category" },
            limit: { type: "number", description: "Maximum number to return (default: 100)" },
          },
        },
      },
      {
        name: "get_material",
        description: "Get detailed information about a specific material",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The material ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_material",
        description: "Create a new material entry",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            name: { type: "string", description: "Material name" },
            type: { type: "string", description: "Material type" },
            tier2Category: { type: "string", description: "Tier2 category (e.g., foundation, framing)" },
            quantity: { type: "number", description: "Quantity" },
            unit: { type: "string", description: "Unit of measurement" },
            cost: { type: "number", description: "Cost per unit" },
            supplier: { type: "string", description: "Supplier name" },
            status: { type: "string", description: "Status: ordered, quoted, delivered, used" },
            details: { type: "string", description: "Additional details" },
          },
          required: ["projectId", "name", "type", "quantity"],
        },
      },
      {
        name: "update_material",
        description: "Update an existing material",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The material ID" },
            name: { type: "string", description: "Material name" },
            type: { type: "string", description: "Material type" },
            tier2Category: { type: "string", description: "Tier2 category" },
            quantity: { type: "number", description: "Quantity" },
            unit: { type: "string", description: "Unit of measurement" },
            cost: { type: "number", description: "Cost per unit" },
            supplier: { type: "string", description: "Supplier name" },
            status: { type: "string", description: "Status: ordered, quoted, delivered, used" },
            details: { type: "string", description: "Additional details" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_material",
        description: "Delete a material entry",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The material ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== LABOR TOOLS ====================
      {
        name: "list_labor",
        description: "List labor entries with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Filter by project ID" },
            taskId: { type: "number", description: "Filter by task ID" },
            status: { type: "string", description: "Filter by status: pending, in_progress, completed, billed" },
            limit: { type: "number", description: "Maximum number to return (default: 100)" },
          },
        },
      },
      {
        name: "get_labor",
        description: "Get a specific labor entry by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The labor entry ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_labor",
        description: "Create a new labor entry",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            taskId: { type: "number", description: "The task ID" },
            contactId: { type: "number", description: "The contact/worker ID" },
            fullName: { type: "string", description: "Worker full name" },
            company: { type: "string", description: "Company name" },
            tier1Category: { type: "string", description: "Tier1 category" },
            tier2Category: { type: "string", description: "Tier2 category" },
            workDate: { type: "string", description: "Work date (YYYY-MM-DD)" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            startTime: { type: "string", description: "Start time (HH:MM)" },
            endTime: { type: "string", description: "End time (HH:MM)" },
            totalHours: { type: "number", description: "Total hours worked" },
            laborCost: { type: "number", description: "Total labor cost" },
            workDescription: { type: "string", description: "Description of work performed" },
            status: { type: "string", description: "Status: pending, in_progress, completed, billed" },
          },
          required: ["projectId", "contactId", "fullName", "company", "workDate", "startDate", "endDate"],
        },
      },
      {
        name: "update_labor",
        description: "Update an existing labor entry",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The labor entry ID" },
            totalHours: { type: "number", description: "Total hours worked" },
            laborCost: { type: "number", description: "Total labor cost" },
            workDescription: { type: "string", description: "Description of work performed" },
            status: { type: "string", description: "Status: pending, in_progress, completed, billed" },
            startTime: { type: "string", description: "Start time (HH:MM)" },
            endTime: { type: "string", description: "End time (HH:MM)" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_labor",
        description: "Delete a labor entry",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The labor entry ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== CONTACT TOOLS ====================
      {
        name: "list_contacts",
        description: "List all contacts with optional filters",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Filter by type: contractor, supplier, consultant, etc." },
            category: { type: "string", description: "Filter by category: electrical, plumbing, concrete, etc." },
            limit: { type: "number", description: "Maximum number to return (default: 100)" },
          },
        },
      },
      {
        name: "get_contact",
        description: "Get a specific contact by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The contact ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_contact",
        description: "Create a new contact",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Contact name" },
            role: { type: "string", description: "Role/position" },
            company: { type: "string", description: "Company name" },
            phone: { type: "string", description: "Phone number" },
            email: { type: "string", description: "Email address" },
            type: { type: "string", description: "Type: contractor, supplier, consultant, etc." },
            category: { type: "string", description: "Category: electrical, plumbing, concrete, etc." },
            initials: { type: "string", description: "Initials for display" },
          },
          required: ["name", "role", "type"],
        },
      },
      {
        name: "update_contact",
        description: "Update an existing contact",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The contact ID" },
            name: { type: "string", description: "Contact name" },
            role: { type: "string", description: "Role/position" },
            company: { type: "string", description: "Company name" },
            phone: { type: "string", description: "Phone number" },
            email: { type: "string", description: "Email address" },
            type: { type: "string", description: "Type: contractor, supplier, consultant, etc." },
            category: { type: "string", description: "Category: electrical, plumbing, concrete, etc." },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_contact",
        description: "Delete a contact",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The contact ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== CHECKLIST TOOLS ====================
      {
        name: "create_checklist_item",
        description: "Create a new checklist item for a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID" },
            title: { type: "string", description: "Checklist item title" },
            description: { type: "string", description: "Checklist item description" },
            section: { type: "string", description: "Section grouping (e.g., Planning, Execution)" },
            assignedTo: { type: "string", description: "Person assigned" },
            dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
          },
          required: ["taskId", "title"],
        },
      },
      {
        name: "update_checklist_item",
        description: "Update an existing checklist item",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The checklist item ID" },
            title: { type: "string", description: "Checklist item title" },
            description: { type: "string", description: "Checklist item description" },
            completed: { type: "boolean", description: "Completion status" },
            section: { type: "string", description: "Section grouping" },
            assignedTo: { type: "string", description: "Person assigned" },
            dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_checklist_item",
        description: "Delete a checklist item",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The checklist item ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== CATEGORY TOOLS ====================
      {
        name: "list_categories",
        description: "List all categories (tier1 and tier2) for a project. Returns hierarchical structure with tier1 categories and their tier2 subcategories.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
          },
          required: ["projectId"],
        },
      },
      {
        name: "create_category",
        description: "Create a new tier1 or tier2 category for a project. For tier2, provide parentId (the tier1 category ID).",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            name: { type: "string", description: "Category name" },
            type: { type: "string", description: "Category type: 'tier1' or 'tier2'" },
            parentId: { type: "number", description: "Parent tier1 category ID (required for tier2 categories)" },
            description: { type: "string", description: "Category description" },
            color: { type: "string", description: "Category color (hex code)" },
            sortOrder: { type: "number", description: "Sort order for display" },
          },
          required: ["projectId", "name", "type"],
        },
      },
      {
        name: "update_category",
        description: "Update an existing category's name, description, color, or sort order",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The category ID to update" },
            name: { type: "string", description: "New category name" },
            description: { type: "string", description: "New description" },
            color: { type: "string", description: "New color (hex code)" },
            sortOrder: { type: "number", description: "New sort order" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_category",
        description: "Delete a category. For tier1, also deletes all tier2 subcategories. Updates tasks to remove category references.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The category ID to delete" },
          },
          required: ["id"],
        },
      },
      {
        name: "apply_preset_categories",
        description: "Apply a preset's categories to a project. Available presets: home-builder, standard-construction, software-development, workout, digital-marketing, digital-marketing-plan, marketing-sales, ai-agent",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            presetId: { type: "string", description: "Preset ID to apply (e.g., 'ai-agent', 'software-development')" },
            clearExisting: { type: "boolean", description: "If true, delete existing categories first (default: true)" },
          },
          required: ["projectId", "presetId"],
        },
      },
      {
        name: "bulk_create_categories",
        description: "Create multiple categories at once. Provide an array of tier1 categories, each with optional tier2 subcategories.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            categories: {
              type: "array",
              description: "Array of tier1 categories with optional tier2 children",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Tier1 category name" },
                  description: { type: "string", description: "Tier1 category description" },
                  color: { type: "string", description: "Tier1 category color" },
                  tier2: {
                    type: "array",
                    description: "Array of tier2 subcategories",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Tier2 category name" },
                        description: { type: "string", description: "Tier2 category description" },
                      },
                    },
                  },
                },
                required: ["name"],
              },
            },
            clearExisting: { type: "boolean", description: "If true, delete existing categories first (default: false)" },
          },
          required: ["projectId", "categories"],
        },
      },

      // ==================== SEARCH & ANALYTICS ====================
      {
        name: "search_tasks",
        description: "Search tasks by title or description across all projects or within a specific project",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            projectId: { type: "number", description: "Optional: limit search to a specific project" },
          },
          required: ["query"],
        },
      },
      {
        name: "get_project_summary",
        description: "Get a summary of a project including task counts by status, total costs, and progress",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
          },
          required: ["projectId"],
        },
      },
      {
        name: "get_checklist_items",
        description: "Get checklist items for a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID" },
          },
          required: ["taskId"],
        },
      },

      // ==================== CALENDAR EVENT TOOLS ====================
      {
        name: "list_calendar_events",
        description: "List calendar events with optional filters. Returns events with their linked tasks/subtasks/labor if any.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Filter by project ID" },
            startDate: { type: "string", description: "Filter events starting on or after this date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "Filter events ending on or before this date (YYYY-MM-DD)" },
            eventType: { type: "string", description: "Filter by event type: event, meeting, deadline, milestone, work_session, reminder" },
            status: { type: "string", description: "Filter by status: scheduled, completed, cancelled" },
            taskId: { type: "number", description: "Filter events linked to a specific task" },
            limit: { type: "number", description: "Maximum number to return (default: 100)" },
          },
        },
      },
      {
        name: "get_calendar_event",
        description: "Get detailed information about a specific calendar event by ID",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The calendar event ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_calendar_event",
        description: "Create a new calendar event. Can be standalone or linked to a task/subtask/labor entry.",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Event title" },
            description: { type: "string", description: "Event description" },
            projectId: { type: "number", description: "Project ID (optional for personal events)" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            startTime: { type: "string", description: "Start time (HH:MM) - omit for all-day events" },
            endTime: { type: "string", description: "End time (HH:MM) - omit for all-day events" },
            isAllDay: { type: "boolean", description: "Whether this is an all-day event (default: true if no time provided)" },
            eventType: { type: "string", description: "Event type: event, meeting, deadline, milestone, work_session, reminder (default: event)" },
            color: { type: "string", description: "Custom color for the event (hex code)" },
            tier1Category: { type: "string", description: "Tier1 category name" },
            tier2Category: { type: "string", description: "Tier2 category name" },
            taskId: { type: "number", description: "Link to a task ID" },
            subtaskId: { type: "number", description: "Link to a subtask ID" },
            laborId: { type: "number", description: "Link to a labor entry ID" },
            contactId: { type: "number", description: "Associated contact ID (e.g., for meetings)" },
            isRecurring: { type: "boolean", description: "Whether this is a recurring event" },
            recurrenceRule: { type: "string", description: "Recurrence rule in iCal RRULE format (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)" },
            recurrenceEndDate: { type: "string", description: "When recurrence ends (YYYY-MM-DD)" },
            reminderMinutes: { type: "number", description: "Minutes before event to send reminder" },
            location: { type: "string", description: "Event location" },
            attendees: { type: "array", items: { type: "string" }, description: "Array of attendee names or contact IDs" },
            notes: { type: "string", description: "Additional notes" },
          },
          required: ["title", "startDate", "endDate"],
        },
      },
      {
        name: "update_calendar_event",
        description: "Update an existing calendar event",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The calendar event ID to update" },
            title: { type: "string", description: "Event title" },
            description: { type: "string", description: "Event description" },
            startDate: { type: "string", description: "Start date (YYYY-MM-DD)" },
            endDate: { type: "string", description: "End date (YYYY-MM-DD)" },
            startTime: { type: "string", description: "Start time (HH:MM)" },
            endTime: { type: "string", description: "End time (HH:MM)" },
            isAllDay: { type: "boolean", description: "Whether this is an all-day event" },
            eventType: { type: "string", description: "Event type: event, meeting, deadline, milestone, work_session, reminder" },
            color: { type: "string", description: "Custom color (hex code)" },
            tier1Category: { type: "string", description: "Tier1 category name" },
            tier2Category: { type: "string", description: "Tier2 category name" },
            taskId: { type: "number", description: "Link to a task ID" },
            subtaskId: { type: "number", description: "Link to a subtask ID" },
            laborId: { type: "number", description: "Link to a labor entry ID" },
            contactId: { type: "number", description: "Associated contact ID" },
            isRecurring: { type: "boolean", description: "Whether this is a recurring event" },
            recurrenceRule: { type: "string", description: "Recurrence rule in iCal RRULE format" },
            recurrenceEndDate: { type: "string", description: "When recurrence ends (YYYY-MM-DD)" },
            reminderMinutes: { type: "number", description: "Minutes before event to send reminder" },
            location: { type: "string", description: "Event location" },
            attendees: { type: "array", items: { type: "string" }, description: "Array of attendee names or contact IDs" },
            notes: { type: "string", description: "Additional notes" },
            status: { type: "string", description: "Status: scheduled, completed, cancelled" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_calendar_event",
        description: "Delete a calendar event",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The calendar event ID to delete" },
            deleteRecurring: { type: "boolean", description: "If true and this is a recurring event, delete all instances (default: false)" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_event_from_task",
        description: "Create a calendar event from an existing task, copying its dates and details",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID to create an event from" },
            eventType: { type: "string", description: "Event type (default: work_session)" },
            startTime: { type: "string", description: "Start time (HH:MM) - omit for all-day" },
            endTime: { type: "string", description: "End time (HH:MM) - omit for all-day" },
          },
          required: ["taskId"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ==================== QUICK START HANDLERS ====================
      case "quick_setup_project": {
        // Preset definitions
        const presets = {
          'home-builder': {
            tier1: ['Permitting', 'Structural', 'Systems', 'Finishings'],
            tier2: {
              'Permitting': ['Building Permits', 'Utility Permits', 'Inspections', 'Documentation'],
              'Structural': ['Foundation', 'Framing', 'Roofing'],
              'Systems': ['Electrical', 'Plumbing', 'HVAC'],
              'Finishings': ['Flooring', 'Paint', 'Fixtures', 'Landscaping']
            }
          },
          'standard-construction': {
            tier1: ['Structural', 'Systems', 'Sheathing', 'Finishings'],
            tier2: {
              'Structural': ['Foundation', 'Framing', 'Roofing'],
              'Systems': ['Electrical', 'Plumbing', 'HVAC'],
              'Sheathing': ['Insulation', 'Drywall', 'Windows'],
              'Finishings': ['Flooring', 'Paint', 'Fixtures', 'Landscaping']
            }
          },
          'software-development': {
            tier1: ['Software Engineering', 'Product Management', 'Design / UX', 'Marketing / Go-to-Market (GTM)'],
            tier2: {
              'Software Engineering': ['DevOps & Infrastructure', 'Architecture & Platform', 'Application Development', 'Quality & Security'],
              'Product Management': ['Strategy & Vision', 'Discovery & Research', 'Roadmap & Prioritization', 'Delivery & Lifecycle'],
              'Design / UX': ['Research and Usability', 'UI/UX Design', 'Visual Design', 'Interaction Design'],
              'Marketing / Go-to-Market (GTM)': ['Positioning & Messaging', 'Demand Gen & Acquisition', 'Pricing & Packaging', 'Launch & Analytics']
            }
          },
          'ai-agent': {
            tier1: ['Strategy', 'Library', 'Production', 'Distribution'],
            tier2: {
              'Strategy': ['Planning', 'Research', 'Architecture', 'Goals'],
              'Library': ['Components', 'Integrations', 'Tools', 'Data'],
              'Production': ['Development', 'Testing', 'Deployment', 'Monitoring'],
              'Distribution': ['Marketing', 'Documentation', 'Support', 'Analytics']
            }
          },
          'workout': {
            tier1: ['Push', 'Pull', 'Legs', 'Cardio'],
            tier2: {
              'Push': ['Chest', 'Shoulders', 'Triceps'],
              'Pull': ['Back', 'Biceps', 'Rear Delts'],
              'Legs': ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
              'Cardio': ['HIIT', 'Steady State', 'Circuit Training']
            }
          },
          'marketing-sales': {
            tier1: ['Lead Generation', 'Lead Nurturing', 'Conversion', 'Retention'],
            tier2: {
              'Lead Generation': ['Content Marketing', 'Paid Advertising', 'Organic Outreach', 'Brand Awareness'],
              'Lead Nurturing': ['Initial Contact', 'Communication', 'Value Delivery', 'Relationship Building'],
              'Conversion': ['Presentation', 'Objection Handling', 'Closing Process', 'Deal Management'],
              'Retention': ['Customer Success', 'Feedback Loop', 'Referral Engine', 'Long-term Value']
            }
          }
        };

        const preset = presets[args.presetId];
        if (!preset) {
          return { content: [{ type: "text", text: `Unknown preset: ${args.presetId}. Available: ${Object.keys(presets).join(', ')}` }], isError: true };
        }

        // Create project
        const projectResult = await query(
          `INSERT INTO projects (name, location, description, status, preset_id)
           VALUES ($1, $2, $3, 'active', $4) RETURNING *`,
          [args.name, args.location || 'Remote', args.description || null, args.presetId]
        );
        const project = projectResult[0];
        const projectId = project.id;

        // Create categories
        const categories = [];
        for (let i = 0; i < preset.tier1.length; i++) {
          const tier1Name = preset.tier1[i];
          const tier1Result = await query(
            `INSERT INTO project_categories (project_id, name, type, sort_order)
             VALUES ($1, $2, 'tier1', $3) RETURNING *`,
            [projectId, tier1Name, i + 1]
          );
          const tier1 = tier1Result[0];
          categories.push({ ...tier1, tier2: [] });

          const tier2Names = preset.tier2[tier1Name] || [];
          for (let j = 0; j < tier2Names.length; j++) {
            const tier2Result = await query(
              `INSERT INTO project_categories (project_id, name, type, parent_id, sort_order)
               VALUES ($1, $2, 'tier2', $3, $4) RETURNING *`,
              [projectId, tier2Names[j], tier1.id, j + 1]
            );
            categories[categories.length - 1].tier2.push(tier2Result[0]);
          }
        }

        return { 
          content: [{ 
            type: "text", 
            text: `Created project "${args.name}" (ID: ${projectId}) with ${args.presetId} preset.\n\nCategories:\n${categories.map(c => `- ${c.name}: ${c.tier2.map(t => t.name).join(', ')}`).join('\n')}\n\nReady to add tasks!` 
          }] 
        };
      }

      case "get_project_overview": {
        // Get project
        const projects = await query("SELECT * FROM projects WHERE id = $1", [args.projectId]);
        if (projects.length === 0) {
          return { content: [{ type: "text", text: `Project ${args.projectId} not found` }], isError: true };
        }
        const project = projects[0];

        // Get categories with hierarchy
        const tier1Cats = await query(
          `SELECT * FROM project_categories WHERE project_id = $1 AND type = 'tier1' ORDER BY sort_order`,
          [args.projectId]
        );
        const tier2Cats = await query(
          `SELECT * FROM project_categories WHERE project_id = $1 AND type = 'tier2' ORDER BY sort_order`,
          [args.projectId]
        );

        const categories = tier1Cats.map(t1 => ({
          name: t1.name,
          id: t1.id,
          tier2: tier2Cats.filter(t2 => t2.parent_id === t1.id).map(t2 => t2.name)
        }));

        // Get task counts by category
        const taskCounts = await query(
          `SELECT tier1_category, tier2_category, status, COUNT(*) as count
           FROM tasks WHERE project_id = $1
           GROUP BY tier1_category, tier2_category, status`,
          [args.projectId]
        );

        // Get totals
        const totals = await query(
          `SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'completed' OR completed = true) as completed,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
            COUNT(*) FILTER (WHERE status = 'not_started') as not_started
           FROM tasks WHERE project_id = $1`,
          [args.projectId]
        );

        const overview = {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            preset: project.preset_id
          },
          categories: categories,
          taskSummary: {
            total: parseInt(totals[0].total),
            completed: parseInt(totals[0].completed),
            inProgress: parseInt(totals[0].in_progress),
            notStarted: parseInt(totals[0].not_started)
          },
          tasksByCategory: taskCounts
        };

        // Format nice output
        let output = `## Project: ${project.name} (ID: ${project.id})\n`;
        output += `Status: ${project.status} | Preset: ${project.preset_id || 'none'}\n\n`;
        output += `### Categories\n`;
        categories.forEach(c => {
          output += `- **${c.name}**: ${c.tier2.join(', ')}\n`;
        });
        output += `\n### Tasks: ${totals[0].total} total\n`;
        output += `- Completed: ${totals[0].completed}\n`;
        output += `- In Progress: ${totals[0].in_progress}\n`;
        output += `- Not Started: ${totals[0].not_started}\n`;

        return { content: [{ type: "text", text: output + "\n\n```json\n" + JSON.stringify(overview, null, 2) + "\n```" }] };
      }

      case "add_tasks_batch": {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const created = [];
        for (const task of args.tasks) {
          const result = await query(
            `INSERT INTO tasks (project_id, title, description, tier1_category, tier2_category, start_date, end_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, title, tier1_category, tier2_category`,
            [
              args.projectId,
              task.title,
              task.description || null,
              task.tier1Category,
              task.tier2Category,
              today,
              nextWeek,
              task.status || 'not_started'
            ]
          );
          created.push(result[0]);
        }

        return { 
          content: [{ 
            type: "text", 
            text: `Created ${created.length} tasks:\n${created.map(t => `- [${t.id}] ${t.title} (${t.tier1_category} > ${t.tier2_category})`).join('\n')}` 
          }] 
        };
      }

      // ==================== PROJECT HANDLERS ====================
      case "list_projects": {
        let sql = "SELECT * FROM projects";
        const params = [];
        const conditions = [];

        if (args?.status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(args.status);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY id DESC";
        sql += ` LIMIT ${args?.limit || 50}`;

        const projects = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
      }

      case "get_project": {
        const projects = await query("SELECT * FROM projects WHERE id = $1", [args.id]);
        if (projects.length === 0) {
          return { content: [{ type: "text", text: `Project with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(projects[0], null, 2) }] };
      }

      case "create_project": {
        const result = await query(
          `INSERT INTO projects (name, location, description, start_date, end_date, status, preset_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            args.name,
            args.location,
            args.description || null,
            args.startDate || null,
            args.endDate || null,
            args.status || "active",
            args.presetId || "home-builder",
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_project": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fields = ["name", "location", "description", "status", "progress"];
        const dateFields = ["startDate", "endDate"];
        const dbDateFields = ["start_date", "end_date"];

        for (const field of fields) {
          if (args[field] !== undefined) {
            updates.push(`${field === "startDate" ? "start_date" : field === "endDate" ? "end_date" : field} = $${paramIndex}`);
            values.push(args[field]);
            paramIndex++;
          }
        }

        for (let i = 0; i < dateFields.length; i++) {
          if (args[dateFields[i]] !== undefined) {
            updates.push(`${dbDateFields[i]} = $${paramIndex}`);
            values.push(args[dateFields[i]]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE projects SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Project with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_project": {
        // Delete related data first
        await query("DELETE FROM tasks WHERE project_id = $1", [args.id]);
        await query("DELETE FROM materials WHERE project_id = $1", [args.id]);
        await query("DELETE FROM labor WHERE project_id = $1", [args.id]);
        await query("DELETE FROM expenses WHERE project_id = $1", [args.id]);
        await query("DELETE FROM calendar_events WHERE project_id = $1", [args.id]);
        const result = await query("DELETE FROM projects WHERE id = $1 RETURNING id", [args.id]);

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Project with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Project ${args.id} and all related data deleted successfully` }] };
      }

      // ==================== TASK HANDLERS ====================
      case "list_tasks": {
        let sql = "SELECT * FROM tasks";
        const params = [];
        const conditions = [];

        if (args?.projectId) {
          conditions.push(`project_id = $${params.length + 1}`);
          params.push(args.projectId);
        }
        if (args?.status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(args.status);
        }
        if (args?.tier1Category) {
          conditions.push(`tier1_category = $${params.length + 1}`);
          params.push(args.tier1Category);
        }
        if (args?.tier2Category) {
          conditions.push(`tier2_category = $${params.length + 1}`);
          params.push(args.tier2Category);
        }
        if (args?.completed !== undefined) {
          conditions.push(`completed = $${params.length + 1}`);
          params.push(args.completed);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY id DESC";
        sql += ` LIMIT ${args?.limit || 100}`;

        const tasks = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
      }

      case "get_task": {
        const tasks = await query("SELECT * FROM tasks WHERE id = $1", [args.id]);
        if (tasks.length === 0) {
          return { content: [{ type: "text", text: `Task with ID ${args.id} not found` }] };
        }

        // Also get subtasks and checklist items
        const subtasks = await query("SELECT * FROM subtasks WHERE parent_task_id = $1 ORDER BY sort_order", [args.id]);
        const checklistItems = await query("SELECT * FROM checklist_items WHERE task_id = $1 ORDER BY sort_order", [args.id]);

        const result = {
          ...tasks[0],
          subtasks,
          checklistItems,
        };

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_task": {
        const result = await query(
          `INSERT INTO tasks (project_id, title, description, tier1_category, tier2_category, start_date, end_date, status, assigned_to, estimated_cost, materials_needed, calendar_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
          [
            args.projectId,
            args.title,
            args.description || null,
            args.tier1Category || "structural",
            args.tier2Category || "foundation",
            args.startDate,
            args.endDate,
            args.status || "not_started",
            args.assignedTo || null,
            args.estimatedCost || null,
            args.materialsNeeded || null,
            args.calendarActive !== undefined ? args.calendarActive : true, // Default to true for calendar visibility
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_task": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          title: "title",
          description: "description",
          tier1Category: "tier1_category",
          tier2Category: "tier2_category",
          startDate: "start_date",
          endDate: "end_date",
          status: "status",
          completed: "completed",
          assignedTo: "assigned_to",
          estimatedCost: "estimated_cost",
          actualCost: "actual_cost",
          calendarActive: "calendar_active",
        };

        // Handle calendarActive even if not in schema (for backwards compatibility)
        if (args.calendarActive !== undefined) {
          updates.push(`calendar_active = $${paramIndex}`);
          values.push(args.calendarActive);
          paramIndex++;
        }

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined && jsField !== "calendarActive") {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE tasks SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Task with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_task": {
        // Delete related data first
        await query("DELETE FROM subtasks WHERE parent_task_id = $1", [args.id]);
        await query("DELETE FROM checklist_items WHERE task_id = $1", [args.id]);
        await query("DELETE FROM task_attachments WHERE task_id = $1", [args.id]);
        const result = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [args.id]);

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Task with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Task ${args.id} and related data deleted successfully` }] };
      }

      // ==================== SUBTASK HANDLERS ====================
      case "list_subtasks": {
        const subtasks = await query(
          "SELECT * FROM subtasks WHERE parent_task_id = $1 ORDER BY sort_order",
          [args.parentTaskId]
        );
        return { content: [{ type: "text", text: JSON.stringify(subtasks, null, 2) }] };
      }

      case "create_subtask": {
        const result = await query(
          `INSERT INTO subtasks (parent_task_id, title, description, assigned_to, start_date, end_date, estimated_cost, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'not_started') RETURNING *`,
          [
            args.parentTaskId,
            args.title,
            args.description || null,
            args.assignedTo || null,
            args.startDate || null,
            args.endDate || null,
            args.estimatedCost || null,
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_subtask": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          title: "title",
          description: "description",
          completed: "completed",
          status: "status",
          assignedTo: "assigned_to",
          estimatedCost: "estimated_cost",
          actualCost: "actual_cost",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE subtasks SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Subtask with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_subtask": {
        const result = await query("DELETE FROM subtasks WHERE id = $1 RETURNING id", [args.id]);
        if (result.length === 0) {
          return { content: [{ type: "text", text: `Subtask with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Subtask ${args.id} deleted successfully` }] };
      }

      // ==================== MATERIAL HANDLERS ====================
      case "list_materials": {
        let sql = "SELECT * FROM materials";
        const params = [];
        const conditions = [];

        if (args?.projectId) {
          conditions.push(`project_id = $${params.length + 1}`);
          params.push(args.projectId);
        }
        if (args?.status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(args.status);
        }
        if (args?.tier2Category) {
          conditions.push(`tier2category = $${params.length + 1}`);
          params.push(args.tier2Category);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY id DESC";
        sql += ` LIMIT ${args?.limit || 100}`;

        const materials = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(materials, null, 2) }] };
      }

      case "get_material": {
        const materials = await query("SELECT * FROM materials WHERE id = $1", [args.id]);
        if (materials.length === 0) {
          return { content: [{ type: "text", text: `Material with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(materials[0], null, 2) }] };
      }

      case "create_material": {
        const result = await query(
          `INSERT INTO materials (project_id, name, type, tier2category, quantity, unit, cost, supplier, status, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [
            args.projectId,
            args.name,
            args.type,
            args.tier2Category || null,
            args.quantity,
            args.unit || null,
            args.cost || null,
            args.supplier || null,
            args.status || "ordered",
            args.details || null,
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_material": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          name: "name",
          type: "type",
          tier2Category: "tier2category",
          quantity: "quantity",
          unit: "unit",
          cost: "cost",
          supplier: "supplier",
          status: "status",
          details: "details",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE materials SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Material with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_material": {
        const result = await query("DELETE FROM materials WHERE id = $1 RETURNING id", [args.id]);
        if (result.length === 0) {
          return { content: [{ type: "text", text: `Material with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Material ${args.id} deleted successfully` }] };
      }

      // ==================== LABOR HANDLERS ====================
      case "list_labor": {
        let sql = "SELECT * FROM labor";
        const params = [];
        const conditions = [];

        if (args?.projectId) {
          conditions.push(`project_id = $${params.length + 1}`);
          params.push(args.projectId);
        }
        if (args?.taskId) {
          conditions.push(`task_id = $${params.length + 1}`);
          params.push(args.taskId);
        }
        if (args?.status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(args.status);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY id DESC";
        sql += ` LIMIT ${args?.limit || 100}`;

        const labor = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(labor, null, 2) }] };
      }

      case "get_labor": {
        const labor = await query("SELECT * FROM labor WHERE id = $1", [args.id]);
        if (labor.length === 0) {
          return { content: [{ type: "text", text: `Labor entry with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(labor[0], null, 2) }] };
      }

      case "create_labor": {
        const result = await query(
          `INSERT INTO labor (project_id, task_id, contact_id, full_name, company, tier1_category, tier2_category, work_date, start_date, end_date, start_time, end_time, total_hours, labor_cost, work_description, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
          [
            args.projectId,
            args.taskId || null,
            args.contactId,
            args.fullName,
            args.company,
            args.tier1Category || null,
            args.tier2Category || null,
            args.workDate,
            args.startDate,
            args.endDate,
            args.startTime || null,
            args.endTime || null,
            args.totalHours || null,
            args.laborCost || null,
            args.workDescription || null,
            args.status || "pending",
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_labor": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          totalHours: "total_hours",
          laborCost: "labor_cost",
          workDescription: "work_description",
          status: "status",
          startTime: "start_time",
          endTime: "end_time",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE labor SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Labor entry with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_labor": {
        const result = await query("DELETE FROM labor WHERE id = $1 RETURNING id", [args.id]);
        if (result.length === 0) {
          return { content: [{ type: "text", text: `Labor entry with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Labor entry ${args.id} deleted successfully` }] };
      }

      // ==================== CONTACT HANDLERS ====================
      case "list_contacts": {
        let sql = "SELECT * FROM contacts";
        const params = [];
        const conditions = [];

        if (args?.type) {
          conditions.push(`type = $${params.length + 1}`);
          params.push(args.type);
        }
        if (args?.category) {
          conditions.push(`category = $${params.length + 1}`);
          params.push(args.category);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY name";
        sql += ` LIMIT ${args?.limit || 100}`;

        const contacts = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(contacts, null, 2) }] };
      }

      case "get_contact": {
        const contacts = await query("SELECT * FROM contacts WHERE id = $1", [args.id]);
        if (contacts.length === 0) {
          return { content: [{ type: "text", text: `Contact with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(contacts[0], null, 2) }] };
      }

      case "create_contact": {
        const result = await query(
          `INSERT INTO contacts (name, role, company, phone, email, type, category, initials)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
          [
            args.name,
            args.role,
            args.company || null,
            args.phone || null,
            args.email || null,
            args.type,
            args.category || "other",
            args.initials || args.name.split(" ").map(n => n[0]).join("").toUpperCase(),
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_contact": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          name: "name",
          role: "role",
          company: "company",
          phone: "phone",
          email: "email",
          type: "type",
          category: "category",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE contacts SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Contact with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_contact": {
        const result = await query("DELETE FROM contacts WHERE id = $1 RETURNING id", [args.id]);
        if (result.length === 0) {
          return { content: [{ type: "text", text: `Contact with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Contact ${args.id} deleted successfully` }] };
      }

      // ==================== CHECKLIST HANDLERS ====================
      case "create_checklist_item": {
        const result = await query(
          `INSERT INTO checklist_items (task_id, title, description, section, assigned_to, due_date)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [
            args.taskId,
            args.title,
            args.description || null,
            args.section || null,
            args.assignedTo || null,
            args.dueDate || null,
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_checklist_item": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          title: "title",
          description: "description",
          completed: "completed",
          section: "section",
          assignedTo: "assigned_to",
          dueDate: "due_date",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE checklist_items SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Checklist item with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_checklist_item": {
        const result = await query("DELETE FROM checklist_items WHERE id = $1 RETURNING id", [args.id]);
        if (result.length === 0) {
          return { content: [{ type: "text", text: `Checklist item with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Checklist item ${args.id} deleted successfully` }] };
      }

      // ==================== CATEGORY HANDLERS ====================
      case "list_categories": {
        // Get all tier1 categories
        const tier1Categories = await query(
          `SELECT * FROM project_categories 
           WHERE project_id = $1 AND type = 'tier1' 
           ORDER BY sort_order, name`,
          [args.projectId]
        );

        // Get all tier2 categories
        const tier2Categories = await query(
          `SELECT * FROM project_categories 
           WHERE project_id = $1 AND type = 'tier2' 
           ORDER BY sort_order, name`,
          [args.projectId]
        );

        // Build hierarchical structure
        const result = tier1Categories.map(tier1 => ({
          ...tier1,
          tier2: tier2Categories.filter(t2 => t2.parent_id === tier1.id)
        }));

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_category": {
        // Validate tier2 has parent
        if (args.type === 'tier2' && !args.parentId) {
          return { content: [{ type: "text", text: "Error: tier2 categories require a parentId (tier1 category ID)" }], isError: true };
        }

        // Get next sort order if not provided
        let sortOrder = args.sortOrder;
        if (sortOrder === undefined) {
          const maxOrder = await query(
            `SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order 
             FROM project_categories 
             WHERE project_id = $1 AND type = $2`,
            [args.projectId, args.type]
          );
          sortOrder = maxOrder[0].next_order;
        }

        const result = await query(
          `INSERT INTO project_categories (project_id, name, type, parent_id, description, color, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
          [
            args.projectId,
            args.name,
            args.type,
            args.parentId || null,
            args.description || null,
            args.color || null,
            sortOrder
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_category": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          name: "name",
          description: "description",
          color: "color",
          sortOrder: "sort_order",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        if (updates.length === 0) {
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        // If name is being updated, also update tasks that reference this category
        const oldCategory = await query("SELECT * FROM project_categories WHERE id = $1", [args.id]);
        if (oldCategory.length === 0) {
          return { content: [{ type: "text", text: `Category with ID ${args.id} not found` }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE project_categories SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        // Update tasks if name changed
        if (args.name && args.name !== oldCategory[0].name) {
          const cat = oldCategory[0];
          if (cat.type === 'tier1') {
            await query(
              `UPDATE tasks SET tier1_category = $1 WHERE project_id = $2 AND tier1_category = $3`,
              [args.name, cat.project_id, cat.name]
            );
          } else {
            await query(
              `UPDATE tasks SET tier2_category = $1 WHERE project_id = $2 AND tier2_category = $3`,
              [args.name, cat.project_id, cat.name]
            );
          }
        }

        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_category": {
        const category = await query("SELECT * FROM project_categories WHERE id = $1", [args.id]);
        if (category.length === 0) {
          return { content: [{ type: "text", text: `Category with ID ${args.id} not found` }] };
        }

        const cat = category[0];

        // If tier1, also delete all tier2 subcategories
        if (cat.type === 'tier1') {
          await query("DELETE FROM project_categories WHERE parent_id = $1", [args.id]);
        }

        // Clear category references from tasks
        if (cat.type === 'tier1') {
          await query(
            `UPDATE tasks SET tier1_category = NULL WHERE project_id = $1 AND tier1_category = $2`,
            [cat.project_id, cat.name]
          );
        } else {
          await query(
            `UPDATE tasks SET tier2_category = NULL WHERE project_id = $1 AND tier2_category = $2`,
            [cat.project_id, cat.name]
          );
        }

        await query("DELETE FROM project_categories WHERE id = $1", [args.id]);
        return { content: [{ type: "text", text: `Category '${cat.name}' deleted successfully` }] };
      }

      case "apply_preset_categories": {
        // Define preset categories inline (simplified version)
        const presets = {
          'home-builder': {
            tier1: ['Permitting', 'Structural', 'Systems', 'Finishings'],
            tier2: {
              'Permitting': ['Building Permits', 'Utility Permits', 'Inspections', 'Documentation'],
              'Structural': ['Foundation', 'Framing', 'Roofing'],
              'Systems': ['Electrical', 'Plumbing', 'HVAC'],
              'Finishings': ['Flooring', 'Paint', 'Fixtures', 'Landscaping']
            }
          },
          'standard-construction': {
            tier1: ['Structural', 'Systems', 'Sheathing', 'Finishings'],
            tier2: {
              'Structural': ['Foundation', 'Framing', 'Roofing'],
              'Systems': ['Electrical', 'Plumbing', 'HVAC'],
              'Sheathing': ['Insulation', 'Drywall', 'Windows'],
              'Finishings': ['Flooring', 'Paint', 'Fixtures', 'Landscaping']
            }
          },
          'software-development': {
            tier1: ['Software Engineering', 'Product Management', 'Design / UX', 'Marketing / Go-to-Market (GTM)'],
            tier2: {
              'Software Engineering': ['DevOps & Infrastructure', 'Architecture & Platform', 'Application Development', 'Quality & Security'],
              'Product Management': ['Strategy & Vision', 'Discovery & Research', 'Roadmap & Prioritization', 'Delivery & Lifecycle'],
              'Design / UX': ['Research and Usability', 'UI/UX Design', 'Visual Design', 'Interaction Design'],
              'Marketing / Go-to-Market (GTM)': ['Positioning & Messaging', 'Demand Gen & Acquisition', 'Pricing & Packaging', 'Launch & Analytics']
            }
          },
          'ai-agent': {
            tier1: ['Strategy', 'Library', 'Production', 'Distribution'],
            tier2: {
              'Strategy': ['Planning', 'Research', 'Architecture', 'Goals'],
              'Library': ['Components', 'Integrations', 'Tools', 'Data'],
              'Production': ['Development', 'Testing', 'Deployment', 'Monitoring'],
              'Distribution': ['Marketing', 'Documentation', 'Support', 'Analytics']
            }
          },
          'workout': {
            tier1: ['Push', 'Pull', 'Legs', 'Cardio'],
            tier2: {
              'Push': ['Chest', 'Shoulders', 'Triceps'],
              'Pull': ['Back', 'Biceps', 'Rear Delts'],
              'Legs': ['Quads', 'Glutes', 'Hamstrings', 'Calves'],
              'Cardio': ['HIIT', 'Steady State', 'Circuit Training']
            }
          },
          'digital-marketing': {
            tier1: ['Marketing / Go-to-Market (GTM)'],
            tier2: {
              'Marketing / Go-to-Market (GTM)': ['Positioning & Messaging', 'Demand Gen & Acquisition', 'Pricing & Packaging', 'Launch & Analytics']
            }
          },
          'digital-marketing-plan': {
            tier1: ['Creative Strategy', 'Marketing / Go-to-Market (GTM)', 'Content Types'],
            tier2: {
              'Creative Strategy': ['Audience & Job To Be Done', 'Offer Design', 'Angle Library', 'Creative Brief'],
              'Marketing / Go-to-Market (GTM)': ['Positioning & Messaging', 'Demand Gen & Acquisition', 'Pricing & Packaging', 'Launch & Analytics'],
              'Content Types': ['Renter Guides', 'Video Scripts', 'Social Media Content']
            }
          },
          'marketing-sales': {
            tier1: ['Lead Generation', 'Lead Nurturing', 'Conversion', 'Retention'],
            tier2: {
              'Lead Generation': ['Content Marketing', 'Paid Advertising', 'Organic Outreach', 'Brand Awareness'],
              'Lead Nurturing': ['Initial Contact', 'Communication', 'Value Delivery', 'Relationship Building'],
              'Conversion': ['Presentation', 'Objection Handling', 'Closing Process', 'Deal Management'],
              'Retention': ['Customer Success', 'Feedback Loop', 'Referral Engine', 'Long-term Value']
            }
          }
        };

        const preset = presets[args.presetId];
        if (!preset) {
          return { content: [{ type: "text", text: `Unknown preset: ${args.presetId}. Available: ${Object.keys(presets).join(', ')}` }], isError: true };
        }

        // Clear existing categories if requested (default: true)
        if (args.clearExisting !== false) {
          await query("DELETE FROM project_categories WHERE project_id = $1", [args.projectId]);
        }

        const createdCategories = [];

        // Create tier1 categories
        for (let i = 0; i < preset.tier1.length; i++) {
          const tier1Name = preset.tier1[i];
          const tier1Result = await query(
            `INSERT INTO project_categories (project_id, name, type, sort_order)
             VALUES ($1, $2, 'tier1', $3) RETURNING *`,
            [args.projectId, tier1Name, i + 1]
          );
          const tier1Id = tier1Result[0].id;
          createdCategories.push(tier1Result[0]);

          // Create tier2 categories for this tier1
          const tier2Names = preset.tier2[tier1Name] || [];
          for (let j = 0; j < tier2Names.length; j++) {
            const tier2Result = await query(
              `INSERT INTO project_categories (project_id, name, type, parent_id, sort_order)
               VALUES ($1, $2, 'tier2', $3, $4) RETURNING *`,
              [args.projectId, tier2Names[j], tier1Id, j + 1]
            );
            createdCategories.push(tier2Result[0]);
          }
        }

        // Update project preset_id
        await query("UPDATE projects SET preset_id = $1 WHERE id = $2", [args.presetId, args.projectId]);

        return { content: [{ type: "text", text: `Applied preset '${args.presetId}' with ${createdCategories.length} categories:\n${JSON.stringify(createdCategories, null, 2)}` }] };
      }

      case "bulk_create_categories": {
        // Clear existing if requested
        if (args.clearExisting) {
          await query("DELETE FROM project_categories WHERE project_id = $1", [args.projectId]);
        }

        const createdCategories = [];

        for (let i = 0; i < args.categories.length; i++) {
          const tier1 = args.categories[i];
          
          // Create tier1 category
          const tier1Result = await query(
            `INSERT INTO project_categories (project_id, name, type, description, color, sort_order)
             VALUES ($1, $2, 'tier1', $3, $4, $5) RETURNING *`,
            [args.projectId, tier1.name, tier1.description || null, tier1.color || null, i + 1]
          );
          const tier1Id = tier1Result[0].id;
          createdCategories.push(tier1Result[0]);

          // Create tier2 subcategories if provided
          if (tier1.tier2 && Array.isArray(tier1.tier2)) {
            for (let j = 0; j < tier1.tier2.length; j++) {
              const tier2 = tier1.tier2[j];
              const tier2Result = await query(
                `INSERT INTO project_categories (project_id, name, type, parent_id, description, sort_order)
                 VALUES ($1, $2, 'tier2', $3, $4, $5) RETURNING *`,
                [args.projectId, tier2.name, tier1Id, tier2.description || null, j + 1]
              );
              createdCategories.push(tier2Result[0]);
            }
          }
        }

        return { content: [{ type: "text", text: `Created ${createdCategories.length} categories:\n${JSON.stringify(createdCategories, null, 2)}` }] };
      }

      // ==================== SEARCH & ANALYTICS ====================
      case "search_tasks": {
        let sql = `SELECT t.*, p.name as project_name
                   FROM tasks t
                   LEFT JOIN projects p ON t.project_id = p.id
                   WHERE (t.title ILIKE $1 OR t.description ILIKE $1)`;
        const params = [`%${args.query}%`];

        if (args.projectId) {
          sql += ` AND t.project_id = $2`;
          params.push(args.projectId);
        }

        sql += " ORDER BY t.id DESC LIMIT 50";

        const tasks = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
      }

      case "get_project_summary": {
        const project = await query("SELECT * FROM projects WHERE id = $1", [args.projectId]);
        if (project.length === 0) {
          return { content: [{ type: "text", text: `Project with ID ${args.projectId} not found` }] };
        }

        const taskStats = await query(
          `SELECT
            COUNT(*) as total_tasks,
            COUNT(*) FILTER (WHERE status = 'completed' OR completed = true) as completed_tasks,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks,
            COUNT(*) FILTER (WHERE status = 'not_started') as not_started_tasks,
            COUNT(*) FILTER (WHERE status = 'blocked') as blocked_tasks,
            COALESCE(SUM(estimated_cost), 0) as total_estimated_cost,
            COALESCE(SUM(actual_cost), 0) as total_actual_cost
           FROM tasks WHERE project_id = $1`,
          [args.projectId]
        );

        const materialStats = await query(
          `SELECT
            COUNT(*) as total_materials,
            COALESCE(SUM(quantity * COALESCE(cost, 0)), 0) as total_material_cost
           FROM materials WHERE project_id = $1`,
          [args.projectId]
        );

        const laborStats = await query(
          `SELECT
            COUNT(*) as total_labor_entries,
            COALESCE(SUM(total_hours), 0) as total_hours,
            COALESCE(SUM(labor_cost), 0) as total_labor_cost
           FROM labor WHERE project_id = $1`,
          [args.projectId]
        );

        const summary = {
          project: project[0],
          tasks: taskStats[0],
          materials: materialStats[0],
          labor: laborStats[0],
        };

        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
      }

      case "get_checklist_items": {
        const items = await query(
          "SELECT * FROM checklist_items WHERE task_id = $1 ORDER BY sort_order",
          [args.taskId]
        );
        return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
      }

      // ==================== CALENDAR EVENT HANDLERS ====================
      case "list_calendar_events": {
        let sql = "SELECT * FROM calendar_events";
        const params = [];
        const conditions = [];

        if (args?.projectId) {
          conditions.push(`project_id = $${params.length + 1}`);
          params.push(args.projectId);
        }
        if (args?.startDate) {
          conditions.push(`start_date >= $${params.length + 1}`);
          params.push(args.startDate);
        }
        if (args?.endDate) {
          conditions.push(`end_date <= $${params.length + 1}`);
          params.push(args.endDate);
        }
        if (args?.eventType) {
          conditions.push(`event_type = $${params.length + 1}`);
          params.push(args.eventType);
        }
        if (args?.status) {
          conditions.push(`status = $${params.length + 1}`);
          params.push(args.status);
        }
        if (args?.taskId) {
          conditions.push(`task_id = $${params.length + 1}`);
          params.push(args.taskId);
        }

        if (conditions.length > 0) {
          sql += " WHERE " + conditions.join(" AND ");
        }

        sql += " ORDER BY start_date, start_time NULLS LAST";
        sql += ` LIMIT ${args?.limit || 100}`;

        const events = await query(sql, params);
        return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
      }

      case "get_calendar_event": {
        const events = await query("SELECT * FROM calendar_events WHERE id = $1", [args.id]);
        if (events.length === 0) {
          return { content: [{ type: "text", text: `Calendar event with ID ${args.id} not found` }] };
        }

        const event = events[0];
        const result = { ...event };

        // Fetch linked entities if they exist
        if (event.task_id) {
          const tasks = await query("SELECT id, title, status FROM tasks WHERE id = $1", [event.task_id]);
          if (tasks.length > 0) result.linkedTask = tasks[0];
        }
        if (event.subtask_id) {
          const subtasks = await query("SELECT id, title, status FROM subtasks WHERE id = $1", [event.subtask_id]);
          if (subtasks.length > 0) result.linkedSubtask = subtasks[0];
        }
        if (event.contact_id) {
          const contacts = await query("SELECT id, name, company FROM contacts WHERE id = $1", [event.contact_id]);
          if (contacts.length > 0) result.linkedContact = contacts[0];
        }

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "create_calendar_event": {
        // Determine if all-day based on time fields
        const isAllDay = args.isAllDay !== undefined ? args.isAllDay : (!args.startTime && !args.endTime);

        const result = await query(
          `INSERT INTO calendar_events (
            title, description, project_id, start_date, end_date, start_time, end_time,
            is_all_day, event_type, color, tier1_category, tier2_category,
            task_id, subtask_id, labor_id, contact_id,
            is_recurring, recurrence_rule, recurrence_end_date,
            reminder_minutes, location, attendees, notes, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
          RETURNING *`,
          [
            args.title,
            args.description || null,
            args.projectId || null,
            args.startDate,
            args.endDate,
            args.startTime || null,
            args.endTime || null,
            isAllDay,
            args.eventType || 'event',
            args.color || null,
            args.tier1Category || null,
            args.tier2Category || null,
            args.taskId || null,
            args.subtaskId || null,
            args.laborId || null,
            args.contactId || null,
            args.isRecurring || false,
            args.recurrenceRule || null,
            args.recurrenceEndDate || null,
            args.reminderMinutes || null,
            args.location || null,
            args.attendees || null,
            args.notes || null,
            'scheduled'
          ]
        );
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "update_calendar_event": {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const fieldMap = {
          title: "title",
          description: "description",
          startDate: "start_date",
          endDate: "end_date",
          startTime: "start_time",
          endTime: "end_time",
          isAllDay: "is_all_day",
          eventType: "event_type",
          color: "color",
          tier1Category: "tier1_category",
          tier2Category: "tier2_category",
          taskId: "task_id",
          subtaskId: "subtask_id",
          laborId: "labor_id",
          contactId: "contact_id",
          isRecurring: "is_recurring",
          recurrenceRule: "recurrence_rule",
          recurrenceEndDate: "recurrence_end_date",
          reminderMinutes: "reminder_minutes",
          location: "location",
          attendees: "attendees",
          notes: "notes",
          status: "status",
        };

        for (const [jsField, dbField] of Object.entries(fieldMap)) {
          if (args[jsField] !== undefined) {
            updates.push(`${dbField} = $${paramIndex}`);
            values.push(args[jsField]);
            paramIndex++;
          }
        }

        // Always update updated_at
        updates.push(`updated_at = NOW()`);

        if (updates.length === 1) { // Only updated_at
          return { content: [{ type: "text", text: "No fields to update" }] };
        }

        values.push(args.id);
        const result = await query(
          `UPDATE calendar_events SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
          values
        );

        if (result.length === 0) {
          return { content: [{ type: "text", text: `Calendar event with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: JSON.stringify(result[0], null, 2) }] };
      }

      case "delete_calendar_event": {
        // Check if this is a recurring event and deleteRecurring is true
        if (args.deleteRecurring) {
          const event = await query("SELECT * FROM calendar_events WHERE id = $1", [args.id]);
          if (event.length > 0 && event[0].is_recurring) {
            // Delete all child instances
            await query("DELETE FROM calendar_events WHERE parent_event_id = $1", [args.id]);
          }
        }

        const result = await query("DELETE FROM calendar_events WHERE id = $1 RETURNING id", [args.id]);
        if (result.length === 0) {
          return { content: [{ type: "text", text: `Calendar event with ID ${args.id} not found` }] };
        }
        return { content: [{ type: "text", text: `Calendar event ${args.id} deleted successfully` }] };
      }

      case "create_event_from_task": {
        // Get the task
        const tasks = await query("SELECT * FROM tasks WHERE id = $1", [args.taskId]);
        if (tasks.length === 0) {
          return { content: [{ type: "text", text: `Task with ID ${args.taskId} not found` }] };
        }

        const task = tasks[0];
        const isAllDay = !args.startTime && !args.endTime;

        const result = await query(
          `INSERT INTO calendar_events (
            title, description, project_id, start_date, end_date, start_time, end_time,
            is_all_day, event_type, tier1_category, tier2_category, task_id, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING *`,
          [
            task.title,
            task.description,
            task.project_id,
            task.start_date,
            task.end_date,
            args.startTime || null,
            args.endTime || null,
            isAllDay,
            args.eventType || 'work_session',
            task.tier1_category,
            task.tier2_category,
            task.id,
            'scheduled'
          ]
        );

        return { content: [{ type: "text", text: `Created calendar event from task "${task.title}":\n${JSON.stringify(result[0], null, 2)}` }] };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }] };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error executing ${name}: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("American Cheese MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
