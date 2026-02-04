# American Cheese MCP Server

MCP (Model Context Protocol) server for the American Cheese construction project management platform. This allows AI assistants like Claude to manage your construction projects, tasks, materials, labor, and more.

## Installation

### 1. Install dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Your deployed American Cheese app URL
API_BASE_URL=http://134.199.207.43

# App password
API_PASSWORD=richman
```

## Usage with Claude Desktop

Add the server to your Claude Desktop configuration file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "american-cheese": {
      "command": "node",
      "args": ["C:/Users/omara/apps/american/mcp-server/api-index.js"],
      "env": {
        "API_BASE_URL": "http://134.199.207.43",
        "API_PASSWORD": "richman"
      }
    }
  }
}
```

## Available Tools

### Quick Start Tools
- **quick_setup_project** - Create a project with preset categories in one step
- **get_project_overview** - Get complete project info including categories and task counts
- **add_tasks_batch** - Create multiple tasks at once

### Project Management
- **list_projects** - List all projects with optional status filter
- **get_project** - Get detailed project information
- **create_project** - Create a new project
- **update_project** - Update project details
- **delete_project** - Delete a project and all related data

### Task Management
- **list_tasks** - List tasks with optional filters
- **get_task** - Get detailed task information
- **create_task** - Create a new task
- **update_task** - Update task details
- **delete_task** - Delete a task

### Subtasks
- **list_subtasks** - List subtasks for a parent task
- **create_subtask** - Create a new subtask
- **update_subtask** - Update subtask details
- **delete_subtask** - Delete a subtask

### Task References
- **add_task_reference** - Link tasks to share materials
- **remove_task_reference** - Remove task links
- **list_task_references** - List all referenced tasks

### Materials
- **list_materials** - List materials with optional filters
- **get_material** - Get material details
- **create_material** - Create a new material entry
- **update_material** - Update material details
- **delete_material** - Delete a material

### Labor
- **list_labor** - List labor entries with optional filters
- **get_labor** - Get labor entry details
- **create_labor** - Create a new labor entry
- **update_labor** - Update labor entry
- **delete_labor** - Delete a labor entry

### Contacts
- **list_contacts** - List all contacts
- **get_contact** - Get contact details
- **create_contact** - Create a new contact
- **update_contact** - Update contact details
- **delete_contact** - Delete a contact

### Checklist/Blockers
- **list_blocker_board** - List checklist items across project
- **create_checklist_item** - Create a new checklist item
- **update_checklist_item** - Update checklist item
- **delete_checklist_item** - Delete checklist item
- **get_checklist_items** - Get checklist items for a task

### Categories
- **list_categories** - List all categories for a project
- **create_category** - Create a new category
- **update_category** - Update category details
- **delete_category** - Delete a category
- **apply_preset_categories** - Apply a preset to a project
- **bulk_create_categories** - Create multiple categories at once

### Search & Analytics
- **search_tasks** - Search tasks by title or description
- **get_project_summary** - Get project summary with stats

### Credentials Vault
- **list_credentials** - List all stored credentials (masked values)
- **get_credential** - Get credential details (masked)
- **create_credential** - Store a new encrypted credential
- **update_credential** - Update credential details
- **delete_credential** - Delete a credential

*Note: Credential values are encrypted with AES-256-GCM. Use the web UI to reveal actual values (requires password re-verification).*

### Calendar Events
- **list_calendar_events** - List calendar events
- **get_calendar_event** - Get event details
- **create_calendar_event** - Create a new event
- **update_calendar_event** - Update event details
- **delete_calendar_event** - Delete an event
- **create_event_from_task** - Create calendar event from task

## Available Category Presets

- `ai-agent` - AI/ML agent development workflow
- `software-development` - Software development lifecycle
- `home-builder` - Residential construction
- `standard-construction` - Commercial construction
- `marketing-sales` - Marketing and sales pipeline
- `digital-marketing` - Digital marketing campaigns
- `workout` - Fitness and workout tracking

## Example Usage

Once connected, you can ask Claude things like:

- "Create a new software development project called 'Mobile App'"
- "Show me all tasks for project 5"
- "Add 3 tasks to the Planning category for project 12"
- "Mark task 45 as completed"
- "Get a summary of project 8"
- "List all materials that are ordered but not delivered"
- "Store my LinkedIn API key securely"
- "List my saved credentials"

## Two Server Modes

This package includes two server implementations:

1. **API Mode (Recommended):** `api-index.js`
   - Connects to your deployed app via REST API
   - More secure - uses app authentication
   - No direct database access needed

2. **Database Mode:** `index.js`
   - Connects directly to PostgreSQL database
   - Faster but requires database credentials
   - Use for development or trusted environments

To use database mode, run:
```bash
npm run start:db
```

## Troubleshooting

### Authentication Errors
- Verify your email and password are correct
- Check that your account is active in the app
- Ensure the API_BASE_URL doesn't have a trailing slash

### Connection Errors
- Verify the app is running at the specified URL
- Check network connectivity
- Ensure HTTPS is working properly

### Tool Not Found
- Restart Claude Desktop after config changes
- Check the server logs for errors
- Verify the MCP server is running
