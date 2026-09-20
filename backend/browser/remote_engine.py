"""
Remote DOM Browser Engine for AccessBridge.

The browser extension inspects the page the user is actually looking at and
sends a snapshot of its form controls to the backend.  This engine exposes that
snapshot through the standard `BaseBrowserEngine` interface so the *entire*
multi-agent pipeline (understanding -> RAG -> proposal -> verification ->
safety gate) works unchanged, while every action is *recorded* instead of being
performed server-side.  The recorded actions are returned to the extension,
which applies them in the user's own tab.

This keeps the safety model intact: the server never drives the user's browser
directly, and untrusted page text is passed through the same injection defense
used for the Playwright and simulated engines.
"""

from typing import Any, Dict, List, Optional

from backend.browser.engine_base import BaseBrowserEngine
from backend.models.schemas import FormField, FormOption, WebPageState
from backend.safety.injection_defense import InjectionDefense

MAX_FIELDS = 120
MAX_TEXT = 400


def _clip(value: Any, limit: int = MAX_TEXT) -> str:
    text = "" if value is None else str(value)
    return text[:limit]


def _coerce_field(raw: Dict[str, Any]) -> Optional[FormField]:
    field_id = _clip(raw.get("field_id") or raw.get("id") or raw.get("name"), 200).strip()
    if not field_id:
        return None

    options: List[FormOption] = []
    for option in (raw.get("options") or [])[:60]:
        if isinstance(option, dict):
            value = _clip(option.get("value", ""), 200)
            label = _clip(option.get("label", value), 200)
        else:
            value = label = _clip(option, 200)
        if value == "" and label == "":
            continue
        options.append(FormOption(value=value, label=label, selected=bool(
            option.get("selected") if isinstance(option, dict) else False
        )))

    field_type = _clip(raw.get("type") or "text", 30).lower() or "text"

    return FormField(
        field_id=field_id,
        name=_clip(raw.get("name") or field_id, 200),
        label=_clip(raw.get("label") or raw.get("accessible_name") or field_id),
        type=field_type,
        required=bool(raw.get("required", False)),
        current_value=_clip(raw.get("current_value", "")),
        options=options,
        accessible_name=_clip(raw.get("accessible_name") or raw.get("label") or field_id),
        help_text=_clip(raw.get("help_text", "")),
        validation_error=_clip(raw.get("validation_error", "")) or None,
    )


