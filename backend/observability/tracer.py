"""
Observability Tracer for AccessBridge
Manages real-time trace timelines, streaming events, and audit logging.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.models.schemas import TraceEntry
from backend.observability.audit_store import AuditStore
from backend.safety.pii_guard import PIIGuard

class Tracer:
    def __init__(self, session_id: str, store: Optional[AuditStore] = None):
        self.session_id = session_id
        self.store = store or AuditStore()
        self.timeline: List[TraceEntry] = []

    def log(
        self,
        agent_name: str,
        agent_input: Optional[Dict[str, Any]] = None,
        agent_output: Optional[Dict[str, Any]] = None,
        tool_call: Optional[str] = None,
        tool_args: Optional[Dict[str, Any]] = None,
        tool_result: Optional[Dict[str, Any]] = None,
        confidence: Optional[float] = None,
        risk: Optional[str] = None,
        decision: Optional[str] = None,
        notes: Optional[str] = None
    ) -> TraceEntry:
        # Redact PII in string values
        clean_notes = PIIGuard.redact(notes) if notes else None

        entry = TraceEntry(
            timestamp=datetime.now().strftime("%H:%M:%S.%f")[:-3],
            agent_name=agent_name,
            agent_input=agent_input,
            agent_output=agent_output,
            tool_call=tool_call,
            tool_args=tool_args,
            tool_result=tool_result,
            confidence=confidence,
            risk=risk,
            decision=decision,
            notes=clean_notes
        )
        self.timeline.append(entry)
        self.store.record_entry(self.session_id, entry.model_dump())
        return entry

    def get_timeline(self) -> List[TraceEntry]:
        return self.timeline
