-- Add semester column to timetable and adjust index

ALTER TABLE timetable ADD COLUMN semester INT;

-- Set a default semester for existing rows
UPDATE timetable SET semester = 1;

ALTER TABLE timetable MODIFY COLUMN semester INT NOT NULL;

ALTER TABLE timetable
    ADD CONSTRAINT CK_timetable_semester CHECK (semester IN (1,2));

DROP INDEX idx_timetable_year_section ON timetable;

CREATE INDEX idx_timetable_year_semester_section
    ON timetable(year, semester, section);

