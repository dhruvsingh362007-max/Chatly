"""
ParkWise AI - Violations REST API Routes
Handles listing, filtering, citation retrieval, issuance, and status updates.
"""

import json
import random
from datetime import datetime, timedelta
from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from database.db import get_db
from schemas import format_validation_errors
from schemas.violation_schema import ViolationCreate, ViolationStatusUpdate

violations_bp = Blueprint('violations', __name__, url_prefix='/api/violations')


def format_violation(v_row, dispute_row=None, vehicle_row=None) -> dict:
    """Helper to transform SQLite violation record into rich API response."""
    data = dict(v_row)

    # Parse AI assessment JSON
    if data.get('ai_assessment'):
        if isinstance(data['ai_assessment'], str):
            try:
                data['ai_assessment'] = json.loads(data['ai_assessment'])
            except Exception:
                pass
    else:
        data['ai_assessment'] = None

    # Compute total due
    fine = float(data.get('fine_amount') or 0.0)
    late = float(data.get('late_fee') or 0.0)
    data['fine_amount'] = fine
    data['late_fee'] = late
    data['total_due'] = fine + late
    data['currency'] = 'INR'
    data['currency_symbol'] = '₹'

    # Attach dispute details if present
    if dispute_row:
        disp_data = dict(dispute_row)
        data['dispute_details'] = {
            'id': disp_data.get('id'),
            'reason': disp_data.get('reason'),
            'letter_text': disp_data.get('letter_text'),
            'status': disp_data.get('status'),
            'evidence_submitted': bool(disp_data.get('evidence_submitted')),
            'adjudicator_notes': disp_data.get('adjudicator_notes'),
            'submitted_at': disp_data.get('submitted_at'),
            'reviewed_at': disp_data.get('reviewed_at')
        }
    else:
        data['dispute_details'] = None

    # Attach vehicle details
    if vehicle_row:
        v = dict(vehicle_row)
        data['vehicle_details'] = f"{v.get('year')} {v.get('make')} {v.get('model')} ({v.get('color')})"
    elif not data.get('vehicle_details'):
        data['vehicle_details'] = f"Registered Vehicle ({data.get('vehicle_plate')})"

    data['is_demonstration'] = True
    data['demonstration_note'] = 'Sample demonstration benchmark citation'
    return data


@violations_bp.route('', methods=['GET'])
def list_violations():
    """
    GET /api/violations
    Query parameters:
      - plate: Filter by vehicle plate (e.g. PB10AB1234)
      - status: Filter by status (Pending, Under Dispute, Resolved, Overdue)
      - user_id: Filter by driver user ID
      - category: Filter by violation category
    """
    db = get_db()
    cursor = db.cursor()

    plate_filter = request.args.get('plate', '').strip().upper()
    status_filter = request.args.get('status', '').strip()
    user_id_filter = request.args.get('user_id', '').strip()
    category_filter = request.args.get('category', '').strip()

    sql = """
        SELECT v.*, u.name as driver_name, 
               veh.make as veh_make, veh.model as veh_model, veh.year as veh_year, veh.color as veh_color
        FROM violations v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN vehicles veh ON v.vehicle_plate = veh.plate
        WHERE 1=1
    """
    params = []

    if plate_filter:
        sql += " AND v.vehicle_plate = ?"
        params.append(plate_filter)
    if status_filter:
        sql += " AND LOWER(v.status) = LOWER(?)"
        params.append(status_filter)
    if user_id_filter:
        sql += " AND v.user_id = ?"
        params.append(user_id_filter)
    if category_filter:
        sql += " AND LOWER(v.category) LIKE LOWER(?)"
        params.append(f"%{category_filter}%")

    sql += " ORDER BY v.issue_date DESC;"
    cursor.execute(sql, params)
    rows = cursor.fetchall()

    results = []
    for r in rows:
        # Check for dispute
        d_cur = db.cursor()
        d_cur.execute("SELECT * FROM disputes WHERE violation_id = ?;", (r['id'],))
        d_row = d_cur.fetchone()

        vehicle_dict = {
            'make': r['veh_make'],
            'model': r['veh_model'],
            'year': r['veh_year'],
            'color': r['veh_color']
        } if r['veh_make'] else None

        results.append(format_violation(r, d_row, vehicle_dict))

    return jsonify({
        'status': 'success',
        'count': len(results),
        'violations': results
    }), 200


