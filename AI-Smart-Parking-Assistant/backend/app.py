"""
ParkWise AI - Python Flask Backend Application
AI-Based Smart Parking Violation Assistant
Phase 2A: REST API Blueprints, SQLite Transactions, and Administrative Endpoints
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, jsonify, g
from flask_cors import CORS

# Add backend directory to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Load environment variables from backend/.env
load_dotenv(os.path.join(BASE_DIR, '.env'))

from database.db import get_db_connection, DATABASE_PATH

# Import Blueprints
from routes.drivers import drivers_bp
from routes.violations import violations_bp
from routes.rules import rules_bp
from routes.disputes import disputes_bp
from routes.reports import reports_bp
from routes.admin import admin_bp
from routes.ai import ai_bp


def create_app(test_config=None):
    app = Flask(__name__)
    
    # Configure application
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'parkwise-ai-dev-secret-key-2024'),
        DATABASE=DATABASE_PATH,
    )
    if test_config:
        app.config.update(test_config)

    # Enable CORS for React frontend (Vite standard ports: 3000, 3001, 5173)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Teardown context closes request-scoped database connection
    @app.teardown_appcontext
    def close_db(error=None):
        db = g.pop('db', None)
        if db is not None:
            db.close()

    # Register API Blueprints
    app.register_blueprint(drivers_bp)
    app.register_blueprint(violations_bp)
    app.register_blueprint(rules_bp)
    app.register_blueprint(disputes_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ai_bp)

    # -------------------------------------------------------------
    # ROOT & HEALTH CHECK ENDPOINTS
    # -------------------------------------------------------------
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'service': 'ParkWise AI Backend',
            'title': 'AI-Based Smart Parking Violation Assistant',
            'status': 'running',
            'phase': 'Phase 2A & 3 - REST API Development & Gemini AI Integration',
            'documentation': {
                'health': '/api/health',
                'drivers': '/api/drivers',
                'violations': '/api/violations',
                'rules': '/api/rules',
                'disputes': '/api/disputes',
                'reports': '/api/reports',
                'admin_overview': '/api/admin/overview',
                'ai_status': '/api/ai/status',
                'ai_chat': '/api/ai/chat'
            }
        }), 200

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """
        System health check endpoint.
        Verifies database connectivity, table accessibility, and counts.
        """
        db_status = {
            'connected': False,
            'database_file': app.config['DATABASE'],
            'tables': {},
            'error': None
        }

        try:
            from database.db import get_db
            db = get_db()
            cursor = db.cursor()
            
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name;
            """)
            tables = [row['name'] for row in cursor.fetchall()]
            
            table_counts = {}
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) AS cnt FROM {table};")
                count_row = cursor.fetchone()
                table_counts[table] = count_row['cnt'] if count_row else 0

            db_status['connected'] = True
            db_status['tables'] = table_counts

        except Exception as e:
            db_status['error'] = str(e)

        overall_status = 'healthy' if db_status['connected'] else 'degraded'

        return jsonify({
            'status': overall_status,
            'service': 'ParkWise AI Backend',
            'title': 'AI-Based Smart Parking Violation Assistant',
            'version': '1.0.0',
            'phase': 'Phase 2A - REST API Development & SQLite Persistence',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'database': db_status
        }), 200 if overall_status == 'healthy' else 500

    # -------------------------------------------------------------
    # ERROR HANDLERS (Standard JSON responses)
    # -------------------------------------------------------------
    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            'error': 'Bad Request',
            'message': getattr(error, 'description', 'Invalid request parameters.'),
            'status_code': 400
        }), 400

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'error': 'Not Found',
            'message': getattr(error, 'description', 'The requested endpoint does not exist on ParkWise AI backend.'),
            'status_code': 404
        }), 404

    @app.errorhandler(422)
    def unprocessable_entity_error(error):
        return jsonify({
            'error': 'Unprocessable Entity',
            'message': getattr(error, 'description', 'Input validation failed.'),
            'status_code': 422
        }), 422

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected server error occurred.',
            'status_code': 500
        }), 500

    return app


app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting ParkWise AI Backend on http://127.0.0.1:{port}")
    app.run(host='127.0.0.1', port=port, debug=True)
