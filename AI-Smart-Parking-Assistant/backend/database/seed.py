"""
ParkWise AI - Database Seeder
Populates the SQLite database with realistic Indian demonstration data.

IMPORTANT NOTICE:
All records in this dataset are demonstration benchmarks created for academic,
research, and prototype testing purposes. They do not constitute actual legal
statutory citations or official municipal records.
"""

import json
import os
import sys

# Ensure backend package can be imported regardless of execution path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db import get_db_connection, init_db, DATABASE_PATH


def seed_database():
    print(f"Initializing database at: {DATABASE_PATH}")
    init_db()

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Disable foreign keys temporarily during clean wipe
        cursor.execute("PRAGMA foreign_keys = OFF;")
        cursor.execute("DELETE FROM disputes;")
        cursor.execute("DELETE FROM reports;")
        cursor.execute("DELETE FROM violations;")
        cursor.execute("DELETE FROM rules;")
        cursor.execute("DELETE FROM vehicles;")
        cursor.execute("DELETE FROM users;")
        cursor.execute("PRAGMA foreign_keys = ON;")

        print("Cleaned existing demonstration records.")

        # 1. SEED USERS
        users_data = [
            (
                'usr_ind_001',
                'Amanpreet Singh',
                'aman.singh@example.in',
                'driver',
                '+91 98765 43210',
                'DL-PB102022004581',
                None,
                None,
                None
            ),
            (
                'adm_ind_007',
                'Inspector Rakesh Verma',
                'admin.verma@urbanmobility.gov.in',
                'admin',
                '+91 98111 22334',
                None,
                'IN-TC-402',
                'Municipal Parking Compliance Cell - Traffic Management Wing',
                'Metro Urban Zone 1'
            )
        ]
        cursor.executemany("""
            INSERT INTO users (id, name, email, role, phone, driver_license, badge_number, department, jurisdiction)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, users_data)
        print(f"Seeded {len(users_data)} users.")

        # 2. SEED VEHICLES
        vehicles_data = [
            ('PB10AB1234', 'usr_ind_001', 'Maruti Suzuki', 'Swift ZXi', 2023, 'Magma Grey'),
            ('DL01CZ4592', 'usr_ind_001', 'Tata', 'Nexon EV Empowered', 2022, 'Teal Blue'),
            ('HR26DQ1109', 'usr_ind_001', 'Mahindra', 'Bolero Maxi Truck', 2021, 'White'),
            ('MH12DE8831', 'usr_ind_001', 'Honda', 'City ZX', 2022, 'Silver')
        ]
        cursor.executemany("""
            INSERT INTO vehicles (plate, user_id, make, model, year, color)
            VALUES (?, ?, ?, ?, ?, ?);
        """, vehicles_data)
        print(f"Seeded {len(vehicles_data)} vehicles.")

        # 3. SEED MUNICIPAL RULES
        rules_data = [
            (
                'RUL-IND-101',
                'PR-101',
                'Commercial District Paid Parking Hours',
                'Downtown Commercial Core (Zone C-1, C-2)',
                'Mon-Sat: 09:00 AM - 09:00 PM',
                '₹30 / hr (3-hour limit)',
                500.0,
                10,
                1,
                'Regulates high-turnover commercial market parking. 10-minute digital grace window applied for payment gateway latency.'
            ),
            (
                'RUL-IND-102',
                'PR-102',
                'Designated No-Parking & Tow-Away Zones',
                'Arterial Ring Roads & High-Density Corridors',
                '24 Hours / 7 Days a Week',
                'Strict Tow-Away Zone',
                1000.0,
                0,
                1,
                'Prohibits stopping along yellow line kerb markings. Regulatory boards must be clearly legible and unobstructed.'
            ),
            (
                'RUL-IND-103',
                'PR-103',
                'Emergency Gate & Fire Hydrant Clearance',
                'City-wide (All Hospital & Emergency Access Gates)',
                '24 Hours / 7 Days a Week',
                'Strict Prohibition',
                1500.0,
                0,
                1,
                'Vehicles must maintain at least 3 meters clearance from emergency hospital gates, fire station exits, and hydrants.'
            ),
            (
                'RUL-IND-104',
                'PR-104',
                'Public EV Charging Stall Idle Regulation',
                'Designated Public Charging Stations & Garages',
                '24 Hours (While Connected)',
                '₹15/kWh charging + ₹2/min idle post 30-min buffer',
                750.0,
                30,
                1,
                'Discourages non-charging vehicles from occupying EV bays. Power grid interruptions considered upon telematics submission.'
            ),
            (
                'RUL-IND-105',
                'PR-105',
                'Residential Sector Overnight Parking Program',
                'Residential Sectors & Colony Gates',
                'Daily: 11:00 PM - 06:00 AM',
                'Resident Digital Sticker Token',
                500.0,
                15,
                0,
                'Configurable overnight residential token guideline to ensure clear passage for night emergency response vehicles.'
            )
        ]
        cursor.executemany("""
            INSERT INTO rules (id, code, title, zone, hours, rate, fine_amount, grace_period_minutes, active, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, rules_data)
        print(f"Seeded {len(rules_data)} parking rules.")

        # 4. SEED VIOLATIONS
        violations_data = [
            (
                'IND-VIO-2024-8841',
                'PB10AB1234',
                'usr_ind_001',
                'RUL-IND-101',
                'Expired Paid Parking Duration',
                'Commercial Curbside Parking',
                'Mall Road, Near Clock Tower, Zone C-2 (Kiosk #14), Ludhiana',
                '30.9010° N, 75.8573° E',
                '2024-10-28 14:15',
                '2024-11-18',
                500.0,
                0.0,
                'Pending',
                'E-ENF-104',
                'Sample Parking Guideline Rule PR-101.A (Commercial Duration Window)',
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
                'Vehicle parked 6 minutes past the paid parking token duration during high-turnover afternoon hours.',
                json.dumps({
                    'verdict': 'High Merit for Grace Window Review (Sample Demo)',
                    'confidenceScore': 88,
                    'summary': 'Ticket recorded 6 minutes post digital slip expiration. Under Sample Parking Guideline PR-101.B, an automated 10-minute grace window applies when a digital payment network latency is noted. Sample UPI gateway logs confirm a payment retry at 14:12.',
                    'reference': 'Sample Guideline Rule PR-101.B (Curbside Grace Window Benchmark)',
                    'legalGrounds': [
                        'Sample Guideline Rule PR-101.B: Automated 10-minute digital grace window applicable',
                        'UPI gateway transaction retry attempt timestamp matches 14:12',
                        'Demonstration vehicle has zero prior citations in Zone C-2'
                    ],
                    'recommendedPath': 'Submit demonstration appeal attaching UPI transaction attempt screenshot.',
                    'potentialFineReduction': '100% Fine Waiver (Demo)'
                }),
                None,
                None
            ),
            (
                'IND-VIO-2024-7930',
                'PB10AB1234',
                'usr_ind_001',
                'RUL-IND-102',
                'Designated No-Parking Zone (Yellow Line Marking)',
                'Urban Roadway Maintenance',
                'Connaught Place, Radial Road 3 (Inner Circle), New Delhi',
                '28.6315° N, 77.2167° E',
                '2024-10-14 09:35',
                '2024-11-04',
                1000.0,
                200.0,
                'Under Dispute',
                'TRAFFIC-DEL-21',
                'Sample Urban Parking Guideline Rule PR-102 (Yellow Kerb Restriction)',
                'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
                'Vehicle halted along yellow curb restricted corridor during morning peak traffic clearance route.',
                json.dumps({
                    'verdict': 'Moderate Basis for Appeal (Sample Demo)',
                    'confidenceScore': 76,
                    'summary': 'Regulatory signboard obscured by temporary utility road barricades. Demonstration street photo verifies restriction board was non-legible within standard roadway approach distance.',
                    'reference': 'Sample Guideline Rule PR-102.D (Signage Visibility & Obstruction Standard)',
                    'legalGrounds': [
                        'Sample Guideline Rule PR-102.D: Mandatory Visibility of Curbside Signage',
                        'Temporary utility work barricade obscured regulatory signage'
                    ],
                    'recommendedPath': 'Submit photo evidence showing construction barricade blocking the signage.',
                    'potentialFineReduction': 'Full Fine Waiver or Reduced Demonstration Surcharge'
                }),
                None,
                None
            ),
            (
                'IND-VIO-2024-9104',
                'DL01CZ4592',
                'usr_ind_001',
                'RUL-IND-104',
                'EV Charging Bay Idle Overstay',
                'Clean Mobility Infrastructure',
                'Cyber Hub Parking Deck, Level 1, Bay EV-04, Gurugram',
                '28.4950° N, 77.0890° E',
                '2024-11-01 11:10',
                '2024-11-21',
                750.0,
                0.0,
                'Pending',
                'SMART-CAM-09',
                'Sample EV Infrastructure Guideline Rule PR-104 (Active Charging Bay Mandate)',
                'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80',
                'Vehicle occupied designated EV fast charging bay after charge session terminated prematurely.',
                json.dumps({
                    'verdict': 'Fair Claim with Telematics Log (Sample Demo)',
                    'confidenceScore': 70,
                    'summary': 'Public charger event log records sudden charging interruption triggered by grid voltage spike. Driver received app notification late due to basement parking signal latency.',
                    'reference': 'Sample EV Guideline Rule PR-104.C (Equipment Interruption Exception)',
                    'legalGrounds': [
                        'Sample EV Guideline Rule PR-104.C: Technical hardware/grid interruption consideration',
                        'Public charger event log corroborates abrupt session termination'
                    ],
                    'recommendedPath': 'Attach charger telematics screenshot to request sample demonstration waiver.',
                    'potentialFineReduction': '100% Fine Waiver (Demo)'
                }),
                None,
                None
            ),
            (
                'IND-VIO-2024-6512',
                'PB10AB1234',
                'usr_ind_001',
                'RUL-IND-103',
                'Emergency Gate & Fire Hydrant Clearance Obstruction',
                'Public Safety Zone',
                'MG Road, Near Metro Pillar #124, Bengaluru',
                '12.9716° N, 77.5946° E',
                '2024-09-02 18:20',
                '2024-09-25',
                1500.0,
                0.0,
                'Resolved',
                'TRAFFIC-BLR-88',
                'Sample Emergency Access Guideline Rule PR-103 (Emergency Gate Clearance)',
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
                'Vehicle parked within 3 meters of active emergency hospital entry gate.',
                json.dumps({
                    'verdict': 'Low Merit for Appeal (Sample Safety Rule)',
                    'confidenceScore': 18,
                    'summary': 'Vehicle parked within restricted emergency access zone. Sample safety guideline mandates strict clearance with zero discretionary buffer.',
                    'reference': 'Sample Emergency Access Guideline Rule PR-103',
                    'legalGrounds': [
                        'Strict liability emergency vehicle passage guideline'
                    ],
                    'recommendedPath': 'Prompt fee settlement completed to prevent penalty escalation.',
                    'potentialFineReduction': 'None'
                }),
                '2024-09-08 10:14',
                'Paid in Full via UPI Payment Gateway (₹1,500.00)'
            ),
            (
                'IND-VIO-2024-5402',
                'PB10AB1234',
                'usr_ind_001',
                'RUL-IND-105',
                'Commercial Corridor Double Parking',
                'Commercial Carriage-way',
                'FC Road, Near Goodluck Chowk, Pune',
                '18.5204° N, 73.8567° E',
                '2024-08-19 16:40',
                '2024-09-10',
                1000.0,
                0.0,
                'Resolved',
                'TRAFFIC-PUN-12',
                'Sample Commercial Corridor Guideline Rule PR-105 (Loading Zone Stop)',
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
                'Vehicle temporarily double-parked on commercial stretch during urgent pharmacy supplies delivery.',
                json.dumps({
                    'verdict': 'Appeal Approved by Reviewer (Sample Demo)',
                    'confidenceScore': 90,
                    'summary': 'Driver presented signed urgent pharmacy delivery receipt. Temporary emergency commercial drop-off exception was applied.',
                    'reference': 'Sample Guideline Rule PR-105.B (Essential Medical Delivery Clause)',
                    'legalGrounds': [
                        'Sample Guideline Rule PR-105.B: Urgent medical courier temporary stop exception',
                        'Stamped medical distributor challan verified'
                    ],
                    'recommendedPath': 'Dispute approved during sample demonstration review.',
                    'potentialFineReduction': '100% Fine Waived (₹0 owed)'
                }),
                '2024-08-25 16:30',
                'Dispute Approved - Fine Waived (₹1,000.00 saved)'
            )
        ]
        cursor.executemany("""
            INSERT INTO violations (
                id, vehicle_plate, user_id, rule_id, type, category, location, gps,
                issue_date, due_date, fine_amount, late_fee, status, officer_id,
                ordinance_code, evidence_image, description, ai_assessment,
                resolved_at, resolution_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, violations_data)
        print(f"Seeded {len(violations_data)} violations.")

        # 5. SEED DISPUTES
        disputes_data = [
            (
                'DSP-IND-2024-001',
                'IND-VIO-2024-7930',
                'usr_ind_001',
                'Signage was heavily obscured by temporary road repair barricades.',
                'Official Dispute Statement: The driver approached via Radial Road 3 where utility barricades covered the standard no-parking signage. Photographs submitted demonstrate obstruction beyond reasonable driver view distance.',
                1,
                'Under Demonstration Review by Parking Cell',
                'Adjudication Officer note: Street photos received. Scheduled for field review verification.',
                '2024-10-16 11:20',
                None
            ),
            (
                'DSP-IND-2024-002',
                'IND-VIO-2024-5402',
                'usr_ind_001',
                'Urgent medical delivery for nearby healthcare clinic.',
                'Urgent courier stop with signed medical receipt from Apollo Pharmacy branch.',
                1,
                'Dispute Approved - Fine Dismissed (Demo)',
                'Adjudication Officer note: Medical delivery challan verified. Exception granted under Guideline PR-105.B.',
                '2024-08-21 14:00',
                '2024-08-25 16:30'
            )
        ]
        cursor.executemany("""
            INSERT INTO disputes (
                id, violation_id, user_id, reason, letter_text, evidence_submitted,
                status, adjudicator_notes, submitted_at, reviewed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, disputes_data)
        print(f"Seeded {len(disputes_data)} disputes.")

        # 6. SEED COMMUNITY REPORTS
        reports_data = [
            (
                'REP-IND-001',
                'Citizen Reporter #440',
                None,
                'HR26DQ1109',
                'Sector 18 Market, Near Gate #2, Noida',
                'Double Parking Blocking Bus Bay',
                'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
                '95% confidence',
                'Commercial tempo parked blocking the public transit bus shelter.',
                'Verified by AI Vision (Sample Demo)',
                '2024-11-03 16:15'
            ),
            (
                'REP-IND-002',
                'Driver Amanpreet Singh',
                'usr_ind_001',
                'MH12DE8831',
                'JM Road, Near Deccan Bus Stand, Pune',
                'Emergency Gate Clearance Obstruction',
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
                '91% confidence',
                'Private sedan parked blocking the hospital ambulance gate ramp.',
                'Pending Review by Parking Cell',
                '2024-11-02 11:30'
            )
        ]
        cursor.executemany("""
            INSERT INTO reports (
                id, reported_by, user_id, vehicle_plate, location,
                violation_type, photo_url, confidence, notes, status, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, reports_data)
        print(f"Seeded {len(reports_data)} community reports.")

        conn.commit()
        print("Database seeding completed successfully.")

    except Exception as e:
        conn.rollback()
        print(f"Seeding failed: {e}", file=sys.stderr)
        raise
    finally:
        conn.close()


if __name__ == '__main__':
    seed_database()

