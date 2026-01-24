# Task Export/Import Format Documentation

## Overview

The task export feature creates a comprehensive XML file containing all task information including subtasks, subtask comments, materials, labor, attachments, and project context. This format is designed to be both machine-readable (for import) and human-readable (with embedded markdown summaries).

## Export Functionality

### How to Export a Task

1. Navigate to a task detail page
2. Click the green **"Export"** button in the header (next to the Edit button)
3. An XML file will be downloaded with the format: `task-{id}-{task-name}.xml`

### What Gets Exported

The export includes:
- **Task Details**: Title, status, dates, costs, categories
- **Description**: Full task description with markdown formatting
- **Project Context**: AI context and structured data from the project
- **Contacts**: All assigned contacts with full details
- **Subtasks**: All subtasks with their properties
  - Subtask title, description, status
  - Start/end dates, assigned users
  - Estimated and actual costs
  - **Subtask Comments**: All comments with authors and timestamps
- **Blocker Board Items**: Checklist items organized by status
- **Materials**: Associated materials with quantities, costs, suppliers
- **Labor Entries**: Work performed with hours, costs, descriptions
- **Attachments**: File metadata and notes

## XML Structure

### File Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<task-export>
  <metadata>
    <exported-at>2025-01-24T12:00:00.000Z</exported-at>
    <task-id>123</task-id>
    <project-id>5</project-id>
    <project-name>Example Project</project-name>
  </metadata>

  <task>
    <title>Example Task</title>
    <status>in_progress</status>
    <category tier="1">structural</category>
    <category tier="2">framing</category>
    <dates>
      <start>2025-01-15</start>
      <end>2025-02-15</end>
    </dates>
    <costs>
      <estimated>5000</estimated>
      <actual>4500</actual>
    </costs>
  </task>

  <description format="markdown">
    <![CDATA[
    # Task Description

    Detailed markdown content here...
    ]]>
  </description>

  <ai-context>
    <!-- AI context sections from project -->
  </ai-context>

  <contacts>
    <contact id="1">
      <name>John Contractor</name>
      <company>ABC Construction</company>
      <role>General Contractor</role>
      <email>john@abc.com</email>
      <phone>555-1234</phone>
    </contact>
  </contacts>

  <subtasks count="5">
    <subtask id="10" order="1" status="completed" completed="true">
      <title>Foundation Prep</title>
      <description><![CDATA[Prepare foundation area]]></description>
      <start-date>2025-01-15</start-date>
      <end-date>2025-01-20</end-date>
      <assigned-to>John Doe</assigned-to>
      <estimated-cost>1000</estimated-cost>
      <actual-cost>950</actual-cost>

      <comments count="3">
        <comment id="101">
          <author>Jane Smith</author>
          <content><![CDATA[Need to check soil compaction]]></content>
          <created-at>2025-01-16T10:00:00.000Z</created-at>
          <updated-at>2025-01-16T10:00:00.000Z</updated-at>
        </comment>
        <comment id="102">
          <author>Bob Builder</author>
          <content><![CDATA[Compaction test passed]]></content>
          <created-at>2025-01-17T14:30:00.000Z</created-at>
          <updated-at>2025-01-17T14:30:00.000Z</updated-at>
        </comment>
      </comments>
    </subtask>
  </subtasks>

  <blocker-board count="3">
    <column status="todo" count="1">
      <item id="20">
        <title>Order lumber</title>
        <description><![CDATA[Need to order 2x4s]]></description>
      </item>
    </column>
    <column status="done" count="2">
      <!-- Completed blocker items -->
    </column>
  </blocker-board>

  <materials count="10">
    <material id="30" status="delivered">
      <name>2x4 Lumber</name>
      <quantity unit="pieces">100</quantity>
      <cost>5.50</cost>
      <supplier>Lumber Yard Inc</supplier>
      <details><![CDATA[Premium grade lumber]]></details>
    </material>
  </materials>

  <labor count="5">
    <entry id="40">
      <worker>John Doe</worker>
      <company>John's Contracting</company>
      <work-description><![CDATA[Foundation excavation and prep]]></work-description>
      <task-description><![CDATA[Foundation work]]></task-description>
      <hours>40</hours>
      <cost>2000</cost>
      <dates>
        <start>2025-01-15</start>
        <end>2025-01-20</end>
      </dates>
    </entry>
  </labor>

  <attachments count="3">
    <file id="50" type="image/jpeg">
      <name>site-photo.jpg</name>
      <notes><![CDATA[Photo of completed foundation]]></notes>
      <created>2025-01-20T16:00:00.000Z</created>
    </file>
  </attachments>

  <human-readable format="markdown">
    <![CDATA[
    # Task Title

    **Status:** IN_PROGRESS
    **Project:** Example Project
    **Category:** structural > framing

    ## Checklist (3/5)
    - [x] Foundation Prep
      > Prepare foundation area
      **Comments (2):**
      - Jane Smith: Need to check soil compaction
      - Bob Builder: Compaction test passed
    - [ ] Frame Walls
    - [ ] Install Roof Trusses

    ## Materials
    | Material | Qty | Cost | Supplier | Status |
    |----------|-----|------|----------|--------|
    | 2x4 Lumber | 100 pieces | $5.50 | Lumber Yard Inc | delivered |

    <!-- More human-readable sections -->
    ]]>
  </human-readable>
