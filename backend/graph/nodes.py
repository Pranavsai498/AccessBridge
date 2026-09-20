"""LangGraph nodes for the AccessBridge conversational form-filling workflow."""

from typing import Any, Dict

from backend.agents.form_agent import FormInteractionAgent
from backend.agents.intake_agent import IntakeAgent
from backend.agents.profile_agent import ProfileAgent
from backend.agents.rag_agent import RAGAgent
from backend.agents.safety_agent import SafetyAgent
from backend.agents.verification_agent import VerificationAgent
from backend.agents.web_agent import WebUnderstandingAgent
from backend.graph.state import AccessBridgeGraphState
from backend.llm.provider import LLMProvider
from backend.mcp.tools import (
    browser_click,
    browser_focus_element,
    browser_get_value,
    browser_select,
    browser_type,
    browser_validate_form,
)
from backend.observability.tracer import Tracer


async def intake_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    provider = LLMProvider()
    agent = IntakeAgent(llm_provider=provider, tracer=tracer)
    result = await agent.process(
        user_message=state.get("user_message", ""),
        current_profile=state.get("accessibility_profile"),
    )
    return {"intake_result": result}


async def profile_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    agent = ProfileAgent(tracer=tracer)
    result = await agent.adapt_profile(
        current_profile=state.get("accessibility_profile"),
        intake_result=state.get("intake_result"),
    )
    return {"accessibility_profile": result}


async def web_understanding_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    provider = LLMProvider()
    agent = WebUnderstandingAgent(llm_provider=provider, tracer=tracer)
    page_state = await agent.inspect()
    return {
        "page_state": page_state,
        "active_field": agent.get_active_or_next_field(page_state),
    }


async def rag_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    agent = RAGAgent(tracer=tracer)
    citations = await agent.retrieve_guidance(
        target_field=state.get("active_field"),
        profile=state.get("accessibility_profile"),
        user_intent=state.get("user_message", ""),
    )
    return {"rag_citations": citations}


async def form_interaction_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    provider = LLMProvider()
    agent = FormInteractionAgent(llm_provider=provider, tracer=tracer)
    page_state = state.get("page_state")
    profile = state.get("accessibility_profile")

    proposal = await agent.propose_action(
        user_message=state.get("user_message", ""),
        page_state=page_state,
        profile=profile,
        active_field=state.get("active_field"),
        conversation_history=state.get("conversation_history", []),
    )
    return {"action_proposal": proposal}


async def verification_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    agent = VerificationAgent(tracer=tracer)
    result = await agent.verify(
        action=state.get("action_proposal"),
        page_state=state.get("page_state"),
        user_message=state.get("user_message", ""),
    )
    return {"verification_result": result}


async def safety_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    agent = SafetyAgent(tracer=tracer)
    result = await agent.evaluate_safety(
        action=state.get("action_proposal"),
        verification=state.get("verification_result"),
        intent_confidence=state.get("intake_result").intent_confidence,
        rag_citations=state.get("rag_citations", []),
        page_state=state.get("page_state"),
        user_confirmed=state.get("user_confirmed", False),
        raw_user_message=state.get("user_message", ""),
    )
    return {"safety_decision": result}


