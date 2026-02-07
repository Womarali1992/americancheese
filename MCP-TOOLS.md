# American Cheese MCP Tools Reference

All tools are prefixed with `mcp__american-cheese__` when called via Claude Code.
**Bold** parameters are required.

---

## Discovery

### list_color_themes
List all available color themes (IDs, names, descriptions).
- No parameters

### list_presets
List category presets with fuzzy search.
- `search` (string) - Fuzzy search term to filter presets

---

## Quick Start

### quick_setup_project
Create a project + apply a preset in one step.
- **`name`** (string) - Project name
- **`presetId`** (string) - Preset (fuzzy matched): ai-agent, software-development, home-builder, marketing-sales, workout, etc.
- `colorTheme` (string) - Color theme (fuzzy matched): earth-tone, neon-noir, futuristic, pastel, etc.
- `location` (string) - Project location (default: 'Remote')
- `description` (string) - Project description

### get_project_overview
Get everything about a project: details, categories, task counts.
- **`projectId`** (number)

### add_tasks_batch
Create multiple tasks at once.
- **`projectId`** (number)
- **`tasks`** (array) - Each item: **`title`**, **`tier1Category`**, **`tier2Category`**, `description`, `status`

---

## Projects

### list_projects
- `status` (string) - active, completed, on_hold, cancelled
- `limit` (number) - Default: 50

### get_project
- **`id`** (number)

### create_project
- **`name`** (string)
- **`location`** (string)
- `description` (string)
- `startDate` (string) - YYYY-MM-DD
- `endDate` (string) - YYYY-MM-DD
- `status` (string) - active, completed, on_hold, cancelled
- `presetId` (string) - e.g., home-builder, commercial

### update_project
- **`id`** (number)
- `name` (string)
- `location` (string)
- `description` (string)
- `startDate` (string) - YYYY-MM-DD
- `endDate` (string) - YYYY-MM-DD
- `status` (string) - active, completed, on_hold, cancelled
- `progress` (number) - 0-100

### delete_project
- **`id`** (number) - Deletes all associated data

---

## Tasks

### list_tasks
- `projectId` (number)
- `status` (string) - not_started, in_progress, completed, blocked
- `tier1Category` (string)
- `tier2Category` (string)
- `completed` (boolean)
- `limit` (number) - Default: 100

### get_task
- **`id`** (number)

### create_task
- **`projectId`** (number)
- **`title`** (string)
- **`startDate`** (string) - YYYY-MM-DD
- **`endDate`** (string) - YYYY-MM-DD
- `description` (string)
- `tier1Category` (string)
- `tier2Category` (string)
- `status` (string)
- `assignedTo` (string)
- `estimatedCost` (number)
- `materialsNeeded` (string)

### update_task
- **`id`** (number)
- `title`, `description`, `tier1Category`, `tier2Category` (string)
- `startDate`, `endDate` (string) - YYYY-MM-DD
- `status` (string)
- `completed` (boolean)
- `assignedTo` (string)
- `estimatedCost`, `actualCost` (number)
- `calendarActive` (boolean)
- `referencedTaskIds` (string[])

### delete_task
- **`id`** (number) - Also deletes subtasks, checklist items, attachments

### search_tasks
- **`query`** (string)
- `projectId` (number) - Limit to specific project

---

## Subtasks

### list_subtasks
- **`parentTaskId`** (number)

### create_subtask
- **`parentTaskId`** (number)
- **`title`** (string)
- `description` (string)
- `assignedTo` (string)
- `startDate`, `endDate` (string) - YYYY-MM-DD
- `estimatedCost` (number)

### update_subtask
- **`id`** (number)
- `title`, `description` (string)
- `completed` (boolean)
- `status` (string)
- `assignedTo` (string)
- `estimatedCost`, `actualCost` (number)

### delete_subtask
- **`id`** (number)

---

## Task References

### add_task_reference
Link a task so its materials show in another task's materials section.
- **`taskId`** (number) - The task to add the reference to
- **`referencedTaskId`** (number) - The task to reference

