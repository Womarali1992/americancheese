#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env") });
dotenv.config({ path: join(__dirname, "../.env") });

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || "http://134.199.207.43";
const API_TOKEN = process.env.API_TOKEN; // Direct API token (preferred)
const API_EMAIL = process.env.API_EMAIL; // Email for login fallback
const API_PASSWORD = process.env.API_PASSWORD; // Password for login fallback

// Auth token storage
let authToken = API_TOKEN || null; // Use API_TOKEN directly if provided

// Helper function to make API requests
async function apiRequest(method, endpoint, body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
  };

  // Add auth token to all requests
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
    headers["X-Access-Token"] = authToken;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

// Login to get auth token (only needed if API_TOKEN not provided)
async function ensureAuthenticated() {
  // If using direct API token, we're already authenticated
  if (API_TOKEN) {
    authToken = API_TOKEN;
    return true;
  }

  // If we already have a session token, we're authenticated
  if (authToken) return true;

  // Need email and password for login
  if (!API_EMAIL || !API_PASSWORD) {
    throw new Error(
      "Authentication required. Please set API_TOKEN (recommended) or both API_EMAIL and API_PASSWORD in your MCP configuration.\n\n" +
      "To get an API token:\n" +
      "1. Log into the web app\n" +
      "2. Go to Settings > API Tokens\n" +
      "3. Generate a new token\n" +
      "4. Add it to your .mcp.json:\n" +
      '   "env": { "API_BASE_URL": "...", "API_TOKEN": "ac_your_token_here" }'
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: API_EMAIL, password: API_PASSWORD }),
    });

    const data = await response.json();
    if (data.success && data.token) {
      authToken = data.token;
      return true;
    }
    throw new Error(data.message || "Login failed");
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// ==================== STATIC DATA ====================
// Color themes available in the application
const COLOR_THEMES = {
  "earth-tone": { name: "Earth Tone", description: "Natural earthy colors inspired by traditional building materials" },
  "pastel": { name: "Pastel", description: "Soft, muted colors for a modern clean look" },
  "futuristic": { name: "Futuristic", description: "Bold vibrant colors for a tech-forward look" },
  "classic-construction": { name: "Classic Construction", description: "Traditional construction palette with high contrast" },
  "molten-core": { name: "Molten Core", description: "Warm, energetic palette with fiery tones" },
  "neon-noir": { name: "Neon Noir", description: "Dark theme with vibrant neon accents" },
  "dust-planet": { name: "Dust Planet", description: "Earthy, muted desert palette" },
  "crystal-cavern": { name: "Crystal Cavern", description: "Cool, crystalline palette with gem tones" },
  "paper-studio": { name: "Paper Studio", description: "Soft, paper-like neutral colors" },
  "paper-bright": { name: "Paper Bright", description: "Bright, clean paper colors" },
  "velvet-lounge": { name: "Velvet Lounge", description: "Rich, luxurious deep palette" },
  "volcanic-dunes": { name: "Volcanic Dunes", description: "Warm, volcanic earth palette" }
};

// Presets available in the application
const PRESETS = {
  "home-builder": { name: "Home Builder", description: "Comprehensive home building with permitting, structural, systems, and finishings", recommendedTheme: "earth-tone" },
  "standard-construction": { name: "Standard Construction", description: "Traditional construction with structural, systems, sheathing, and finishings", recommendedTheme: "classic-construction" },
  "software-development": { name: "Software Development", description: "Software engineering, product management, design, and marketing phases", recommendedTheme: "futuristic" },
  "workout": { name: "Workout Training", description: "Push/Pull/Legs/Cardio workout program organized by muscle groups", recommendedTheme: "neon-noir" },
  "digital-marketing": { name: "Digital Marketing", description: "Marketing strategy, positioning, demand generation, and launch", recommendedTheme: "futuristic" },
  "digital-marketing-plan": { name: "Digital Marketing Plan", description: "Complete marketing plan with creative strategy, GTM, and content", recommendedTheme: "velvet-lounge" },
  "marketing-sales": { name: "Marketing & Sales", description: "End-to-end marketing and sales funnel for service businesses", recommendedTheme: "futuristic" },
  "ai-agent": { name: "AI Agent", description: "AI agent development with Strategy, Library, Production, and Distribution", recommendedTheme: "futuristic" }
};

