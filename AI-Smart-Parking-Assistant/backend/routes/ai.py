"""
ParkWise AI - AI Assistant REST API Blueprint
Routes:
  - GET  /api/ai/status : Check Gemini configuration and AI service availability
  - POST /api/ai/chat   : Process parking inquiries with RAG context & Gemini Flash
"""

from flask import Blueprint, jsonify, request
from database.db import get_db
from services.ai_context import build_system_prompt_and_context, build_database_fallback_reply
from services.gemini_service import is_gemini_configured, get_configured_model, generate_gemini_response

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@ai_bp.route('/status', methods=['GET'])
def ai_status():
    """
    GET /api/ai/status
    Returns status of AI copilot, configured model, and database telemetry counts.
    Never exposes API keys.
    """
    configured = is_gemini_configured()
    model = get_configured_model()

    db = get_db()
    cursor = db.cursor()
    cursor.execute("SELECT COUNT(*) FROM rules WHERE active = 1;")
    active_rules_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM violations;")
    violations_count = cursor.fetchone()[0]

    return jsonify({
        'status': 'success',
        'service': 'ParkWise AI Explainable Assistant',
        'configured': configured,
        'model': model,
        'mode': 'gemini_live' if configured else 'sqlite_fallback',
        'telemetry': {
            'active_rules': active_rules_count,
            'violations_indexed': violations_count,
            'database': 'parkwise.db'
        },
        'notice': 'Production Gemini Flash API active' if configured else 'Gemini API key not configured in backend/.env; operating in SQLite database fallback mode'
    }), 200


@ai_bp.route('/chat', methods=['POST'])
def ai_chat():
    """
    POST /api/ai/chat
    Request JSON:
      - message (str, required): The user's question or prompt
      - history (list, optional): Array of prior turns [{ role: 'user'|'assistant', content: str }]
    """
    payload = request.get_json(silent=True)
    if not payload or not isinstance(payload, dict):
        return jsonify({
            'status': 'error',
            'message': 'Invalid request body. Expected JSON object with a "message" field.',
            'status_code': 400
        }), 400

    user_message = payload.get('message', '').strip()
    if not user_message:
        return jsonify({
            'status': 'error',
            'message': 'The "message" field cannot be empty.',
            'status_code': 400
        }), 400

    conversation_history = payload.get('history', [])

    db = get_db()

    # 1. Retrieve grounded SQLite context (Rules + Violations + Telematics)
    context_info = build_system_prompt_and_context(user_message, db)

    # 2. Check if Gemini API is configured and attempt generation
    reply = None
    model_used = None
    fallback_reason = None

    if is_gemini_configured():
        reply, model_used, error_msg = generate_gemini_response(
            user_message=user_message,
            system_instruction=context_info['system_instruction'],
            context_data=context_info['context_data'],
            conversation_history=conversation_history
        )
        if error_msg:
            fallback_reason = error_msg
    else:
        fallback_reason = "Gemini API key is not configured in backend/.env (using database benchmark mode)"

    # 3. If Gemini is unconfigured or call failed, use SQLite-grounded fallback
    is_fallback = False
    if not reply:
        is_fallback = True
        model_used = 'sqlite-rag-engine'
        reply = build_database_fallback_reply(user_message, context_info)

    return jsonify({
        'status': 'success',
        'reply': reply,
        'source': context_info['source'],
        'reference': context_info['reference'],
        'violation_id': context_info['violation_id'],
        'is_fallback': is_fallback,
        'fallback_reason': fallback_reason if is_fallback else None,
        'model': model_used,
        'suggested_actions': context_info['suggested_actions']
    }), 200

