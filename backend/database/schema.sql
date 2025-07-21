-- College Management System Database Schema

CREATE DATABASE IF NOT EXISTS college_management;
USE college_management;

-- Users table (students, professors, admin, HOD, alumni)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'hod', 'professor', 'student', 'alumni') NOT NULL,
    department VARCHAR(100),
    year INT,
    section VARCHAR(10),
    roll_number VARCHAR(50) UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    parent_contact VARCHAR(20),
    blood_group VARCHAR(10),
    admission_year INT,
    graduation_year INT,
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    year INT NOT NULL,
    semester INT NOT NULL,
    credits INT NOT NULL,
    professor_id INT,
    type ENUM('theory', 'lab', 'elective') NOT NULL,
    max_marks INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Classes table
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    semester INT NOT NULL,
    section VARCHAR(10) NOT NULL,
    hod_id INT,
    total_strength INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_class (year, semester, section)
);

-- Class-Subject mapping table
CREATE TABLE class_subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_class_subject (class_id, subject_id)
);

-- Student-Class mapping table
CREATE TABLE student_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_class (student_id, class_id)
);

-- Attendance table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN NOT NULL,
    period INT NOT NULL,
    marked_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_attendance (student_id, subject_id, date, period)
);

-- Internal marks table
CREATE TABLE internal_marks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    subject_id INT NOT NULL,
    type ENUM('mid1', 'mid2', 'mid3', 'assignment1', 'assignment2', 'assignment3') NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    date DATE NOT NULL,
    entered_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_internal_mark (student_id, subject_id, type)
);

-- Chat messages table
CREATE TABLE chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    chat_type ENUM('section', 'global', 'alumni') NOT NULL,
    section VARCHAR(10),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_type_section (chat_type, section),
    INDEX idx_timestamp (timestamp)
);

-- Announcements table
CREATE TABLE announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    target_role VARCHAR(50),
    target_section VARCHAR(10),
    target_year INT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_target (target_role, target_section, target_year),
    INDEX idx_created_at (created_at)
);

-- Academic records table
CREATE TABLE academic_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    year INT NOT NULL,
    semester INT NOT NULL,
    sgpa DECIMAL(4,2),
    cgpa DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_semester (student_id, year, semester)
);

-- Subject grades table (for academic records)
CREATE TABLE subject_grades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    academic_record_id INT NOT NULL,
    subject_id INT NOT NULL,
    marks DECIMAL(5,2),
    max_marks DECIMAL(5,2),
    grade VARCHAR(5),
    grade_points DECIMAL(4,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (academic_record_id) REFERENCES academic_records(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE achievements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category ENUM('academic', 'sports', 'cultural', 'technical', 'other') NOT NULL,
    date DATE NOT NULL,
    certificate VARCHAR(255),
    verified BOOLEAN DEFAULT FALSE,
    verified_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Events table
CREATE TABLE events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    location VARCHAR(255),
    organizer_id INT NOT NULL,
    event_type ENUM('academic', 'cultural', 'sports', 'technical', 'other') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Jobs table (for alumni to post job opportunities)
CREATE TABLE jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT,
    requirements TEXT,
    location VARCHAR(255),
    experience_required VARCHAR(100),
    salary_range VARCHAR(100),
    posted_by INT NOT NULL,
    application_deadline DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample data insertion

-- Insert admin user
INSERT INTO users (name, email, password, role, department) VALUES 
('Admin User', 'admin@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'ECE');

-- Insert HOD
INSERT INTO users (name, email, password, role, department) VALUES 
('Dr. Smith', 'hod@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'hod', 'ECE');

-- Insert professors
INSERT INTO users (name, email, password, role, department) VALUES 
('Prof. Johnson', 'prof@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor', 'ECE'),
('Dr. Sarah Wilson', 'prof2@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'professor', 'ECE');

-- Insert student
INSERT INTO users (name, email, password, role, department, year, section, roll_number) VALUES 
('John Doe', 'student@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'ECE', 3, 'A', '20EC001');

-- Insert alumni
INSERT INTO users (name, email, password, role, department, graduation_year) VALUES 
('Jane Smith', 'alumni@college.edu', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'alumni', 'ECE', 2020);

-- Insert subjects
INSERT INTO subjects (name, code, year, semester, credits, professor_id, type) VALUES 
('Digital Signal Processing', 'EC301', 3, 5, 4, 3, 'theory'),
('VLSI Design', 'EC302', 3, 5, 3, 3, 'theory'),
('Computer Networks', 'EC303', 3, 5, 4, 4, 'theory');

-- Insert classes
INSERT INTO classes (year, semester, section, hod_id, total_strength) VALUES 
(3, 5, 'A', 2, 45),
(3, 5, 'B', 2, 42);

-- Note: All passwords are hashed version of 'password'
-- Default login credentials:
-- Admin: admin@college.edu / password
-- HOD: hod@college.edu / password  
-- Professor: prof@college.edu / password
-- Student: student@college.edu / password
-- Alumni: alumni@college.edu / password