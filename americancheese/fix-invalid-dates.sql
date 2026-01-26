-- Script to fix any invalid dates in the database that might cause gateway errors
-- Run this on production database via SSH: psql $DATABASE_URL -f fix-invalid-dates.sql

-- Fix projects with invalid dates (set to NULL if invalid)
UPDATE projects 
SET start_date = NULL 
WHERE start_date IS NOT NULL 
  AND (start_date < '1900-01-01' OR start_date > '2100-01-01');

UPDATE projects 
SET end_date = NULL 
WHERE end_date IS NOT NULL 
  AND (end_date < '1900-01-01' OR end_date > '2100-01-01');

-- Fix tasks with invalid dates (set to current date if invalid)
UPDATE tasks 
SET start_date = CURRENT_DATE 
WHERE start_date IS NOT NULL 
  AND (start_date < '1900-01-01' OR start_date > '2100-01-01');

UPDATE tasks 
SET end_date = CURRENT_DATE + INTERVAL '7 days'
WHERE end_date IS NOT NULL 
  AND (end_date < '1900-01-01' OR end_date > '2100-01-01')
  AND start_date IS NOT NULL;

-- Ensure end_date is after start_date for tasks
UPDATE tasks 
SET end_date = start_date + INTERVAL '7 days'
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL 
  AND end_date < start_date;

-- Fix subtasks with invalid dates
UPDATE subtasks 
SET start_date = NULL 
WHERE start_date IS NOT NULL 
  AND (start_date < '1900-01-01' OR start_date > '2100-01-01');

UPDATE subtasks 
SET end_date = NULL 
WHERE end_date IS NOT NULL 
  AND (end_date < '1900-01-01' OR end_date > '2100-01-01');

-- Ensure end_date is after start_date for subtasks
UPDATE subtasks 
SET end_date = start_date + INTERVAL '7 days'
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL 
  AND end_date < start_date;

-- Fix labor with invalid dates
UPDATE labor 
SET date = CURRENT_DATE 
WHERE date IS NOT NULL 
  AND (date < '1900-01-01' OR date > '2100-01-01');

-- Show summary of fixes
SELECT 'Projects fixed' as table_name, COUNT(*) as fixed_count
FROM projects 
WHERE (start_date IS NOT NULL AND (start_date < '1900-01-01' OR start_date > '2100-01-01'))
   OR (end_date IS NOT NULL AND (end_date < '1900-01-01' OR end_date > '2100-01-01'))
UNION ALL
SELECT 'Tasks fixed', COUNT(*)
FROM tasks 
WHERE (start_date IS NOT NULL AND (start_date < '1900-01-01' OR start_date > '2100-01-01'))
   OR (end_date IS NOT NULL AND (end_date < '1900-01-01' OR end_date > '2100-01-01'));
