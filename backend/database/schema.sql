-- Database Schema for College Management System

-- Users table
-- For existing deployments, run:
--   ALTER TABLE users ADD semester INT NULL;
--   ALTER TABLE users ADD designation VARCHAR(100);
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_otp VARCHAR(255),
    reset_expires DATETIME,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'hod', 'professor', 'student', 'alumni')),
    department VARCHAR(100),
    year int,
    semester int CHECK (semester IN (1,2) OR semester IS NULL),
    section VARCHAR(10),
    roll_number VARCHAR(50),
    phone VARCHAR(20),
    profile_image VARCHAR(255),
    linkedin_profile VARCHAR(255),
    current_company VARCHAR(255),
    current_position VARCHAR(255),
    designation VARCHAR(100),
    graduation_year int,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_users_year_section_roll_number UNIQUE (year, section, roll_number)
);

-- Settings table
-- Stores global configuration values like the current semester
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    current_semester int NOT NULL CHECK (current_semester IN (1,2)),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO settings (current_semester) VALUES (1);

-- Subjects table
CREATE TABLE subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    year int NOT NULL,
    semester int NOT NULL,
    credits int NOT NULL,
    type VARCHAR(50) DEFAULT 'theory',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Classes table
-- For existing deployments, run:
--   ALTER TABLE classes ADD semester INT NOT NULL DEFAULT 1;
--   -- Drop existing unique constraint on (year, section, department) before adding the new one
--   ALTER TABLE classes DROP CONSTRAINT UQ_classes_year_section_department;
--   ALTER TABLE classes ADD CONSTRAINT UQ_classes_year_semester_section UNIQUE (year, semester, section);
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year int NOT NULL,
    semester int NOT NULL CHECK (semester IN (1,2)),
    section VARCHAR(10) NOT NULL,
    department VARCHAR(100) NOT NULL,
    hod_id int,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES users(id),
    UNIQUE(year, semester, section)
);

-- Student Classes table
CREATE TABLE student_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id int NOT NULL,
    student_id int NOT NULL,
    enrollment_date DATETIME,
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    UNIQUE(class_id, student_id)
);

-- Extra Classes table
-- For existing deployments, run:
--   CREATE TABLE extra_classes (
--       id INT AUTO_INCREMENT PRIMARY KEY,
--       subject_id int NOT NULL,
--       class_id int NOT NULL,
--       date date NOT NULL,
--       start_time time NOT NULL,
--       end_time time NOT NULL,
--       created_by int NOT NULL,
--       created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--       FOREIGN KEY (subject_id) REFERENCES subjects(id),
--       FOREIGN KEY (class_id) REFERENCES classes(id),
--       FOREIGN KEY (created_by) REFERENCES users(id)
--   );
CREATE TABLE extra_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject_id int NOT NULL,
    class_id int NOT NULL,
    date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_by int NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Attendance table
-- For existing deployments, run:
--   ALTER TABLE attendance ADD present bit NOT NULL DEFAULT 0;
--   UPDATE attendance SET present = CASE WHEN status = 'present' THEN 1 ELSE 0 END;
--   ALTER TABLE attendance DROP COLUMN status;
--   ALTER TABLE attendance ADD extra_class_id int NULL;
--   ALTER TABLE attendance ADD CONSTRAINT FK_attendance_extra_class
--       FOREIGN KEY (extra_class_id) REFERENCES extra_classes(id);
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id int NOT NULL,
    subject_id int NOT NULL,
    date date NOT NULL,
    period int NOT NULL,
    present bit NOT NULL,
    extra_class_id int,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (extra_class_id) REFERENCES extra_classes(id),
    UNIQUE(student_id, subject_id, date, period)
);

-- Marks table
CREATE TABLE marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id int NOT NULL,
    subject_id int NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    marks decimal(5,2) NOT NULL,
    max_marks decimal(5,2) NOT NULL,
    date date DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Announcements table
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id int NOT NULL,
    target_role VARCHAR(100),
    target_section VARCHAR(100),
    target_year int,
    is_active bit DEFAULT 1,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Chat Groups table
CREATE TABLE chat_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'custom' CHECK (type IN ('section', 'subject', 'year', 'department', 'custom')),
    created_by int NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Chat Group Members table
CREATE TABLE chat_group_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id int NOT NULL,
    user_id int NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(group_id, user_id)
);

-- Chat Messages table
CREATE TABLE chat_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id int NOT NULL,
    sender_id int NOT NULL,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_deleted bit DEFAULT 0,
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Timetable table
CREATE TABLE timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day VARCHAR(20) NOT NULL,
    time VARCHAR(20) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    room VARCHAR(50) NOT NULL,
    year int NOT NULL,
    semester int NOT NULL CHECK (semester IN (1,2)),
    section VARCHAR(10) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo timetable data
