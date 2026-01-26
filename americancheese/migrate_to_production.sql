-- Migration script: Copy local data to production
-- Run on production: sudo -u postgres psql -d americancheese -f migrate_to_production.sql

BEGIN;

-- Clear existing data (if any)
TRUNCATE projects, tasks, subtasks, categories, contacts, materials, labor, checklist_items RESTART IDENTITY CASCADE;

-- Insert Projects
INSERT INTO projects (id, name, location, description, status, progress, color_theme, use_global_theme, preset_id) VALUES
(2, 'Test Project', 'Test Location', NULL, 'active', 0, NULL, true, 'home-builder'),
(3, 'htxapt.com', 'Houston, TX', 'AI-enabled apartment locating platform. Renters describe what they want, AI matches them to apartments from our 200+ listing database. Revenue from apartment commissions on signed leases.', 'active', 0, 'earth-tone', false, 'software-development'),
(4, 'HTXapt Content Marketing', 'Houston, TX', 'Complete content marketing system for HTXapt.com. Covers creative strategy, audience segments, offer design, angle library, content types, script templates, creation and distribution SOPs.', 'active', 0, NULL, true, 'software-development'),
(5, 'Automated Marketing', 'Remote', 'Automated marketing project with content strategy, channels, production, and analytics', 'active', 0, NULL, true, 'home-builder'),
(8, 'UCP (Imported)', 'HTXapt', '', 'active', 0, NULL, true, 'home-builder'),
(10, 'HTXapt Content Strategy', 'Houston, TX', 'Content DNA - Strategy, templates, and research for HTXapt content production.', 'active', 0, NULL, true, 'home-builder'),
(11, 'Automated Marketing (Imported)', 'Remote', 'Automated marketing project with content strategy, channels, production, and analytics', 'active', 0, NULL, true, 'home-builder'),
(12, 'SuperX', 'Houston, TX', 'Modular content system. Research → Components → Assembly. Layer 1: Deep customer research. Layer 2: Reusable content components (hooks, messages, CTAs, formats). Layer 3: Campaign assembly from components.', 'active', 0, 'Classic Construction', true, 'marketing-sales');

-- Reset sequence for projects
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

COMMIT;

-- Note: Tasks, categories, and other data will need to be added separately
-- This script creates the basic project structure
