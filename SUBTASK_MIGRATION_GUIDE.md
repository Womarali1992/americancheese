# Task-Related Data Migration Guide

## Problem
The UCP project (project ID 89 / "Location Agent") was imported using `migrate-tasks.js`, but additional task-related data was not included because it's stored in separate database tables:

- **Subtasks** - Sub-items under tasks
- **Subtask Comments** - Comments on subtasks
- **Checklist Items** - Task checklist items
- **Checklist Item Comments** - Comments on checklist items
- **Section States** - UI state (collapsed/expanded sections)
- **Section Comments** - Comments on task sections
- **Task Attachments** - Files attached to tasks

## Solution - Two Approaches

### 🚀 **Recommended: Comprehensive Export (All Data)**

This approach exports all task-related data at once.

#### Step 1: Export All Task-Related Data

Run this on your **LOCAL** machine where the original database is:

```bash
# Export all task-related data for the UCP project (project ID 89)
node export-task-related-data.js --project-id 89
```

This will create these JSON files:
- `subtasks.json`
- `subtask_comments.json`
- `checklist_items.json`
- `checklist_comments.json`
- `section_states.json`
- `section_comments.json`
- `task_attachments.json`

#### Step 2: Generate Migration SQL

```bash
node migrate-all-task-data.js > insert_all_task_data.sql
```

This generates a single SQL file with INSERT statements for all data types.

#### Step 3: Import to Production Database

Apply the SQL to your production/target database:

**Option A: Using psql**
```bash
psql $DATABASE_URL -f insert_all_task_data.sql
```

**Option B: Direct execution**
```bash
cat insert_all_task_data.sql | psql $DATABASE_URL
```

**Option C: Through your database client**
- Open your database management tool (pgAdmin, DBeaver, etc.)
- Run the contents of `insert_all_task_data.sql`

---

### 📦 **Alternative: Subtasks Only**

If you only need subtasks (not comments, checklists, etc.):

#### Step 1: Export Subtasks Only

```bash
node export-subtasks.js
```

#### Step 2: Generate Migration SQL

```bash
node migrate-subtasks.js > insert_subtasks.sql
```

#### Step 3: Import to Production Database

```bash
psql $DATABASE_URL -f insert_subtasks.sql
```

---

## Verification

After importing, verify the subtasks were imported correctly:

```sql
-- Check total subtasks
SELECT COUNT(*) FROM subtasks;

-- Check subtasks for a specific task
SELECT * FROM subtasks WHERE parent_task_id = <task_id> ORDER BY sort_order;

-- Check subtasks for the UCP project (via tasks)
SELECT
  t.id as task_id,
  t.title as task_title,
  COUNT(s.id) as subtask_count
FROM tasks t
LEFT JOIN subtasks s ON s.parent_task_id = t.id
WHERE t.project_id = 89  -- UCP project ID
GROUP BY t.id, t.title
HAVING COUNT(s.id) > 0
ORDER BY subtask_count DESC;
```

---

## Quick Start (TL;DR)

For the UCP project specifically:

```bash
# On LOCAL machine with original database
node export-task-related-data.js --project-id 89

# Generate SQL
node migrate-all-task-data.js > insert_all_task_data.sql

# On PRODUCTION/target machine
psql $DATABASE_URL -f insert_all_task_data.sql
```

Done! All task-related data for the UCP project is now migrated.

---

## Troubleshooting

### "Connection refused" or database connection errors
Update the connection string in `export-subtasks.js`:
```javascript
const client = new Client({
  connectionString: 'postgresql://user:password@host:port/database'
});
```

### "Table doesn't exist"
Make sure you're running migrations on the correct database version that has the subtasks table.

### Duplicate key violations
The SQL uses `ON CONFLICT (id) DO NOTHING` to skip duplicates, so it's safe to run multiple times.

---

## Files Created

### Scripts (already created):
- `export-task-related-data.js` - Exports all task-related data (recommended)
- `migrate-all-task-data.js` - Generates comprehensive SQL migration
- `export-subtasks.js` - Exports only subtasks (alternative)
- `migrate-subtasks.js` - Generates SQL for subtasks only (alternative)

### Data Files (you create these by running the scripts):
- `subtasks.json` - Exported subtask data
- `subtask_comments.json` - Exported subtask comments
- `checklist_items.json` - Exported checklist items
- `checklist_comments.json` - Exported checklist comments
- `section_states.json` - Exported section states
- `section_comments.json` - Exported section comments
- `task_attachments.json` - Exported task attachments
- `insert_all_task_data.sql` - Generated SQL statements for all data
