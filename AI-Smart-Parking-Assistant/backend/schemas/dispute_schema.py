"""
ParkWise AI - Dispute Validation Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


STATUS_NORMALIZATION_MAP = {
    'approved': 'Dispute Approved - Fine Dismissed (Demo)',
    'dispute approved': 'Dispute Approved - Fine Dismissed (Demo)',
    'dispute approved - fine dismissed (demo)': 'Dispute Approved - Fine Dismissed (Demo)',
    'pending': 'Pending Review',
    'pending review': 'Pending Review',
    'under review': 'Under Demonstration Review by Parking Cell',
    'under demonstration review by parking cell': 'Under Demonstration Review by Parking Cell',
    'rejected': 'Rejected',
    'dismissed': 'Dismissed'
}


class DisputeCreate(BaseModel):
    violation_id: str = Field(..., min_length=3, description="Violation citation ID being disputed")
    reason: str = Field(..., min_length=5, description="Brief justification for dispute")
    letter_text: Optional[str] = Field(default=None, description="Detailed appeal letter statement")
    evidence_submitted: Optional[bool] = Field(default=False, description="Flag indicating photo/document evidence attached")
    user_id: Optional[str] = Field(default=None, description="Disputing user ID")


class DisputeStatusUpdate(BaseModel):
    status: str = Field(..., description="Adjudication outcome status")
    adjudicator_notes: Optional[str] = Field(default=None, description="Notes from the reviewing officer")
    waive_fine: Optional[bool] = Field(default=True, description="Whether to automatically waive citation fine if approved")

    @field_validator('status')
    @classmethod
    def validate_and_normalize_status(cls, v: str) -> str:
        key = v.strip().lower()
        if key not in STATUS_NORMALIZATION_MAP:
            allowed = list(set(STATUS_NORMALIZATION_MAP.values()))
            raise ValueError(f"Invalid dispute status '{v}'. Allowed values include: {allowed}")
        return STATUS_NORMALIZATION_MAP[key]