</task-export>
```

## Import Guidelines

When implementing an import feature, the system should:

1. **Parse XML**: Use an XML parser to read the exported file
2. **Validate Structure**: Ensure all required fields are present
3. **Handle IDs**:
   - Ignore existing IDs (they're for reference only)
   - Generate new IDs for imported records
   - Maintain relationships between entities
4. **Process in Order**:
   - Create/update task first
   - Create contacts if they don't exist
   - Create subtasks and link to task
   - Create subtask comments and link to subtasks
   - Create materials and associate with task
   - Create labor entries
   - Create attachments (note: file content not included in export)

### Key Import Considerations

**Subtasks and Comments:**
- Each `<subtask>` element has an `id` attribute - this is the original ID from export
- Comments within a subtask reference the parent subtask
- When importing, create subtasks first, then create comments linked to the new subtask IDs
- Preserve the author name and timestamp from comments

**Data Types:**
- Dates: ISO 8601 format (YYYY-MM-DD)
- Timestamps: ISO 8601 format with timezone (e.g., 2025-01-24T12:00:00.000Z)
- Booleans: String values "true" or "false"
- Numbers: Decimal format for costs, integer for IDs

**CDATA Sections:**
- Content wrapped in `<![CDATA[...]]>` can contain special characters
- Parse these sections carefully to preserve formatting

**Categories:**
- Two-tier category system: tier1 and tier2
- Map to your project's category structure during import

**Relationships:**
- Contact IDs: Match by email or name if contact exists, otherwise create new
- Material IDs: Associate materials with task using `taskIds` array
- Subtask-to-Task: Use `parentTaskId` to link subtasks to main task
- Comments-to-Subtask: Use `subtaskId` to link comments to subtasks

## Example Import Implementation (Pseudo-code)

```javascript
async function importTask(xmlContent) {
  const parsed = parseXML(xmlContent);

  // 1. Create the main task
  const taskData = {
    title: parsed.task.title,
    status: parsed.task.status,
    tier1Category: parsed.task.category[0],
    tier2Category: parsed.task.category[1],
    description: parsed.description,
    startDate: parsed.task.dates.start,
    endDate: parsed.task.dates.end,
    estimatedCost: parsed.task.costs?.estimated,
    actualCost: parsed.task.costs?.actual,
    projectId: getCurrentProjectId() // or from metadata
  };

  const newTask = await createTask(taskData);

  // 2. Import or match contacts
  const contactMap = new Map(); // original ID -> new ID
  for (const contact of parsed.contacts) {
    const existing = await findContactByEmail(contact.email);
    if (existing) {
      contactMap.set(contact.id, existing.id);
    } else {
      const newContact = await createContact({
        name: contact.name,
        company: contact.company,
        role: contact.role,
        email: contact.email,
        phone: contact.phone
      });
      contactMap.set(contact.id, newContact.id);
    }
  }

  // 3. Import subtasks
  const subtaskMap = new Map(); // original ID -> new ID
  for (const subtask of parsed.subtasks) {
    const newSubtask = await createSubtask({
      parentTaskId: newTask.id,
      title: subtask.title,
      description: subtask.description,
      status: subtask.status,
      completed: subtask.completed === 'true',
      sortOrder: subtask.order,
      assignedTo: subtask.assignedTo,
      startDate: subtask.startDate,
      endDate: subtask.endDate,
      estimatedCost: subtask.estimatedCost,
      actualCost: subtask.actualCost
    });

    subtaskMap.set(subtask.id, newSubtask.id);

    // 4. Import subtask comments
    if (subtask.comments) {
      for (const comment of subtask.comments) {
        await createSubtaskComment({
          subtaskId: newSubtask.id,
          authorName: comment.author,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt
        });
      }
    }
  }

  // 5. Import blocker board items
  for (const column of parsed.blockerBoard?.columns || []) {
    for (const item of column.items) {
      await createChecklistItem({
        taskId: newTask.id,
        title: item.title,
        description: item.description,
        status: column.status
      });
    }
  }

  // 6. Import materials
  for (const material of parsed.materials) {
    await createMaterial({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      cost: material.cost,
      supplier: material.supplier,
      status: material.status,
      details: material.details,
      projectId: newTask.projectId,
      taskIds: [newTask.id]
    });
  }

  // 7. Import labor entries
  for (const labor of parsed.labor) {
    const contactId = contactMap.get(labor.contactId) || null;
    await createLabor({
      fullName: labor.worker,
      company: labor.company,
      workDescription: labor.workDescription,
      taskDescription: labor.taskDescription,
      totalHours: labor.hours,
      laborCost: labor.cost,
      startDate: labor.dates?.start,
      endDate: labor.dates?.end,
      taskId: newTask.id,
      contactId: contactId,
      projectId: newTask.projectId
    });
  }

  return newTask;
}
```

## Use Cases

1. **Backup & Restore**: Export tasks before major changes, import to restore
2. **Template Creation**: Export a well-structured task, import to create similar tasks
3. **Project Transfer**: Move tasks between projects or systems
4. **Data Migration**: Migrate from other project management systems
5. **Reporting**: Parse exported XML for custom reports and analytics
6. **AI Integration**: Feed task data to AI systems for analysis or suggestions

## Notes

- **File Size**: Exports can be large for tasks with many materials/labor entries
- **Attachments**: File content is NOT included in exports (only metadata)
- **Versioning**: The export format includes metadata for future version compatibility
- **Encoding**: All exports use UTF-8 encoding
- **Special Characters**: Properly escaped in XML, preserved in CDATA sections

## API Endpoints Used

The export functionality fetches data from these endpoints:

- `GET /api/tasks/:taskId` - Main task data
- `GET /api/tasks/:taskId/subtasks` - All subtasks for the task
- `GET /api/subtasks/:subtaskId/comments` - Comments for each subtask
- `GET /api/tasks/:taskId/checklist` - Blocker board items
- `GET /api/tasks/:taskId/labor` - Labor entries
- `GET /api/tasks/:taskId/attachments` - File attachments metadata
- `GET /api/materials` - Materials (filtered by taskId)
- `GET /api/contacts` - Contacts (filtered by contactIds)
- `GET /api/projects/:projectId` - Project details with context

## Future Enhancements

Planned improvements to the export/import system:

1. **Import UI**: Web interface for importing XML files
2. **Batch Export**: Export multiple tasks at once
3. **Project-Level Export**: Export entire projects with all tasks
4. **JSON Format**: Alternative JSON format for easier parsing
5. **Attachment Data**: Optional inclusion of base64-encoded file content
6. **Selective Export**: Choose which sections to include in export
7. **Import Mapping**: Map categories/contacts during import
8. **Version Migration**: Automatic format conversion between versions
