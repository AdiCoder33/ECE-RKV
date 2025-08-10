-- Remove professor_id column from subjects table if it exists
DECLARE @constraintName NVARCHAR(200);

SELECT @constraintName = fk.name
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
WHERE fk.parent_object_id = OBJECT_ID('subjects') AND c.name = 'professor_id';

IF @constraintName IS NOT NULL
BEGIN
    EXEC('ALTER TABLE subjects DROP CONSTRAINT ' + @constraintName);
END;

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('subjects') AND name = 'professor_id')
BEGIN
    ALTER TABLE subjects DROP COLUMN professor_id;
END;
