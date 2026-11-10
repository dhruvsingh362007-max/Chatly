"""
ParkWise AI - Drivers REST API Routes
"""

from flask import Blueprint, jsonify, request
from database.db import get_db

drivers_bp = Blueprint('drivers', __name__, url_prefix='/api/drivers')


@drivers_bp.route('', methods=['GET'])
def list_drivers():
    """
    GET /api/drivers
    List all registered demonstration drivers with their vehicles and citation summary.
    Query params:
      - search: string to match driver name or email
      - plate: string to match registered vehicle plate
    """
    db = get_db()
    cursor = db.cursor()

    search_query = request.args.get('search', '').strip()
    plate_filter = request.args.get('plate', '').strip().upper()

    base_sql = "SELECT * FROM users WHERE role = 'driver'"
    params = []

    if search_query:
        base_sql += " AND (name LIKE ? OR email LIKE ?)"
        params.extend([f"%{search_query}%", f"%{search_query}%"])

    base_sql += " ORDER BY name ASC;"
    cursor.execute(base_sql, params)
    drivers = [dict(row) for row in cursor.fetchall()]

    response_data = []
    for driver in drivers:
        # Fetch vehicles
        v_cursor = db.cursor()
        v_cursor.execute("SELECT * FROM vehicles WHERE user_id = ? ORDER BY year DESC;", (driver['id'],))
        vehicles = [dict(v) for v in v_cursor.fetchall()]

        # Filter by plate if requested
        if plate_filter and not any(v['plate'] == plate_filter for v in vehicles):
            continue

        # Fetch citation summary
        vio_cursor = db.cursor()
        vio_cursor.execute("""
            SELECT 
                COUNT(*) as total_citations,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_citations,
                SUM(CASE WHEN status = 'Under Dispute' THEN 1 ELSE 0 END) as disputed_citations,
                SUM(CASE WHEN status = 'Pending' THEN fine_amount + late_fee ELSE 0 END) as pending_fines_inr
            FROM violations 
            WHERE user_id = ?;
        """, (driver['id'],))
        stats = dict(vio_cursor.fetchone() or {})

        driver_info = {
            'id': driver['id'],
            'name': driver['name'],
            'email': driver['email'],
            'role': driver['role'],
            'phone': driver['phone'],
            'driver_license': driver['driver_license'],
            'vehicles': vehicles,
            'citation_summary': {
                'total': stats.get('total_citations') or 0,
                'pending': stats.get('pending_citations') or 0,
                'under_dispute': stats.get('disputed_citations') or 0,
                'pending_balance_inr': stats.get('pending_fines_inr') or 0.0,
                'currency': 'INR',
                'currency_symbol': '₹'
            },
            'is_demonstration': True,
            'demonstration_note': 'Sample demonstration profile'
        }
        response_data.append(driver_info)

    return jsonify({
        'status': 'success',
        'count': len(response_data),
        'drivers': response_data
    }), 200


@drivers_bp.route('/<driver_id>', methods=['GET'])
def get_driver(driver_id):
    """
    GET /api/drivers/<driver_id>
    Retrieve full profile, vehicles, and active citations for a single driver.
    """
    db = get_db()
    cursor = db.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ? AND role = 'driver';", (driver_id,))
    driver_row = cursor.fetchone()

    if not driver_row:
        return jsonify({
            'status': 'error',
            'message': f"Driver with ID '{driver_id}' not found.",
            'status_code': 404
        }), 404

    driver = dict(driver_row)

    # Fetch vehicles
    cursor.execute("SELECT * FROM vehicles WHERE user_id = ? ORDER BY year DESC;", (driver_id,))
    vehicles = [dict(v) for v in cursor.fetchall()]

    # Fetch citations
    cursor.execute("""
        SELECT id, vehicle_plate, type, location, fine_amount, late_fee, status, issue_date, due_date
        FROM violations 
        WHERE user_id = ?
        ORDER BY issue_date DESC;
    """, (driver_id,))
    violations = [dict(v) for v in cursor.fetchall()]

    pending_balance = sum(v['fine_amount'] + v['late_fee'] for v in violations if v['status'] == 'Pending')

    return jsonify({
        'status': 'success',
        'driver': {
            'id': driver['id'],
            'name': driver['name'],
            'email': driver['email'],
            'phone': driver['phone'],
            'driver_license': driver['driver_license'],
            'vehicles': vehicles,
            'pending_balance_inr': pending_balance,
            'currency': 'INR',
            'currency_symbol': '₹',
            'violations_count': len(violations),
            'recent_violations': violations,
            'is_demonstration': True
        }
    }), 200

