-- Migration: add target fields to announcements
-- Adds target_role, target_section, target_year, is_active and priority columns
-- Migrates existing data from target_audience to target_role and drops target_audience

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_role VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_section VARCHAR(100);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_year INT;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT 1;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority VARCHAR(20);

-- migrate existing target_audience data
UPDATE announcements
SET target_role = target_audience
WHERE target_role IS NULL AND target_audience IS NOT NULL;

ALTER TABLE announcements DROP COLUMN IF EXISTS target_audience;