@violations_bp.route('/<violation_id>', methods=['GET'])
def get_violation(violation_id):
    """
    GET /api/violations/<violation_id>
    Retrieve full citation details for a specific violation.
    """
    db = get_db()
    cursor = db.cursor()

    sql = """
        SELECT v.*, u.name as driver_name,
               veh.make as veh_make, veh.model as veh_model, veh.year as veh_year, veh.color as veh_color
        FROM violations v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN vehicles veh ON v.vehicle_plate = veh.plate
        WHERE v.id = ?;
    """
    cursor.execute(sql, (violation_id,))
    row = cursor.fetchone()

    if not row:
        return jsonify({
            'status': 'error',
            'message': f"Violation '{violation_id}' not found.",
            'status_code': 404
        }), 404

    # Fetch dispute if present
    d_cur = db.cursor()
    d_cur.execute("SELECT * FROM disputes WHERE violation_id = ?;", (violation_id,))
    d_row = d_cur.fetchone()

    vehicle_dict = {
        'make': row['veh_make'],
        'model': row['veh_model'],
        'year': row['veh_year'],
        'color': row['veh_color']
    } if row['veh_make'] else None

    # Fetch rule if linked
    rule_data = None
    if row['rule_id']:
        r_cur = db.cursor()
        r_cur.execute("SELECT * FROM rules WHERE id = ?;", (row['rule_id'],))
        r_row = r_cur.fetchone()
        if r_row:
            rule_data = dict(r_row)

    res = format_violation(row, d_row, vehicle_dict)
    res['linked_rule'] = rule_data

    return jsonify({
        'status': 'success',
        'violation': res
    }), 200