async def execution_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    action = state.get("action_proposal")
    updates = list(action.field_updates)

    # Submission and reset are represented separately and are never included
    # in normal field_updates.
    if action.intent == "submit" or action.action_type == "submit":
        result = await browser_validate_form()
        if not result.get("is_valid"):
            return {
                "action_result": {"success": False, "validation": result},
                "status": "need_clarification",
                "assistant_message": (
                    "The form is not ready to submit yet. "
                    "Please complete the remaining required information."
                ),
                "explanation": "; ".join(result.get("missing_required", [])),
            }

        clicked = await browser_click("submit_btn")
        if not clicked:
            return {
                "action_result": {"success": False, "status": "SUBMIT_FAILED"},
                "status": "error",
                "assistant_message": "I could not submit the form successfully. Please try again.",
                "explanation": "The live browser rejected the final submission action.",
            }

        tracer.log(
            agent_name="ExecutionNode",
            tool_call="browser_click",
            tool_args={"target_id": "submit_btn"},
            tool_result={"success": True},
            notes="Final submission executed after explicit user confirmation.",
        )
        return {
            "action_result": {"status": "SUBMITTED", "success": True},
            "status": "submitted",
            "assistant_message": "Your application has been submitted successfully.",
            "explanation": "The form passed validation and was submitted after your explicit approval.",
        }

    if action.intent == "update_preferences" or action.action_type == "preference":
        profile = state.get("accessibility_profile")
        prefs = action.preferences or {}
        updated = profile.model_copy(
            update={
                "interaction": prefs.get("accessibility_mode", profile.interaction)
                if prefs.get("accessibility_mode", "standard") != "standard"
                else profile.interaction,
                "cognitive": "simplified_language" if prefs.get("simplified_language") else profile.cognitive,
                "high_contrast": True if prefs.get("high_contrast") else profile.high_contrast,
                "font_scale": max(profile.font_scale, 1.25) if prefs.get("high_contrast") else profile.font_scale,
            }
        )
        tracer.log(
            agent_name="ExecutionNode",
            agent_input={"preferences": prefs},
            agent_output=updated.model_dump(),
            notes="Applied an accessibility preference change requested by the user.",
        )
        return {
            "accessibility_profile": updated,
            "action_result": {"success": True, "preferences": prefs},
            "status": "action_completed",
            "assistant_message": "I updated how I interact with you. Tell me whenever you want it changed again.",
            "explanation": "Accessibility preferences were updated; no form field was modified.",
        }

    if action.intent == "reset" or action.action_type == "clear":
        return {
            "action_result": {"success": False, "status": "RESET_REQUIRES_DIRECT_UI"},
            "status": "need_confirmation",
            "assistant_message": "Please confirm that you want to clear all entered information.",
            "explanation": "Resetting the entire form removes previously entered information.",
        }

    if not updates:
        return {
            "action_result": {"success": False, "status": "NO_UPDATES"},
            "status": "need_clarification",
            "assistant_message": "I could not confidently match that answer to the form. Could you rephrase it?",
            "explanation": action.reasoning,
        }

    execution_results = []
    successful_updates = []

    for update in updates:
        success = False
        tool_name = update.action_type
        value = update.value

        if update.action_type == "type":
            success = await browser_type(update.field_id, str(value))
            tool_name = "browser_type"
        elif update.action_type == "select":
            success = await browser_select(update.field_id, str(value))
            tool_name = "browser_select"
        elif update.action_type in {"click", "focus"}:
            if update.action_type == "click":
                # For checkboxes, clicking is a toggle. Only click when the
                # current state differs from Gemini's desired boolean state.
                target_field = next(
                    (field for field in state.get("page_state").fields if field.field_id == update.field_id),
                    None,
                )
                if target_field and target_field.type == "checkbox" and isinstance(update.value, bool):
                    current = await browser_get_value(update.field_id)
                    current_checked = str(current).lower() in {"true", "yes", "checked", "1"}
                    success = True if current_checked == update.value else await browser_click(update.field_id)
                else:
                    success = await browser_click(update.field_id)
                tool_name = "browser_click"
            else:
                success = await browser_focus_element(update.field_id)
                tool_name = "browser_focus_element"
        elif update.action_type == "clear":
            success = await browser_type(update.field_id, "")
            tool_name = "browser_type"

        execution_results.append(
            {
                "field_id": update.field_id,
                "value": value,
                "success": success,
                "tool": tool_name,
            }
        )
        if success:
            successful_updates.append(update.field_id)

        tracer.log(
            agent_name="ExecutionNode",
            tool_call=tool_name,
            tool_args={"target_id": update.field_id, "value": value},
            tool_result={"success": success},
            notes=f"Executed Gemini-proposed update on {update.field_id}.",
        )

    updated_page = await WebUnderstandingAgent(tracer=tracer).inspect()
    next_field = WebUnderstandingAgent.get_active_or_next_field(updated_page)

    def answered(field):
        if field.type == "checkbox":
            return str(field.current_value).lower() in {"true", "yes", "checked", "1"}
        if field.type == "radio":
            return str(field.current_value).lower() not in {"", "false", "none", "null"}
        return field.current_value not in {"", None}

    missing_required = [
        field for field in updated_page.fields
        if field.visible and field.required and not answered(field)
    ]

    question = None
    if missing_required:
        question_agent = FormInteractionAgent(tracer=tracer)
        question = await question_agent.next_question(
            page_state=updated_page,
            profile=state.get("accessibility_profile"),
        )

    success_count = len(successful_updates)
    total = len(updates)

    if question:
        assistant_message = (
            f"I filled {success_count} piece{'s' if success_count != 1 else ''} of information. "
            f"{question}"
        )
    elif success_count == total:
        assistant_message = "I filled the information I could from your answer. The form is ready for review."
    else:
        assistant_message = (
            f"I filled {success_count} of {total} requested items. "
            "One or more fields could not be updated, so please review them."
        )

    return {
        "action_result": {"success": success_count == total, "updates": execution_results},
        "page_state": updated_page,
        "active_field": next_field,
        "status": "action_completed",
        "assistant_message": assistant_message,
        "explanation": (
            f"Updated {success_count}/{total} field(s) using Gemini's semantic interpretation, "
            "then re-read the live page."
        ),
    }


