-- Migration: add profile_image column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);
