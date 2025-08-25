-- Creates extra_classes table and links attendance records

CREATE TABLE extra_classes (
    id int IDENTITY(1,1) PRIMARY KEY,
    subject_id int NOT NULL,
    class_id int NOT NULL,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

ALTER TABLE attendance ADD extra_class_id int NULL;
ALTER TABLE attendance ADD CONSTRAINT FK_attendance_extra_class
    FOREIGN KEY (extra_class_id) REFERENCES extra_classes(id);

CREATE INDEX idx_extra_classes_class_date ON extra_classes(class_id, date);
CREATE INDEX idx_attendance_extra_class ON attendance(extra_class_id);