### remove_task_reference
- **`taskId`** (number)
- **`referencedTaskId`** (number)

### list_task_references
- **`taskId`** (number) - Returns referenced tasks with their materials

---

## Materials

### list_materials
- `projectId` (number)
- `status` (string) - ordered, quoted, delivered, used
- `tier2Category` (string)
- `limit` (number) - Default: 100

### get_material
- **`id`** (number)

### create_material
- **`projectId`** (number)
- **`name`** (string)
- **`type`** (string)
- **`quantity`** (number)
- `tier2Category` (string)
- `unit` (string)
- `cost` (number)
- `supplier` (string)
- `status` (string) - ordered, quoted, delivered, used
- `details` (string)

### update_material
- **`id`** (number)
- `name`, `type`, `tier2Category`, `unit`, `supplier`, `status`, `details` (string)
- `quantity`, `cost` (number)

### delete_material
- **`id`** (number)

---

## Labor

### list_labor
- `projectId` (number)
- `taskId` (number)
- `status` (string) - pending, in_progress, completed, billed
- `limit` (number) - Default: 100

### get_labor
- **`id`** (number)

### create_labor
- **`projectId`** (number)
- **`contactId`** (number)
- **`fullName`** (string)
- **`company`** (string)
- **`workDate`** (string) - YYYY-MM-DD
- **`startDate`** (string) - YYYY-MM-DD
- **`endDate`** (string) - YYYY-MM-DD
- `taskId` (number)
- `tier1Category`, `tier2Category` (string)
- `startTime`, `endTime` (string) - HH:MM
- `totalHours`, `laborCost` (number)
- `workDescription` (string)
- `status` (string)

### update_labor
- **`id`** (number)
- `startTime`, `endTime` (string) - HH:MM
- `totalHours`, `laborCost` (number)
- `workDescription` (string)
- `status` (string)

### delete_labor
- **`id`** (number)

---

## Contacts

### list_contacts
- `type` (string) - contractor, supplier, consultant, etc.
- `category` (string) - electrical, plumbing, concrete, etc.
- `limit` (number) - Default: 100

### get_contact
- **`id`** (number)

### create_contact
- **`name`** (string)
- **`role`** (string)
- **`type`** (string) - contractor, supplier, consultant, etc.
- `company` (string)
- `phone` (string)
- `email` (string)
- `category` (string)
- `initials` (string)

### update_contact
- **`id`** (number)
- `name`, `role`, `company`, `phone`, `email`, `type`, `category` (string)

### delete_contact
- **`id`** (number)

---

## Checklist / Blockers

### list_blocker_board
- `projectId` (number) - All blockers across all tasks in project
- `taskId` (number) - Specific task
- `completed` (boolean)
- `assignedTo` (string)
- `section` (string) - e.g., Planning, Execution
- `contactId` (number)
- `limit` (number) - Default: 100

### get_checklist_items
- **`taskId`** (number)

### create_checklist_item
- **`taskId`** (number)
- **`title`** (string)
- `description` (string)
- `section` (string)
- `assignedTo` (string)
- `dueDate` (string) - YYYY-MM-DD
- `sortOrder` (number)
- `contactIds` (string[])

### update_checklist_item
- **`id`** (number)
- `title`, `description`, `section`, `assignedTo` (string)
- `completed` (boolean)
- `dueDate` (string) - YYYY-MM-DD
- `sortOrder` (number)
- `contactIds` (string[])

### delete_checklist_item
- **`id`** (number)

---

## Categories

### list_categories
Returns hierarchical tier1 + tier2 structure.
- **`projectId`** (number)

### create_category
- **`projectId`** (number)
- **`name`** (string)
- **`type`** (string) - 'tier1' or 'tier2'
- `parentId` (number) - Required for tier2
- `description` (string)
- `color` (string) - Hex code
- `sortOrder` (number)

### update_category
- **`id`** (number)
- `name` (string)
- `description` (string)
- `color` (string) - Hex code
- `sortOrder` (number)

