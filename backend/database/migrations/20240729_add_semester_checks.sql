-- Normalize semester values and add check constraints

-- Update existing semester values for classes
UPDATE classes
SET year = (semester + 1) / 2,
    semester = CASE WHEN semester % 2 = 0 THEN 2 ELSE 1 END;

-- Update existing semester values for students
UPDATE users
SET year = (semester + 1) / 2,
    semester = CASE WHEN semester % 2 = 0 THEN 2 ELSE 1 END
WHERE role = 'student';

-- Add check constraints once data is normalized
ALTER TABLE classes
    ADD CONSTRAINT CK_classes_semester CHECK (semester IN (1,2));

ALTER TABLE users
    ADD CONSTRAINT CK_users_semester CHECK (semester IN (1,2) OR semester IS NULL);
