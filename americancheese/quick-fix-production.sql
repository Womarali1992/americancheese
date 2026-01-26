-- Quick fix for production database issues
-- Run: sudo -u postgres psql -d americancheese -f quick-fix-production.sql

-- Fix any NULL dates that might cause issues (set to reasonable defaults)
UPDATE projects 
SET start_date = CURRENT_DATE 
WHERE start_date IS NULL AND status = 'active';

UPDATE projects 
SET end_date = CURRENT_DATE + INTERVAL '1 year'
WHERE end_date IS NULL AND status = 'active';

-- Fix tasks with NULL dates (set to project dates or current date)
UPDATE tasks t
SET start_date = COALESCE(
  (SELECT start_date FROM projects WHERE id = t.project_id),
  CURRENT_DATE
)
WHERE start_date IS NULL;

UPDATE tasks t
SET end_date = COALESCE(
  (SELECT end_date FROM projects WHERE id = t.project_id),
  CURRENT_DATE + INTERVAL '7 days'
)
WHERE end_date IS NULL;

-- Ensure end_date is after start_date
UPDATE tasks 
SET end_date = start_date + INTERVAL '7 days'
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL 
  AND end_date < start_date;

-- Fix any dates that are way out of range
UPDATE projects 
SET start_date = NULL 
WHERE start_date < '1900-01-01' OR start_date > '2100-01-01';

UPDATE projects 
SET end_date = NULL 
WHERE end_date < '1900-01-01' OR end_date > '2100-01-01';

UPDATE tasks 
SET start_date = CURRENT_DATE 
WHERE start_date < '1900-01-01' OR start_date > '2100-01-01';

UPDATE tasks 
SET end_date = CURRENT_DATE + INTERVAL '7 days'
WHERE end_date < '1900-01-01' OR end_date > '2100-01-01';

-- Verify fixes
SELECT 'Projects fixed' as status, COUNT(*) as count FROM projects WHERE start_date IS NOT NULL OR end_date IS NOT NULL
UNION ALL
SELECT 'Tasks fixed', COUNT(*) FROM tasks WHERE start_date IS NOT NULL AND end_date IS NOT NULL;
