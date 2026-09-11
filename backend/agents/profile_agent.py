"""
Accessibility Profile Agent for AccessBridge
Adapts the interaction environment to user preferences (visual, motor, cognitive, interaction).
Represents interaction preferences, not medical diagnoses.
"""

from typing import Dict, Any, Optional
from backend.models.schemas import AccessibilityProfile, IntakeResult

class ProfileAgent:
    def __init__(self, tracer=None):
        self.tracer = tracer

    async def adapt_profile(
        self,
        current_profile: AccessibilityProfile,
        intake_result: IntakeResult
    ) -> AccessibilityProfile:
        adapted = current_profile.model_copy()

        # Adapt dynamically if user specifically asked for simplicity or voice
        if any(w in intake_result.raw_intent.lower() for w in ["simple", "plain", "easy"]) or intake_result.accessibility_mode == "cognitive_simplified":
            adapted.cognitive = "simplified_language"
            adapted.step_by_step = True

        if intake_result.accessibility_mode == "voice":
            adapted.interaction = "voice"

        if intake_result.accessibility_mode == "screen_reader":
            adapted.visual = "screen_reader"
            adapted.interaction = "screen_reader_oriented"

        if self.tracer:
            self.tracer.log(
                agent_name="AccessibilityProfileAgent",
                agent_input={"current": current_profile.model_dump(), "intake_mode": intake_result.accessibility_mode},
                agent_output=adapted.model_dump(),
                notes=f"Active Profile: {adapted.name} (Cognitive: {adapted.cognitive}, Visual: {adapted.visual})"
            )

        return adapted

    @staticmethod
    def get_preset_profiles() -> Dict[str, AccessibilityProfile]:
        return {
            "cognitive_motor": AccessibilityProfile(
                profile_id="cognitive_motor",
                name="Cognitive + Motor Assistance",
                visual="standard",
                motor="limited_mouse_control",
                cognitive="simplified_language",
                interaction="voice",
                font_scale=1.1,
                high_contrast=False,
                step_by_step=True,
                confirm_all_actions=False
            ),
            "low_vision": AccessibilityProfile(
                profile_id="low_vision",
                name="Low Vision & High Contrast",
                visual="high_contrast",
                motor="standard",
                cognitive="standard",
                interaction="text",
                font_scale=1.3,
                high_contrast=True,
                step_by_step=True,
                confirm_all_actions=False
            ),
            "screen_reader": AccessibilityProfile(
                profile_id="screen_reader",
                name="Screen Reader Oriented",
                visual="screen_reader",
                motor="keyboard_only",
                cognitive="standard",
                interaction="screen_reader_oriented",
                font_scale=1.0,
                high_contrast=False,
                step_by_step=True,
                confirm_all_actions=False
            )
        }
