-- Remove professor_id column from subjects table if it exists
SET @constraintName = (
    SELECT CONSTRAINT_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'subjects'
      AND COLUMN_NAME = 'professor_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);

SET @sql = IF(@constraintName IS NOT NULL,
              CONCAT('ALTER TABLE subjects DROP FOREIGN KEY ', @constraintName),
              'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE subjects DROP COLUMN IF EXISTS professor_id;
