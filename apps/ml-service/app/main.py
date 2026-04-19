"""FastAPI application — routing only."""
from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import health, mock, debug, offer

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Loan Wizard ML Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(mock.router)
app.include_router(debug.router)
app.include_router(offer.router)


@app.on_event("startup")
def _startup() -> None:
    from app.deps import get_risk_scorer, get_persona_classifier
    from app.db.session import engine
    from app.db.models import Base

    # Create tables (idempotent)
    try:
        Base.metadata.create_all(bind=engine)
        logging.getLogger(__name__).info("DB tables ready")
    except Exception as exc:
        logging.getLogger(__name__).warning("DB init failed (will retry on first request): %s", exc)

    # Pre-load models into the lru_cache
    get_risk_scorer()
    get_persona_classifier()
