"""Web and form discovery agent for AccessBridge."""

from typing import Optional

from backend.agents.form_agent import FormInteractionAgent
from backend.llm.provider import LLMProvider
from backend.models.schemas import FormField, WebPageState
from backend.mcp.tools import browser_get_accessibility_tree, browser_get_page


class WebUnderstandingAgent:
    def __init__(self, tracer=None, llm_provider: Optional[LLMProvider] = None):
        self.tracer = tracer
        self.llm_provider = llm_provider or LLMProvider()

    async def inspect(self, url: Optional[str] = None) -> WebPageState:
        raw_page_data = await browser_get_page(url=url)
        page_state = WebPageState(**raw_page_data)

        # Pull the accessibility tree so the semantic model has already been
        # grounded in the browser's accessible representation.
        await browser_get_accessibility_tree()

        form_agent = FormInteractionAgent(llm_provider=self.llm_provider, tracer=self.tracer)
        page_state = await form_agent.understand_page_form(page_state)

        if self.tracer:
            next_field = self.get_active_or_next_field(page_state)
            self.tracer.log(
                agent_name="WebUnderstandingAgent",
                agent_input={"url": url or page_state.url},
                agent_output={
                    "title": page_state.title,
                    "field_count": len(page_state.fields),
                    "semantic_fields": [
                        {
                            "field_id": field.field_id,
                            "semantic_name": field.semantic_name,
                        }
                        for field in page_state.fields
                    ],
                    "next_unfilled_field": next_field.field_id if next_field else "all_filled",
                    "untrusted_detected": page_state.untrusted_content_detected,
                },
                tool_call="browser_get_page",
                notes=(
                    f"Discovered {len(page_state.fields)} controls and semantically "
                    f"classified the form with Gemini."
                ),
            )

        return page_state

    @staticmethod
    def get_active_or_next_field(page_state: WebPageState) -> Optional[FormField]:
        if page_state.current_focus:
            focused = next(
                (
                    field
                    for field in page_state.fields
                    if field.field_id == page_state.current_focus and field.visible
                ),
                None,
            )
            if focused and (focused.required and not focused.current_value):
                return focused

        for field in page_state.fields:
            if field.visible and field.required and not field.current_value:
                return field

        return next((field for field in page_state.fields if field.visible), None)
