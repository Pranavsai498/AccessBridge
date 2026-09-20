"""Gemini-backed high-level intent analysis for AccessBridge."""

from typing import Any, Optional

from backend.llm.provider import LLMProvider
from backend.models.schemas import AccessibilityProfile, IntakeResult


class IntakeAgent:
    def __init__(self, llm_provider: Optional[LLMProvider] = None, tracer=None):
        self.llm_provider = llm_provider or LLMProvider()
        self.tracer = tracer

    async def process(
        self,
        user_message: str,
        current_profile: AccessibilityProfile,
    ) -> IntakeResult:
        result = await self.llm_provider.analyze_user_intent(user_message)
        intake = IntakeResult(
            goal=result.get("goal", "unknown"),
            intent_confidence=max(
                0.0, min(1.0, float(result.get("intent_confidence", 0.0)))
            ),
            accessibility_mode=result.get(
                "accessibility_mode", current_profile.interaction
            ),
            ambiguities=result.get("ambiguities", []),
            urgency=result.get("urgency", "normal"),
            raw_intent=user_message,
        )

        if self.tracer:
            self.tracer.log(
                agent_name="IntakeAgent",
                agent_input={"user_message": user_message},
                agent_output={
                    **intake.model_dump(),
                    "source": result.get("source", "gemini"),
                },
                confidence=intake.intent_confidence,
                notes=f"Intent source={result.get('source', 'gemini')}; goal={intake.goal}",
            )

        return intake
