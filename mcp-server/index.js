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
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
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
          `INSERT INTO tasks (project_id, title, description, tier1_category, tier2_category, start_date, end_date, status, assigned_to, estimated_cost, materials_needed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
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
