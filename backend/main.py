"""FastAPI entry point for the AccessBridge conversational form assistant."""

import asyncio
import os
import re
import sys
from typing import Any, Dict, Optional
from urllib.parse import urlparse

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.agents.form_agent import FormInteractionAgent
from backend.agents.profile_agent import ProfileAgent
from backend.agents.web_agent import WebUnderstandingAgent
from backend.browser.playwright_engine import PlaywrightBrowserEngine
from backend.browser.remote_engine import RemoteDOMEngine
from backend.browser.simulated_engine import SimulatedBrowserEngine
from backend.config import settings
from backend.graph.workflow import build_accessbridge_graph
from backend.mcp.tools import (
    get_active_browser_engine,
    mcp_server,
    set_active_browser_engine,
)
from backend.models.schemas import (
    AccessibilityProfile,
    TraceEntry,
    UserInteractionRequest,
    UserInteractionResponse,
    WebPageState,
)
from backend.observability.audit_store import AuditStore
from backend.observability.tracer import Tracer

app = FastAPI(
    title="AccessBridge Backend API",
    description="AI-powered accessible interface for complex web forms",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

engines = {
    "playwright": None,
    "simulated": SimulatedBrowserEngine(),
}
active_engine_name = "simulated"
audit_store = AuditStore()

# Lightweight session state. The browser itself remains managed by the current
# engine, while conversation history and the current target URL live here.
session_store: Dict[str, Dict[str, Any]] = {}


@app.on_event("startup")
async def startup_event():
    global active_engine_name
    try:
        engines["playwright"] = PlaywrightBrowserEngine()
        if settings.DEFAULT_BROWSER_ENGINE == "playwright":
            active_engine_name = "playwright"
            set_active_browser_engine(engines["playwright"])
        else:
            active_engine_name = "simulated"
            set_active_browser_engine(engines["simulated"])
    except Exception:
        active_engine_name = "simulated"
        set_active_browser_engine(engines["simulated"])


@app.on_event("shutdown")
async def shutdown_event():
    if engines.get("playwright"):
        try:
            await engines["playwright"].close()
        except Exception:
            pass


demo_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "demo_site")
if os.path.exists(demo_dir):
    app.mount("/demo", StaticFiles(directory=demo_dir, html=True), name="demo")


@app.get("/")
async def root():
    return {
        "service": "AccessBridge Agentic Accessibility Layer",
        "status": "online",
        "version": "2.0.0",
        "llm_provider": settings.LLM_PROVIDER,
        "gemini_model": settings.GEMINI_MODEL,
        "docs_url": "/docs",
        "health_check": "/health",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AccessBridge",
        "version": "2.0.0",
        "active_engine": active_engine_name,
        "llm_provider": settings.LLM_PROVIDER,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "gemini_model": settings.GEMINI_MODEL,
    }


@app.get("/api/status/system")
async def get_system_status():
    engine = get_active_browser_engine()
    state = await engine.get_page_state()
    return {
        "system_online": True,
        "browser": {
            "status": "CONNECTED" if state else "DISCONNECTED",
            "engine": active_engine_name,
            "fields_count": len(state.fields) if state else 0,
            "url": state.url if state else "",
            "title": state.title if state else "",
        },
        "agents": {
            "status": "READY",
            "count": 7,
            "orchestrator": "LangGraph",
        },
        "semantic_understanding": {
            "status": "READY" if settings.GEMINI_API_KEY else "FALLBACK",
            "provider": "Gemini",
            "model": settings.GEMINI_MODEL,
        },
        "safety": {
            "status": "READY",
            "risk": "LOW",
            "decision": "STANDBY",
        },
    }


@app.get("/api/browser/screenshot")
async def get_browser_screenshot():
    engine = get_active_browser_engine()
    return {
        "screenshot": await engine.get_screenshot_base64(),
        "engine": active_engine_name,
    }


