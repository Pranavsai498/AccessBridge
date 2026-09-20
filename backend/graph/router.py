"""
Conditional Router for AccessBridge LangGraph Workflow
Directs execution flow strictly based on verified safety decisions.
Never allows execution simply because an LLM wants to continue.
"""

from typing import Literal
from backend.graph.state import AccessBridgeGraphState

def route_safety_decision(
    state: AccessBridgeGraphState
) -> Literal["execute", "require_confirmation", "ask_clarification", "block"]:
    decision = state.get("safety_decision")
    if not decision:
        return "ask_clarification"

    dec_str = decision.decision
    if dec_str == "EXECUTE":
        return "execute"
    elif dec_str == "REQUIRE_CONFIRMATION":
        return "require_confirmation"
    elif dec_str == "ASK_CLARIFICATION":
        return "ask_clarification"
    else:
        return "block"
