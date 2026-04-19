"""Dependency injection for FastAPI routes."""
from __future__ import annotations

from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.risk_scorer import RiskScorer
from app.services.policy_engine import PolicyEngine
from app.services.persona_classifier import PersonaClassifier
from app.services.offer_builder import OfferBuilder
from app.services.bureau_mock import BureauMock


@lru_cache(maxsize=1)
def get_risk_scorer() -> RiskScorer:
    scorer = RiskScorer()
    scorer.load()
    return scorer


@lru_cache(maxsize=1)
def get_policy_engine() -> PolicyEngine:
    return PolicyEngine()


@lru_cache(maxsize=1)
def get_persona_classifier() -> PersonaClassifier:
    clf = PersonaClassifier()
    clf.load()
    return clf


@lru_cache(maxsize=1)
def get_offer_builder() -> OfferBuilder:
    return OfferBuilder()


@lru_cache(maxsize=1)
def get_bureau_mock() -> BureauMock:
    return BureauMock()


DbDep = Annotated[Session, Depends(get_db)]
RiskScorerDep = Annotated[RiskScorer, Depends(get_risk_scorer)]
PolicyDep = Annotated[PolicyEngine, Depends(get_policy_engine)]
PersonaDep = Annotated[PersonaClassifier, Depends(get_persona_classifier)]
OfferBuilderDep = Annotated[OfferBuilder, Depends(get_offer_builder)]
BureauDep = Annotated[BureauMock, Depends(get_bureau_mock)]
