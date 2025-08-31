-- Migration: add reset_otp and reset_expires columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_otp VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires DATETIME;
