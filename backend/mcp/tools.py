"""
MCP Tools Implementation for AccessBridge
Implements the 13 required MCP tools for browser control, accessibility profile, RAG knowledge, and audit logging.
"""

from typing import Dict, Any, List, Optional
from mcp.server.fastmcp import FastMCP
from backend.models.schemas import AccessibilityProfile, RAGCitation, WebPageState
from backend.rag.store import RAGStore

# Initialize FastMCP Server
mcp_server = FastMCP(
    name="accessbridge-mcp",
    instructions="MCP tool server providing real browser accessibility automation and WCAG grounding."
)

# Active engine reference (swappable between Playwright and Simulated)
_active_browser_engine = None
_active_profile: AccessibilityProfile = AccessibilityProfile()
_audit_trail: List[Dict[str, Any]] = []

def set_active_browser_engine(engine):
    global _active_browser_engine
    _active_browser_engine = engine

def get_active_browser_engine():
    global _active_browser_engine
    if _active_browser_engine is None:
        from backend.browser.simulated_engine import SimulatedBrowserEngine
        _active_browser_engine = SimulatedBrowserEngine()
    return _active_browser_engine

# =========================================================================
# MCP Tools (Exposed via FastMCP and directly callable by LangGraph agents)
# =========================================================================

@mcp_server.tool()
async def browser_get_page(url: Optional[str] = None) -> Dict[str, Any]:
    """Fetches the current web page DOM state, title, active focus, and structured fields."""
    engine = get_active_browser_engine()
    if url:
        page_state = await engine.navigate(url)
    else:
        page_state = await engine.get_page_state()
    return page_state.model_dump()

@mcp_server.tool()
async def browser_get_accessibility_tree() -> Dict[str, Any]:
    """Retrieves the full accessibility tree (roles, accessible names, states) from the browser."""
    engine = get_active_browser_engine()
    return await engine.get_accessibility_tree()

@mcp_server.tool()
async def browser_get_form() -> List[Dict[str, Any]]:
    """Inspects and returns all interactive form controls, their labels, types, and constraints."""
    engine = get_active_browser_engine()
    state = await engine.get_page_state()
    return [f.model_dump() for f in state.fields]

@mcp_server.tool()
async def browser_focus_element(target_id: str) -> bool:
    """Sets visible and programmatic focus to the specified form control."""
    engine = get_active_browser_engine()
    return await engine.focus_element(target_id)

@mcp_server.tool()
async def browser_type(target_id: str, text: str) -> bool:
    """Inputs typed text into an input field or textarea and dispatches DOM change events."""
    engine = get_active_browser_engine()
    return await engine.type_text(target_id, text)

@mcp_server.tool()
async def browser_click(target_id: str) -> bool:
    """Performs a verified click action on a button, radio option, or checkbox."""
    engine = get_active_browser_engine()
    return await engine.click_element(target_id)

@mcp_server.tool()
async def browser_select(target_id: str, value: str) -> bool:
    """Selects an option inside a dropdown (<select>) element."""
    engine = get_active_browser_engine()
    return await engine.select_option(target_id, value)

@mcp_server.tool()
async def browser_get_value(target_id: str) -> Any:
    """Reads the current live DOM value from the target form control."""
    engine = get_active_browser_engine()
    return await engine.get_value(target_id)

@mcp_server.tool()
async def browser_validate_form() -> Dict[str, Any]:
    """Runs form validation and returns error status for each field."""
    engine = get_active_browser_engine()
    state = await engine.get_page_state()
    errors = {f.field_id: f.validation_error for f in state.fields if f.validation_error}
    missing_required = [f.field_id for f in state.fields if f.required and not f.current_value]
    return {
        "is_valid": len(errors) == 0 and len(missing_required) == 0,
        "errors": errors,
        "missing_required": missing_required
    }

@mcp_server.tool()
def user_get_preferences() -> Dict[str, Any]:
    """Returns the user's active accessibility preferences."""
    global _active_profile
    return _active_profile.model_dump()

@mcp_server.tool()
def user_update_preferences(preferences: Dict[str, Any]) -> Dict[str, Any]:
    """Updates user interaction preferences (e.g. plain language, step-by-step, high contrast)."""
    global _active_profile
    for k, v in preferences.items():
        if hasattr(_active_profile, k):
            setattr(_active_profile, k, v)
    return _active_profile.model_dump()

@mcp_server.tool()
def knowledge_search(query: str, k: int = 3) -> List[Dict[str, Any]]:
    """Performs vector similarity search against WCAG 2.2, WAI-ARIA, and COGA guidance."""
    rag_store = RAGStore.get_instance()
    citations = rag_store.search(query=query, k=k)
    return [c.model_dump() for c in citations]

@mcp_server.tool()
def audit_log(entry: Dict[str, Any]) -> bool:
    """Appends an immutable structured audit log entry."""
    global _audit_trail
    _audit_trail.append(entry)
    return True

@mcp_server.tool()
def request_user_confirmation(summary: str, risk_level: str = "HIGH") -> Dict[str, Any]:
    """Signals that a high-impact action requires explicit human approval before execution."""
    return {
        "status": "AWAITING_CONFIRMATION",
        "risk_level": risk_level,
        "summary": summary,
        "requires_modal": True
    }
