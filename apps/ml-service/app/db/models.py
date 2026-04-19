from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    pass


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    policy_passed = Column(Boolean, nullable=False)
    failed_rules = Column(JSON, default=list)
    risk_band = Column(String, nullable=True)
    risk_score = Column(Float, nullable=True)
    persona = Column(String, nullable=True)
    offer_amount = Column(Integer, nullable=True)
    offer_rate = Column(Float, nullable=True)
    offer_tenure = Column(Integer, nullable=True)
    offer_emi = Column(Integer, nullable=True)
    reason_codes = Column(JSON, default=list)
    decided_at = Column(DateTime, server_default=func.now())
