"""
ParkWise AI - Municipal Parking Rule Validation Schemas
"""

from typing import Optional
from pydantic import BaseModel, Field


class RuleUpdate(BaseModel):
    title: Optional[str] = Field(default=None, description="Title of parking rule")
    zone: Optional[str] = Field(default=None, description="Enforcement zone name")
    hours: Optional[str] = Field(default=None, description="Active enforcement hours")
    rate: Optional[str] = Field(default=None, description="Standard hourly rate")
    fine_amount: Optional[float] = Field(default=None, ge=0, description="Penalty amount in INR")
    grace_period_minutes: Optional[int] = Field(default=None, ge=0, description="Grace duration in minutes")
    active: Optional[bool] = Field(default=None, description="Whether rule is currently active")
    description: Optional[str] = Field(default=None, description="Rule rationale and guidelines")

