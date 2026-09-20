"""LangGraph state machine for AccessBridge."""

from functools import partial

from langgraph.graph import END, START, StateGraph

from backend.graph.nodes import (
    block_node,
    clarification_node,
    confirmation_node,
    execution_node,
    form_interaction_node,
    intake_node,
    profile_node,
    rag_node,
    safety_node,
    verification_node,
    web_understanding_node,
)
from backend.graph.router import route_safety_decision
from backend.graph.state import AccessBridgeGraphState
from backend.observability.tracer import Tracer


def build_accessbridge_graph(tracer: Tracer):
    builder = StateGraph(AccessBridgeGraphState)

    builder.add_node("intake", partial(intake_node, tracer=tracer))
    builder.add_node("profile", partial(profile_node, tracer=tracer))
    builder.add_node("web_understanding", partial(web_understanding_node, tracer=tracer))
    builder.add_node("rag", partial(rag_node, tracer=tracer))
    builder.add_node("form_interaction", partial(form_interaction_node, tracer=tracer))
    builder.add_node("verification", partial(verification_node, tracer=tracer))
    builder.add_node("safety", partial(safety_node, tracer=tracer))
    builder.add_node("execute", partial(execution_node, tracer=tracer))
    builder.add_node("clarification", partial(clarification_node, tracer=tracer))
    builder.add_node("confirmation", partial(confirmation_node, tracer=tracer))
    builder.add_node("block", partial(block_node, tracer=tracer))

    builder.add_edge(START, "intake")
    builder.add_edge("intake", "profile")
    builder.add_edge("profile", "web_understanding")
    builder.add_edge("web_understanding", "rag")
    builder.add_edge("rag", "form_interaction")
    builder.add_edge("form_interaction", "verification")
    builder.add_edge("verification", "safety")

    builder.add_conditional_edges(
        "safety",
        route_safety_decision,
        {
            "execute": "execute",
            "require_confirmation": "confirmation",
            "ask_clarification": "clarification",
            "block": "block",
        },
    )

    builder.add_edge("execute", END)
    builder.add_edge("clarification", END)
    builder.add_edge("confirmation", END)
    builder.add_edge("block", END)

    return builder.compile()
