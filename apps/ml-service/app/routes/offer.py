"""POST /offer — the single endpoint Stream C calls."""
from __future__ import annotations

import logging

from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.db.models import Decision
from app.deps import (
    BureauDep,
    DbDep,
    OfferBuilderDep,
    PersonaDep,
    PolicyDep,
    RiskScorerDep,
)
from app.routes.debug import _infer_geo_tier
from app.schemas import Offer, OfferRequest

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/offer", response_model=Offer)
def create_offer(
    req: OfferRequest,
    risk_scorer: RiskScorerDep,
    policy_engine: PolicyDep,
    persona_clf: PersonaDep,
    offer_builder: OfferBuilderDep,
    bureau: BureauDep,
    db: DbDep,
) -> Offer:
    bureau_data = bureau.get(req.form_data.name or "unknown")
    geo_tier = _infer_geo_tier(req)

    policy_result = policy_engine.evaluate(req.form_data, req.cv_signals_summary, bureau_data)
    risk_output = risk_scorer.score(req.form_data, req.cv_signals_summary, bureau_data, geo_tier)
    persona_output = persona_clf.classify(req.form_data, bureau_data, req.transcript_snippets)

    offer = offer_builder.build(
        session_id=req.session_id,
        form=req.form_data,
        policy=policy_result,
        risk=risk_output,
        persona=persona_output,
    )

    _audit(db, req.session_id, policy_result, risk_output, persona_output, offer)

    return offer


def _audit(db: Session, session_id: str, policy, risk, persona, offer: Offer) -> None:
    try:
        record = Decision(
            session_id=session_id,
            policy_passed=policy.passed,
            failed_rules=policy.failed_rules,
            risk_band=risk.risk_band,
            risk_score=risk.risk_score,
            persona=persona.persona,
            offer_amount=offer.amount,
            offer_rate=offer.interest_rate,
            offer_tenure=offer.tenure_months,
            offer_emi=offer.emi,
            reason_codes=[rc.model_dump() for rc in offer.reason_codes],
        )
        existing = db.query(Decision).filter(Decision.session_id == session_id).first()
        if existing:
            db.delete(existing)
            db.flush()
        db.add(record)
        db.commit()
    except Exception as exc:
        logger.warning("Audit write failed for session %s: %s", session_id, exc)
        db.rollback()
