"""
ParkWise AI - Disputes REST API Routes
Handles filing appeals, reviewing disputes, and adjudication workflows.
"""

import random
from datetime import datetime
from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from database.db import get_db
from schemas import format_validation_errors
from schemas.dispute_schema import DisputeCreate, DisputeStatusUpdate

disputes_bp = Blueprint('disputes', __name__, url_prefix='/api/disputes')


def format_dispute(row) -> dict:
    data = dict(row)
    data['evidence_submitted'] = bool(data.get('evidence_submitted'))
    data['is_demonstration'] = True
    data['demonstration_note'] = 'Sample demonstration appeal record'
    return data


@disputes_bp.route('', methods=['GET'])
def list_disputes():
    """
    GET /api/disputes
    Query parameters:
      - status: Filter by dispute status
      - violation_id: Filter by violation ID
      - user_id: Filter by driver user ID
    """
    db = get_db()
    cursor = db.cursor()

    status_filter = request.args.get('status', '').strip()
    violation_filter = request.args.get('violation_id', '').strip()
    user_id_filter = request.args.get('user_id', '').strip()

    sql = """
        SELECT d.*, 
               v.type as violation_type, v.fine_amount as violation_fine, 
               v.vehicle_plate, v.location as violation_location,
               u.name as driver_name, u.email as driver_email
        FROM disputes d
        JOIN violations v ON d.violation_id = v.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE 1=1
    """
    params = []

    if status_filter:
        sql += " AND LOWER(d.status) LIKE LOWER(?)"
        params.append(f"%{status_filter}%")
    if violation_filter:
        sql += " AND d.violation_id = ?"
        params.append(violation_filter)
    if user_id_filter:
        sql += " AND d.user_id = ?"
        params.append(user_id_filter)

    sql += " ORDER BY d.submitted_at DESC;"
    cursor.execute(sql, params)
    rows = cursor.fetchall()

    return jsonify({
        'status': 'success',
        'count': len(rows),
        'disputes': [format_dispute(r) for r in rows]
    }), 200


@disputes_bp.route('/<dispute_id>', methods=['GET'])
def get_dispute(dispute_id):
    """
    GET /api/disputes/<dispute_id>
    Retrieve full details of a specific dispute.
    """
    db = get_db()
    cursor = db.cursor()

    sql = """
        SELECT d.*, 
               v.type as violation_type, v.fine_amount as violation_fine, 
               v.vehicle_plate, v.location as violation_location, v.status as violation_status,
               u.name as driver_name, u.email as driver_email
        FROM disputes d
        JOIN violations v ON d.violation_id = v.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = ?;
    """
    cursor.execute(sql, (dispute_id,))
    row = cursor.fetchone()

    if not row:
        return jsonify({
            'status': 'error',
            'message': f"Dispute '{dispute_id}' not found.",
            'status_code': 404
        }), 404

    return jsonify({
        'status': 'success',
        'dispute': format_dispute(row)
    }), 200


