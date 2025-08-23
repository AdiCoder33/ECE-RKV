CREATE TABLE complaints (
  id INT IDENTITY(1,1) PRIMARY KEY,
  student_id INT NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  is_anonymous BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  CONSTRAINT fk_complaints_student FOREIGN KEY (student_id) REFERENCES users(id)
);
GO
