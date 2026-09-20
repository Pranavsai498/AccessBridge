"""
Safety / Confidence Agent for AccessBridge
Calculates explicit multi-factor confidence and enforces guardrails.
Never blindly trusts LLM self-confidence assertions.
"""

from typing import List, Optional
from backend.models.schemas import (
    SafetyDecision,
    FormActionProposal,
    VerificationResult,
    RAGCitation,
    WebPageState
)
from backend.safety.confidence_scorer import ConfidenceScorer
from backend.safety.injection_defense import InjectionDefense

class SafetyAgent:
    def __init__(self, tracer=None):
        self.tracer = tracer

    async def evaluate_safety(
        self,
        action: FormActionProposal,
        verification: VerificationResult,
        intent_confidence: float,
        rag_citations: List[RAGCitation],
        page_state: WebPageState,
        user_confirmed: bool = False,
        raw_user_message: str = ""
    ) -> SafetyDecision:
        top_rag_score = rag_citations[0].retrieval_score if rag_citations else 0.5

        # Check untrusted content from page DOM OR from user input
        dom_untrusted = page_state.untrusted_content_detected if page_state else False
        user_inj_detected, _ = InjectionDefense.inspect_text(raw_user_message)
        untrusted_flag = dom_untrusted or user_inj_detected or (intent_confidence <= 0.2 and "injection" in action.reasoning.lower())

        decision = ConfidenceScorer.evaluate(
            action=action,
            verification=verification,
            intent_confidence=intent_confidence,
            rag_score=top_rag_score,
            untrusted_flag=untrusted_flag,
            user_confirmed=user_confirmed
        )

        if self.tracer:
            self.tracer.log(
                agent_name="SafetyConfidenceAgent",
                agent_input={
                    "action": action.action_type,
                    "target_field": action.target_field_id,
                    "intent_conf": intent_confidence,
                    "untrusted_flag": untrusted_flag,
                    "user_confirmed": user_confirmed
                },
                agent_output=decision.model_dump(),
                confidence=decision.composite_confidence,
                risk=decision.risk_level,
                decision=decision.decision,
                notes=f"Safety routing decision: {decision.decision} (Confidence: {decision.composite_confidence}, Risk: {decision.risk_level})"
            )

        return decision