@app.get("/api/browser/status")
async def get_browser_status():
    engine = get_active_browser_engine()
    state = await engine.get_page_state()
    return {
        "connected": bool(state),
        "engine": active_engine_name,
        "url": state.url if state else "",
        "fields_count": len(state.fields) if state else 0,
        "title": state.title if state else "",
    }


@app.get("/api/browser/a11y-tree")
async def get_browser_a11y_tree():
    engine = get_active_browser_engine()
    return {
        "a11y_tree": await engine.get_accessibility_tree(),
        "engine": active_engine_name,
    }


def _validate_url(url: str) -> str:
    candidate = url.strip()
    parsed = urlparse(candidate)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(
            status_code=400,
            detail="Please provide a complete website URL beginning with http:// or https://.",
        )
    return candidate


def _extract_url(message: str) -> Optional[str]:
    match = re.search(r"https?://[^\s<>()]+", message or "", flags=re.IGNORECASE)
    if not match:
        return None
    return match.group(0).rstrip(".,!?;:]")


def _strip_url(message: str, url: str) -> str:
    cleaned = message.replace(url, " ").strip()
    return re.sub(r"\s+", " ", cleaned)


def _session(session_id: str) -> Dict[str, Any]:
    return session_store.setdefault(
        session_id,
        {
            "website_url": "",
            "conversation_history": [],
        },
    )


def _progress(page_state: Optional[WebPageState]) -> Dict[str, Any]:
    if not page_state:
        return {"completed": 0, "required": 0, "remaining": 0, "percent": 0}
    required_fields = [
        field
        for field in page_state.fields
        if field.visible and field.required
    ]
    def answered(field):
        if field.type == "checkbox":
            return str(field.current_value).lower() in {"true", "yes", "checked", "1"}
        if field.type == "radio":
            return str(field.current_value).lower() not in {"", "false", "none", "null"}
        return field.current_value not in {"", None}

    completed = sum(answered(field) for field in required_fields)
    required = len(required_fields)
    remaining = required - completed
    return {
        "completed": completed,
        "required": required,
        "remaining": remaining,
        "percent": round((completed / required) * 100) if required else 100,
    }


@app.post("/api/browser/navigate")
async def navigate_browser(payload: Dict[str, str]):
    url = _validate_url(payload.get("url", ""))
    engine = get_active_browser_engine()
    try:
        state = await engine.navigate(url)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to open the website: {exc}") from exc
    return state.model_dump()


@app.get("/api/profiles")
async def get_profiles():
    return {
        key: profile.model_dump()
        for key, profile in ProfileAgent.get_preset_profiles().items()
    }


@app.get("/api/form/state")
async def get_form_state():
    engine = get_active_browser_engine()
    state = await engine.get_page_state()
    return state.model_dump()


@app.post("/api/form/reset")
async def reset_form():
    global engines
    if active_engine_name == "simulated":
        engines["simulated"] = SimulatedBrowserEngine()
        set_active_browser_engine(engines["simulated"])
    elif engines.get("playwright"):
        try:
            target = engines["playwright"].url
            if target:
                await engines["playwright"].navigate(target)
        except Exception:
            pass
    return {"status": "reset_completed"}


@app.post("/api/engine/switch")
async def switch_engine(payload: Dict[str, str]):
    global active_engine_name
    target = payload.get("engine", "playwright").lower()
    if target not in engines or engines[target] is None:
        raise HTTPException(status_code=400, detail=f"Engine '{target}' unavailable.")
    active_engine_name = target
    set_active_browser_engine(engines[target])
    return {"status": "switched", "active_engine": active_engine_name}


@app.get("/api/mcp/tools")
async def list_mcp_tools():
    tools = await mcp_server.list_tools()
    return [
        {
            "name": tool.name,
            "description": tool.description,
            "inputSchema": tool.inputSchema,
        }
        for tool in tools
    ]


@app.get("/api/traces/{session_id}")
async def get_session_traces(session_id: str):
    return audit_store.get_session_traces(session_id)


