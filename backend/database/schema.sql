-- MSSQL Database Schema for College Management System

-- Users table
CREATE TABLE users (
    id int IDENTITY(1,1) PRIMARY KEY,
    name nvarchar(255) NOT NULL,
    email nvarchar(255) UNIQUE NOT NULL,
    password nvarchar(255) NOT NULL,
    role nvarchar(50) NOT NULL CHECK (role IN ('admin', 'hod', 'professor', 'student', 'alumni')),
    department nvarchar(100),
    year int,
    section nvarchar(10),
    roll_number nvarchar(50) UNIQUE,
    phone nvarchar(20),
    linkedin_profile nvarchar(255),
    current_company nvarchar(255),
    current_position nvarchar(255),
    graduation_year int,
    created_at datetime2 DEFAULT GETDATE(),
    updated_at datetime2 DEFAULT GETDATE()
);

-- Subjects table
CREATE TABLE subjects (
    id int IDENTITY(1,1) PRIMARY KEY,
    name nvarchar(255) NOT NULL,
    code nvarchar(50) UNIQUE NOT NULL,
    year int NOT NULL,
    semester int NOT NULL,
    credits int NOT NULL,
    professor_id int,
    type nvarchar(50) DEFAULT 'theory',
    max_marks int DEFAULT 100,
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (professor_id) REFERENCES users(id)
);

-- Classes table
CREATE TABLE classes (
    id int IDENTITY(1,1) PRIMARY KEY,
    year int NOT NULL,
    section nvarchar(10) NOT NULL,
    department nvarchar(100) NOT NULL,
    hod_id int,
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (hod_id) REFERENCES users(id),
    UNIQUE(year, section, department)
);

-- Attendance table
CREATE TABLE attendance (
    id int IDENTITY(1,1) PRIMARY KEY,
    student_id int NOT NULL,
    subject_id int NOT NULL,
    date date NOT NULL,
    period int NOT NULL,
    status nvarchar(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    UNIQUE(student_id, subject_id, date, period)
);

-- Marks table
CREATE TABLE marks (
    id int IDENTITY(1,1) PRIMARY KEY,
    student_id int NOT NULL,
    subject_id int NOT NULL,
    exam_type nvarchar(50) NOT NULL,
    marks decimal(5,2) NOT NULL,
    max_marks decimal(5,2) NOT NULL,
    date date DEFAULT CAST(GETDATE() AS DATE),
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
);

-- Announcements table
CREATE TABLE announcements (
    id int IDENTITY(1,1) PRIMARY KEY,
    title nvarchar(255) NOT NULL,
    content ntext NOT NULL,
    author_id int NOT NULL,
    target_audience nvarchar(100),
    priority nvarchar(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    expires_at datetime2,
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Chat Groups table
CREATE TABLE chat_groups (
    id int IDENTITY(1,1) PRIMARY KEY,
    name nvarchar(255) NOT NULL,
    description ntext,
    type nvarchar(50) DEFAULT 'custom' CHECK (type IN ('section', 'subject', 'year', 'department', 'custom')),
    created_by int NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Chat Group Members table
CREATE TABLE chat_group_members (
    id int IDENTITY(1,1) PRIMARY KEY,
    group_id int NOT NULL,
    user_id int NOT NULL,
    joined_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(group_id, user_id)
);

-- Chat Messages table
CREATE TABLE chat_messages (
    id int IDENTITY(1,1) PRIMARY KEY,
    group_id int NOT NULL,
    sender_id int NOT NULL,
    content ntext NOT NULL,
    chat_type nvarchar(50) DEFAULT 'general',
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (group_id) REFERENCES chat_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Timetable table
CREATE TABLE timetable (
    id int IDENTITY(1,1) PRIMARY KEY,
    day_of_week nvarchar(20) NOT NULL,
    time_slot nvarchar(20) NOT NULL,
    subject_id int NOT NULL,
    faculty_id int NOT NULL,
    room nvarchar(50) NOT NULL,
    year int NOT NULL,
    section nvarchar(10) NOT NULL,
    created_at datetime2 DEFAULT GETDATE(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (faculty_id) REFERENCES users(id),
    UNIQUE(day_of_week, time_slot, year, section)
);

-- Create indexes for better performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department);
CREATE INDEX idx_users_year_section ON users(year, section);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_marks_student_subject ON marks(student_id, subject_id);
CREATE INDEX idx_chat_messages_group ON chat_messages(group_id);
CREATE INDEX idx_timetable_year_section ON timetable(year, section);

-- Insert sample data
INSERT INTO users (name, email, password, role, department) VALUES 
('Admin User', 'admin@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ECE'),
('Dr. Smith', 'hod@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hod', 'ECE'),
('Prof. Johnson', 'prof@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor', 'ECE'),
('John Doe', 'student@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'ECE', 3, 'A', '20EC001'),
('Jane Smith', 'alumni@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumni', 'ECE', NULL, NULL, NULL, NULL, NULL, 'Tech Corp', 'Software Engineer', 2020);