-- Migration script: Copy local data to production
-- Run on production: sudo -u postgres psql -d americancheese -f migrate_to_production.sql

BEGIN;

-- Insert Projects (with required dates)
INSERT INTO projects (id, name, location, start_date, end_date, description, status, progress, color_theme, use_global_theme, preset_id) VALUES
(2, 'Test Project', 'Test Location', '2026-01-24', '2026-02-24', NULL, 'active', 0, NULL, true, 'home-builder'),
(3, 'htxapt.com', 'Houston, TX', '2026-01-24', '2026-06-29', 'AI-enabled apartment locating platform. Renters describe what they want, AI matches them to apartments from our 200+ listing database. Revenue from apartment commissions on signed leases.', 'active', 0, 'earth-tone', false, 'software-development'),
(4, 'HTXapt Content Marketing', 'Houston, TX', '2026-01-24', '2026-04-24', 'Complete content marketing system for HTXapt.com. Covers creative strategy, audience segments, offer design, angle library, content types, script templates, creation and distribution SOPs.', 'active', 0, NULL, true, 'software-development'),
(5, 'Automated Marketing', 'Remote', '2026-01-24', '2026-04-24', 'Automated marketing project with content strategy, channels, production, and analytics', 'active', 0, NULL, true, 'home-builder'),
(8, 'UCP (Imported)', 'HTXapt', '2026-01-01', '2026-01-31', '', 'active', 0, NULL, true, 'home-builder'),
(10, 'HTXapt Content Strategy', 'Houston, TX', '2026-01-24', '2026-04-24', 'Content DNA - Strategy, templates, and research for HTXapt content production.', 'active', 0, NULL, true, 'home-builder'),
(11, 'Automated Marketing (Imported)', 'Remote', '2026-01-24', '2026-04-24', 'Automated marketing project with content strategy, channels, production, and analytics', 'active', 0, NULL, true, 'home-builder'),
(12, 'SuperX', 'Houston, TX', '2026-01-24', '2026-04-24', 'Modular content system. Research, Components, Assembly.', 'active', 0, 'Classic Construction', true, 'marketing-sales')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Reset sequence
SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 1));

COMMIT;
