"""
ParkWise AI - Citizen Reports REST API Routes
Provides community reporting of parking infractions.
"""

import random
from datetime import datetime
from flask import Blueprint, jsonify, request
from database.db import get_db
from schemas.violation_schema import normalize_indian_plate

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('', methods=['GET'])
def list_reports():
    """GET /api/reports - List community parking violation reports."""
    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT * FROM reports ORDER BY timestamp DESC;")
    rows = cursor.fetchall()

    return jsonify({
        'status': 'success',
        'count': len(rows),
        'reports': [dict(r) for r in rows]
    }), 200


@reports_bp.route('', methods=['POST'])
def submit_report():
    """POST /api/reports - Submit a citizen community violation report."""
    payload = request.get_json(silent=True) or {}
    
    plate_raw = payload.get('vehicle_plate', '').strip()
    location = payload.get('location', '').strip()
    violation_type = payload.get('violation_type', '').strip()

    if not plate_raw or not location or not violation_type:
        return jsonify({
            'status': 'error',
            'message': "Missing required fields: 'vehicle_plate', 'location', and 'violation_type' are required.",
            'status_code': 400
        }), 400

    try:
        plate = normalize_indian_plate(plate_raw)
    except ValueError as e:
        return jsonify({'status': 'error', 'message': str(e), 'status_code': 422}), 422

    db = get_db()
    cursor = db.cursor()

    report_id = f"REP-IND-{random.randint(100, 999)}"
    now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
    reported_by = payload.get('reported_by', 'Citizen Reporter')
    photo_url = payload.get('photo_url', 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80')
    notes = payload.get('notes', 'Reported via ParkWise AI Citizen Portal.')
    confidence = payload.get('confidence', '92% confidence (Simulated)')
    status = 'Pending Review by Parking Cell'

    try:
        cursor.execute("""
            INSERT INTO reports (
                id, reported_by, user_id, vehicle_plate, location,
                violation_type, photo_url, confidence, notes, status, timestamp
            ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (report_id, reported_by, plate, location, violation_type, photo_url, confidence, notes, status, now_str))
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e), 'status_code': 500}), 500

    cursor.execute("SELECT * FROM reports WHERE id = ?;", (report_id,))
    new_report = cursor.fetchone()

    return jsonify({
        'status': 'success',
        'message': f"Community report '{report_id}' submitted successfully.",
        'report': dict(new_report)
    }), 201