@violations_bp.route('', methods=['POST'])
def create_violation():
    """
    POST /api/violations
    Issue a new demonstration parking violation citation.
    Validates payload using Pydantic.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({
            'status': 'error',
            'message': 'Missing JSON request body.',
            'status_code': 400
        }), 400

    try:
        validated = ViolationCreate(**payload)
    except ValidationError as e:
        return jsonify({
            'status': 'error',
            'message': 'Input validation failed.',
            'errors': format_validation_errors(e),
            'status_code': 422
        }), 422

    db = get_db()
    cursor = db.cursor()

    # 1. Determine driver user_id
    user_id = validated.user_id
    plate = validated.vehicle_plate

    # Check if plate already registered to an existing user
    cursor.execute("SELECT user_id, make, model, year, color FROM vehicles WHERE plate = ?;", (plate,))
    veh_row = cursor.fetchone()

    if veh_row:
        user_id = veh_row['user_id']
    else:
        # Default to primary demonstration driver if no owner exists
        if not user_id:
            user_id = 'usr_ind_001'
        # Auto-register vehicle so foreign key holds
        cursor.execute("""
            INSERT INTO vehicles (plate, user_id, make, model, year, color)
            VALUES (?, ?, 'Demonstration Vehicle', 'Standard Hatchback', 2023, 'White');
        """, (plate, user_id))

    # 2. Generate unique citation ID: IND-VIO-2024-XXXX
    random_suffix = random.randint(1000, 9999)
    violation_id = f"IND-VIO-2024-{random_suffix}"
    
    # Check uniqueness
    while cursor.execute("SELECT 1 FROM violations WHERE id = ?;", (violation_id,)).fetchone():
        random_suffix = random.randint(1000, 9999)
        violation_id = f"IND-VIO-2024-{random_suffix}"

    now = datetime.now()
    issue_date = now.strftime('%Y-%m-%d %H:%M')
    due_date = validated.due_date or (now + timedelta(days=21)).strftime('%Y-%m-%d')

    # Serialize simulated AI assessment if provided, or supply standard benchmark evaluation
    ai_eval = validated.ai_assessment
    if not ai_eval:
        ai_eval = {
            'verdict': 'Simulated Initial Compliance Check',
            'confidenceScore': 85,
            'summary': f"Citation logged for {validated.type} at {validated.location}.",
            'reference': validated.ordinance_code or 'Sample Urban Parking Guideline',
            'legalGrounds': ['Demonstration evidentiary frame logged via ANPR simulator.'],
            'recommendedPath': 'Review demonstration evidence photos and submit dispute or settle fine.',
            'potentialFineReduction': 'Subject to demonstration review'
        }
    ai_assessment_json = json.dumps(ai_eval)

    try:
        cursor.execute("""
            INSERT INTO violations (
                id, vehicle_plate, user_id, rule_id, type, category, location, gps,
                issue_date, due_date, fine_amount, late_fee, status, officer_id,
                ordinance_code, evidence_image, description, ai_assessment,
                resolved_at, resolution_method
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, NULL, NULL);
        """, (
            violation_id,
            plate,
            user_id,
            validated.rule_id,
            validated.type,
            validated.category or 'Curbside Parking',
            validated.location,
            validated.gps or '28.6139° N, 77.2090° E',
            issue_date,
            due_date,
            validated.fine_amount,
            validated.late_fee or 0.0,
            validated.officer_id or 'AI-ANPR-AUTO-01',
            validated.ordinance_code or 'Sample Urban Parking Guideline PR-101',
            validated.evidence_image or 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
            validated.description or 'Recorded via automated demonstration monitoring terminal.',
            ai_assessment_json
        ))
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({
            'status': 'error',
            'message': f"Failed to record violation: {str(e)}",
            'status_code': 500
        }), 500

    # Fetch newly created record
    cursor.execute("SELECT * FROM violations WHERE id = ?;", (violation_id,))
    new_row = cursor.fetchone()

    return jsonify({
        'status': 'success',
        'message': f"Demonstration citation '{violation_id}' created successfully.",
        'violation': format_violation(new_row)
    }), 201


@violations_bp.route('/<violation_id>/status', methods=['PATCH'])
def update_violation_status(violation_id):
    """
    PATCH /api/violations/<violation_id>/status
    Update violation status (e.g. Pending -> Resolved, Overdue).
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Missing JSON body.', 'status_code': 400}), 400

    try:
        validated = ViolationStatusUpdate(**payload)
    except ValidationError as e:
        return jsonify({'status': 'error', 'message': 'Validation failed.', 'errors': format_validation_errors(e), 'status_code': 422}), 422

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM violations WHERE id = ?;", (violation_id,))
    v_row = cursor.fetchone()
    if not v_row:
        return jsonify({'status': 'error', 'message': f"Violation '{violation_id}' not found.", 'status_code': 404}), 404

    resolved_at = validated.resolved_at
    if validated.status == 'Resolved' and not resolved_at:
        resolved_at = datetime.now().strftime('%Y-%m-%d %H:%M')

    resolution_method = validated.resolution_method
    if validated.status == 'Resolved' and not resolution_method:
        fine = v_row['fine_amount'] + v_row['late_fee']
        resolution_method = f"Settled in Full via UPI Payment Gateway (₹{fine:,.2f})"

    try:
        cursor.execute("""
            UPDATE violations
            SET status = ?, resolved_at = ?, resolution_method = ?
            WHERE id = ?;
        """, (validated.status, resolved_at, resolution_method, violation_id))
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e), 'status_code': 500}), 500

    cursor.execute("SELECT * FROM violations WHERE id = ?;", (violation_id,))
    updated_row = cursor.fetchone()

    return jsonify({
        'status': 'success',
        'message': f"Violation '{violation_id}' status updated to '{validated.status}'.",
        'violation': format_violation(updated_row)
    }), 200
