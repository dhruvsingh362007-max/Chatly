"""
ParkWise AI - Municipal Rules REST API Routes
Provides management and lookup of municipal parking regulations.
"""

from flask import Blueprint, jsonify, request
from pydantic import ValidationError
from database.db import get_db
from schemas import format_validation_errors
from schemas.rule_schema import RuleUpdate

rules_bp = Blueprint('rules', __name__, url_prefix='/api/rules')


def format_rule(row) -> dict:
    data = dict(row)
    data['currency'] = 'INR'
    data['currency_symbol'] = '₹'
    data['active'] = bool(data.get('active'))
    data['is_demonstration'] = True
    data['demonstration_note'] = 'Sample municipal parking guideline benchmark'
    return data


@rules_bp.route('', methods=['GET'])
def list_rules():
    """
    GET /api/rules
    Query parameters:
      - active_only: 'true' to filter only active rules
    """
    db = get_db()
    cursor = db.cursor()

    active_only = request.args.get('active_only', '').strip().lower() == 'true'

    sql = "SELECT * FROM rules"
    if active_only:
        sql += " WHERE active = 1"
    sql += " ORDER BY code ASC;"

    cursor.execute(sql)
    rows = cursor.fetchall()

    return jsonify({
        'status': 'success',
        'count': len(rows),
        'rules': [format_rule(r) for r in rows]
    }), 200


@rules_bp.route('/<rule_id>', methods=['GET'])
def get_rule(rule_id):
    """
    GET /api/rules/<rule_id>
    Retrieve a single parking rule by its ID (e.g. RUL-IND-101 or PR-101).
    """
    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM rules WHERE id = ? OR code = ?;", (rule_id, rule_id))
    row = cursor.fetchone()

    if not row:
        return jsonify({
            'status': 'error',
            'message': f"Parking rule '{rule_id}' not found.",
            'status_code': 404
        }), 404

    return jsonify({
        'status': 'success',
        'rule': format_rule(row)
    }), 200


@rules_bp.route('/<rule_id>', methods=['PUT'])
def update_rule(rule_id):
    """
    PUT /api/rules/<rule_id>
    Update parking rule parameters (admin action).
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({'status': 'error', 'message': 'Missing JSON body.', 'status_code': 400}), 400

    try:
        validated = RuleUpdate(**payload)
    except ValidationError as e:
        return jsonify({'status': 'error', 'message': 'Validation failed.', 'errors': format_validation_errors(e), 'status_code': 422}), 422

    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM rules WHERE id = ? OR code = ?;", (rule_id, rule_id))
    current_row = cursor.fetchone()
    if not current_row:
        return jsonify({'status': 'error', 'message': f"Rule '{rule_id}' not found.", 'status_code': 404}), 404

    actual_id = current_row['id']
    fields = []
    params = []

    if validated.title is not None:
        fields.append("title = ?")
        params.append(validated.title)
    if validated.zone is not None:
        fields.append("zone = ?")
        params.append(validated.zone)
    if validated.hours is not None:
        fields.append("hours = ?")
        params.append(validated.hours)
    if validated.rate is not None:
        fields.append("rate = ?")
        params.append(validated.rate)
    if validated.fine_amount is not None:
        fields.append("fine_amount = ?")
        params.append(validated.fine_amount)
    if validated.grace_period_minutes is not None:
        fields.append("grace_period_minutes = ?")
        params.append(validated.grace_period_minutes)
    if validated.active is not None:
        fields.append("active = ?")
        params.append(1 if validated.active else 0)
    if validated.description is not None:
        fields.append("description = ?")
        params.append(validated.description)

    if not fields:
        return jsonify({'status': 'error', 'message': 'No modifiable fields provided.', 'status_code': 400}), 400

    params.append(actual_id)
    update_sql = f"UPDATE rules SET {', '.join(fields)} WHERE id = ?;"

    try:
        cursor.execute(update_sql, params)
        db.commit()
    except Exception as e:
        db.rollback()
        return jsonify({'status': 'error', 'message': str(e), 'status_code': 500}), 500

    cursor.execute("SELECT * FROM rules WHERE id = ?;", (actual_id,))
    updated_row = cursor.fetchone()

    return jsonify({
        'status': 'success',
        'message': f"Rule '{actual_id}' updated successfully.",
        'rule': format_rule(updated_row)
    }), 200
