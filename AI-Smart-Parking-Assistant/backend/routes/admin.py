"""
ParkWise AI - Municipal Admin & Analytics REST API Routes
Provides aggregated statistics, enforcement metrics, and administrative audit trails.
"""

from flask import Blueprint, jsonify
from database.db import get_db

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


@admin_bp.route('/overview', methods=['GET'])
def get_overview():
    """
    GET /api/admin/overview
    Returns municipal dashboard KPIs, enforcement totals, and dispute approval analytics.
    """
    db = get_db()
    cursor = db.cursor()

    # Violations breakdown
    cursor.execute("""
        SELECT 
            COUNT(*) as total_violations,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_violations,
            SUM(CASE WHEN status = 'Under Dispute' THEN 1 ELSE 0 END) as disputed_violations,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_violations,
            SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END) as overdue_violations,
            SUM(fine_amount + late_fee) as total_fines_levied,
            SUM(CASE WHEN status = 'Resolved' THEN fine_amount + late_fee ELSE 0 END) as total_fines_settled,
            SUM(CASE WHEN status = 'Pending' THEN fine_amount + late_fee ELSE 0 END) as total_fines_outstanding
        FROM violations;
    """)
    vio_stats = dict(cursor.fetchone() or {})

    # Disputes breakdown
    cursor.execute("""
        SELECT 
            COUNT(*) as total_disputes,
            SUM(CASE WHEN status LIKE '%Approved%' THEN 1 ELSE 0 END) as approved_disputes,
            SUM(CASE WHEN status LIKE '%Review%' OR status LIKE '%Pending%' THEN 1 ELSE 0 END) as pending_disputes,
            SUM(CASE WHEN status LIKE '%Rejected%' THEN 1 ELSE 0 END) as rejected_disputes
        FROM disputes;
    """)
    disp_stats = dict(cursor.fetchone() or {})

    total_disp = disp_stats.get('total_disputes') or 0
    approved_disp = disp_stats.get('approved_disputes') or 0
    approval_rate = round((approved_disp / total_disp * 100), 1) if total_disp > 0 else 0.0

    # Rules count
    cursor.execute("SELECT COUNT(*) as total_rules, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_rules FROM rules;")
    rule_stats = dict(cursor.fetchone() or {})

    # Vehicle count
    cursor.execute("SELECT COUNT(*) as total_vehicles FROM vehicles;")
    veh_stats = dict(cursor.fetchone() or {})

    # Recent violations
    cursor.execute("""
        SELECT id, vehicle_plate, type, location, fine_amount, status, issue_date 
        FROM violations 
        ORDER BY issue_date DESC 
        LIMIT 5;
    """)
    recent_violations = [dict(r) for r in cursor.fetchall()]

    return jsonify({
        'status': 'success',
        'overview': {
            'violations': {
                'total': vio_stats.get('total_violations') or 0,
                'pending': vio_stats.get('pending_violations') or 0,
                'under_dispute': vio_stats.get('disputed_violations') or 0,
                'resolved': vio_stats.get('resolved_violations') or 0,
                'overdue': vio_stats.get('overdue_violations') or 0
            },
            'financials': {
                'currency': 'INR',
                'currency_symbol': '₹',
                'total_fines_levied_inr': vio_stats.get('total_fines_levied') or 0.0,
                'total_fines_settled_inr': vio_stats.get('total_fines_settled') or 0.0,
                'total_fines_outstanding_inr': vio_stats.get('total_fines_outstanding') or 0.0
            },
            'disputes': {
                'total': total_disp,
                'approved': approved_disp,
                'pending_review': disp_stats.get('pending_disputes') or 0,
                'rejected': disp_stats.get('rejected_disputes') or 0,
                'approval_rate_percent': approval_rate
            },
            'rules': {
                'total': rule_stats.get('total_rules') or 0,
                'active': rule_stats.get('active_rules') or 0
            },
            'vehicles_monitored': veh_stats.get('total_vehicles') or 0,
            'recent_activity': recent_violations
        },
        'is_demonstration': True,
        'demonstration_note': 'Municipal administration benchmark analytics'
    }), 200

