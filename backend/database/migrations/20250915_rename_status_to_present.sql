-- Renames attendance.status to attendance.present
ALTER TABLE attendance ADD present bit NOT NULL DEFAULT 0;
UPDATE attendance SET present = CASE WHEN status = 'present' THEN 1 ELSE 0 END;
ALTER TABLE attendance DROP COLUMN status;
