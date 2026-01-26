-- SQL to sync SuperX project (ID 12) from local to production
-- Run this on production database via SSH: psql $DATABASE_URL -f sync-superx-to-production.sql

-- First, check if SuperX already exists and delete the duplicate I created (ID 13)
DELETE FROM projects WHERE id = 13 AND name = 'SuperX' AND location = 'TBD';

-- Insert/Update SuperX project using DO block for safer handling
DO $$
DECLARE
  project_exists BOOLEAN;
  project_id INTEGER;
BEGIN
  -- Check if SuperX project exists
  SELECT EXISTS(SELECT 1 FROM projects WHERE name = 'SuperX' AND location = 'Houston, TX') INTO project_exists;
  SELECT id INTO project_id FROM projects WHERE name = 'SuperX' AND location = 'Houston, TX' LIMIT 1;
  
  IF project_exists THEN
    -- Update existing project
    UPDATE projects SET
      name = 'SuperX',
      location = 'Houston, TX',
      start_date = NULL,
      end_date = NULL,
      description = 'Modular content system. Research → Components → Assembly. Layer 1: Deep customer research. Layer 2: Reusable content components (hooks, messages, CTAs, formats). Layer 3: Campaign assembly from components.',
      status = 'active',
      progress = 0,
      hidden_categories = NULL,
      selected_templates = NULL,
      color_theme = 'Classic Construction',
      use_global_theme = true,
      preset_id = 'marketing-sales',
      structured_context = NULL
    WHERE id = project_id;
    
    RAISE NOTICE 'Updated existing SuperX project (ID: %)', project_id;
  ELSE
    -- Insert new project
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
    );
    
    RAISE NOTICE 'Created new SuperX project';
  END IF;
END $$;

-- Note: If you need to sync tasks, materials, labor, etc., use the CSV export/import feature
-- or run additional export scripts for those tables