@app.get("/api/evaluation/results")
async def get_evaluation_results():
    from tests.evaluation.gold_scenarios import GOLD_SCENARIOS

    scenarios = [
        {
            "id": scenario["id"],
            "name": scenario["name"],
            "description": scenario["description"],
            "expected_decision": scenario["expected_decision"],
            "expected_status": scenario["expected_status"],
            "min_confidence": scenario.get("min_confidence", 0.0),
        }
        for scenario in GOLD_SCENARIOS
    ]
    return {
        "total_scenarios": len(scenarios),
        "scenarios": scenarios,
        "note": "Evaluation metrics are reported by the test suite; this endpoint does not fabricate pass rates.",
    }


@app.get("/api/safety/summary")
async def get_safety_summary():
    return {
        "prompt_injection_status": "ACTIVE",
        "pii_redaction_status": "ACTIVE",
        "untrusted_dom_isolation": "ACTIVE",
        "final_submission_confirmation": True,
    }


@app.post("/api/interact", response_model=UserInteractionResponse)
async def handle_user_interaction(request: UserInteractionRequest):
    if request.engine and request.engine in engines and engines[request.engine]:
        set_active_browser_engine(engines[request.engine])

    profile = request.accessibility_profile or AccessibilityProfile()
    session = _session(request.session_id)

    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Allow users to paste the target URL directly into the chat.  Navigate
    # first, then continue processing any remaining text as a normal answer.
    pasted_url = _extract_url(message)
    if pasted_url:
        pasted_url = _validate_url(pasted_url)
        engine = get_active_browser_engine()
        try:
            page_state = await engine.navigate(pasted_url)
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Unable to open that website: {exc}") from exc

        session["website_url"] = pasted_url
        remaining_text = _strip_url(message, pasted_url)

        if not remaining_text:
            tracer = Tracer(session_id=request.session_id, store=audit_store)
            form_agent = FormInteractionAgent(tracer=tracer)
            page_state = await form_agent.understand_page_form(page_state)
            session["conversation_history"].append({"role": "user", "content": message})

            next_question = await form_agent.next_question(page_state, profile)
            assistant_message = (
                f"I opened {page_state.title or pasted_url} and found {len(page_state.fields)} interactive form fields. "
                + (next_question or "The form is already complete; you can review it before submission.")
            )
            session["conversation_history"].append({"role": "assistant", "content": assistant_message})
            return UserInteractionResponse(
                session_id=request.session_id,
                assistant_message=assistant_message,
                explanation="The page was inspected and its form controls were semantically classified.",
                status="action_completed",
                active_field=WebUnderstandingAgent.get_active_or_next_field(page_state),
                page_state=page_state,
                progress=_progress(page_state),
                trace_summary=tracer.get_timeline(),
            )

        message = remaining_text

    session["conversation_history"].append({"role": "user", "content": message})

    tracer = Tracer(session_id=request.session_id, store=audit_store)
    graph = build_accessbridge_graph(tracer=tracer)

    initial_state = {
        "session_id": request.session_id,
        "user_message": message,
        "website_url": session.get("website_url", ""),
        "conversation_history": list(session.get("conversation_history", [])),
        "accessibility_profile": profile,
        "user_confirmed": bool(request.confirmed),
    }

    final_state = await graph.ainvoke(initial_state)

    page_state: Optional[WebPageState] = final_state.get("page_state")
    safety_decision = final_state.get("safety_decision")
    citations = final_state.get("rag_citations", [])
    active_field = final_state.get("active_field")
    action_result = final_state.get("action_result", {})
    status = final_state.get("status", "idle")
    assistant_msg = final_state.get(
        "assistant_message",
        "I am ready to help you complete this form.",
    )
    explanation = final_state.get("explanation", "")
    action_proposal = final_state.get("action_proposal")

    # Store the assistant response for the next Gemini turn.
    session["conversation_history"].append({"role": "assistant", "content": assistant_msg})
    if len(session["conversation_history"]) > 20:
        session["conversation_history"] = session["conversation_history"][-20:]

    confirmation_payload = None
    if status == "need_confirmation":
        confirmation_payload = {
            "title": "Review Before Submission",
            "summary": action_result.get(
                "pending_summary",
                "Please review your completed application before submission.",
            ),
            "risk": "HIGH",
            "action": "submit",
        }

    field_updates = []
    if action_proposal:
        field_updates = action_proposal.field_updates

    return UserInteractionResponse(
        session_id=request.session_id,
        assistant_message=assistant_msg,
        explanation=explanation,
        status=status,
        active_field=active_field,
        page_state=page_state,
        safety_decision=safety_decision,
        citations=citations,
        trace_summary=tracer.get_timeline(),
        confirmation_payload=confirmation_payload,
        field_updates=field_updates,
        progress=_progress(page_state),
    )


