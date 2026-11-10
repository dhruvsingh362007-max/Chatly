-- ParkWise AI: AI-Based Smart Parking Violation Assistant
-- Database Schema for Demonstration & Compliance Management
-- Target: SQLite 3

PRAGMA foreign_keys = ON;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('driver', 'admin')),
    phone TEXT,
    driver_license TEXT,
    badge_number TEXT,
    department TEXT,
    jurisdiction TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    plate TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. MUNICIPAL RULES TABLE
CREATE TABLE IF NOT EXISTS rules (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    zone TEXT NOT NULL,
    hours TEXT NOT NULL,
    rate TEXT NOT NULL,
    fine_amount REAL NOT NULL,
    grace_period_minutes INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. VIOLATIONS TABLE
CREATE TABLE IF NOT EXISTS violations (
    id TEXT PRIMARY KEY,
    vehicle_plate TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rule_id TEXT,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    gps TEXT,
    issue_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    fine_amount REAL NOT NULL,
    late_fee REAL DEFAULT 0.0,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Under Dispute', 'Resolved', 'Overdue')),
    officer_id TEXT,
    ordinance_code TEXT,
    evidence_image TEXT,
    description TEXT,
    ai_assessment TEXT, -- Stored as JSON string
    resolved_at TEXT,
    resolution_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_plate) REFERENCES vehicles(plate) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL
);

-- 5. DISPUTES TABLE
CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    violation_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    letter_text TEXT,
    evidence_submitted BOOLEAN DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN (
        'Pending Review',
        'Under Demonstration Review by Parking Cell',
        'Dispute Approved - Fine Dismissed (Demo)',
        'Rejected',
        'Dismissed'
    )),
    adjudicator_notes TEXT,
    submitted_at TEXT NOT NULL,
    reviewed_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (violation_id) REFERENCES violations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- 6. COMMUNITY REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reported_by TEXT NOT NULL,
    user_id TEXT,
    vehicle_plate TEXT NOT NULL,
    location TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    photo_url TEXT,
    confidence TEXT,
    notes TEXT,
    status TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- INDEXES FOR FREQUENT QUERIES
CREATE INDEX IF NOT EXISTS idx_vehicles_user ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_vehicle ON violations(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_violations_user ON violations(user_id);
CREATE INDEX IF NOT EXISTS idx_violations_status ON violations(status);
CREATE INDEX IF NOT EXISTS idx_disputes_violation ON disputes(violation_id);
CREATE INDEX IF NOT EXISTS idx_reports_plate ON reports(vehicle_plate);

