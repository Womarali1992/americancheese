-- Migration: Add preset_id column to projects table
-- Date: 2024
-- Description: Adds preset_id column to store which category preset was used when creating the project

ALTER TABLE projects ADD COLUMN IF NOT EXISTS preset_id TEXT DEFAULT 'home-builder';

-- Add comment to the column
COMMENT ON COLUMN projects.preset_id IS 'Category preset used for this project (e.g., home-builder, standard-construction)';
