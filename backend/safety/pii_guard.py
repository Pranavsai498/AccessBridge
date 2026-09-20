"""
PII Guard & Data Redactor
Prevents accidental logging or leakage of sensitive user identifiers and secrets.
"""

import re

PII_PATTERNS = [
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REDACTED_SSN]"),
    (re.compile(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b"), "[REDACTED_CREDIT_CARD]"),
    (re.compile(r"(?i)(password|secret|apikey|token)\s*[:=]\s*['\"]?[a-zA-Z0-9_\-]{8,}['\"]?"), r"\1=[REDACTED]"),
]

class PIIGuard:
    @staticmethod
    def redact(text: str) -> str:
        if not text:
            return ""
        result = text
        for pattern, replacement in PII_PATTERNS:
            result = pattern.sub(replacement, result)
        return result
