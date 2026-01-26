-- Simple migration: Insert projects
INSERT INTO projects (name, location, start_date, end_date, description, status, preset_id) VALUES
('htxapt.com', 'Houston, TX', '2026-01-24', '2026-06-29', 'AI-enabled apartment locating platform', 'active', 'software-development'),
('HTXapt Content Marketing', 'Houston, TX', '2026-01-24', '2026-04-24', 'Content marketing system for HTXapt', 'active', 'software-development'),
('SuperX', 'Houston, TX', '2026-01-24', '2026-04-24', 'Modular content system', 'active', 'marketing-sales'),
('Automated Marketing', 'Remote', '2026-01-24', '2026-04-24', 'Automated marketing project', 'active', 'home-builder'),
('HTXapt Content Strategy', 'Houston, TX', '2026-01-24', '2026-04-24', 'Content DNA and strategy', 'active', 'home-builder')
ON CONFLICT DO NOTHING;
