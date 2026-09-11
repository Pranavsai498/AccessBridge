"""LangGraph state definition for AccessBridge."""

from typing import Any, Dict, List, Optional, TypedDict

from backend.models.schemas import (
    AccessibilityProfile,
    FormActionProposal,
    FormField,
    IntakeResult,
    RAGCitation,
    SafetyDecision,
    TraceEntry,
    VerificationResult,
    WebPageState,
)


class AccessBridgeGraphState(TypedDict, total=False):
    session_id: str
    user_message: str
    website_url: str
    conversation_history: List[Dict[str, str]]

    accessibility_profile: AccessibilityProfile
    page_state: WebPageState
    intake_result: IntakeResult
    active_field: Optional[FormField]

    rag_citations: List[RAGCitation]
    action_proposal: FormActionProposal
    verification_result: VerificationResult
    safety_decision: SafetyDecision

    action_result: Dict[str, Any]
    assistant_message: str
    explanation: str
    status: str
    user_confirmed: bool
    trace_entries: List[TraceEntry]
