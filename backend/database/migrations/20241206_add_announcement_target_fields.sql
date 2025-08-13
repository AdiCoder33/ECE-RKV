-- Migration: add target fields to announcements
-- Adds target_role, target_section, target_year, is_active and priority columns
-- Migrates existing data from target_audience to target_role and drops target_audience

IF COL_LENGTH('announcements', 'target_role') IS NULL
    ALTER TABLE announcements ADD target_role NVARCHAR(100);

IF COL_LENGTH('announcements', 'target_section') IS NULL
    ALTER TABLE announcements ADD target_section NVARCHAR(100);

IF COL_LENGTH('announcements', 'target_year') IS NULL
    ALTER TABLE announcements ADD target_year INT;

IF COL_LENGTH('announcements', 'is_active') IS NULL
    ALTER TABLE announcements ADD is_active BIT NOT NULL DEFAULT 1;

IF COL_LENGTH('announcements', 'priority') IS NULL
    ALTER TABLE announcements ADD priority NVARCHAR(20);

-- migrate existing target_audience data
IF COL_LENGTH('announcements', 'target_audience') IS NOT NULL
BEGIN
    UPDATE announcements
    SET target_role = target_audience
    WHERE target_role IS NULL AND target_audience IS NOT NULL;

    ALTER TABLE announcements DROP COLUMN target_audience;
END;
