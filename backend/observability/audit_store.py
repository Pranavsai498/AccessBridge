"""
Audit Store for AccessBridge
Persistent SQLite storage for all agent traces, tool executions, and security decisions.
"""

import sqlite3
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.config import settings

class AuditStore:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.AUDIT_DB_PATH
        self._init_db()

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS traces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    tool_call TEXT,
                    tool_args TEXT,
                    tool_result TEXT,
                    confidence REAL,
                    risk TEXT,
                    decision TEXT,
                    notes TEXT,
                    payload TEXT
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_session ON traces(session_id)")
            conn.commit()

    def record_entry(self, session_id: str, entry: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO traces (
                    session_id, timestamp, agent_name, tool_call, tool_args,
                    tool_result, confidence, risk, decision, notes, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                session_id,
                entry.get("timestamp", datetime.now().isoformat()),
                entry.get("agent_name", "UNKNOWN"),
                entry.get("tool_call"),
                json.dumps(entry.get("tool_args")) if entry.get("tool_args") else None,
                json.dumps(entry.get("tool_result")) if entry.get("tool_result") else None,
                entry.get("confidence"),
                entry.get("risk"),
                entry.get("decision"),
                entry.get("notes"),
                json.dumps(entry)
            ))
            conn.commit()

    def get_session_traces(self, session_id: str) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT timestamp, agent_name, tool_call, tool_args, tool_result,
                       confidence, risk, decision, notes, payload
                FROM traces WHERE session_id = ? ORDER BY id ASC
            """, (session_id,))
            rows = cursor.fetchall()
            traces = []
            for row in rows:
                payload = json.loads(row[9]) if row[9] else {}
                traces.append(payload)
            return traces