### delete_category
- **`id`** (number) - For tier1, also deletes all tier2 subcategories

### get_category_context
Get the AI context for a category.
- **`projectId`** (number)
- **`categoryId`** (number)

### update_category_context
Update the AI context for a category.
- **`projectId`** (number)
- **`categoryId`** (number)
- **`context`** (object) - ContextData with sections: mission, scope, tech, casting, deliverables, strategy_tags, constraints

### apply_preset_categories
Apply a preset's categories to a project (fuzzy matching supported).
- **`projectId`** (number)
- **`presetId`** (string) - ai-agent, software-development, home-builder, workout, etc.
- `clearExisting` (boolean) - Default: true

### bulk_create_categories
Create multiple categories at once.
- **`projectId`** (number)
- **`categories`** (array) - Each: **`name`**, `description`, `color`, `tier2[]` (each: `name`, `description`)
- `clearExisting` (boolean) - Default: false

---

## Calendar Events

### list_calendar_events
- `projectId` (number)
- `startDate`, `endDate` (string) - YYYY-MM-DD
- `eventType` (string) - event, meeting, deadline, milestone, work_session, reminder
- `status` (string) - scheduled, completed, cancelled
- `taskId` (number)
- `limit` (number) - Default: 100

### get_calendar_event
- **`id`** (number)

### create_calendar_event
- **`title`** (string)
- **`startDate`** (string) - YYYY-MM-DD
- **`endDate`** (string) - YYYY-MM-DD
- `description` (string)
- `projectId` (number)
- `startTime`, `endTime` (string) - HH:MM (omit for all-day)
- `isAllDay` (boolean)
- `eventType` (string) - event, meeting, deadline, milestone, work_session, reminder
- `color` (string) - Hex code
- `tier1Category`, `tier2Category` (string)
- `taskId`, `subtaskId`, `laborId`, `contactId` (number)
- `isRecurring` (boolean)
- `recurrenceRule` (string) - iCal RRULE format
- `recurrenceEndDate` (string) - YYYY-MM-DD
- `reminderMinutes` (number)
- `location` (string)
- `attendees` (string[])
- `notes` (string)

### update_calendar_event
- **`id`** (number)
- All fields from create_calendar_event (optional)
- `status` (string) - scheduled, completed, cancelled

### delete_calendar_event
- **`id`** (number)
- `deleteRecurring` (boolean) - Delete all recurring instances

### create_event_from_task
Create a calendar event from an existing task.
- **`taskId`** (number)
- `eventType` (string) - Default: work_session
- `startTime`, `endTime` (string) - HH:MM (omit for all-day)

---

## Search & Analytics

### get_project_summary
Task counts by status, total costs, progress.
- **`projectId`** (number)

---

## Credentials Vault

### list_credentials
- `category` (string) - api_key, password, connection_string, certificate, other

### get_credential
Returns masked value. Use web UI to reveal.
- **`id`** (number)

### create_credential
Stored with AES-256-GCM encryption.
- **`name`** (string)
- **`value`** (string)
- `category` (string)
- `website` (string)
- `username` (string)
- `notes` (string)
- `expiresAt` (string) - YYYY-MM-DD

### update_credential
- **`id`** (number)
- `name`, `category`, `value`, `website`, `username`, `notes` (string)
- `expiresAt` (string) - YYYY-MM-DD

### delete_credential
- **`id`** (number)

---

## Attachments

### list_attachments
- **`taskId`** (number)

### get_attachment
Returns base64-encoded content.
- **`id`** (number)

### create_attachment
- **`taskId`** (number)
- **`fileName`** (string) - e.g., 'blueprint.pdf'
- **`fileType`** (string) - MIME type
- **`fileSize`** (number) - Bytes
- **`fileContent`** (string) - Base64-encoded
- `notes` (string)
- `type` (string) - document, image, note, video, audio, other

### update_attachment
Metadata only. Delete and recreate to change file content.
- **`id`** (number)
- `notes` (string)
- `type` (string)

### delete_attachment
- **`id`** (number)
