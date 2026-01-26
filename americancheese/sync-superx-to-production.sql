-- SQL to sync SuperX project (ID 12) from local to production
-- Run this on production database via SSH: psql $DATABASE_URL -f sync-superx-to-production.sql

-- Insert/Update SuperX project
INSERT INTO projects (
  name, 
  location, 
  start_date, 
  end_date, 
  description, 
  status, 
  progress, 
  hidden_categories, 
  selected_templates, 
  color_theme, 
  use_global_theme, 
  preset_id, 
  structured_context
)
VALUES (
  'SuperX',
  'Houston, TX',
  NULL,
  NULL,
  'Modular content system. Research → Components → Assembly. Layer 1: Deep customer research. Layer 2: Reusable content components (hooks, messages, CTAs, formats). Layer 3: Campaign assembly from components.',
  'active',
  0,
  NULL,
  NULL,
  'Classic Construction',
  true,
  'marketing-sales',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  progress = EXCLUDED.progress,
  hidden_categories = EXCLUDED.hidden_categories,
  selected_templates = EXCLUDED.selected_templates,
  color_theme = EXCLUDED.color_theme,
  use_global_theme = EXCLUDED.use_global_theme,
  preset_id = EXCLUDED.preset_id,
  structured_context = EXCLUDED.structured_context;

-- Note: If you need to sync tasks, materials, labor, etc., use the CSV export/import feature
-- or run additional export scripts for those tables
