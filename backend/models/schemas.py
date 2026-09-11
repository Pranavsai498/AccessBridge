"""
Pydantic schemas for AccessBridge.

These schemas are shared by the browser layer, Gemini semantic interpreter,
LangGraph workflow, FastAPI API, and frontend.  Gemini proposes meaning; the
backend validates and executes the resulting structured actions.
"""

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AccessibilityProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")

    profile_id: str = "default"
    name: str = "Standard Profile"
    visual: str = "standard"
    motor: str = "standard"
    cognitive: str = "standard"
    interaction: str = "text"
    font_scale: float = 1.0
    high_contrast: bool = False
    step_by_step: bool = True
    confirm_all_actions: bool = False
    confirm_before_submit: bool = True
    one_field_at_a_time: bool = True

    @field_validator("visual", mode="before")
    @classmethod
    def normalize_visual(cls, v: Any) -> str:
        value = str(v).lower() if v else "standard"
        return "standard" if value in {"normal", "default"} else value

    @field_validator("motor", mode="before")
    @classmethod
    def normalize_motor(cls, v: Any) -> str:
        value = str(v).lower() if v else "standard"
        aliases = {
            "limited_dexterity": "limited_mouse_control",
            "dexterity": "limited_mouse_control",
            "hands_free": "tremor_assistance",
            "tremor": "tremor_assistance",
        }
        return aliases.get(value, value)

    @field_validator("cognitive", mode="before")
    @classmethod
    def normalize_cognitive(cls, v: Any) -> str:
        value = str(v).lower() if v else "standard"
        return "simplified_language" if value in {"conversational", "plain"} else value

    @field_validator("interaction", mode="before")
    @classmethod
    def normalize_interaction(cls, v: Any) -> str:
        value = str(v).lower() if v else "text"
        if value in {"text_and_voice", "both", "speech_and_text"}:
            return "multimodal"
        if value in {"keyboard", "keys"}:
            return "text"
        return value


class FormOption(BaseModel):
    value: str
    label: str
    selected: bool = False


class FormField(BaseModel):
    field_id: str
    name: str = ""
    label: str = ""
    semantic_name: str = ""
    semantic_description: str = ""

    type: Literal[
        "text",
        "email",
        "number",
        "date",
        "select",
        "radio",
        "checkbox",
        "textarea",
        "file",
        "password",
        "tel",
        "url",
    ] = "text"

    required: bool = False
    current_value: Any = ""
    placeholder: str = ""
    autocomplete: str = ""
    aria_label: str = ""
    aria_describedby: str = ""
    fieldset_label: str = ""

    options: List[FormOption] = Field(default_factory=list)

    accessible_name: str = ""
    help_text: str = ""
    validation_error: Optional[str] = None
    is_focused: bool = False
    aria_required: bool = False
    is_ambiguous: bool = False
    visible: bool = True


class WebPageState(BaseModel):
    url: str = ""
    title: str = ""
    form_name: str = ""
    form_description: str = ""

    fields: List[FormField] = Field(default_factory=list)
    buttons: List[Dict[str, Any]] = Field(default_factory=list)
    headings: List[str] = Field(default_factory=list)

    current_focus: Optional[str] = None
    form_accessible_summary: str = ""

    untrusted_content_detected: bool = False
    untrusted_snippets: List[str] = Field(default_factory=list)
    is_form_valid: bool = False


class IntakeResult(BaseModel):
    goal: Literal[
        "form_entry",
        "form_submission",
        "form_reset",
        "information_request",
        "website_navigation",
        "unknown",
    ] = "form_entry"
    intent_confidence: float = 1.0
    accessibility_mode: str = "standard"
    ambiguities: List[str] = Field(default_factory=list)
    urgency: Literal["low", "normal", "high"] = "normal"
    raw_intent: str = ""


class RAGCitation(BaseModel):
    rule_id: str = ""
    source: str = ""
    section: str = ""
    text: str = ""
    retrieval_score: float = 0.0


class FieldUpdate(BaseModel):
    field_id: str
    value: Any = None
    action_type: Literal["type", "click", "select", "clear", "focus"] = "type"
    confidence: float = 0.0
    reasoning: str = ""
    is_ambiguous: bool = False
    is_high_risk: bool = False


class FormActionProposal(BaseModel):
    intent: str = "answer_question"
    target_field_id: str = ""
    proposed_value: Any = ""
    raw_value: str = ""
    confidence: float = 0.0
    reasoning: str = ""

    action_type: Literal[
        "type",
        "click",
        "select",
        "submit",
        "focus",
        "clear",
        "cancel",
    ] = "type"

    field_updates: List[FieldUpdate] = Field(default_factory=list)
    is_ambiguous: bool = False
    needs_clarification: bool = False
    requires_confirmation: bool = False
    is_high_risk: bool = False
    source: str = "gemini"


class VerificationResult(BaseModel):
    field_match: float = 0.0
    semantic_match: float = 0.0
    format_valid: bool = True
    ambiguity: bool = False
    is_reversible: bool = True
    is_high_risk: bool = False
    validation_errors: List[str] = Field(default_factory=list)
    verified_field_ids: List[str] = Field(default_factory=list)
    notes: str = ""


class SafetyDecision(BaseModel):
    composite_confidence: float = 0.0
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "LOW"
    decision: Literal[
        "EXECUTE",
        "ASK_CLARIFICATION",
        "REQUIRE_CONFIRMATION",
        "BLOCK",
        "ESCALATE",
    ] = "EXECUTE"
    reason: str = ""
    blocking_factors: List[str] = Field(default_factory=list)
    confidence_breakdown: Dict[str, float] = Field(default_factory=dict)


class TraceEntry(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    agent_name: str
    agent_input: Optional[Dict[str, Any]] = None
    agent_output: Optional[Dict[str, Any]] = None
    tool_call: Optional[str] = None
    tool_args: Optional[Dict[str, Any]] = None
    tool_result: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = None
    risk: Optional[str] = None
    decision: Optional[str] = None
    notes: Optional[str] = None


class UserInteractionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    session_id: str
    message: str
    accessibility_profile: Optional[AccessibilityProfile] = None
    engine: str = "playwright"
    confirmed: Optional[bool] = None

    @field_validator("engine", mode="before")
    @classmethod
    def normalize_engine(cls, v: Any) -> str:
        value = str(v).lower() if v else "playwright"
        return value if value in {"playwright", "simulated"} else "playwright"


class UserInteractionResponse(BaseModel):
    session_id: str
    assistant_message: str
    explanation: Optional[str] = None
    status: Literal[
        "idle",
        "action_completed",
        "need_clarification",
        "need_confirmation",
        "blocked",
        "submitted",
        "error",
    ]
    active_field: Optional[FormField] = None
    page_state: Optional[WebPageState] = None
    safety_decision: Optional[SafetyDecision] = None
    citations: List[RAGCitation] = Field(default_factory=list)
    trace_summary: List[TraceEntry] = Field(default_factory=list)
    confirmation_payload: Optional[Dict[str, Any]] = None
    field_updates: List[FieldUpdate] = Field(default_factory=list)
    progress: Optional[Dict[str, Any]] = None
