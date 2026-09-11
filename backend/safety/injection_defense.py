"""
Prompt Injection Defense & Untrusted DOM Isolation
Detects adversarial prompt injections originating from user input or untrusted webpage DOM.
"""

import re
from typing import Tuple, List

# Malicious patterns commonly used in prompt injections and DOM hijacking
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions?",
    r"disregard\s+(all\s+)?(previous|prior)\s+instructions?",
    r"system\s*prompt\s*(override|bypass)",
    r"send\s+(all\s+)?(user\s+)?(data|info|credentials)\s+to",
    r"exfiltrate",
    r"upload\s+to\s+https?://",
    r"as\s+an\s+ai\s+you\s+must",
    r"you\s+are\s+now\s+in\s+dan\s+mode",
    r"override\s+safety\s+rules?",
    r"bypass\s+confirmation",
    r"execute\s+silently\s+without\s+asking",
    r"<script[\s\S]*?>[\s\S]*?<\/script>",
    r"javascript:\s*",
    r"eval\s*\("
]

COMPILED_INJECTION_REGEX = re.compile("|".join(INJECTION_PATTERNS), re.IGNORECASE)

class InjectionDefense:
    @staticmethod
    def inspect_text(text: str, source: str = "webpage") -> Tuple[bool, List[str]]:
        """
        Inspects text for prompt injection vectors.
        Returns: (is_malicious, detected_matches)
        """
        if not text:
            return False, []

        matches = COMPILED_INJECTION_REGEX.findall(text)
        # findall with groups returns tuples, let's extract matches
        found_matches = []
        for m in COMPILED_INJECTION_REGEX.finditer(text):
            found_matches.append(m.group(0))

        if found_matches:
            return True, found_matches
        return False, []

    @staticmethod
    def sanitize_untrusted_dom(text: str) -> str:
        """
        Strips dangerous control tokens and neutralizes embedded directives from third-party DOM.
        Ensures DOM text is treated strictly as passive data, never instructions.
        """
        if not text:
            return ""
        # Remove potential script tags and HTML injection
        cleaned = re.sub(r"<[^>]+>", " ", text)
        # Defang injection phrases
        for pattern in INJECTION_PATTERNS:
            cleaned = re.sub(pattern, "[FILTERED_DIRECTIVE]", cleaned, flags=re.IGNORECASE)
        return cleaned.strip()
