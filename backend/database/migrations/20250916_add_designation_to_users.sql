-- Migration: add designation column to users
IF COL_LENGTH('users', 'designation') IS NULL
    ALTER TABLE users ADD designation NVARCHAR(100);
