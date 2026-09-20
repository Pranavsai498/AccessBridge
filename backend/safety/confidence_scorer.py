"""
Explicit Confidence Scorer for AccessBridge
Implements multi-factor mathematical scoring for safety decisions.
Never relies on ungrounded LLM self-confidence assertions.
"""

from typing import Dict, Any, List, Optional
from backend.models.schemas import SafetyDecision, FormActionProposal, VerificationResult
from backend.config import settings

class ConfidenceScorer:
    """Computes transparent, multi-factor confidence and risk assessments."""

    WEIGHT_INTENT = 0.25
    WEIGHT_FIELD_MATCH = 0.40
    WEIGHT_VALUE_MATCH = 0.30
    WEIGHT_RAG_EVIDENCE = 0.05

    AMBIGUITY_PENALTY = 0.35
    INVALID_FORMAT_PENALTY = 0.40
    SECURITY_FLAG_PENALTY = 0.85

    @classmethod
    def evaluate(
        cls,
        action: FormActionProposal,
        verification: VerificationResult,
        intent_confidence: float = 1.0,
        rag_score: float = 0.8,
        untrusted_flag: bool = False,
        user_confirmed: bool = False
    ) -> SafetyDecision:
        """
        Calculates composite confidence and produces a definitive safety routing decision.
        """
        blocking_factors: List[str] = []
        
        # 1. Component scores
        c_intent = max(0.0, min(1.0, intent_confidence))
        c_field = max(0.0, min(1.0, verification.field_match))
        c_value = max(0.0, min(1.0, verification.semantic_match))
        c_rag = max(0.0, min(1.0, rag_score))

        # Base weighted confidence
        base_score = (
            (c_intent * cls.WEIGHT_INTENT) +
            (c_field * cls.WEIGHT_FIELD_MATCH) +
            (c_value * cls.WEIGHT_VALUE_MATCH) +
            (c_rag * cls.WEIGHT_RAG_EVIDENCE)
        )

        penalties = 0.0
        
        # Ambiguity deduction
        if verification.ambiguity:
            penalties += cls.AMBIGUITY_PENALTY
            blocking_factors.append("Ambiguity detected in user intent or field mapping")

        # Format validation failure deduction
        if not verification.format_valid:
            penalties += cls.INVALID_FORMAT_PENALTY
            blocking_factors.append(f"Format validation error: {', '.join(verification.validation_errors)}")

        # Security flag deduction
        if untrusted_flag:
            penalties += cls.SECURITY_FLAG_PENALTY
            blocking_factors.append("Untrusted content or potential prompt injection detected")

        composite = max(0.0, min(1.0, base_score - penalties))
        composite = round(composite, 3)

        breakdown = {
            "intent_confidence": c_intent,
            "field_match": c_field,
            "semantic_value_match": c_value,
            "rag_evidence": c_rag,
            "penalties_applied": penalties,
            "composite_confidence": composite
        }

        # Determine Risk Level
        risk_level = "LOW"
        if action.action_type in ["submit", "clear"] or action.is_high_risk:
            risk_level = "HIGH"
        elif untrusted_flag:
            risk_level = "CRITICAL"
        elif verification.ambiguity or not verification.format_valid:
            risk_level = "MEDIUM"

        # 1. Critical Security Threat Check
        if untrusted_flag:
            return SafetyDecision(
                composite_confidence=composite,
                risk_level="CRITICAL",
                decision="BLOCK",
                reason="Blocked execution due to untrusted instructions or injection attempt.",
                blocking_factors=blocking_factors,
                confidence_breakdown=breakdown
            )

        # 2. High Risk actions (Form submission, deletion, financial commitments)
        if (risk_level == "HIGH" or action.requires_confirmation or action.action_type == "submit"):
            if not user_confirmed:
                return SafetyDecision(
                    composite_confidence=composite,
                    risk_level="HIGH",
                    decision="REQUIRE_CONFIRMATION",
                    reason="Action is high-impact (form submission or irreversible action). Explicit user review required.",
                    blocking_factors=["High-impact action requires user verification before proceeding."],
                    confidence_breakdown=breakdown
                )

        # 3. Ambiguity or low confidence
        if verification.ambiguity or composite < settings.CONFIDENCE_THRESHOLD_MEDIUM:
            return SafetyDecision(
                composite_confidence=composite,
                risk_level=risk_level,
                decision="ASK_CLARIFICATION",
                reason="Confidence below acceptable threshold or ambiguity present. Clarification needed from user.",
                blocking_factors=blocking_factors,
                confidence_breakdown=breakdown
            )

        # 4. Moderate confidence verification check
        if composite < settings.CONFIDENCE_THRESHOLD_HIGH:
            return SafetyDecision(
                composite_confidence=composite,
                risk_level=risk_level,
                decision="ASK_CLARIFICATION",
                reason="Confidence is moderate; seeking user confirmation on specific value before applying.",
                blocking_factors=blocking_factors,
                confidence_breakdown=breakdown
            )

        # 5. High confidence & verified
        return SafetyDecision(
            composite_confidence=composite,
            risk_level="LOW",
            decision="EXECUTE",
            reason="High confidence, verified field mapping and semantic match.",
            blocking_factors=[],
            confidence_breakdown=breakdown
        )
