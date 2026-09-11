"""
RAG / Accessibility Knowledge Agent for AccessBridge
Retrieves grounded WCAG 2.2 and COGA guidance chunks with source citations.
Never hallucinates accessibility requirements from ungrounded memory.
"""

from typing import List, Dict, Any, Optional
from backend.models.schemas import RAGCitation, FormField, AccessibilityProfile
from backend.mcp.tools import knowledge_search

class RAGAgent:
    def __init__(self, tracer=None):
        self.tracer = tracer

    async def retrieve_guidance(
        self,
        target_field: Optional[FormField],
        profile: AccessibilityProfile,
        user_intent: str
    ) -> List[RAGCitation]:
        # Formulate grounded query based on field constraints and profile
        query_parts = [user_intent]
        if target_field:
            query_parts.append(target_field.type)
            query_parts.append(target_field.label)
            if target_field.required:
                query_parts.append("required")
            if target_field.validation_error:
                query_parts.append("error suggestion")

        if profile.cognitive == "simplified_language":
            query_parts.append("plain language cognitive")
        if profile.motor != "standard":
            query_parts.append("keyboard motor focus")
        if profile.visual == "screen_reader":
            query_parts.append("accessible name screen reader")

        query = " ".join(query_parts)
        
        # Real MCP tool call to knowledge store
        raw_results = knowledge_search(query=query, k=3)
        citations = [RAGCitation(**r) for r in raw_results]

        if self.tracer:
            self.tracer.log(
                agent_name="RAGKnowledgeAgent",
                agent_input={"query": query},
                agent_output={"citation_count": len(citations), "top_rule": citations[0].rule_id if citations else "None"},
                tool_call="knowledge_search",
                tool_args={"query": query, "k": 3},
                notes=f"Retrieved {len(citations)} citations. Top match: {citations[0].rule_id if citations else 'None'}"
            )

        return citations
