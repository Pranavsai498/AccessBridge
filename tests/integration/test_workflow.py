"""Integration tests for the LangGraph workflow with Gemini mocked."""

import pytest

from backend.agents.form_agent import FormInteractionAgent
from backend.browser.simulated_engine import SimulatedBrowserEngine
from backend.graph.workflow import build_accessbridge_graph
from backend.models.schemas import AccessibilityProfile
from backend.observability.tracer import Tracer
from backend.mcp.tools import set_active_browser_engine


class FakeProvider:
    async def analyze_user_intent(self, message):
        lower = message.lower()
        if "submit" in lower:
            return {
                "goal": "form_submission",
                "intent_confidence": 0.99,
                "accessibility_mode": "standard",
                "ambiguities": [],
                "urgency": "normal",
                "source": "gemini",
            }
        if "either" in lower:
            return {
                "goal": "form_entry",
                "intent_confidence": 0.55,
                "accessibility_mode": "standard",
                "ambiguities": ["Ambiguous choice."],
                "urgency": "normal",
                "source": "gemini",
            }
        return {
            "goal": "form_entry",
            "intent_confidence": 0.98,
            "accessibility_mode": "standard",
            "ambiguities": [],
            "urgency": "normal",
            "source": "gemini",
        }

    async def understand_form(self, fields):
        return [
            {
                "field_id": f.field_id,
                "semantic_name": f.field_id,
                "semantic_description": f.label,
            }
            for f in fields
        ]

    async def map_user_answer_to_fields(self, user_message, fields, current_field_id=None, conversation_history=None):
        lower = user_message.lower()
        if "submit" in lower:
            return {
                "intent": "submit",
                "field_updates": [],
                "action_type": "submit",
                "confidence": 0.99,
                "is_ambiguous": False,
                "needs_clarification": False,
                "is_high_risk": True,
                "reasoning": "Explicit submission request.",
                "source": "gemini",
            }
        if "either" in lower:
            return {
                "intent": "clarify",
                "field_updates": [],
                "action_type": "unknown",
                "confidence": 0.55,
                "is_ambiguous": True,
                "needs_clarification": True,
                "is_high_risk": False,
                "reasoning": "Ambiguous choice.",
                "source": "gemini",
            }
        return {
            "intent": "answer_question",
            "field_updates": [
                {
                    "field_id": current_field_id or "full_name",
                    "value": "John Doe",
                    "action_type": "type",
                    "confidence": 0.99,
                    "reasoning": "Name answer.",
                    "is_ambiguous": False,
                    "is_high_risk": False,
                }
            ],
            "action_type": "fill",
            "confidence": 0.99,
            "is_ambiguous": False,
            "needs_clarification": False,
            "is_high_risk": False,
            "reasoning": "Name answer.",
            "source": "gemini",
        }

    async def generate_next_question(self, field, remaining_fields, profile=None):
        return f"What is your {field.label.lower()}?"


@pytest.fixture(autouse=True)
def setup(monkeypatch):
    set_active_browser_engine(SimulatedBrowserEngine())
    monkeypatch.setattr("backend.graph.nodes.LLMProvider", FakeProvider)
    monkeypatch.setattr("backend.agents.web_agent.LLMProvider", FakeProvider)
    monkeypatch.setattr("backend.agents.form_agent.LLMProvider", FakeProvider)
    monkeypatch.setattr("backend.agents.intake_agent.LLMProvider", FakeProvider)


@pytest.mark.asyncio
async def test_full_workflow_happy_path_step():
    tracer = Tracer(session_id="test_session_1")
    graph = build_accessbridge_graph(tracer=tracer)
    state = await graph.ainvoke({
        "session_id": "test_session_1",
        "user_message": "My name is John Doe",
        "accessibility_profile": AccessibilityProfile(),
        "user_confirmed": False,
    })
    assert state["status"] == "action_completed"
    assert state["page_state"].fields[0].current_value == "John Doe"
    assert state["safety_decision"].decision == "EXECUTE"


@pytest.mark.asyncio
async def test_workflow_clarifies_ambiguous_input():
    tracer = Tracer(session_id="test_session_2")
    graph = build_accessbridge_graph(tracer=tracer)
    state = await graph.ainvoke({
        "session_id": "test_session_2",
        "user_message": "Choose either tech or community, you decide",
        "accessibility_profile": AccessibilityProfile(),
        "user_confirmed": False,
    })
    assert state["status"] == "need_clarification"
    assert state["safety_decision"].decision == "ASK_CLARIFICATION"


@pytest.mark.asyncio
async def test_submission_requires_confirmation():
    tracer = Tracer(session_id="test_session_3")
    graph = build_accessbridge_graph(tracer=tracer)
    state = await graph.ainvoke({
        "session_id": "test_session_3",
        "user_message": "Submit my application now",
        "accessibility_profile": AccessibilityProfile(),
        "user_confirmed": False,
    })
    assert state["status"] == "need_confirmation"
    assert state["safety_decision"].decision == "REQUIRE_CONFIRMATION"
