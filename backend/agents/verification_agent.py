"""Deterministic validation layer for Gemini-proposed form actions."""

import re
from datetime import datetime
from typing import List

from backend.models.schemas import (
    FormActionProposal,
    VerificationResult,
    WebPageState,
)


class VerificationAgent:
    def __init__(self, tracer=None):
        self.tracer = tracer

    async def verify(
        self,
        action: FormActionProposal,
        page_state: WebPageState,
        user_message: str,
    ) -> VerificationResult:
        if action.action_type == "submit" or action.intent == "submit":
            return await self._verify_submission(action, page_state)

        if action.action_type == "clear" or action.intent == "reset":
            result = VerificationResult(
                field_match=1.0,
                semantic_match=action.confidence,
                format_valid=True,
                ambiguity=False,
                is_reversible=False,
                is_high_risk=True,
                notes="Reset action identified; explicit confirmation is required.",
            )
            self._log(action, result)
            return result

        if not action.field_updates:
            result = VerificationResult(
                field_match=0.0,
                semantic_match=0.0,
                format_valid=True,
                ambiguity=True,
                is_reversible=True,
                is_high_risk=action.is_high_risk,
                validation_errors=["No form field could be mapped confidently."],
                notes="No structured field update was produced.",
            )
            self._log(action, result)
            return result

        field_by_id = {field.field_id: field for field in page_state.fields}
        errors: List[str] = []
        verified_fields: List[str] = []
        field_scores: List[float] = []
        value_scores: List[float] = []
        ambiguity = action.is_ambiguous
        format_valid = True
        high_risk = action.is_high_risk

        for update in action.field_updates:
            field = field_by_id.get(update.field_id)
            if not field:
                field_scores.append(0.0)
                value_scores.append(0.0)
                format_valid = False
                errors.append(f"Field '{update.field_id}' does not exist on the live page.")
                continue

            verified_fields.append(field.field_id)
            field_scores.append(1.0)
            value_score = max(0.0, min(1.0, update.confidence or action.confidence))
            value_scores.append(value_score)
            ambiguity = ambiguity or update.is_ambiguous
            high_risk = high_risk or update.is_high_risk

            if field.type == "file":
                format_valid = False
                errors.append(
                    f"'{field.label}' is a file upload field and cannot be completed from a text answer."
                )
                continue

            if field.type == "email":
                value = str(update.value or "").strip()
                if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", value):
                    format_valid = False
                    errors.append(f"{field.label}: please provide a valid email address.")

            elif field.type == "number":
                try:
                    numeric = float(str(update.value).replace(",", "").replace("₹", "").replace("$", ""))
                    if numeric < 0:
                        raise ValueError
                except (TypeError, ValueError):
                    format_valid = False
                    errors.append(f"{field.label}: please provide a valid non-negative number.")

            elif field.type == "date":
                value = str(update.value or "").strip()
                valid = False
                try:
                    datetime.strptime(value, "%Y-%m-%d")
                    valid = True
                except ValueError:
                    try:
                        datetime.strptime(value, "%d/%m/%Y")
                        valid = True
                    except ValueError:
                        pass
                if not valid:
                    format_valid = False
                    errors.append(f"{field.label}: please provide a complete date (for example 2001-03-12).")

            elif field.type in {"select", "radio"}:
                allowed = {option.value for option in field.options}
                if allowed and str(update.value) not in allowed:
                    format_valid = False
                    errors.append(
                        f"{field.label}: selected value is not one of the available options."
                    )

            elif field.type == "checkbox":
                if not isinstance(update.value, bool):
                    format_valid = False
                    errors.append(f"{field.label}: checkbox value must be true or false.")

            if field.is_ambiguous:
                ambiguity = True

        # We intentionally keep the ambiguity guard independent of simple
        # substring checks; Gemini is the semantic interpreter.
        field_match = sum(field_scores) / len(field_scores) if field_scores else 0.0
        semantic_match = min(value_scores) if value_scores else 0.0

        result = VerificationResult(
            field_match=round(field_match, 3),
            semantic_match=round(semantic_match, 3),
            format_valid=format_valid,
            ambiguity=ambiguity,
            is_reversible=True,
            is_high_risk=high_risk,
            validation_errors=errors,
            verified_field_ids=verified_fields,
            notes=(
                f"Validated {len(verified_fields)} Gemini-proposed field update(s); "
                f"format_valid={format_valid}, ambiguity={ambiguity}."
            ),
        )
        self._log(action, result)
        return result

    async def _verify_submission(
        self,
        action: FormActionProposal,
        page_state: WebPageState,
    ) -> VerificationResult:
        def answered(field):
            if field.type == "checkbox":
                return str(field.current_value).lower() in {"true", "yes", "checked", "1"}
            if field.type == "radio":
                return str(field.current_value).lower() not in {"", "false", "none", "null"}
            return field.current_value not in {"", None}

        missing = [
            field.label
            for field in page_state.fields
            if field.visible and field.required and not answered(field)
        ]
        errors: List[str] = []
        if missing:
            errors.append("Required information is still missing: " + ", ".join(missing))

        result = VerificationResult(
            field_match=1.0,
            semantic_match=action.confidence,
            format_valid=not bool(errors),
            ambiguity=False,
            is_reversible=False,
            is_high_risk=True,
            validation_errors=errors,
            notes="Submission verified against the currently discovered required fields.",
        )
        self._log(action, result)
        return result

    def _log(self, action: FormActionProposal, result: VerificationResult) -> None:
        if not self.tracer:
            return
        self.tracer.log(
            agent_name="VerificationAgent",
            agent_input=action.model_dump(),
            agent_output=result.model_dump(),
            confidence=round((result.field_match + result.semantic_match) / 2, 3),
            notes=result.notes,
        )