class RemoteDOMEngine(BaseBrowserEngine):
    """A read-only mirror of a page owned by the user's own browser."""

    def __init__(
        self,
        url: str = "",
        title: str = "",
        fields: Optional[List[Dict[str, Any]]] = None,
        headings: Optional[List[str]] = None,
        current_focus: Optional[str] = None,
    ) -> None:
        self.url = _clip(url, 2000)
        self.title = _clip(title)
        self.headings = [_clip(h, 200) for h in (headings or [])[:20]]
        self.current_focus = _clip(current_focus, 200) or None
        self.fields: Dict[str, FormField] = {}
        self.submitted = False
        self.pending_actions: List[Dict[str, Any]] = []

        for raw in (fields or [])[:MAX_FIELDS]:
            if not isinstance(raw, dict):
                continue
            field = _coerce_field(raw)
            if field:
                self.fields[field.field_id] = field

        if self.current_focus not in self.fields:
            self.current_focus = next(iter(self.fields), None)

    # ---------------------------------------------------------------- state

    def _validate_all_fields(self) -> bool:
        for field in self.fields.values():
            if field.required and not field.current_value:
                return False
            if field.validation_error:
                return False
        return True

    def missing_required(self) -> List[str]:
        return [
            field.label or field.field_id
            for field in self.fields.values()
            if field.required and not field.current_value
        ]

    async def get_page_state(self) -> WebPageState:
        fields_list = list(self.fields.values())

        untrusted_snippets: List[str] = []
        has_injection = False
        for field in fields_list:
            for text, source in ((field.help_text, field.field_id), (field.label, field.field_id)):
                if not text:
                    continue
                is_malicious, matches = InjectionDefense.inspect_text(text, source=source)
                if is_malicious:
                    has_injection = True
                    untrusted_snippets.extend(matches)

        return WebPageState(
            url=self.url,
            title=self.title,
            fields=fields_list,
            buttons=[{"id": "submit_btn", "label": "Submit", "type": "submit"}],
            headings=self.headings,
            current_focus=self.current_focus,
            form_accessible_summary=(
                f"Live page '{self.title or self.url}' with {len(fields_list)} interactive form fields."
            ),
            untrusted_content_detected=has_injection,
            untrusted_snippets=untrusted_snippets[:10],
            is_form_valid=self._validate_all_fields(),
        )

    async def navigate(self, url: str) -> WebPageState:
        # The extension owns navigation; record the request for the client.
        self.pending_actions.append({"action": "navigate", "url": _clip(url, 2000)})
        return await self.get_page_state()

    async def get_accessibility_tree(self) -> Dict[str, Any]:
        return {
            "role": "WebArea",
            "name": self.title,
            "url": self.url,
            "children": [
                {
                    "role": field.type,
                    "name": field.accessible_name,
                    "value": str(field.current_value),
                    "required": field.required,
                    "focused": field.field_id == self.current_focus,
                }
                for field in self.fields.values()
            ],
        }

    # -------------------------------------------------------------- actions

    async def type_text(self, target_id: str, text: str) -> bool:
        field = self.fields.get(target_id)
        if not field:
            return False
        field.current_value = _clip(text)
        field.validation_error = None
        if field.type == "email" and ("@" not in str(text) or "." not in str(text)):
            field.validation_error = "Please enter a valid email address (e.g. user@example.com)"
        self.current_focus = target_id
        self.pending_actions.append({"action": "type", "field_id": target_id, "value": field.current_value})
        return True

    async def click_element(self, target_id: str) -> bool:
        field = self.fields.get(target_id)
        if field:
            self.current_focus = target_id
            if field.type == "checkbox":
                field.current_value = "yes" if field.current_value != "yes" else "no"
            self.pending_actions.append(
                {"action": "click", "field_id": target_id, "value": field.current_value}
            )
            return True
        if target_id == "submit_btn":
            return (await self.submit_form()).get("success", False)
        return False

    async def select_option(self, target_id: str, value: str) -> bool:
        field = self.fields.get(target_id)
        if not field:
            return False
        field.current_value = _clip(value, 200)
        for option in field.options:
            option.selected = option.value == value
        field.validation_error = None
        self.current_focus = target_id
        self.pending_actions.append({"action": "select", "field_id": target_id, "value": field.current_value})
        return True

    async def get_value(self, target_id: str) -> Any:
        field = self.fields.get(target_id)
        return field.current_value if field else None

    async def focus_element(self, target_id: str) -> bool:
        if target_id not in self.fields:
            return False
        self.current_focus = target_id
        self.pending_actions.append({"action": "focus", "field_id": target_id})
        return True

    async def submit_form(self) -> Dict[str, Any]:
        errors = {
            field.field_id: f"{field.label} is required."
            for field in self.fields.values()
            if field.required and not field.current_value
        }
        for field in self.fields.values():
            if field.validation_error:
                errors[field.field_id] = field.validation_error

        if errors:
            return {
                "success": False,
                "status": "VALIDATION_FAILED",
                "errors": errors,
                "message": "Form submission failed due to validation errors.",
            }

        self.submitted = True
        self.pending_actions.append({"action": "submit"})
        return {
            "success": True,
            "status": "SUBMIT_REQUESTED",
            "message": "Submission approved. The extension will press submit in your browser tab.",
        }

    async def get_screenshot_base64(self) -> Optional[str]:
        return None

    def drain_actions(self) -> List[Dict[str, Any]]:
        actions, self.pending_actions = self.pending_actions, []
        return actions
