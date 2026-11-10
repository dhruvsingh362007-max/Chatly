"""
ParkWise AI - Pydantic Validation Helpers
"""

from pydantic import ValidationError


def format_validation_errors(e: ValidationError) -> list:
    """Transform Pydantic validation errors into clean, JSON-serializable dictionaries."""
    formatted = []
    for err in e.errors():
        field_path = " -> ".join(str(loc) for loc in err.get('loc', []))
        formatted.append({
            'field': field_path or 'root',
            'message': err.get('msg', 'Invalid value'),
            'type': err.get('type', 'validation_error')
        })
    return formatted
