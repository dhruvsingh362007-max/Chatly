"""
ParkWise AI - Google Gemini API Integration Service
Handles communication with Google GenAI SDK (`google-genai`), model fallback,
and secure API key handling.
"""

import os
import logging
from typing import Tuple, Optional, List
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(BASE_DIR, '.env')

# Candidate Gemini Flash models in priority order
# gemini-3.1-flash-lite and gemini-3.5-flash-lite are the active, fast models supported on Google GenAI SDK
CANDIDATE_FLASH_MODELS = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash'
]


def reload_env_if_needed():
    """Ensure environment is loaded from backend/.env."""
    load_dotenv(ENV_PATH, override=False)


def is_gemini_configured() -> bool:
    """Check if a valid non-placeholder GEMINI_API_KEY is present in environment."""
    reload_env_if_needed()
    key = os.getenv('GEMINI_API_KEY', '').strip()
    if not key or key.startswith('YOUR_') or key == 'placeholder' or len(key) < 15:
        # Retry with force reload from disk
        load_dotenv(ENV_PATH, override=True)
        key = os.getenv('GEMINI_API_KEY', '').strip()
        if not key or key.startswith('YOUR_') or key == 'placeholder' or len(key) < 15:
            return False
    return True


def get_configured_model() -> str:
    """Return primary model name configured in environment."""
    reload_env_if_needed()
    return os.getenv('GEMINI_MODEL', 'gemini-3.1-flash-lite').strip()


def generate_gemini_response(
    user_message: str,
    system_instruction: str,
    context_data: str,
    conversation_history: Optional[List[dict]] = None
) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Call Google Gemini Flash via the official `google-genai` SDK.

    Returns:
        (reply_text, model_name, error_message)
    """
    if not is_gemini_configured():
        return None, None, "GEMINI_API_KEY is not configured or contains default placeholder in backend/.env"

    api_key = os.getenv('GEMINI_API_KEY').strip()
    primary_model = get_configured_model()

    # Build list of models to try (primary first, then other flash candidates)
    models_to_try = [primary_model]
    for m in CANDIDATE_FLASH_MODELS:
        if m not in models_to_try:
            models_to_try.append(m)

    try:
        from google import genai
        from google.genai import types
    except ImportError as e:
        logger.error("google-genai package not found: %s", e)
        return None, None, "Google GenAI SDK (google-genai) is not installed in the backend environment."

    try:
        client = genai.Client(api_key=api_key)
    except Exception as e:
        logger.error("Failed to initialize Google GenAI Client: %s", type(e).__name__)
        return None, None, f"Client initialization error: {type(e).__name__}"

    # Prepare structured user prompt with injected database context
    prompt_content = f"{context_data}\n\nUSER INQUIRY:\n{user_message}"

    # Build contents with optional prior conversation turns
    contents = []
    if conversation_history and isinstance(conversation_history, list):
        # Only take the last 4 turns to keep context tight and relevant
        for turn in conversation_history[-4:]:
            role = turn.get('role', 'user')
            text = turn.get('content', '').strip()
            if text and role in ('user', 'assistant'):
                mapped_role = 'user' if role == 'user' else 'model'
                contents.append(types.Content(
                    role=mapped_role,
                    parts=[types.Part.from_text(text=text)]
                ))

    # Add current turn
    contents.append(types.Content(
        role='user',
        parts=[types.Part.from_text(text=prompt_content)]
    ))

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.3,
        max_output_tokens=1000
    )

    last_error = None
    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )
            if response and response.text:
                return response.text, model_name, None
        except Exception as e:
            err_msg = str(e)
            logger.warning("Gemini generation attempt with model '%s' failed: %s", model_name, type(e).__name__)
            last_error = f"{type(e).__name__}: {err_msg[:120]}"

            # If it's an authentication error, don't keep trying models
            if 'API_KEY_INVALID' in err_msg or 'PERMISSION_DENIED' in err_msg or '401' in err_msg or '403' in err_msg:
                return None, None, "Authentication failed: Provided GEMINI_API_KEY is invalid or lacks necessary permissions."

    return None, None, f"Gemini API request failed ({last_error or 'Unknown error'})"

