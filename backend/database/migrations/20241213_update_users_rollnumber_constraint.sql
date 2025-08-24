-- Migration: update roll number uniqueness constraint on users
DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = kc.name
FROM sys.key_constraints kc
JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE kc.parent_object_id = OBJECT_ID('users') AND kc.type = 'UQ' AND c.name = 'roll_number';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE users DROP CONSTRAINT ' + QUOTENAME(@constraintName));
END;

-- Drop legacy unique index if it exists
IF EXISTS (
    SELECT name FROM sys.indexes
    WHERE name = 'Users_RollNumber' AND object_id = OBJECT_ID('users')
)
BEGIN
    DROP INDEX Users_RollNumber ON users;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID('users') AND [type] = 'UQ' AND name = 'UQ_users_year_section_roll_number'
)
BEGIN
    ALTER TABLE users ADD CONSTRAINT UQ_users_year_section_roll_number UNIQUE (year, section, roll_number);
END;
