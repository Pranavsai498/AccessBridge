"""Unit tests for AccessBridge agents with Gemini mocked at the provider boundary."""

import pytest

from backend.models.schemas import AccessibilityProfile, FormActionProposal, FormField, FormOption, IntakeResult
from backend.agents.form_agent import FormInteractionAgent
from backend.agents.intake_agent import IntakeAgent
from backend.agents.profile_agent import ProfileAgent
from backend.agents.verification_agent import VerificationAgent
from backend.browser.simulated_engine import SimulatedBrowserEngine


class FakeProvider:
    async def analyze_user_intent(self, user_message):
        if "either" in user_message.lower():
            return {
                "goal": "form_entry",
                "intent_confidence": 0.55,
                "accessibility_mode": "standard",
                "ambiguities": ["User asked the system to choose between alternatives."],
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
        return {
            "intent": "provide_multiple_answers",
            "field_updates": [
                {
                    "field_id": "full_name",
                    "value": "Yaswanth Reddy",
                    "action_type": "type",
                    "confidence": 0.99,
                    "reasoning": "The user identified their name.",
                    "is_ambiguous": False,
                    "is_high_risk": False,
                },
                {
                    "field_id": "email",
                    "value": "yaswanth@example.com",
                    "action_type": "type",
                    "confidence": 0.98,
                    "reasoning": "The user supplied an email address.",
                    "is_ambiguous": False,
                    "is_high_risk": False,
                },
            ],
            "action_type": "fill",
            "confidence": 0.98,
            "is_ambiguous": False,
            "needs_clarification": False,
            "is_high_risk": False,
            "reasoning": "The user provided two pieces of information.",
            "source": "gemini",
        }

    async def generate_next_question(self, field, remaining_fields, profile=None):
        return f"What is your {field.label.lower()}?"


@pytest.mark.asyncio
async def test_intake_agent_uses_gemini_provider():
    agent = IntakeAgent(llm_provider=FakeProvider())
    profile = AccessibilityProfile()

    result = await agent.process("My name is Yaswanth", profile)
    assert result.goal == "form_entry"
    assert result.intent_confidence > 0.8

    ambiguous = await agent.process("Choose either A or B", profile)
    assert ambiguous.intent_confidence < 0.7
    assert ambiguous.ambiguities


@pytest.mark.asyncio
async def test_profile_agent_adapts_preferences():
    agent = ProfileAgent()
    intake = IntakeResult(
        goal="form_entry",
        intent_confidence=0.9,
        accessibility_mode="voice",
        raw_intent="Please use voice",
    )
    adapted = await agent.adapt_profile(AccessibilityProfile(), intake)
    assert adapted.interaction == "voice"


@pytest.mark.asyncio
async def test_form_agent_can_extract_multiple_fields():
    agent = FormInteractionAgent(llm_provider=FakeProvider())
    page_state = await SimulatedBrowserEngine().get_page_state()

    proposal = await agent.propose_action(
        user_message="My name is Yaswanth and my email is yaswanth@example.com",
        page_state=page_state,
        profile=AccessibilityProfile(),
    )

    assert len(proposal.field_updates) == 2
    assert proposal.field_updates[0].field_id == "full_name"
    assert proposal.field_updates[1].field_id == "email"
    assert proposal.confidence >= 0.9


@pytest.mark.asyncio
async def test_verification_agent_blocks_invalid_email():
    agent = VerificationAgent()
    page_state = await SimulatedBrowserEngine().get_page_state()

    proposal = FormActionProposal(
        target_field_id="email",
        proposed_value="notanemail",
        action_type="type",
        field_updates=[
            {
                "field_id": "email",
                "value": "notanemail",
                "action_type": "type",
                "confidence": 0.95,
            }
        ],
    )
    result = await agent.verify(proposal, page_state, "notanemail")
    assert result.format_valid is False
    assert result.validation_errors
