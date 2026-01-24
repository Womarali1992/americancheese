# Task Import Functionality - User Guide

## Overview

The task import feature allows you to upload XML files (created by the export feature) to recreate complete tasks with all their data including subtasks, comments, materials, labor, and contacts.

## How to Import a Task

### Step 1: Access the Import Function

1. Navigate to the **Tasks** page in your application
2. Look for the blue **"Import Task"** button next to the green "Add Task" button
3. Click the **"Import Task"** button to open the import dialog

### Step 2: Select Target Project

1. In the import dialog, select the **Target Project** from the dropdown
   - This determines which project the imported task will belong to
   - If you're viewing a specific project's tasks, that project will be pre-selected

### Step 3: Upload XML File

1. Click the **file upload area** (or click "Click to select XML file")
2. Select an XML file that was previously exported from the system
   - Only `.xml` files are accepted
   - The file must be in the correct export format

### Step 4: Import the Task

1. Review your selections:
   - Target project is correct
   - XML file is selected
2. Click the **"Import Task"** button
3. Wait for the import to complete (you'll see a loading indicator)

### Step 5: Review Results

After import completes, you'll see:
- **Success message** with the task name
- **Import summary** showing:
  - Number of subtasks imported
  - Number of contacts imported/matched
  - Number of materials imported
  - Number of labor entries imported

The dialog will show a green success message with all the details.

## What Gets Imported

The import process recreates all task data:

✅ **Main Task**
- Title, description, status
- Start and end dates
- Categories (tier1 and tier2)
- Estimated and actual costs
- Completion status

✅ **Subtasks**
- All subtask titles and descriptions
- Status and completion state
- Dates and assigned users
- Cost estimates and actuals
- **Sort order preserved**

✅ **Subtask Comments**
- All comments with original content
- Author names preserved
- Timestamps preserved

✅ **Contacts**
- Automatically matched by email if exists
- New contacts created if not found
- All contact details preserved

✅ **Materials**
- Material names, quantities, units
- Costs and suppliers
- Automatically linked to the new task
- Material details and status

✅ **Labor Entries**
- Worker names and companies
- Work descriptions
- Hours and costs
- Date ranges
- Automatically links workers as contacts

✅ **Blocker Board Items**
- Checklist items with titles
- Status (todo, planning, execution, done)
- Descriptions

## Important Notes

### Contact Matching
- Contacts are matched by **email address**
- If a contact with the same email exists, it will be reused
- If no match is found, a new contact is created
- This prevents duplicate contacts in your system

### Material Creation
- All materials are created as new records
- Materials are automatically linked to the new task
- Material IDs from the export are ignored (new IDs assigned)

### Task Relationships
- Original task and subtask IDs are ignored
- New IDs are assigned during import
- All relationships are preserved (task→subtask, subtask→comment)

### Data Validation
- The system validates the XML structure before importing
- Invalid XML files will be rejected with an error message
- Missing required fields will cause import to fail

## Error Handling

If import fails, you'll see an error message explaining what went wrong:

**Common Issues:**
- **"Invalid XML format"** - The file is not properly formatted XML
- **"No file uploaded"** - You forgot to select a file
- **"No project selected"** - You must select a target project
- **"Failed to import task"** - Server error (check server logs)

## Use Cases

### 1. Backup and Restore
Export tasks as backups, then import them if you need to restore deleted tasks.

### 2. Template Creation
1. Create a well-structured task with subtasks and materials
2. Export it as a template
3. Import it whenever you need a similar task
4. Update the imported task as needed

### 3. Project Migration
Move tasks between projects:
1. Export task from Project A
2. Import to Project B using the project selector

### 4. Cross-System Migration
If you have multiple instances of the application, you can export from one and import to another.

### 5. Data Recovery
If you accidentally delete a task but have an export, you can recover it completely with all its data.

## Best Practices

### Before Importing
1. **Verify the target project** - Make sure you're importing to the right project
2. **Check the XML file** - Ensure it's a recent export and not corrupted
3. **Review project context** - The imported task will use the target project's settings

### After Importing
1. **Verify the import** - Check that all data was imported correctly
2. **Update dates if needed** - Imported dates are preserved, update them for new timeline
3. **Review assigned contacts** - Check that contacts were matched or created correctly
4. **Check materials** - Verify material quantities and costs are correct

### Managing Imports
1. **One task at a time** - Import dialog handles one task per operation
2. **Use descriptive project names** - Makes it easier to select the right target
3. **Keep export files organized** - Name them clearly (e.g., "foundation-task-2025-01-24.xml")

## Technical Details

### XML Structure
The import expects XML in this structure:
```xml
<task-export>
  <metadata>...</metadata>
  <task>...</task>
  <description>...</description>
  <contacts>...</contacts>
  <subtasks>
    <subtask>
      <comments>...</comments>
    </subtask>
  </subtasks>
  <materials>...</materials>
  <labor>...</labor>
  <blocker-board>...</blocker-board>
</task-export>
```

### API Endpoint
Backend endpoint: `POST /api/tasks/import`
- Accepts multipart/form-data
- Requires `file` (XML file)
- Optional `projectId` (target project)

### File Size Limit
- Maximum file size: **5MB**
- This is sufficient for even very large tasks with hundreds of subtasks

## Troubleshooting

### Import Button Not Visible
- Refresh the page
- Check that you have the latest version deployed
- Clear browser cache

### Import Hangs or Times Out
- Check file size (should be under 5MB)
- Verify XML is not corrupted
- Check server logs for errors

### Data Missing After Import
- Verify the XML file contains all expected data
- Check export was complete
- Review server logs for warnings

### Duplicate Contacts Created
- Contacts are matched by email
- If emails don't match exactly, duplicates will be created
- You can merge contacts manually after import

### Wrong Project Selected
- You can't change the project after import
- Delete the imported task and import again with correct project
- Or manually move the task to the correct project

## Future Enhancements

Planned improvements:
1. **Batch Import** - Import multiple tasks at once
2. **Import Preview** - See what will be imported before confirming
3. **Conflict Resolution** - Choose how to handle duplicate contacts/materials
4. **Partial Import** - Select which sections to import
5. **Import History** - Track all imports with timestamps
6. **Import Templates** - Save import configurations for reuse

## Support

For issues:
1. Check this guide first
2. Verify your XML file is valid
3. Check server logs: `pm2 logs americancheese`
4. Review network tab in browser developer tools
5. Contact support with error details and XML file (sanitized)

---

**Last Updated:** 2026-01-24
**Version:** 1.0
