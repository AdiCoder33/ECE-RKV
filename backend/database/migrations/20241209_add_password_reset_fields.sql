-- Migration: add reset_otp and reset_expires columns to users
IF COL_LENGTH('users', 'reset_otp') IS NULL
    ALTER TABLE users ADD reset_otp NVARCHAR(255);
IF COL_LENGTH('users', 'reset_expires') IS NULL
    ALTER TABLE users ADD reset_expires DATETIME;

