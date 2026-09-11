"""
Form interaction agent.

Gemini performs semantic interpretation and may produce multiple field updates
from one user message.  This agent converts that interpretation into a single
validated application proposal.  It never executes browser actions.
"""

from typing import Any, Dict, List, Optional

from backend.llm.provider import LLMProvider
from backend.models.schemas import (
    AccessibilityProfile,
    FormActionProposal,
    FormField,
    FieldUpdate,
    WebPageState,
)


class FormInteractionAgent:
    def __init__(self, llm_provider: Optional[LLMProvider] = None, tracer=None):
        self.llm_provider = llm_provider or LLMProvider()
        self.tracer = tracer

    async def understand_page_form(
        self,
        page_state: WebPageState,
    ) -> WebPageState:
        """Ask Gemini to semantically understand the discovered form."""
        annotations = await self.llm_provider.understand_form(page_state.fields)
        annotation_map = {item["field_id"]: item for item in annotations}

        updated_fields: List[FormField] = []
        for field in page_state.fields:
            annotation = annotation_map.get(field.field_id, {})
            updated_fields.append(
                field.model_copy(
                    update={
                        "semantic_name": annotation.get(
                            "semantic_name", field.semantic_name
                        ),
                        "semantic_description": annotation.get(
                            "semantic_description", field.semantic_description
                        ),
                    }
                )
            )

        return page_state.model_copy(update={"fields": updated_fields})

    async def propose_action(
        self,
        user_message: str,
        page_state: WebPageState,
        profile: AccessibilityProfile,
        active_field: Optional[FormField] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> FormActionProposal:
        mapping = await self.llm_provider.map_user_answer_to_fields(
            user_message=user_message,
            fields=page_state.fields,
            current_field_id=active_field.field_id if active_field else None,
            conversation_history=conversation_history,
        )

        raw_updates = mapping.get("field_updates", [])
        updates: List[FieldUpdate] = []
        field_by_id = {field.field_id: field for field in page_state.fields}

        for raw in raw_updates:
            if not isinstance(raw, dict):
                continue
            field_id = str(raw.get("field_id", ""))
            field = field_by_id.get(field_id)
            if not field:
                continue

            try:
                confidence = float(raw.get("confidence", mapping.get("confidence", 0.0)))
            except (TypeError, ValueError):
                confidence = 0.0
            confidence = max(0.0, min(1.0, confidence))

            updates.append(
                FieldUpdate(
                    field_id=field_id,
                    value=raw.get("value"),
                    action_type=raw.get("action_type", "type"),
                    confidence=confidence,
                    reasoning=str(
                        raw.get(
                            "reasoning",
                            "Gemini interpreted the user's answer.",
                        )
                    ),
                    is_ambiguous=bool(raw.get("is_ambiguous", False)),
                    is_high_risk=bool(raw.get("is_high_risk", False)),
                )
            )

        top_update = updates[0] if updates else None
        target_fid = top_update.field_id if top_update else ""
        proposed_val = top_update.value if top_update else ""
        act_type = top_update.action_type if top_update else mapping.get("action_type", "type")

        # Normal field filling is never made high-risk merely because an
        # accessibility profile exists.  Only genuinely high-impact actions
        # (submission/reset) or an explicitly dangerous model proposal are.
        is_submission = mapping.get("intent") == "submit" or mapping.get("action_type") == "submit"
        is_reset = mapping.get("intent") == "reset" or mapping.get("action_type") == "clear"
        is_high_risk = bool(mapping.get("is_high_risk", False)) or is_submission or is_reset

        # Preserve explicit user-controlled confirmation policy for abnormal
        # actions, but don't turn ordinary type/select/click actions into
        # confirmation gates.
        if profile.confirm_all_actions and act_type not in {"type", "select", "click", "focus"}:
            is_high_risk = True

        confidence_values = [u.confidence for u in updates]
        overall_confidence = min(confidence_values, default=0.0)
        model_confidence = self._clamp(mapping.get("confidence", overall_confidence))
        if updates:
            overall_confidence = min(overall_confidence or model_confidence, model_confidence)
        else:
            overall_confidence = model_confidence

        needs_clarification = bool(mapping.get("needs_clarification", False)) or bool(
            mapping.get("is_ambiguous", False)
        ) or any(u.is_ambiguous for u in updates)

        # If Gemini failed to map anything while a field is active, allow the
        # backend to ask for clarification rather than silently stuffing raw
        # conversational text into a field.
        if not updates and not is_submission and not is_reset:
            needs_clarification = True

        proposal = FormActionProposal(
            intent=str(mapping.get("intent", "unknown")),
            target_field_id=target_fid,
            proposed_value=proposed_val,
            raw_value=user_message,
            confidence=overall_confidence,
            reasoning=str(
                mapping.get(
                    "reasoning",
                    "Gemini interpreted the user's answer.",
                )
            ),
            action_type=act_type if act_type in {
                "type", "click", "select", "submit", "focus", "clear", "cancel"
            } else "type",
            field_updates=updates,
            is_ambiguous=needs_clarification,
            needs_clarification=needs_clarification,
            requires_confirmation=is_high_risk,
            is_high_risk=is_high_risk,
            source=str(mapping.get("source", "gemini")),
        )

        if self.tracer:
            self.tracer.log(
                agent_name="FormInteractionAgent",
                agent_input={
                    "user_message": user_message,
                    "active_field": active_field.field_id if active_field else None,
                    "history_messages": len(conversation_history or []),
                },
                agent_output=proposal.model_dump(),
                confidence=overall_confidence,
                risk="HIGH" if is_high_risk else "LOW",
                notes=(
                    f"Source={proposal.source}; updates={len(updates)}; "
                    f"intent={proposal.intent}; clarification={needs_clarification}"
                ),
            )

        return proposal

    async def next_question(
        self,
        page_state: WebPageState,
        profile: AccessibilityProfile,
    ) -> Optional[str]:
        def answered(field: FormField) -> bool:
            if field.type == "checkbox":
                return str(field.current_value).lower() in {"true", "yes", "checked", "1"}
            if field.type == "radio":
                return str(field.current_value).lower() not in {"", "false", "none", "null"}
            return field.current_value not in {"", None}

        missing = [
            field
            for field in page_state.fields
            if field.visible and field.required and not answered(field)
        ]
        if not missing:
            return None

        next_field = self._preferred_next_field(page_state)
        remaining = [f for f in missing if f.field_id != next_field.field_id]
        return await self.llm_provider.generate_next_question(
            field=next_field,
            remaining_fields=remaining,
            profile=profile.model_dump(),
        )

    @staticmethod
    def _preferred_next_field(page_state: WebPageState) -> FormField:
        if page_state.current_focus:
            focused = next(
                (
                    field
                    for field in page_state.fields
                    if field.field_id == page_state.current_focus
                    and field.visible
                    and field.required
                    and not (
                        (field.type == "checkbox" and str(field.current_value).lower() in {"true", "yes", "checked", "1"})
                        or (field.type == "radio" and str(field.current_value).lower() not in {"", "false", "none", "null"})
                        or (field.type not in {"checkbox", "radio"} and field.current_value not in {"", None})
                    )
                ),
                None,
            )
            if focused:
                return focused

        return next(
            field
            for field in page_state.fields
            if field.visible and field.required and not (
                (field.type == "checkbox" and str(field.current_value).lower() in {"true", "yes", "checked", "1"})
                or (field.type == "radio" and str(field.current_value).lower() not in {"", "false", "none", "null"})
                or (field.type not in {"checkbox", "radio"} and field.current_value not in {"", None})
            )
        )

    @staticmethod
    def _clamp(value: Any) -> float:
        try:
            return max(0.0, min(1.0, float(value)))
        except (TypeError, ValueError):
            return 0.0
