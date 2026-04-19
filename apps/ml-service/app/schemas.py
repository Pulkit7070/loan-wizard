"""Pydantic mirrors of @loan-wizard/contracts TypeScript types."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ---- primitives ----

EmploymentType = Literal["salaried", "self_employed", "business_owner", "unemployed", "retired"]
RiskBand = Literal["low", "medium", "high"]
PersonaType = Literal[
    "salaried_prime", "self_employed_thin_file", "high_aspiration", "cautious_saver", "risky"
]


class FormData(BaseModel):
    name: Optional[str] = None
    employment_type: Optional[EmploymentType] = None
    monthly_income: Optional[float] = None
    loan_amount_requested: Optional[float] = None
    purpose: Optional[str] = None
    declared_age: Optional[int] = None


class CVSignalsSummary(BaseModel):
    avg_age_estimate: Optional[float] = None
    avg_liveness: float
    min_liveness: float
    face_present_ratio: float


class GeoPoint(BaseModel):
    lat: float
    lng: float


class BureauData(BaseModel):
    cibil_score_proxy: int
    existing_loans: int
    default_history: bool


# ---- request / response types ----

class OfferRequest(BaseModel):
    session_id: str
    form_data: FormData
    cv_signals_summary: CVSignalsSummary
    geo: Optional[GeoPoint] = None
    transcript_snippets: list[str] = Field(default_factory=list)


class ReasonCode(BaseModel):
    code: str
    label: str
    weight: float


class Offer(BaseModel):
    session_id: str
    eligible: bool
    amount: Optional[int] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    emi: Optional[int] = None
    risk_band: RiskBand
    persona: str
    reason_codes: list[ReasonCode]
    rejection_reason: Optional[str] = None
    generated_at: str


class RiskScoreOutput(BaseModel):
    risk_band: RiskBand
    risk_score: float = Field(ge=0.0, le=1.0)
    feature_importance: dict[str, float]


class PersonaClassificationOutput(BaseModel):
    persona: PersonaType
    confidence: float = Field(ge=0.0, le=1.0)
    context_notes: list[str]


class PolicyResult(BaseModel):
    passed: bool
    failed_rules: list[str]
    passed_rules: list[str]


class DebugPersonaRequest(BaseModel):
    transcript_snippets: list[str]
    form_data: FormData


class HealthResponse(BaseModel):
    status: str
    models_loaded: dict[str, bool]
