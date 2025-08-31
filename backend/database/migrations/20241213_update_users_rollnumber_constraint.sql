-- Migration: update roll number uniqueness constraint on users
SET @constraintName = (
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND NON_UNIQUE = 0
      AND COLUMN_NAME = 'roll_number'
    LIMIT 1
);

SET @sql = IF(@constraintName IS NOT NULL,
              CONCAT('ALTER TABLE users DROP INDEX ', @constraintName),
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

DROP INDEX IF EXISTS Users_RollNumber ON users;

ALTER TABLE users ADD CONSTRAINT UQ_users_year_section_roll_number UNIQUE (year, section, roll_number);