# ---------------------------------------------------------------------------
# Browser extension bridge
#
# The extension snapshots the page the user is on and posts it here.  The same
# multi-agent pipeline runs against that snapshot, and the approved actions are
# returned so the extension can apply them inside the user's own tab.  The
# backend never drives the user's browser itself.
# ---------------------------------------------------------------------------


class ExtensionAssistRequest(BaseModel):
    session_id: str
    message: str
    url: str = ""
    title: str = ""
    headings: list = Field(default_factory=list)
    fields: list = Field(default_factory=list)
    current_focus: Optional[str] = None
    accessibility_profile: Optional[AccessibilityProfile] = None
    confirmed: Optional[bool] = None


@app.post("/api/extension/assist")
async def extension_assist(request: ExtensionAssistRequest):
    message = request.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if not request.fields:
        raise HTTPException(
            status_code=400,
            detail="No form fields were found on this page, so there is nothing I can fill in yet.",
        )

    profile = request.accessibility_profile or AccessibilityProfile()
    session = _session(f"ext::{request.session_id}")
    session["website_url"] = request.url
    session["conversation_history"].append({"role": "user", "content": message})

    engine = RemoteDOMEngine(
        url=request.url,
        title=request.title,
        fields=request.fields,
        headings=request.headings,
        current_focus=request.current_focus,
    )

    previous_engine = get_active_browser_engine()
    set_active_browser_engine(engine)
    tracer = Tracer(session_id=request.session_id, store=audit_store)
    try:
        graph = build_accessbridge_graph(tracer=tracer)
        final_state = await graph.ainvoke(
            {
                "session_id": request.session_id,
                "user_message": message,
                "website_url": request.url,
                "conversation_history": list(session.get("conversation_history", [])),
                "accessibility_profile": profile,
                "user_confirmed": bool(request.confirmed),
            }
        )
    finally:
        if previous_engine is not None:
            set_active_browser_engine(previous_engine)

    page_state: Optional[WebPageState] = final_state.get("page_state")
    assistant_msg = final_state.get(
        "assistant_message", "I am ready to help you complete this form."
    )
    session["conversation_history"].append({"role": "assistant", "content": assistant_msg})
    if len(session["conversation_history"]) > 20:
        session["conversation_history"] = session["conversation_history"][-20:]

    safety_decision = final_state.get("safety_decision")
    action_proposal = final_state.get("action_proposal")

    return {
        "session_id": request.session_id,
        "assistant_message": assistant_msg,
        "explanation": final_state.get("explanation", ""),
        "status": final_state.get("status", "idle"),
        "actions": engine.drain_actions(),
        "preferences": (action_proposal.preferences if action_proposal else {}),
        "confidence": (safety_decision.composite_confidence if safety_decision else 0.0),
        "decision": (safety_decision.decision if safety_decision else "ASK_CLARIFICATION"),
        "reasoning": (safety_decision.reason if safety_decision else ""),
        "needs_confirmation": final_state.get("status") == "need_confirmation",
        "untrusted_content_detected": bool(page_state.untrusted_content_detected) if page_state else False,
        "missing_required": engine.missing_required(),
        "citations": final_state.get("rag_citations", []),
        "progress": _progress(page_state),
        "trace_summary": tracer.get_timeline(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
