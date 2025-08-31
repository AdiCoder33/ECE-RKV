-- Creates extra_classes table and links attendance records

CREATE TABLE extra_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id INT NOT NULL,
    class_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE attendance ADD COLUMN extra_class_id INT NULL;
ALTER TABLE attendance ADD CONSTRAINT FK_attendance_extra_class
    FOREIGN KEY (extra_class_id) REFERENCES extra_classes(id);

CREATE INDEX idx_extra_classes_class_date ON extra_classes (class_id, date);
CREATE INDEX idx_attendance_extra_class ON attendance (extra_class_id);
