"""
Unit Tests for AccessBridge Explicit Confidence Scorer
"""

import pytest
from backend.safety.confidence_scorer import ConfidenceScorer
from backend.models.schemas import FormActionProposal, VerificationResult

def test_high_confidence_execute():
    action = FormActionProposal(
        target_field_id="email",
        proposed_value="test@example.com",
        action_type="type",
        is_high_risk=False
    )
    verification = VerificationResult(
        field_match=0.95,
        semantic_match=0.95,
        format_valid=True,
        ambiguity=False
    )
    decision = ConfidenceScorer.evaluate(
        action=action,
        verification=verification,
        intent_confidence=1.0,
        rag_score=0.9
    )
    assert decision.decision == "EXECUTE"
    assert decision.composite_confidence >= 0.85
    assert decision.risk_level == "LOW"

def test_high_risk_action_requires_confirmation_regardless_of_confidence():
    # Submit action with perfect confidence
    action = FormActionProposal(
        target_field_id="submit_btn",
        proposed_value="submit",
        action_type="submit",
        is_high_risk=True
    )
    verification = VerificationResult(
        field_match=1.0,
        semantic_match=1.0,
        format_valid=True,
        ambiguity=False
    )
    decision = ConfidenceScorer.evaluate(
        action=action,
        verification=verification,
        intent_confidence=1.0,
        rag_score=1.0,
        user_confirmed=False
    )
    # MUST require confirmation!
    assert decision.decision == "REQUIRE_CONFIRMATION"
    assert decision.risk_level == "HIGH"

def test_high_risk_action_executes_after_confirmation():
    action = FormActionProposal(
        target_field_id="submit_btn",
        proposed_value="submit",
        action_type="submit",
        is_high_risk=True
    )
    verification = VerificationResult(
        field_match=1.0,
        semantic_match=1.0,
        format_valid=True,
        ambiguity=False
    )
    decision = ConfidenceScorer.evaluate(
        action=action,
        verification=verification,
        intent_confidence=1.0,
        rag_score=1.0,
        user_confirmed=True
    )
    assert decision.decision == "EXECUTE"

def test_ambiguity_penalizes_and_asks_clarification():
    action = FormActionProposal(
        target_field_id="project_category",
        proposed_value=None,
        action_type="select",
        is_high_risk=False
    )
    verification = VerificationResult(
        field_match=0.90,
        semantic_match=0.30,
        format_valid=True,
        ambiguity=True
    )
    decision = ConfidenceScorer.evaluate(
        action=action,
        verification=verification,
        intent_confidence=0.50
    )
    assert decision.decision == "ASK_CLARIFICATION"
    assert "Ambiguity detected" in " ".join(decision.blocking_factors)

def test_untrusted_flag_blocks_execution():
    action = FormActionProposal(
        target_field_id="full_name",
        proposed_value="Alice",
        action_type="type"
    )
    verification = VerificationResult(
        field_match=1.0,
        semantic_match=1.0,
        format_valid=True
    )
    decision = ConfidenceScorer.evaluate(
        action=action,
        verification=verification,
        untrusted_flag=True
    )
    assert decision.decision == "BLOCK"
    assert decision.risk_level == "CRITICAL"
