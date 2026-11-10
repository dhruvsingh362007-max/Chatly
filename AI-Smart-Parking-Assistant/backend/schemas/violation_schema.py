"""
ParkWise AI - Violation Validation Schemas
"""

import re
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, field_validator


INDIAN_PLATE_REGEX = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$')


def normalize_indian_plate(plate: str) -> str:
    """Normalize vehicle plate by stripping whitespace and dashes."""
    cleaned = re.sub(r'[\s\-]+', '', plate.upper())
    if not INDIAN_PLATE_REGEX.match(cleaned):
        raise ValueError(
            f"Invalid Indian vehicle registration format: '{plate}'. "
            f"Expected standard format (e.g., 'PB10AB1234', 'DL01CZ4592', 'MH12DE8831')."
        )
    return cleaned


class ViolationCreate(BaseModel):
    vehicle_plate: str = Field(..., description="Indian vehicle registration number")
    type: str = Field(..., min_length=3, description="Violation type or infraction title")
    category: Optional[str] = Field(default="Curbside Parking", description="Classification category")
    location: str = Field(..., min_length=3, description="Location of citation")
    gps: Optional[str] = Field(default=None, description="GPS coordinates")
    fine_amount: float = Field(..., ge=0, description="Fine amount in INR")
    late_fee: Optional[float] = Field(default=0.0, ge=0, description="Late fee amount in INR")
    due_date: Optional[str] = Field(default=None, description="Due date YYYY-MM-DD")
    rule_id: Optional[str] = Field(default=None, description="Linked municipal rule ID")
    officer_id: Optional[str] = Field(default="AI-ANPR-AUTO-01", description="Issuing officer or camera ID")
    ordinance_code: Optional[str] = Field(default=None, description="Sample regulatory guideline code")
    evidence_image: Optional[str] = Field(default=None, description="Evidence photo URL")
    description: Optional[str] = Field(default=None, description="Detailed citation notes")
    user_id: Optional[str] = Field(default=None, description="Driver user ID if known")
    ai_assessment: Optional[Dict[str, Any]] = Field(default=None, description="Simulated AI assessment payload")

    @field_validator('vehicle_plate')
    @classmethod
    def validate_plate(cls, v: str) -> str:
        return normalize_indian_plate(v)


class ViolationStatusUpdate(BaseModel):
    status: str = Field(..., description="Updated violation status")
    resolution_method: Optional[str] = Field(default=None, description="Payment or waiver explanation")
    resolved_at: Optional[str] = Field(default=None, description="Timestamp of resolution")

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid_statuses = {'Pending', 'Under Dispute', 'Resolved', 'Overdue'}
        # Capitalize words
        title_v = v.strip().title()
        if title_v not in valid_statuses:
            raise ValueError(f"Invalid status '{v}'. Allowed statuses: {sorted(list(valid_statuses))}")
        return title_v

