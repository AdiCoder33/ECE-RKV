-- Migration: add unique index to InternalMarks for student, subject, and type
ALTER TABLE InternalMarks ADD UNIQUE KEY uniq_student_subject_type (student_id, subject_id, type);