// ==================== FUZZY MATCHING ====================
function fuzzyMatch(input, candidates) {
  if (!input) return null;

  const normalizedInput = input.toLowerCase().replace(/[-_\s]/g, '');

  // Exact match first
  for (const [id, data] of Object.entries(candidates)) {
    if (id.toLowerCase() === input.toLowerCase()) {
      return { id, ...data, matchType: 'exact' };
    }
  }

  // Normalized exact match (ignore hyphens, underscores, spaces)
  for (const [id, data] of Object.entries(candidates)) {
    const normalizedId = id.toLowerCase().replace(/[-_\s]/g, '');
    if (normalizedId === normalizedInput) {
      return { id, ...data, matchType: 'normalized' };
    }
  }

  // Partial match (input is contained in id or name)
  for (const [id, data] of Object.entries(candidates)) {
    const normalizedId = id.toLowerCase().replace(/[-_\s]/g, '');
    const normalizedName = (data.name || '').toLowerCase().replace(/[-_\s]/g, '');
    if (normalizedId.includes(normalizedInput) || normalizedName.includes(normalizedInput)) {
      return { id, ...data, matchType: 'partial' };
    }
  }

  // Reverse partial match (id or name is contained in input)
  for (const [id, data] of Object.entries(candidates)) {
    const normalizedId = id.toLowerCase().replace(/[-_\s]/g, '');
    const normalizedName = (data.name || '').toLowerCase().replace(/[-_\s]/g, '');
    if (normalizedInput.includes(normalizedId) || normalizedInput.includes(normalizedName)) {
      return { id, ...data, matchType: 'reverse-partial' };
    }
  }

  // Levenshtein distance for typo tolerance
  let bestMatch = null;
  let bestDistance = Infinity;

  for (const [id, data] of Object.entries(candidates)) {
    const distance = levenshteinDistance(normalizedInput, id.toLowerCase().replace(/[-_\s]/g, ''));
    if (distance < bestDistance && distance <= 3) { // Allow up to 3 character differences
      bestDistance = distance;
      bestMatch = { id, ...data, matchType: 'fuzzy', distance };
    }
  }

  return bestMatch;
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
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
      // ==================== DISCOVERY TOOLS ====================
      {
        name: "list_color_themes",
        description: "List all available color themes. Returns theme IDs, names, and descriptions. Use this to discover themes before creating or updating projects.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_presets",
        description: "List all available category presets with fuzzy search. Returns preset IDs, names, descriptions, and recommended themes. Supports fuzzy matching (e.g., 'work' matches 'workout', 'sw dev' matches 'software-development').",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Optional fuzzy search term to filter presets" },
          },
        },
      },

      // ==================== QUICK START TOOLS ====================
      {
        name: "quick_setup_project",
        description: "Create a new project AND apply a category preset in one step. Supports fuzzy preset matching (e.g., 'workout', 'work out', 'neon' for theme). Returns the project with its categories ready to use.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Project name" },
            presetId: { type: "string", description: "Preset (fuzzy matched): ai-agent, software-development, home-builder, marketing-sales, workout, etc." },
            colorTheme: { type: "string", description: "Color theme (fuzzy matched): earth-tone, neon-noir, futuristic, pastel, etc. Defaults to preset's recommended theme." },
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
            status: { type: "string", description: "Filter by status: active, completed, on_hold, cancelled" },
            limit: { type: "number", description: "Maximum number of projects to return (default: 50)" },
          },
        },
      },
      {
        name: "get_project",
        description: "Get detailed information about a specific project by ID, including all fields like color theme, preset, hidden categories, and selected templates.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The project ID" },
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
            referencedTaskIds: { type: "array", items: { type: "string" }, description: "Array of task IDs to reference (their materials will be shown)" },
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

      // ==================== TASK REFERENCE TOOLS ====================
      {
        name: "add_task_reference",
        description: "Add a reference to another task. Referenced tasks' materials will be shown in this task's materials section.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID to add the reference to" },
            referencedTaskId: { type: "number", description: "The task ID to reference" },
          },
          required: ["taskId", "referencedTaskId"],
        },
      },
      {
        name: "remove_task_reference",
        description: "Remove a task reference from a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID to remove the reference from" },
            referencedTaskId: { type: "number", description: "The referenced task ID to remove" },
          },
          required: ["taskId", "referencedTaskId"],
        },
      },
      {
        name: "list_task_references",
        description: "List all referenced tasks for a given task, including their materials",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID to get references for" },
          },
          required: ["taskId"],
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
            startTime: { type: "string", description: "Start time (HH:MM)" },
            endTime: { type: "string", description: "End time (HH:MM)" },
            totalHours: { type: "number", description: "Total hours worked" },
            laborCost: { type: "number", description: "Total labor cost" },
            workDescription: { type: "string", description: "Description of work performed" },
            status: { type: "string", description: "Status: pending, in_progress, completed, billed" },
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

      // ==================== BLOCKER/CHECKLIST TOOLS ====================
      {
        name: "list_blocker_board",
        description: "List all blocker/checklist items across a project or for specific tasks. Returns items grouped by task with completion stats.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "Filter by project ID (returns all blockers for all tasks in project)" },
            taskId: { type: "number", description: "Filter by specific task ID" },
            completed: { type: "boolean", description: "Filter by completion status (true=completed, false=incomplete)" },
            assignedTo: { type: "string", description: "Filter by person assigned" },
            section: { type: "string", description: "Filter by section (e.g., Planning, Execution)" },
            contactId: { type: "number", description: "Filter by tagged contact ID" },
            limit: { type: "number", description: "Maximum number to return (default: 100)" },
          },
        },
      },
      {
        name: "create_checklist_item",
        description: "Create a new checklist/blocker item for a task",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID" },
            title: { type: "string", description: "Checklist item title" },
            description: { type: "string", description: "Checklist item description" },
            section: { type: "string", description: "Section grouping (e.g., Planning, Execution)" },
            assignedTo: { type: "string", description: "Person assigned" },
            dueDate: { type: "string", description: "Due date (YYYY-MM-DD)" },
            sortOrder: { type: "number", description: "Sort order within the task" },
            contactIds: { type: "array", items: { type: "string" }, description: "Array of contact IDs to tag" },
          },
          required: ["taskId", "title"],
        },
      },
      {
        name: "update_checklist_item",
        description: "Update an existing checklist/blocker item",
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
            sortOrder: { type: "number", description: "Sort order within the task" },
            contactIds: { type: "array", items: { type: "string" }, description: "Array of contact IDs to tag" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_checklist_item",
        description: "Delete a checklist/blocker item",
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
        name: "get_category_context",
        description: "Get the AI context for a category. Returns structured context data (mission, scope, tech, casting, deliverables, etc.).",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            categoryId: { type: "number", description: "The category ID" },
          },
          required: ["projectId", "categoryId"],
        },
      },
      {
        name: "update_category_context",
        description: "Update the AI context for a category. Accepts structured context data or a JSON string.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            categoryId: { type: "number", description: "The category ID" },
            context: { type: "object", description: "The context data object (ContextData structure with sections like mission, scope, tech, casting, deliverables, strategy_tags, constraints)" },
          },
          required: ["projectId", "categoryId", "context"],
        },
      },
      {
        name: "apply_preset_categories",
        description: "Apply a preset's categories to a project. Supports fuzzy matching (e.g., 'work' matches 'workout'). Use list_presets to see all available presets.",
        inputSchema: {
          type: "object",
          properties: {
            projectId: { type: "number", description: "The project ID" },
            presetId: { type: "string", description: "Preset ID (fuzzy matched): ai-agent, software-development, home-builder, workout, etc." },
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

      // ==================== CREDENTIALS VAULT TOOLS ====================
      {
        name: "list_credentials",
        description: "List all stored credentials for the authenticated user. Returns masked values for security. Use reveal in the web UI to see actual values.",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by category: api_key, password, connection_string, certificate, other" },
          },
        },
      },
      {
        name: "get_credential",
        description: "Get a specific credential by ID (masked value). Use the web UI to reveal the actual value.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The credential ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_credential",
        description: "Create a new encrypted credential. The value will be stored securely with AES-256-GCM encryption.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", description: "Credential name (e.g., 'LinkedIn API', 'Database Password')" },
            category: { type: "string", description: "Category: api_key, password, connection_string, certificate, other" },
            value: { type: "string", description: "The credential value to encrypt and store" },
            website: { type: "string", description: "Associated website or service URL" },
            username: { type: "string", description: "Associated username or email" },
            notes: { type: "string", description: "Optional notes about this credential" },
            expiresAt: { type: "string", description: "Expiration date (YYYY-MM-DD)" },
          },
          required: ["name", "value"],
        },
      },
      {
        name: "update_credential",
        description: "Update an existing credential. Leave value empty to keep the existing encrypted value.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The credential ID to update" },
            name: { type: "string", description: "New name" },
            category: { type: "string", description: "New category: api_key, password, connection_string, certificate, other" },
            value: { type: "string", description: "New value (leave empty to keep existing)" },
            website: { type: "string", description: "Associated website or service URL" },
            username: { type: "string", description: "Associated username or email" },
            notes: { type: "string", description: "Optional notes" },
            expiresAt: { type: "string", description: "Expiration date (YYYY-MM-DD)" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_credential",
        description: "Delete a credential permanently",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The credential ID to delete" },
          },
          required: ["id"],
        },
      },

      // ==================== TASK ATTACHMENT TOOLS ====================
      {
        name: "list_attachments",
        description: "List all attachments for a specific task. Returns attachment metadata including file name, type, size, and upload date.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID to list attachments for" },
          },
          required: ["taskId"],
        },
      },
      {
        name: "get_attachment",
        description: "Get a specific attachment by ID including its base64-encoded content. Use this to download or view attachment contents.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The attachment ID" },
          },
          required: ["id"],
        },
      },
      {
        name: "create_attachment",
        description: "Upload a new attachment to a task. Accepts base64-encoded file content. Supports images, documents, PDFs, and other file types.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: { type: "number", description: "The task ID to attach the file to" },
            fileName: { type: "string", description: "The name of the file (e.g., 'blueprint.pdf', 'photo.jpg')" },
            fileType: { type: "string", description: "MIME type of the file (e.g., 'image/jpeg', 'application/pdf', 'text/plain')" },
            fileSize: { type: "number", description: "Size of the file in bytes" },
            fileContent: { type: "string", description: "Base64-encoded file content" },
            notes: { type: "string", description: "Optional notes or description about the attachment" },
            type: { type: "string", description: "Attachment type: document, image, note, video, audio, other (default: document)" },
          },
          required: ["taskId", "fileName", "fileType", "fileSize", "fileContent"],
        },
      },
      {
        name: "update_attachment",
        description: "Update an existing attachment's metadata (notes, type). Cannot update the file content itself - delete and recreate for that.",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The attachment ID to update" },
            notes: { type: "string", description: "Updated notes or description" },
            type: { type: "string", description: "Updated attachment type: document, image, note, video, audio, other" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_attachment",
        description: "Delete an attachment permanently from a task",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "number", description: "The attachment ID to delete" },
          },
          required: ["id"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Ensure we're authenticated before making API calls
    await ensureAuthenticated();

    switch (name) {
      // ==================== DISCOVERY HANDLERS ====================
      case "list_color_themes": {
        const themes = Object.entries(COLOR_THEMES).map(([id, data]) => ({
          id,
          name: data.name,
          description: data.description
        }));

        let output = "## Available Color Themes\n\n";
        output += "| ID | Name | Description |\n";
        output += "|-----|------|-------------|\n";
        themes.forEach(t => {
          output += `| ${t.id} | ${t.name} | ${t.description} |\n`;
        });
        output += "\n*Use these theme IDs when creating projects. Fuzzy matching is supported (e.g., 'neon' matches 'neon-noir').*";

        return { content: [{ type: "text", text: output }] };
      }

      case "list_presets": {
        let presets = Object.entries(PRESETS).map(([id, data]) => ({
          id,
          name: data.name,
          description: data.description,
          recommendedTheme: data.recommendedTheme
        }));

        // Apply fuzzy search if provided
        if (args?.search) {
          const match = fuzzyMatch(args.search, PRESETS);
          if (match) {
            presets = [{
              id: match.id,
              name: match.name,
              description: match.description,
              recommendedTheme: match.recommendedTheme,
              matchType: match.matchType
            }];
          } else {
            return { content: [{ type: "text", text: `No presets matched "${args.search}". Use list_presets without search to see all options.` }] };
          }
        }

        let output = "## Available Category Presets\n\n";
        output += "| ID | Name | Recommended Theme | Description |\n";
        output += "|-----|------|-------------------|-------------|\n";
        presets.forEach(p => {
          output += `| ${p.id} | ${p.name} | ${p.recommendedTheme} | ${p.description} |\n`;
        });
        output += "\n*Use these preset IDs when creating projects. Fuzzy matching is supported (e.g., 'work' matches 'workout').*";

        return { content: [{ type: "text", text: output }] };
      }

      // ==================== QUICK START HANDLERS ====================
      case "quick_setup_project": {
        // Fuzzy match preset
        const presetMatch = fuzzyMatch(args.presetId, PRESETS);
        if (!presetMatch) {
          const available = Object.keys(PRESETS).join(', ');
          return {
            content: [{ type: "text", text: `Preset "${args.presetId}" not found. Available presets: ${available}` }],
            isError: true
          };
        }
        const resolvedPresetId = presetMatch.id;

        // Fuzzy match color theme (use provided, or preset's recommended, or default)
        let resolvedTheme = presetMatch.recommendedTheme;
        if (args.colorTheme) {
          const themeMatch = fuzzyMatch(args.colorTheme, COLOR_THEMES);
          if (themeMatch) {
            resolvedTheme = themeMatch.id;
          }
        }

        // Create project with preset
        const project = await apiRequest("POST", "/api/projects", {
          name: args.name,
          location: args.location || "Remote",
          description: args.description || null,
          presetId: resolvedPresetId,
          colorTheme: resolvedTheme,
        });

        // Load preset categories
        await apiRequest("POST", `/api/projects/${project.id}/load-preset-categories`, {
          presetId: resolvedPresetId,
          clearExisting: true,
        });

        // Create tasks from templates for this preset
        let tasksCreated = 0;
        try {
          const tasksResult = await apiRequest("POST", `/api/projects/${project.id}/create-tasks-from-templates`, {
            presetId: resolvedPresetId,
            replaceExisting: false
          });
          tasksCreated = Array.isArray(tasksResult?.createdTasks) ? tasksResult.createdTasks.length : 0;
        } catch (taskError) {
          // Tasks are optional - don't fail if template tasks can't be created
          console.error("Error creating tasks from templates:", taskError.message);
        }

        // Get categories to display
        const categories = await apiRequest("GET", `/api/projects/${project.id}/template-categories`);

        const tier1Cats = categories.filter(c => c.type === "tier1");
        const tier2Cats = categories.filter(c => c.type === "tier2");

        const catDisplay = tier1Cats.map(t1 => {
          const children = tier2Cats.filter(t2 => t2.parentId === t1.id).map(t2 => t2.name);
          return `- ${t1.name}: ${children.join(', ')}`;
        }).join('\n');

        let matchInfo = "";
        if (presetMatch.matchType !== 'exact') {
          matchInfo = ` (matched "${args.presetId}" → "${resolvedPresetId}")`;
        }

        const taskInfo = tasksCreated > 0 ? `\n\nTasks: ${tasksCreated} created from templates` : "\n\nNo template tasks found for this preset.";

        return {
          content: [{
            type: "text",
            text: `Created project "${args.name}" (ID: ${project.id}) with ${resolvedPresetId} preset${matchInfo}.\nTheme: ${resolvedTheme}\n\nCategories:\n${catDisplay}${taskInfo}`
          }]
        };
      }

      case "get_project_overview": {
        const project = await apiRequest("GET", `/api/projects/${args.projectId}`);
        const categories = await apiRequest("GET", `/api/projects/${args.projectId}/template-categories`);
        const tasks = await apiRequest("GET", `/api/projects/${args.projectId}/tasks`);

        const tier1Cats = categories.filter(c => c.type === "tier1");
        const tier2Cats = categories.filter(c => c.type === "tier2");

        const catHierarchy = tier1Cats.map(t1 => ({
          name: t1.name,
          id: t1.id,
          tier2: tier2Cats.filter(t2 => t2.parentId === t1.id).map(t2 => t2.name)
        }));

        const taskStats = {
          total: tasks.length,
          completed: tasks.filter(t => t.completed || t.status === "completed").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
          notStarted: tasks.filter(t => t.status === "not_started").length,
        };

        let output = `## Project: ${project.name} (ID: ${project.id})\n`;
        output += `Status: ${project.status} | Preset: ${project.presetId || 'none'}\n\n`;
        output += `### Categories\n`;
        catHierarchy.forEach(c => {
          output += `- **${c.name}**: ${c.tier2.join(', ')}\n`;
        });
        output += `\n### Tasks: ${taskStats.total} total\n`;
        output += `- Completed: ${taskStats.completed}\n`;
        output += `- In Progress: ${taskStats.inProgress}\n`;
        output += `- Not Started: ${taskStats.notStarted}\n`;

        return { content: [{ type: "text", text: output }] };
      }

      case "add_tasks_batch": {
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const created = [];
        for (const task of args.tasks) {
          const result = await apiRequest("POST", "/api/tasks", {
            projectId: args.projectId,
            title: task.title,
            description: task.description || null,
            tier1Category: task.tier1Category,
            tier2Category: task.tier2Category,
            startDate: today,
            endDate: nextWeek,
            status: task.status || "not_started",
          });
          created.push(result);
        }

        return {
          content: [{
            type: "text",
            text: `Created ${created.length} tasks:\n${created.map(t => `- [${t.id}] ${t.title} (${t.tier1Category} > ${t.tier2Category})`).join('\n')}`
          }]
        };
      }

      // ==================== PROJECT HANDLERS ====================
      case "list_projects": {
        const projects = await apiRequest("GET", "/api/projects");
        let filtered = projects;
        if (args?.status) {
          filtered = projects.filter(p => p.status === args.status);
        }
        if (args?.limit) {
          filtered = filtered.slice(0, args.limit);
        }
        return { content: [{ type: "text", text: JSON.stringify(filtered, null, 2) }] };
      }

      case "get_project": {
        const project = await apiRequest("GET", `/api/projects/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
      }

      case "create_project": {
        const project = await apiRequest("POST", "/api/projects", {
          name: args.name,
          location: args.location,
          description: args.description || null,
          startDate: args.startDate || null,
          endDate: args.endDate || null,
          status: args.status || "active",
          presetId: args.presetId || "home-builder",
        });
        return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
      }

      case "update_project": {
        const updateData = {};
        const fields = ["name", "location", "description", "startDate", "endDate", "status", "progress"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const project = await apiRequest("PUT", `/api/projects/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
      }

      case "delete_project": {
        await apiRequest("DELETE", `/api/projects/${args.id}`);
        return { content: [{ type: "text", text: `Project ${args.id} deleted successfully` }] };
      }

      // ==================== TASK HANDLERS ====================
      case "list_tasks": {
        let endpoint = "/api/tasks";
        if (args?.projectId) {
          endpoint = `/api/projects/${args.projectId}/tasks`;
        }
        let tasks = await apiRequest("GET", endpoint);

        if (args?.status) tasks = tasks.filter(t => t.status === args.status);
        if (args?.tier1Category) tasks = tasks.filter(t => t.tier1Category === args.tier1Category);
        if (args?.tier2Category) tasks = tasks.filter(t => t.tier2Category === args.tier2Category);
        if (args?.completed !== undefined) tasks = tasks.filter(t => t.completed === args.completed);
        if (args?.limit) tasks = tasks.slice(0, args.limit);

        return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
      }

      case "get_task": {
        const task = await apiRequest("GET", `/api/tasks/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
      }

      case "create_task": {
        const task = await apiRequest("POST", "/api/tasks", {
          projectId: args.projectId,
          title: args.title,
          description: args.description || null,
          tier1Category: args.tier1Category || null,
          tier2Category: args.tier2Category || null,
          startDate: args.startDate,
          endDate: args.endDate,
          status: args.status || "not_started",
          assignedTo: args.assignedTo || null,
          estimatedCost: args.estimatedCost || null,
          materialsNeeded: args.materialsNeeded || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
      }

      case "update_task": {
        const updateData = {};
        const fields = ["title", "description", "tier1Category", "tier2Category", "startDate", "endDate",
                       "status", "completed", "assignedTo", "estimatedCost", "actualCost", "calendarActive", "referencedTaskIds"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const task = await apiRequest("PUT", `/api/tasks/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(task, null, 2) }] };
      }

      case "delete_task": {
        await apiRequest("DELETE", `/api/tasks/${args.id}`);
        return { content: [{ type: "text", text: `Task ${args.id} deleted successfully` }] };
      }

      // ==================== SUBTASK HANDLERS ====================
      case "list_subtasks": {
        const subtasks = await apiRequest("GET", `/api/tasks/${args.parentTaskId}/subtasks`);
        return { content: [{ type: "text", text: JSON.stringify(subtasks, null, 2) }] };
      }

      case "create_subtask": {
        const subtask = await apiRequest("POST", `/api/tasks/${args.parentTaskId}/subtasks`, {
          title: args.title,
          description: args.description || null,
          assignedTo: args.assignedTo || null,
          startDate: args.startDate || null,
          endDate: args.endDate || null,
          estimatedCost: args.estimatedCost || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(subtask, null, 2) }] };
      }

      case "update_subtask": {
        const updateData = {};
        const fields = ["title", "description", "completed", "status", "assignedTo", "estimatedCost", "actualCost"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const subtask = await apiRequest("PUT", `/api/subtasks/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(subtask, null, 2) }] };
      }

      case "delete_subtask": {
        await apiRequest("DELETE", `/api/subtasks/${args.id}`);
        return { content: [{ type: "text", text: `Subtask ${args.id} deleted successfully` }] };
      }

      // ==================== TASK REFERENCE HANDLERS ====================
      case "add_task_reference": {
        const task = await apiRequest("GET", `/api/tasks/${args.taskId}`);
        const currentRefs = task.referencedTaskIds || [];
        const newRefs = [...currentRefs, String(args.referencedTaskId)];
        const updated = await apiRequest("PUT", `/api/tasks/${args.taskId}`, { referencedTaskIds: newRefs });
        return { content: [{ type: "text", text: `Added reference to task ${args.referencedTaskId}. Current references: ${newRefs.join(', ')}` }] };
      }

      case "remove_task_reference": {
        const task = await apiRequest("GET", `/api/tasks/${args.taskId}`);
        const currentRefs = task.referencedTaskIds || [];
        const newRefs = currentRefs.filter(r => r !== String(args.referencedTaskId));
        const updated = await apiRequest("PUT", `/api/tasks/${args.taskId}`, { referencedTaskIds: newRefs });
        return { content: [{ type: "text", text: `Removed reference to task ${args.referencedTaskId}. Remaining references: ${newRefs.join(', ') || 'none'}` }] };
      }

      case "list_task_references": {
        const task = await apiRequest("GET", `/api/tasks/${args.taskId}`);
        const refs = task.referencedTaskIds || [];
        if (refs.length === 0) {
          return { content: [{ type: "text", text: "No task references found" }] };
        }
        const refTasks = [];
        for (const refId of refs) {
          try {
            const refTask = await apiRequest("GET", `/api/tasks/${refId}`);
            refTasks.push(refTask);
          } catch (e) {
            // Task may have been deleted
          }
        }
        return { content: [{ type: "text", text: JSON.stringify(refTasks, null, 2) }] };
      }

      // ==================== MATERIAL HANDLERS ====================
      case "list_materials": {
        let endpoint = "/api/materials";
        if (args?.projectId) {
          endpoint = `/api/projects/${args.projectId}/materials`;
        }
        let materials = await apiRequest("GET", endpoint);
        if (args?.status) materials = materials.filter(m => m.status === args.status);
        if (args?.tier2Category) materials = materials.filter(m => m.tier2Category === args.tier2Category);
        if (args?.limit) materials = materials.slice(0, args.limit);
        return { content: [{ type: "text", text: JSON.stringify(materials, null, 2) }] };
      }

      case "get_material": {
        const material = await apiRequest("GET", `/api/materials/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(material, null, 2) }] };
      }

      case "create_material": {
        const material = await apiRequest("POST", "/api/materials", {
          projectId: args.projectId,
          name: args.name,
          type: args.type,
          tier2Category: args.tier2Category || null,
          quantity: args.quantity,
          unit: args.unit || null,
          cost: args.cost || null,
          supplier: args.supplier || null,
          status: args.status || "ordered",
          details: args.details || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(material, null, 2) }] };
      }

      case "update_material": {
        const updateData = {};
        const fields = ["name", "type", "tier2Category", "quantity", "unit", "cost", "supplier", "status", "details"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const material = await apiRequest("PUT", `/api/materials/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(material, null, 2) }] };
      }

      case "delete_material": {
        await apiRequest("DELETE", `/api/materials/${args.id}`);
        return { content: [{ type: "text", text: `Material ${args.id} deleted successfully` }] };
      }

      // ==================== LABOR HANDLERS ====================
      case "list_labor": {
        let endpoint = "/api/labor";
        if (args?.projectId) {
          endpoint = `/api/projects/${args.projectId}/labor`;
        } else if (args?.taskId) {
          endpoint = `/api/tasks/${args.taskId}/labor`;
        }
        let labor = await apiRequest("GET", endpoint);
        if (args?.status) labor = labor.filter(l => l.status === args.status);
        if (args?.limit) labor = labor.slice(0, args.limit);
        return { content: [{ type: "text", text: JSON.stringify(labor, null, 2) }] };
      }

      case "get_labor": {
        const labor = await apiRequest("GET", `/api/labor/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(labor, null, 2) }] };
      }

      case "create_labor": {
        const labor = await apiRequest("POST", "/api/labor", {
          projectId: args.projectId,
          taskId: args.taskId || null,
          contactId: args.contactId,
          fullName: args.fullName,
          company: args.company,
          tier1Category: args.tier1Category || null,
          tier2Category: args.tier2Category || null,
          workDate: args.workDate,
          startDate: args.startDate,
          endDate: args.endDate,
          startTime: args.startTime || null,
          endTime: args.endTime || null,
          totalHours: args.totalHours || null,
          laborCost: args.laborCost || null,
          workDescription: args.workDescription || null,
          status: args.status || "pending",
        });
        return { content: [{ type: "text", text: JSON.stringify(labor, null, 2) }] };
      }

      case "update_labor": {
        const updateData = {};
        const fields = ["startTime", "endTime", "totalHours", "laborCost", "workDescription", "status"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const labor = await apiRequest("PUT", `/api/labor/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(labor, null, 2) }] };
      }

      case "delete_labor": {
        await apiRequest("DELETE", `/api/labor/${args.id}`);
        return { content: [{ type: "text", text: `Labor entry ${args.id} deleted successfully` }] };
      }

      // ==================== CONTACT HANDLERS ====================
      case "list_contacts": {
        let contacts = await apiRequest("GET", "/api/contacts");
        if (args?.type) contacts = contacts.filter(c => c.type === args.type);
        if (args?.category) contacts = contacts.filter(c => c.category === args.category);
        if (args?.limit) contacts = contacts.slice(0, args.limit);
        return { content: [{ type: "text", text: JSON.stringify(contacts, null, 2) }] };
      }

      case "get_contact": {
        const contact = await apiRequest("GET", `/api/contacts/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(contact, null, 2) }] };
      }

      case "create_contact": {
        const contact = await apiRequest("POST", "/api/contacts", {
          name: args.name,
          role: args.role,
          company: args.company || null,
          phone: args.phone || null,
          email: args.email || null,
          type: args.type,
          category: args.category || "other",
          initials: args.initials || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(contact, null, 2) }] };
      }

      case "update_contact": {
        const updateData = {};
        const fields = ["name", "role", "company", "phone", "email", "type", "category"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const contact = await apiRequest("PUT", `/api/contacts/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(contact, null, 2) }] };
      }

      case "delete_contact": {
        await apiRequest("DELETE", `/api/contacts/${args.id}`);
        return { content: [{ type: "text", text: `Contact ${args.id} deleted successfully` }] };
      }

      // ==================== BLOCKER/CHECKLIST HANDLERS ====================
      case "list_blocker_board": {
        // The API doesn't have a direct blocker board endpoint, so we get checklist items via tasks
        let items = [];
        if (args?.taskId) {
          const task = await apiRequest("GET", `/api/tasks/${args.taskId}`);
          items = await apiRequest("GET", `/api/tasks/${args.taskId}/checklist`) || [];
        } else if (args?.projectId) {
          const tasks = await apiRequest("GET", `/api/projects/${args.projectId}/tasks`);
          for (const task of tasks.slice(0, 50)) {
            try {
              const taskItems = await apiRequest("GET", `/api/tasks/${task.id}/checklist`) || [];
              items.push(...taskItems.map(i => ({ ...i, taskId: task.id, taskTitle: task.title })));
            } catch (e) { /* ignore */ }
          }
        }

        if (args?.completed !== undefined) items = items.filter(i => i.completed === args.completed);
        if (args?.assignedTo) items = items.filter(i => i.assignedTo === args.assignedTo);
        if (args?.section) items = items.filter(i => i.section === args.section);
        if (args?.limit) items = items.slice(0, args.limit);

        return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
      }

      case "create_checklist_item": {
        const item = await apiRequest("POST", `/api/tasks/${args.taskId}/checklist`, {
          title: args.title,
          description: args.description || null,
          section: args.section || null,
          assignedTo: args.assignedTo || null,
          dueDate: args.dueDate || null,
          sortOrder: args.sortOrder || 0,
          contactIds: args.contactIds || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(item, null, 2) }] };
      }

      case "update_checklist_item": {
        const updateData = {};
        const fields = ["title", "description", "completed", "section", "assignedTo", "dueDate", "sortOrder", "contactIds"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const item = await apiRequest("PUT", `/api/checklist/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(item, null, 2) }] };
      }

      case "delete_checklist_item": {
        await apiRequest("DELETE", `/api/checklist/${args.id}`);
        return { content: [{ type: "text", text: `Checklist item ${args.id} deleted successfully` }] };
      }

      // ==================== CATEGORY HANDLERS ====================
      case "list_categories": {
        const categories = await apiRequest("GET", `/api/projects/${args.projectId}/template-categories`);
        const tier1 = categories.filter(c => c.type === "tier1");
        const tier2 = categories.filter(c => c.type === "tier2");

        const hierarchy = tier1.map(t1 => ({
          ...t1,
          tier2: tier2.filter(t2 => t2.parentId === t1.id)
        }));

        return { content: [{ type: "text", text: JSON.stringify(hierarchy, null, 2) }] };
      }

      case "create_category": {
        const category = await apiRequest("POST", `/api/projects/${args.projectId}/template-categories`, {
          name: args.name,
          type: args.type,
          parentId: args.parentId || null,
          description: args.description || null,
          color: args.color || null,
          sortOrder: args.sortOrder || 0,
        });
        return { content: [{ type: "text", text: JSON.stringify(category, null, 2) }] };
      }

      case "update_category": {
        // Need to find which project this category belongs to
        // This is a limitation - we'll need the projectId
        const updateData = {};
        const fields = ["name", "description", "color", "sortOrder"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        // Try to update - this might need adjustment based on actual API structure
        const category = await apiRequest("PATCH", `/api/project-categories/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(category, null, 2) }] };
      }

      case "delete_category": {
        await apiRequest("DELETE", `/api/project-categories/${args.id}`);
        return { content: [{ type: "text", text: `Category ${args.id} deleted successfully` }] };
      }

      case "get_category_context": {
        const result = await apiRequest("GET", `/api/projects/${args.projectId}/categories/${args.categoryId}/context`);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "update_category_context": {
        const result = await apiRequest("PUT", `/api/projects/${args.projectId}/categories/${args.categoryId}/context`, {
          context: args.context
        });
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "apply_preset_categories": {
        // Fuzzy match preset
        const presetMatch = fuzzyMatch(args.presetId, PRESETS);
        if (!presetMatch) {
          const available = Object.keys(PRESETS).join(', ');
          return {
            content: [{ type: "text", text: `Preset "${args.presetId}" not found. Available presets: ${available}` }],
            isError: true
          };
        }
        const resolvedPresetId = presetMatch.id;

        await apiRequest("POST", `/api/projects/${args.projectId}/load-preset-categories`, {
          presetId: resolvedPresetId,
          clearExisting: args.clearExisting !== false,
        });
        const categories = await apiRequest("GET", `/api/projects/${args.projectId}/template-categories`);

        let matchInfo = "";
        if (presetMatch.matchType !== 'exact') {
          matchInfo = ` (matched "${args.presetId}" → "${resolvedPresetId}")`;
        }
        return { content: [{ type: "text", text: `Applied ${resolvedPresetId} preset${matchInfo}. ${categories.length} categories created.` }] };
      }

      case "bulk_create_categories": {
        // Create tier1 categories first, then tier2
        const created = [];
        for (const cat of args.categories) {
          const tier1 = await apiRequest("POST", `/api/projects/${args.projectId}/template-categories`, {
            name: cat.name,
            type: "tier1",
            description: cat.description || null,
            color: cat.color || null,
          });
          created.push(tier1);

          if (cat.tier2) {
            for (const t2 of cat.tier2) {
              const tier2 = await apiRequest("POST", `/api/projects/${args.projectId}/template-categories`, {
                name: t2.name,
                type: "tier2",
                parentId: tier1.id,
                description: t2.description || null,
              });
              created.push(tier2);
            }
          }
        }
        return { content: [{ type: "text", text: `Created ${created.length} categories` }] };
      }

      // ==================== SEARCH & ANALYTICS HANDLERS ====================
      case "search_tasks": {
        let tasks = await apiRequest("GET", `/api/tasks/search?q=${encodeURIComponent(args.query)}`);
        if (args?.projectId) {
          tasks = tasks.filter(t => t.projectId === args.projectId);
        }
        return { content: [{ type: "text", text: JSON.stringify(tasks, null, 2) }] };
      }

      case "get_project_summary": {
        const project = await apiRequest("GET", `/api/projects/${args.projectId}`);
        const tasks = await apiRequest("GET", `/api/projects/${args.projectId}/tasks`);
        const materials = await apiRequest("GET", `/api/projects/${args.projectId}/materials`);
        const labor = await apiRequest("GET", `/api/projects/${args.projectId}/labor`);

        const summary = {
          project: {
            id: project.id,
            name: project.name,
            status: project.status,
            progress: project.progress,
          },
          tasks: {
            total: tasks.length,
            completed: tasks.filter(t => t.completed || t.status === "completed").length,
            inProgress: tasks.filter(t => t.status === "in_progress").length,
            notStarted: tasks.filter(t => t.status === "not_started").length,
            blocked: tasks.filter(t => t.status === "blocked").length,
          },
          costs: {
            estimatedTotal: tasks.reduce((sum, t) => sum + (t.estimatedCost || 0), 0),
            actualTotal: tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0),
            materialsCost: materials.reduce((sum, m) => sum + ((m.cost || 0) * (m.quantity || 0)), 0),
            laborCost: labor.reduce((sum, l) => sum + (l.laborCost || 0), 0),
          },
        };

        return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
      }

      case "get_checklist_items": {
        const items = await apiRequest("GET", `/api/tasks/${args.taskId}/checklist`);
        return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
      }

      // ==================== CALENDAR HANDLERS ====================
      case "list_calendar_events": {
        let endpoint = "/api/calendar-events";
        const params = [];
        if (args?.projectId) params.push(`projectId=${args.projectId}`);
        if (args?.startDate) params.push(`startDate=${args.startDate}`);
        if (args?.endDate) params.push(`endDate=${args.endDate}`);
        if (args?.eventType) params.push(`eventType=${args.eventType}`);
        if (args?.status) params.push(`status=${args.status}`);
        if (args?.taskId) params.push(`taskId=${args.taskId}`);
        if (params.length > 0) endpoint += "?" + params.join("&");

        let events = await apiRequest("GET", endpoint);
        if (args?.limit) events = events.slice(0, args.limit);
        return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
      }

      case "get_calendar_event": {
        const event = await apiRequest("GET", `/api/calendar-events/${args.id}`);
        return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
      }

      case "create_calendar_event": {
        const event = await apiRequest("POST", "/api/calendar-events", {
          title: args.title,
          description: args.description || null,
          projectId: args.projectId || null,
          startDate: args.startDate,
          endDate: args.endDate,
          startTime: args.startTime || null,
          endTime: args.endTime || null,
          isAllDay: args.isAllDay !== false && !args.startTime,
          eventType: args.eventType || "event",
          color: args.color || null,
          tier1Category: args.tier1Category || null,
          tier2Category: args.tier2Category || null,
          taskId: args.taskId || null,
          subtaskId: args.subtaskId || null,
          laborId: args.laborId || null,
          contactId: args.contactId || null,
          isRecurring: args.isRecurring || false,
          recurrenceRule: args.recurrenceRule || null,
          recurrenceEndDate: args.recurrenceEndDate || null,
          reminderMinutes: args.reminderMinutes || null,
          location: args.location || null,
          attendees: args.attendees || null,
          notes: args.notes || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
      }

      case "update_calendar_event": {
        const updateData = {};
        const fields = ["title", "description", "startDate", "endDate", "startTime", "endTime", "isAllDay",
                       "eventType", "color", "tier1Category", "tier2Category", "taskId", "subtaskId",
                       "laborId", "contactId", "isRecurring", "recurrenceRule", "recurrenceEndDate",
                       "reminderMinutes", "location", "attendees", "notes", "status"];
        for (const field of fields) {
          if (args[field] !== undefined) {
            updateData[field] = args[field];
          }
        }
        const event = await apiRequest("PUT", `/api/calendar-events/${args.id}`, updateData);
        return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
      }

      case "delete_calendar_event": {
        let endpoint = `/api/calendar-events/${args.id}`;
        if (args?.deleteRecurring) {
          endpoint += "?deleteRecurring=true";
        }
        await apiRequest("DELETE", endpoint);
        return { content: [{ type: "text", text: `Calendar event ${args.id} deleted successfully` }] };
      }

      case "create_event_from_task": {
        const task = await apiRequest("GET", `/api/tasks/${args.taskId}`);
        const event = await apiRequest("POST", "/api/calendar-events", {
          title: task.title,
          description: task.description || null,
          projectId: task.projectId,
          startDate: task.startDate,
          endDate: task.endDate,
          startTime: args.startTime || null,
          endTime: args.endTime || null,
          isAllDay: !args.startTime,
          eventType: args.eventType || "work_session",
          taskId: task.id,
          tier1Category: task.tier1Category || null,
          tier2Category: task.tier2Category || null,
        });
        return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
      }

      // ==================== CREDENTIALS VAULT HANDLERS ====================
      case "list_credentials": {
        const result = await apiRequest("GET", "/api/credentials");
        let credentials = result?.credentials || [];

        // Filter by category if provided
        if (args?.category) {
          credentials = credentials.filter(c => c.category === args.category);
        }

        if (credentials.length === 0) {
          return { content: [{ type: "text", text: "No credentials found." }] };
        }

        let output = "## Credentials Vault\n\n";
        output += "| ID | Name | Category | Username | Website | Expires |\n";
        output += "|-----|------|----------|----------|---------|----------|\n";
        credentials.forEach(c => {
          const expires = c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "-";
          const expiredFlag = c.isExpired ? " (EXPIRED)" : "";
          output += `| ${c.id} | ${c.name} | ${c.category} | ${c.username || "-"} | ${c.website || "-"} | ${expires}${expiredFlag} |\n`;
        });
        output += "\n*Values are encrypted. Use the web UI to reveal actual credential values.*";

        return { content: [{ type: "text", text: output }] };
      }

      case "get_credential": {
        const result = await apiRequest("GET", `/api/credentials/${args.id}`);
        const cred = result?.credential;
        if (!cred) {
          return { content: [{ type: "text", text: `Credential ${args.id} not found.` }], isError: true };
        }

        let output = `## Credential: ${cred.name}\n\n`;
        output += `- **ID:** ${cred.id}\n`;
        output += `- **Category:** ${cred.category}\n`;
        output += `- **Username:** ${cred.username || "Not set"}\n`;
        output += `- **Website:** ${cred.website || "Not set"}\n`;
        output += `- **Value:** ${cred.maskedValue} (encrypted)\n`;
        output += `- **Notes:** ${cred.notes || "None"}\n`;
        output += `- **Expires:** ${cred.expiresAt ? new Date(cred.expiresAt).toLocaleDateString() : "Never"}\n`;
        output += `- **Last Accessed:** ${cred.lastAccessedAt ? new Date(cred.lastAccessedAt).toLocaleDateString() : "Never"}\n`;
        if (cred.isExpired) {
          output += "\n**WARNING: This credential has expired!**\n";
        }
        output += "\n*Use the web UI to reveal the actual credential value.*";

        return { content: [{ type: "text", text: output }] };
      }

      case "create_credential": {
        const result = await apiRequest("POST", "/api/credentials", {
          name: args.name,
          category: args.category || "other",
          value: args.value,
          website: args.website || null,
          username: args.username || null,
          notes: args.notes || null,
          expiresAt: args.expiresAt || null,
        });

        if (result?.success) {
          return { content: [{ type: "text", text: `Credential "${args.name}" created successfully (ID: ${result.credential?.id}). Value is encrypted with AES-256-GCM.` }] };
        }
        return { content: [{ type: "text", text: `Failed to create credential: ${result?.message || "Unknown error"}` }], isError: true };
      }

      case "update_credential": {
        const updateData = {};
        const fields = ["name", "category", "value", "website", "username", "notes", "expiresAt"];
        for (const field of fields) {
          if (args[field] !== undefined && args[field] !== "") {
            updateData[field] = args[field];
          }
        }

        const result = await apiRequest("PUT", `/api/credentials/${args.id}`, updateData);
        if (result?.success) {
          return { content: [{ type: "text", text: `Credential ${args.id} updated successfully.` }] };
        }
        return { content: [{ type: "text", text: `Failed to update credential: ${result?.message || "Unknown error"}` }], isError: true };
      }

      case "delete_credential": {
        const result = await apiRequest("DELETE", `/api/credentials/${args.id}`);
        if (result?.success) {
          return { content: [{ type: "text", text: `Credential ${args.id} deleted successfully.` }] };
        }
        return { content: [{ type: "text", text: `Failed to delete credential: ${result?.message || "Unknown error"}` }], isError: true };
      }

      // ==================== TASK ATTACHMENT HANDLERS ====================
      case "list_attachments": {
        const attachments = await apiRequest("GET", `/api/tasks/${args.taskId}/attachments`);

        if (!attachments || attachments.length === 0) {
          return { content: [{ type: "text", text: `No attachments found for task ${args.taskId}.` }] };
        }

        let output = `## Attachments for Task ${args.taskId}\n\n`;
        output += `| ID | File Name | Type | Size | Uploaded |\n`;
        output += `|----|-----------|------|------|----------|\n`;

        for (const att of attachments) {
          const sizeKB = (att.fileSize / 1024).toFixed(1);
          const uploaded = att.uploadedAt ? new Date(att.uploadedAt).toLocaleDateString() : 'N/A';
          output += `| ${att.id} | ${att.fileName} | ${att.type || 'document'} | ${sizeKB} KB | ${uploaded} |\n`;
        }

        output += `\n*Total: ${attachments.length} attachment(s)*`;
        if (attachments.some(a => a.notes)) {
          output += `\n\n### Notes:\n`;
          attachments.filter(a => a.notes).forEach(a => {
            output += `- **${a.fileName}**: ${a.notes}\n`;
          });
        }

        return { content: [{ type: "text", text: output }] };
      }

      case "get_attachment": {
        const attachment = await apiRequest("GET", `/api/attachments/${args.id}`);

        if (!attachment) {
          return { content: [{ type: "text", text: `Attachment ${args.id} not found.` }], isError: true };
        }

        // Return metadata without the full content for display, but include content info
        const sizeKB = (attachment.fileSize / 1024).toFixed(1);
        const uploaded = attachment.uploadedAt ? new Date(attachment.uploadedAt).toISOString() : 'N/A';
        const hasContent = !!attachment.fileContent;
        const contentPreview = hasContent ? `${attachment.fileContent.substring(0, 50)}...` : 'N/A';

        let output = `## Attachment Details\n\n`;
        output += `- **ID**: ${attachment.id}\n`;
        output += `- **Task ID**: ${attachment.taskId}\n`;
        output += `- **File Name**: ${attachment.fileName}\n`;
        output += `- **File Type**: ${attachment.fileType}\n`;
        output += `- **Category**: ${attachment.type || 'document'}\n`;
        output += `- **Size**: ${sizeKB} KB (${attachment.fileSize} bytes)\n`;
        output += `- **Uploaded**: ${uploaded}\n`;
        if (attachment.notes) {
          output += `- **Notes**: ${attachment.notes}\n`;
        }
        output += `\n**Content Available**: ${hasContent ? 'Yes (base64 encoded)' : 'No'}\n`;
        if (hasContent) {
          output += `**Content Preview**: \`${contentPreview}\`\n`;
        }

        // Also return the raw JSON for programmatic access
        return {
          content: [
            { type: "text", text: output },
            { type: "text", text: `\n---\n**Raw JSON:**\n\`\`\`json\n${JSON.stringify(attachment, null, 2)}\n\`\`\`` }
          ]
        };
      }

      case "create_attachment": {
        const attachment = await apiRequest("POST", `/api/tasks/${args.taskId}/attachments`, {
          taskId: args.taskId,
          fileName: args.fileName,
          fileType: args.fileType,
          fileSize: args.fileSize,
          fileContent: args.fileContent,
          notes: args.notes || null,
          type: args.type || "document",
        });

        const sizeKB = (attachment.fileSize / 1024).toFixed(1);
        return {
          content: [{
            type: "text",
            text: `Successfully uploaded attachment:\n- **ID**: ${attachment.id}\n- **File**: ${attachment.fileName}\n- **Size**: ${sizeKB} KB\n- **Type**: ${attachment.type || 'document'}\n- **Task**: ${attachment.taskId}`
          }]
        };
      }

      case "update_attachment": {
        const updateData = {};
        if (args.notes !== undefined) updateData.notes = args.notes;
        if (args.type !== undefined) updateData.type = args.type;

        if (Object.keys(updateData).length === 0) {
          return { content: [{ type: "text", text: "No update fields provided. Specify 'notes' or 'type' to update." }], isError: true };
        }

        const attachment = await apiRequest("PUT", `/api/attachments/${args.id}`, updateData);
        return {
          content: [{
            type: "text",
            text: `Attachment ${args.id} updated successfully.\n- **File**: ${attachment.fileName}\n- **Type**: ${attachment.type}\n- **Notes**: ${attachment.notes || '(none)'}`
          }]
        };
      }

      case "delete_attachment": {
        await apiRequest("DELETE", `/api/attachments/${args.id}`);
        return { content: [{ type: "text", text: `Attachment ${args.id} deleted successfully.` }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("American Cheese MCP Server (API mode) running on stdio");
}

main().catch(console.error);
