# Task Export Feature - Implementation Summary

## Overview

A comprehensive export feature has been added to the task detail page that allows users to download complete task data including subtasks, subtask comments, materials, labor entries, attachments, and project context in a structured XML format suitable for both import and archiving.

## What Was Implemented

### 1. Enhanced Export Hook (`client/src/hooks/useTaskPageExport.ts`)

**Added functionality:**
- Fetches subtask comments for each subtask
- Combines subtasks with their comments in a single data structure
- Updated export format to include:
  - All subtask properties (dates, assignedTo, costs, status)
  - Subtask comments with author, content, and timestamps
  - Enhanced markdown summaries with comment information

**Key changes:**
```typescript
// Now fetches comments for each subtask
const subtaskCommentQueries = subtasks.map((subtask) =>
  useQuery<SubtaskComment[]>({
    queryKey: [`/api/subtasks/${subtask.id}/comments`],
    enabled: enabled && taskId > 0 && subtask.id > 0,
  })
);

// Combines subtasks with comments
const subtasksWithComments: SubtaskWithComments[] = subtasks.map((subtask, index) => ({
  ...subtask,
  comments: subtaskCommentQueries[index]?.data || [],
}));
```

### 2. Export Button on Task Detail Page (`client/src/pages/tasks/TaskDetailPage.tsx`)

**Added:**
- Green "Export" button in the header (next to Edit button)
- Download handler that creates and downloads XML file
- Toast notification on successful export
- Proper file naming: `task-{id}-{task-name}.xml`

**Button location:**
- Positioned in the top-right header section
- Styled with emerald color to stand out as a data action
- Includes helpful tooltip describing what's exported

**Download handler:**
```typescript
const handleExportTask = () => {
  if (!task) return;

  const exportContent = getExportContent();
  const fileName = `task-${task.id}-${task.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.xml`;

  // Create blob and download
  const blob = new Blob([exportContent], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast({
    title: "Export Complete",
    description: `Task data exported to ${fileName}`,
  });
};
```

### 3. Enhanced XML Export Format

The XML export now includes:

```xml
<subtasks count="N">
  <subtask id="X" order="1" status="completed" completed="true">
    <title>Subtask Title</title>
    <description><![CDATA[Description...]]></description>
    <start-date>2025-01-15</start-date>
    <end-date>2025-01-20</end-date>
    <assigned-to>John Doe</assigned-to>
    <estimated-cost>1000</estimated-cost>
    <actual-cost>950</actual-cost>

    <!-- NEW: Subtask Comments -->
    <comments count="3">
      <comment id="101">
        <author>Jane Smith</author>
        <content><![CDATA[Comment text...]]></content>
        <created-at>2025-01-16T10:00:00.000Z</created-at>
        <updated-at>2025-01-16T10:00:00.000Z</updated-at>
      </comment>
    </comments>
  </subtask>
</subtasks>
```

**Also includes in markdown summary:**
```markdown
## Checklist (3/5)
- [x] Foundation Prep
  > Prepare foundation area
  **Comments (2):**
  - Jane Smith: Need to check soil compaction
  - Bob Builder: Compaction test passed
```

## Files Modified

1. **client/src/hooks/useTaskPageExport.ts**
   - Added subtask comment fetching
   - Updated `SubtaskWithComments` type
   - Enhanced XML output format
   - Added comment sections to markdown summaries

2. **client/src/pages/tasks/TaskDetailPage.tsx**
   - Added `Download` icon import
   - Added `handleExportTask` function
   - Added Export button in header

## Files Created

1. **TASK_EXPORT_FORMAT.md** - Comprehensive documentation including:
   - XML structure reference
   - Data type specifications
   - Import implementation guidelines
   - Example code for parsing and importing
   - API endpoints used
   - Future enhancement plans

2. **EXPORT_FEATURE_SUMMARY.md** (this file) - Implementation summary

## How to Use

1. Navigate to any task detail page
2. Click the green **"Export"** button in the top-right header
3. An XML file will download automatically named: `task-{id}-{task-name}.xml`
4. File contains all task data formatted for import/archiving

## Export Includes

✅ Task details (title, status, dates, costs, categories)
✅ Full description with markdown
✅ Project AI context
✅ Assigned contacts
✅ **Subtasks** with all properties
✅ **Subtask comments** with authors and timestamps
✅ Blocker board items
✅ Associated materials
✅ Labor entries
✅ Attachment metadata
✅ Human-readable markdown summary

## Data Format Features

- **Machine-readable**: Structured XML for programmatic import
- **Human-readable**: Embedded markdown summaries
- **Complete**: All relationships preserved with IDs
- **Timestamped**: All temporal data included
- **Annotated**: Comments show author and timestamps
- **Versioned**: Metadata includes export timestamp for tracking

## Import Compatibility

The export format is designed to support future import functionality:

- IDs are included for reference but should be regenerated on import
- All relationships are explicitly defined
- CDATA sections preserve special characters and formatting
- Timestamps use ISO 8601 format
- See `TASK_EXPORT_FORMAT.md` for detailed import implementation guide

## API Endpoints Used

The export fetches data from:
- `/api/tasks/:taskId` - Main task
- `/api/tasks/:taskId/subtasks` - Subtasks
- `/api/subtasks/:subtaskId/comments` - **NEW: Subtask comments**
- `/api/tasks/:taskId/checklist` - Blocker board
- `/api/tasks/:taskId/labor` - Labor entries
- `/api/tasks/:taskId/attachments` - Attachments
- `/api/materials` - Materials (filtered)
- `/api/contacts` - Contacts (filtered)
- `/api/projects/:projectId` - Project context

## Technical Notes

- Export uses React Query to batch-fetch all data
- Comments are fetched per-subtask using parallel queries
- File download uses Blob API for client-side file generation
- XML special characters are properly escaped
- CDATA sections used for user content to preserve formatting
- Type-safe with TypeScript interfaces

## Future Enhancements

Potential improvements:
1. **Import UI** - Upload and import XML files
2. **Batch Export** - Export multiple tasks at once
3. **JSON Format** - Alternative to XML
4. **Selective Export** - Choose which sections to include
5. **Attachment Data** - Optional base64-encoded file content
6. **Project Export** - Export entire projects
7. **Template Export** - Export as reusable template

## Testing Recommendations

Before deployment, test:
1. Export with various task configurations
2. Export with/without subtasks
3. Export with/without comments
4. Export with special characters in content
5. Verify XML is well-formed
6. Check file naming with special characters
7. Verify all data sections are present
8. Test markdown rendering in summary section

## Notes

- The existing drag-export feature still works alongside the button
- Button is styled to be prominent but not overwhelming
- Toast notification provides user feedback
- File naming handles special characters safely
- Export format is documented for future import development