async def clarification_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    action = state.get("action_proposal")
    verification = state.get("verification_result")
    active_field = state.get("active_field")
    profile = state.get("accessibility_profile")

    if verification and verification.validation_errors:
        msg = (
            "I understood what you were trying to provide, but I need one small correction. "
            + " ".join(verification.validation_errors)
        )
        explanation = "Deterministic validation rejected the proposed value."
    elif action and action.needs_clarification:
        provider = LLMProvider()
        if active_field:
            msg = await provider.generate_next_question(
                field=active_field,
                remaining_fields=[],
                profile=profile.model_dump() if profile else {},
            )
        else:
            msg = "I want to make sure I understood you correctly. Could you please rephrase your answer?"
        explanation = action.reasoning or "Gemini marked the answer as ambiguous."
    else:
        msg = "I want to make sure I understood you correctly. Could you please rephrase your answer?"
        explanation = "The verified confidence score was below the execution threshold."

    tracer.log(agent_name="ClarificationNode", notes=f"Clarification requested: {msg}")
    return {
        "status": "need_clarification",
        "assistant_message": msg,
        "explanation": explanation,
    }


async def confirmation_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    page_state = state.get("page_state")
    summary_lines = []
    for field in page_state.fields:
        if field.visible and field.current_value not in {None, ""}:
            summary_lines.append(f"• {field.label}: {field.current_value}")

    summary = "\n".join(summary_lines) or "All required form details are ready."
    msg = "Your form is ready. Please review the answers below before I submit the application."

    tracer.log(
        agent_name="ConfirmationNode",
        notes="Final submission paused for explicit human approval.",
    )
    return {
        "status": "need_confirmation",
        "assistant_message": msg,
        "explanation": "Final submission is a high-impact action and requires explicit human approval.",
        "action_result": {"pending_summary": summary, "pending_action": "submit"},
    }


async def block_node(state: AccessBridgeGraphState, tracer: Tracer) -> Dict[str, Any]:
    decision = state.get("safety_decision")
    page_state = state.get("page_state")
    reasons = "; ".join(decision.blocking_factors) if decision else "Safety policy rejected the action."

    if page_state and page_state.untrusted_content_detected:
        msg = (
            "I detected untrusted instructions on the website. "
            "I stopped the automated action to protect your information."
        )
        explanation = "Third-party webpage content was treated as untrusted data."
    else:
        msg = f"I stopped that action for safety: {reasons}"
        explanation = reasons

    tracer.log(
        agent_name="BlockNode",
        risk="CRITICAL",
        decision="BLOCKED",
        notes=f"Action blocked: {reasons}",
    )
    return {
        "status": "blocked",
        "assistant_message": msg,
        "explanation": explanation,
    }