INSERT INTO timetable (day, time, subject, faculty, room, year, semester, section) VALUES
('Monday', '08:30-09:30', 'Data Structures', 'Dr. Smith', 'CS-101', 3, 1, 'A'),
('Monday', '10:40-11:40', 'Database Systems', 'Dr. Smith', 'CS-102', 3, 1, 'B'),
('Monday', '14:40-15:40', 'Operating Systems', 'Dr. Smith', 'CS-103', 4, 1, 'A'),
('Tuesday', '09:30-10:30', 'Data Structures', 'Dr. Smith', 'CS-101', 3, 1, 'A'),
('Tuesday', '13:40-14:40', 'Database Systems', 'Dr. Smith', 'CS-102', 3, 1, 'B'),
('Wednesday', '08:30-09:30', 'Operating Systems', 'Dr. Smith', 'CS-103', 4, 1, 'A'),
('Wednesday', '11:40-12:40', 'Data Structures', 'Dr. Smith', 'CS-101', 3, 1, 'A'),
('Thursday', '09:30-10:30', 'Database Systems', 'Dr. Smith', 'CS-102', 3, 1, 'B'),
('Thursday', '15:40-16:40', 'Operating Systems', 'Dr. Smith', 'CS-103', 4, 1, 'A'),
('Friday', '08:30-09:30', 'Data Structures', 'Dr. Smith', 'CS-101', 3, 1, 'A'),
('Friday', '14:40-15:40', 'Database Systems', 'Dr. Smith', 'CS-102', 3, 1, 'B');

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_year_section ON users(year, section);
CREATE INDEX idx_users_year_sem_section ON users(year, semester, section);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_extra_classes_class_date ON extra_classes(class_id, date);
CREATE INDEX idx_attendance_extra_class ON attendance(extra_class_id);
CREATE INDEX idx_marks_student_subject ON marks(student_id, subject_id);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX idx_timetable_year_semester_section ON timetable(year, semester, section);

-- Internal Marks table
CREATE TABLE InternalMarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'mid1', 'mid2', 'internal1', 'internal2', 'assignment', 'quiz'
    marks DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    entered_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES Subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES Users(id)
);

-- Resumes table
CREATE TABLE resumes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id int NOT NULL,
    personal_info TEXT,
    education TEXT,
    experience TEXT,
    projects TEXT,
    skills TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Alumni Profiles table
CREATE TABLE alumni_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id int NOT NULL,
    company VARCHAR(255),
    position VARCHAR(255),
    graduation_year int,
    field_of_study VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    linkedin VARCHAR(255),
    github VARCHAR(255),
    website VARCHAR(255),
    achievements TEXT,
    skills TEXT,
    work_experience TEXT,
    education TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Professor Achievements table
CREATE TABLE professor_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    professor_id int NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date date NOT NULL,
    category VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Messages table for private messaging
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id int NOT NULL,
    receiver_id int NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    is_read bit DEFAULT 0,
    delivered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE NO ACTION
);

-- Conversation user state (pinning and read tracking)
CREATE TABLE conversation_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id int NOT NULL,
    conversation_type VARCHAR(10) NOT NULL CHECK (conversation_type IN ('direct','group')),
    conversation_id int NOT NULL,
    pinned bit DEFAULT 0,
    last_read_at DATETIME DEFAULT '1900-01-01',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_conversation_users (user_id, conversation_type, conversation_id)
);

-- Device tokens for push notifications
CREATE TABLE device_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id int NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE push_subscriptions (
    endpoint VARCHAR(500) PRIMARY KEY,
    keys_p256dh VARCHAR(255) NOT NULL,
    keys_auth VARCHAR(255) NOT NULL,
    topics TEXT,
    user_id int NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Complaints table
CREATE TABLE complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id int NOT NULL,
    type varchar(100) NOT NULL,
    title varchar(255) NOT NULL,
    description text NOT NULL,
    is_anonymous bit DEFAULT 0,
    created_at datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- Insert sample data
INSERT INTO users (name, email, password, role, department) VALUES
('Admin User', 'admin@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ECE'),
('Dr. Smith', 'hod@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hod', 'ECE'),
('Prof. Johnson', 'prof@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor', 'ECE'),
('John Doe', 'student@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'ECE', 3, 'A', '20EC001'),
('Jane Smith', 'alumni@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumni', 'ECE', NULL, NULL, NULL, NULL, NULL, 'Tech Corp', 'Software Engineer', 2020);