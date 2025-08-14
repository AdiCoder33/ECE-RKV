-- Migration: add profile_image column to users
IF COL_LENGTH('users', 'profile_image') IS NULL
    ALTER TABLE users ADD profile_image NVARCHAR(255);
