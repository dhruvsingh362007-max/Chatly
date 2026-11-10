"""
ParkWise AI - Comprehensive Phase 2A REST API Test Suite
Tests all endpoints, CRUD operations, input validation, and SQLite persistence.
"""

import sys
import os
import json

# Force UTF-8 for console output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app
from database.db import get_db_connection


def run_tests():
    print("=" * 70)
    print("PARKWISE AI - PHASE 2A REST API TEST SUITE")
    print("=" * 70)

    client = app.test_client()
    passed = 0
    failed = 0

    def assert_test(condition, test_name, details=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"[PASS] {test_name}")
            if details:
                print(f"       -> {details}")
        else:
            failed += 1
            print(f"[FAIL] {test_name}")
            if details:
                print(f"       -> ERROR: {details}")

    # 1. HEALTH CHECK
    res = client.get('/api/health')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('status') == 'healthy', 
                "GET /api/health", 
                f"Status: {data.get('status')}, Tables: {data.get('database', {}).get('tables')}")

    # 2. DRIVERS LIST & DETAIL
    res = client.get('/api/drivers')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('count', 0) >= 1,
                "GET /api/drivers",
                f"Found {data.get('count')} drivers. Driver 0: {data.get('drivers', [{}])[0].get('name')}")

    res = client.get('/api/drivers/usr_ind_001')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('driver', {}).get('name') == 'Amanpreet Singh',
                "GET /api/drivers/usr_ind_001",
                f"Name: {data.get('driver', {}).get('name')}, Vehicles: {len(data.get('driver', {}).get('vehicles', []))}, Balance: ₹{data.get('driver', {}).get('pending_balance_inr')}")

    # 3. VIOLATIONS LIST & FILTERING
    res = client.get('/api/violations')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('count', 0) >= 5,
                "GET /api/violations",
                f"Found {data.get('count')} total violations")

    res = client.get('/api/violations?plate=PB10AB1234')
    data = res.get_json()
    assert_test(res.status_code == 200 and all(v['vehicle_plate'] == 'PB10AB1234' for v in data.get('violations', [])),
                "GET /api/violations?plate=PB10AB1234",
                f"Filtered {data.get('count')} citations for plate PB10AB1234")

    res = client.get('/api/violations?status=Pending')
    data = res.get_json()
    assert_test(res.status_code == 200 and all(v['status'] == 'Pending' for v in data.get('violations', [])),
                "GET /api/violations?status=Pending",
                f"Filtered {data.get('count')} pending citations")

    # 4. GET SINGLE VIOLATION
    res = client.get('/api/violations/IND-VIO-2024-8841')
    data = res.get_json()
    vio = data.get('violation', {})
    assert_test(res.status_code == 200 and vio.get('vehicle_plate') == 'PB10AB1234',
                "GET /api/violations/IND-VIO-2024-8841",
                f"Type: {vio.get('type')}, Fine: ₹{vio.get('fine_amount')}, Status: {vio.get('status')}")

    # 5. POST /api/violations (CREATE CITATION)
    new_violation_payload = {
        'vehicle_plate': 'MH12DE8831',
        'type': 'Bus Lane Obstruction',
        'category': 'Transit Corridor Enforcement',
        'location': 'FC Road, Near Deccan Gymkhana, Pune',
        'fine_amount': 1000.0,
        'ordinance_code': 'Sample Transit Corridor Rule PR-106',
        'description': 'Vehicle halted in dedicated public bus priority lane.'
    }
    res = client.post('/api/violations', json=new_violation_payload)
    data = res.get_json()
    created_vio_id = data.get('violation', {}).get('id')
    assert_test(res.status_code == 201 and created_vio_id is not None,
                "POST /api/violations",
                f"Created Citation: {created_vio_id}, Plate: {data.get('violation', {}).get('vehicle_plate')}, Fine: ₹{data.get('violation', {}).get('fine_amount')}")

    # 6. PATCH /api/violations/{id}/status (RESOLVE CITATION)
    res = client.patch(f'/api/violations/{created_vio_id}/status', json={
        'status': 'Resolved',
        'resolution_method': 'Paid via UPI Gateway (₹1,000.00)'
    })
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('violation', {}).get('status') == 'Resolved',
                f"PATCH /api/violations/{created_vio_id}/status -> Resolved",
                f"Status: {data.get('violation', {}).get('status')}, Method: {data.get('violation', {}).get('resolution_method')}")

    # 7. RULES LIST & DETAIL & UPDATE
    res = client.get('/api/rules')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('count', 0) >= 5,
                "GET /api/rules",
                f"Found {data.get('count')} municipal rules")

    res = client.get('/api/rules/RUL-IND-101')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('rule', {}).get('code') == 'PR-101',
                "GET /api/rules/RUL-IND-101",
                f"Rule: {data.get('rule', {}).get('title')}, Grace: {data.get('rule', {}).get('grace_period_minutes')} mins, Fine: ₹{data.get('rule', {}).get('fine_amount')}")

    res = client.put('/api/rules/RUL-IND-101', json={'grace_period_minutes': 15})
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('rule', {}).get('grace_period_minutes') == 15,
                "PUT /api/rules/RUL-IND-101 (Update Grace Period)",
                f"Updated grace period to: {data.get('rule', {}).get('grace_period_minutes')} mins")

    # Revert back to 10 for clean demo state
    client.put('/api/rules/RUL-IND-101', json={'grace_period_minutes': 10})

    # 8. DISPUTES LIST & DETAIL
    res = client.get('/api/disputes')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('count', 0) >= 2,
                "GET /api/disputes",
                f"Found {data.get('count')} disputes")

    res = client.get('/api/disputes/DSP-IND-2024-001')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('dispute', {}).get('id') == 'DSP-IND-2024-001',
                "GET /api/disputes/DSP-IND-2024-001",
                f"Reason: {data.get('dispute', {}).get('reason')}, Status: {data.get('dispute', {}).get('status')}")

    # 9. POST /api/disputes (SUBMIT DISPUTE)
    # We will dispute citation IND-VIO-2024-9104 (EV charging overstay)
    dispute_payload = {
        'violation_id': 'IND-VIO-2024-9104',
        'reason': 'Fast charger experienced grid power spike aborting charging session abruptly.',
        'letter_text': 'Telematics log attached showing sudden session drop due to power fluctuation.',
        'evidence_submitted': True
    }
    res = client.post('/api/disputes', json=dispute_payload)
    data = res.get_json()
    created_dsp_id = data.get('dispute', {}).get('id')
    assert_test(res.status_code == 201 and created_dsp_id is not None,
                "POST /api/disputes",
                f"Created Dispute: {created_dsp_id}, Citation IND-VIO-2024-9104 status updated to Under Dispute")

    # Verify violation status is indeed Under Dispute
    res_vio_check = client.get('/api/violations/IND-VIO-2024-9104')
    assert_test(res_vio_check.get_json().get('violation', {}).get('status') == 'Under Dispute',
                "Verify Citation Status Synchronization",
                "Violation status automatically synchronized to 'Under Dispute'")

    # 10. PATCH /api/disputes/{id}/status (ADMIN ADJUDICATION)
    res = client.patch(f'/api/disputes/{created_dsp_id}/status', json={
        'status': 'Dispute Approved - Fine Dismissed (Demo)',
        'adjudicator_notes': 'Verified charger telematics log. Grid spike confirmed. Fine waived.'
    })
    data = res.get_json()
    assert_test(res.status_code == 200 and 'Approved' in data.get('dispute', {}).get('status'),
                f"PATCH /api/disputes/{created_dsp_id}/status (Approve & Waive Fine)",
                f"Dispute Status: {data.get('dispute', {}).get('status')}, Associated Citation: {data.get('associated_violation', {}).get('status')}")

    # 11. REPORTS ENDPOINTS
    res = client.get('/api/reports')
    data = res.get_json()
    assert_test(res.status_code == 200 and data.get('count', 0) >= 2,
                "GET /api/reports",
                f"Found {data.get('count')} community reports")

    res = client.post('/api/reports', json={
        'vehicle_plate': 'KA01MJ4401',
        'location': 'Indiranagar 100ft Road, Bengaluru',
        'violation_type': 'Sidewalk Pedestrian Path Obstruction',
        'reported_by': 'Citizen Reporter #512'
    })
    data = res.get_json()
    assert_test(res.status_code == 201 and data.get('report', {}).get('id') is not None,
                "POST /api/reports",
                f"Created Report: {data.get('report', {}).get('id')}, Plate: {data.get('report', {}).get('vehicle_plate')}")

    # 12. ADMIN OVERVIEW KPI
    res = client.get('/api/admin/overview')
    data = res.get_json()
    ov = data.get('overview', {})
    assert_test(res.status_code == 200 and ov.get('violations', {}).get('total', 0) >= 5,
                "GET /api/admin/overview",
                f"Total Citations: {ov.get('violations', {}).get('total')}, Outstanding: ₹{ov.get('financials', {}).get('total_fines_outstanding_inr')}, Approval Rate: {ov.get('disputes', {}).get('approval_rate_percent')}%")

    # 13. INPUT VALIDATION & ERROR HANDLING
    # Invalid plate format (US plate format instead of Indian)
    res = client.post('/api/violations', json={
        'vehicle_plate': 'INVALID-PLATE-XYZ-99999',
        'type': 'No Parking',
        'location': 'Main St',
        'fine_amount': 500
    })
    assert_test(res.status_code == 422,
                "Validation: Reject Non-Indian Plate Format",
                f"Expected 422, Got {res.status_code}")

    # Negative fine amount
    res = client.post('/api/violations', json={
        'vehicle_plate': 'PB10AB1234',
        'type': 'No Parking',
        'location': 'Main St',
        'fine_amount': -500
    })
    assert_test(res.status_code == 422,
                "Validation: Reject Negative Fine Amount",
                f"Expected 422, Got {res.status_code}")

    # 404 for non-existent violation
    res = client.get('/api/violations/IND-VIO-NONEXISTENT')
    assert_test(res.status_code == 404,
                "Error Handling: 404 for Non-Existent Violation",
                f"Expected 404, Got {res.status_code}")

    # 409 for duplicate dispute
    res = client.post('/api/disputes', json={
        'violation_id': 'IND-VIO-2024-7930',
        'reason': 'Duplicate dispute submission attempt'
    })
    assert_test(res.status_code == 409,
                "Conflict: Reject Duplicate Dispute on Same Citation",
                f"Expected 409, Got {res.status_code}")

    # 14. SQLITE PERSISTENCE CHECK ACROSS INDEPENDENT CONNECTION
    raw_conn = get_db_connection()
    cur = raw_conn.cursor()
    cur.execute("SELECT count(*) FROM violations;")
    total_in_db = cur.fetchone()[0]
    raw_conn.close()
    assert_test(total_in_db >= 6,
                "Persistence: Verify SQLite Record Persistence",
                f"Total persisted violations in parkwise.db: {total_in_db}")

    print("=" * 70)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 70)

    return failed == 0


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
