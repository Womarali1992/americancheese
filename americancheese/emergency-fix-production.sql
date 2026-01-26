-- EMERGENCY FIX for production database
-- This fixes all potential issues that could cause bad gateway errors
-- Run: sudo -u postgres psql -d americancheese -f emergency-fix-production.sql

BEGIN;

-- 1. Fix all invalid dates first
UPDATE projects 
SET start_date = NULL 
WHERE start_date IS NOT NULL AND (start_date < '1900-01-01' OR start_date > '2100-01-01');

UPDATE projects 
SET end_date = NULL 
WHERE end_date IS NOT NULL AND (end_date < '1900-01-01' OR end_date > '2100-01-01');

UPDATE tasks 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL OR start_date < '1900-01-01' OR start_date > '2100-01-01';

UPDATE tasks 
SET end_date = CURRENT_DATE + INTERVAL '7 days'
WHERE end_date IS NULL OR end_date < '1900-01-01' OR end_date > '2100-01-01';

-- Ensure end_date >= start_date
UPDATE tasks 
SET end_date = start_date + INTERVAL '7 days'
WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < start_date;

-- 2. Fix subtasks
UPDATE subtasks 
SET start_date = NULL 
WHERE start_date IS NOT NULL AND (start_date < '1900-01-01' OR start_date > '2100-01-01');

UPDATE subtasks 
SET end_date = NULL 
WHERE end_date IS NOT NULL AND (end_date < '1900-01-01' OR end_date > '2100-01-01');

UPDATE subtasks 
SET end_date = start_date + INTERVAL '7 days'
WHERE start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < start_date;

-- 3. Ensure calendar_active is never NULL (set to false if NULL for backwards compatibility)
UPDATE tasks 
SET calendar_active = false 
WHERE calendar_active IS NULL;

UPDATE subtasks 
SET calendar_active = false 
WHERE calendar_active IS NULL;

-- 4. Fix any NULL project_id references (shouldn't happen but just in case)
UPDATE tasks 
SET project_id = (SELECT id FROM projects LIMIT 1)
WHERE project_id IS NULL AND EXISTS (SELECT 1 FROM projects);

-- 5. Fix any orphaned subtasks (subtasks without valid parent tasks)
DELETE FROM subtasks 
WHERE parent_task_id IS NULL 
   OR NOT EXISTS (SELECT 1 FROM tasks WHERE id = subtasks.parent_task_id);

-- 6. Fix any NULL status values
UPDATE tasks 
SET status = 'not_started' 
WHERE status IS NULL;

UPDATE subtasks 
SET status = 'not_started' 
WHERE status IS NULL;

-- 7. Fix any NULL required text fields
UPDATE projects 
SET name = 'Unnamed Project' 
WHERE name IS NULL OR name = '';

UPDATE projects 
SET location = 'Unknown' 
WHERE location IS NULL OR location = '';

UPDATE tasks 
SET title = 'Untitled Task' 
WHERE title IS NULL OR title = '';

UPDATE subtasks 
SET title = 'Untitled Subtask' 
WHERE title IS NULL OR title = '';

COMMIT;

-- Show summary
SELECT 'Projects' as table_name, COUNT(*) as total_count,
       COUNT(CASE WHEN start_date IS NULL THEN 1 END) as null_start_dates,
       COUNT(CASE WHEN end_date IS NULL THEN 1 END) as null_end_dates
FROM projects
UNION ALL
SELECT 'Tasks', COUNT(*),
       COUNT(CASE WHEN start_date IS NULL THEN 1 END),
       COUNT(CASE WHEN end_date IS NULL THEN 1 END)
FROM tasks
UNION ALL
SELECT 'Subtasks', COUNT(*),
       COUNT(CASE WHEN start_date IS NULL THEN 1 END),
       COUNT(CASE WHEN end_date IS NULL THEN 1 END)
FROM subtasks;
