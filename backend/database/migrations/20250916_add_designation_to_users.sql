-- Migration: add designation column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
