-- SQL Schema for Beneficiary and Attendance Management System
-- This schema is derived from the firebase-blueprint.json

-- 1. Churches Table
CREATE TABLE churches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table (Tutors/Admins)
CREATE TABLE users (
    uid VARCHAR(128) PRIMARY KEY, -- Firebase Auth UID
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role ENUM('admin', 'tutor') NOT NULL DEFAULT 'tutor',
    church_id VARCHAR(50),
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (church_id) REFERENCES churches(id)
);

-- 3. Approved Emails (Whitelist)
CREATE TABLE approved_emails (
    email VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    church_id VARCHAR(50) NOT NULL,
    role ENUM('admin', 'tutor') NOT NULL,
    FOREIGN KEY (church_id) REFERENCES churches(id)
);

-- 4. Classes Table
CREATE TABLE classes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tutor_name VARCHAR(100),
    schedule_days JSON, -- Array of integers [0-6]
    schedule_time VARCHAR(20),
    owner_id VARCHAR(128) NOT NULL,
    church_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(uid),
    FOREIGN KEY (church_id) REFERENCES churches(id)
);

-- 5. Beneficiaries Table (Students)
CREATE TABLE beneficiaries (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('M', 'F') NOT NULL,
    project_code VARCHAR(50),
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    registration_date DATE,
    section_id VARCHAR(50), -- Reference to classes(id)
    owner_id VARCHAR(128) NOT NULL,
    church_id VARCHAR(50) NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES classes(id),
    FOREIGN KEY (owner_id) REFERENCES users(uid),
    FOREIGN KEY (church_id) REFERENCES churches(id)
);

-- 6. Attendance Records Table
CREATE TABLE attendance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    owner_id VARCHAR(128) NOT NULL,
    church_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (class_id, date),
    FOREIGN KEY (class_id) REFERENCES classes(id),
    FOREIGN KEY (owner_id) REFERENCES users(uid),
    FOREIGN KEY (church_id) REFERENCES churches(id)
);

-- 7. Attendance Details (Individual presence)
CREATE TABLE attendance_details (
    attendance_record_id INT NOT NULL,
    beneficiary_id VARCHAR(50) NOT NULL,
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (attendance_record_id, beneficiary_id),
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    FOREIGN KEY (beneficiary_id) REFERENCES beneficiaries(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_beneficiary_church ON beneficiaries(church_id);
CREATE INDEX idx_class_church ON classes(church_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