@disputes_bp.route('', methods=['POST'])
def create_dispute():
    """
    POST /api/disputes
    File a new dispute for an existing violation.
    Automatically updates the violation's status to 'Under Dispute'.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Missing JSON body.', 'status_code': 400}), 400

    try:
        validated = DisputeCreate(**payload)
    except ValidationError as e:
        return jsonify({'status': 'error', 'message': 'Validation failed.', 'errors': format_validation_errors(e), 'status_code': 422}), 422

    db = get_db()
    cursor = db.cursor()

    # 1. Verify violation exists
    cursor.execute("SELECT * FROM violations WHERE id = ?;", (validated.violation_id,))
    v_row = cursor.fetchone()
    if not v_row:
        return jsonify({
            'status': 'error',
            'message': f"Violation citation '{validated.violation_id}' not found.",
            'status_code': 404
        }), 404

    if v_row['status'] == 'Resolved':
        return jsonify({
            'status': 'error',
            'message': f"Citation '{validated.violation_id}' is already marked as 'Resolved' and cannot be disputed.",
            'status_code': 400
        }), 400

    # 2. Check if dispute already exists for this violation
    cursor.execute("SELECT id FROM disputes WHERE violation_id = ?;", (validated.violation_id,))
    existing_d = cursor.fetchone()
    if existing_d:
        return jsonify({
            'status': 'error',
            'message': f"A dispute is already pending or reviewed for citation '{validated.violation_id}' (Dispute ID: {existing_d['id']}).",
            'status_code': 409
        }), 409

    # 3. Create unique dispute ID: DSP-IND-2024-XXXX
    random_suffix = random.randint(100, 999)
    dispute_id = f"DSP-IND-2024-{random_suffix}"
    while cursor.execute("SELECT 1 FROM disputes WHERE id = ?;", (dispute_id,)).fetchone():
        random_suffix = random.randint(100, 999)
        dispute_id = f"DSP-IND-2024-{random_suffix}"

    now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
    user_id = validated.user_id or v_row['user_id']
    initial_status = 'Under Demonstration Review by Parking Cell'

    letter_text = validated.letter_text or f"Dispute submitted regarding citation {validated.violation_id}. Reason: {validated.reason}"

    try:
        # Insert dispute
        cursor.execute("""
            INSERT INTO disputes (
                id, violation_id, user_id, reason, letter_text, evidence_submitted,
                status, adjudicator_notes, submitted_at, reviewed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL);
        """, (
            dispute_id,
            validated.violation_id,
            user_id,
            validated.reason,
            letter_text,
            1 if validated.evidence_submitted else 0,
            initial_status,
            now_str
        ))

        # Update violation status to 'Under Dispute'
        cursor.execute("""
            UPDATE violations
            SET status = 'Under Dispute'
            WHERE id = ?;
        """, (validated.violation_id,))

        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': f"Dispute filing failed: {str(e)}", 'status_code': 500}), 500

    cursor.execute("SELECT * FROM disputes WHERE id = ?;", (dispute_id,))
    new_dispute = cursor.fetchone()

    return jsonify({
        'status': 'success',
        'message': f"Demonstration dispute '{dispute_id}' submitted successfully. Citation '{validated.violation_id}' is now Under Dispute.",
        'dispute': format_dispute(new_dispute)
    }), 201


@disputes_bp.route('/<dispute_id>/status', methods=['PATCH'])
def update_dispute_status(dispute_id):
    """
    PATCH /api/disputes/<dispute_id>/status
    Admin adjudication endpoint: approve, reject, or update dispute status.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Missing JSON body.', 'status_code': 400}), 400

    try:
        validated = DisputeStatusUpdate(**payload)
    except ValidationError as e:
        return jsonify({'status': 'error', 'message': 'Validation failed.', 'errors': format_validation_errors(e), 'status_code': 422}), 422

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM disputes WHERE id = ?;", (dispute_id,))
    d_row = cursor.fetchone()
    if not d_row:
        return jsonify({'status': 'error', 'message': f"Dispute '{dispute_id}' not found.", 'status_code': 404}), 404

    now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
    target_status = validated.status
    adjudicator_notes = validated.adjudicator_notes or f"Demonstration review updated to {target_status} at {now_str}."

    try:
        cursor.execute("""
            UPDATE disputes
            SET status = ?, adjudicator_notes = ?, reviewed_at = ?
            WHERE id = ?;
        """, (target_status, adjudicator_notes, now_str, dispute_id))

        violation_id = d_row['violation_id']

        # If dispute was approved/dismissed
        if target_status == 'Dispute Approved - Fine Dismissed (Demo)':
            cursor.execute("""
                UPDATE violations
                SET status = 'Resolved',
                    resolved_at = ?,
                    resolution_method = 'Dispute Approved - Fine Waived (Demo)'
                WHERE id = ?;
            """, (now_str, violation_id))
        elif target_status in ('Rejected', 'Dismissed'):
            # Revert violation to Pending so driver owes the fine
            cursor.execute("""
                UPDATE violations
                SET status = 'Pending',
                    resolution_method = NULL,
                    resolved_at = NULL
                WHERE id = ?;
            """, (violation_id,))

        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e), 'status_code': 500}), 500

    cursor.execute("SELECT * FROM disputes WHERE id = ?;", (dispute_id,))
    updated_d = cursor.fetchone()

    cursor.execute("SELECT status, resolution_method FROM violations WHERE id = ?;", (d_row['violation_id'],))
    v_updated = cursor.fetchone()

    return jsonify({
        'status': 'success',
        'message': f"Dispute '{dispute_id}' updated to '{target_status}'.",
        'dispute': format_dispute(updated_d),
        'associated_violation': {
            'id': d_row['violation_id'],
            'status': v_updated['status'],
            'resolution_method': v_updated['resolution_method']
        }
    }), 200
