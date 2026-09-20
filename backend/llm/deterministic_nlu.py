"""
Deterministic natural-language understanding for AccessBridge.

Gemini remains the primary semantic engine.  This module is the authoritative
offline interpreter that runs whenever Gemini is unavailable (no API key,
network failure, or unusable structured output).  It is fully deterministic,
which makes the gold benchmark, the red-team suite and judge demos reproducible
without any external service.

Design rules:
- Never guess.  When the message is ambiguous, return zero field updates and
  report which field the ambiguity is about.
- Never stuff raw conversational text into a form field.
- Treat the user's message as data; injection screening happens upstream.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from backend.models.schemas import FormField

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "can", "do", "does",
    "for", "from", "have", "i", "if", "in", "is", "it", "me", "my", "need",
    "of", "on", "or", "please", "should", "that", "the", "their", "then",
    "this", "to", "want", "was", "we", "what", "when", "which", "will", "with",
    "you", "your", "enter", "type", "fill", "select", "choose", "set", "field",
    "form", "value", "yes", "no", "not", "during", "also", "about", "would",
}

WORD_NUMBERS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6,
    "seven": 7, "eight": 8, "nine": 9, "ten": 10, "eleven": 11, "twelve": 12,
    "fifteen": 15, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50,
    "hundred": 100,
}

MULTIPLIERS = {
    "thousand": 1_000,
    "k": 1_000,
    "lakh": 100_000,
    "lac": 100_000,
    "lakhs": 100_000,
    "million": 1_000_000,
    "crore": 10_000_000,
    "crores": 10_000_000,
}

MONTHS = {
    "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
    "july": 7, "august": 8, "september": 9, "october": 10, "november": 11,
    "december": 12,
}

MONEY_CONTEXT = (
    "income", "salary", "earn", "earning", "rupee", "rupees", "inr", "usd",
    "dollar", "money", "amount", "wage", "stipend", "budget", "pay",
)

AFFIRMATIVE = ("yes", "yeah", "yep", "sure", "i do", "i need", "please do", "correct", "true")
NEGATIVE = ("no ", "nope", "i do not", "i don't", "not required", "false", "none")

AMBIGUITY_PATTERNS = (
    r"\beither\b.*\bor\b",
    r"\bjust (choose|pick|select|decide)\b",
    r"\bwhichever\b",
    r"\byou (choose|pick|decide)\b",
    r"\b(choose|pick) (one|any|something) for me\b",
    r"\bi (think|guess) maybe\b",
    r"\bmaybe\b.*\bor\b",
    r"\bnot sure\b",
    r"\bi'?m unsure\b",
    r"\bbut i also\b",
    r"\bguess\b",
)

QUESTION_PATTERNS = (
    r"^\s*(what|why|how|when|where|which|who|can you explain|explain|tell me)\b",
    r"\bwhat does\b.*\bmean\b",
)

PREFERENCE_PATTERNS = {
    "voice": (r"\bvoice\b", r"\bspeak\b", r"\bread (it )?(aloud|out)\b", r"\bhands[- ]free\b", r"\btalk to me\b"),
    "screen_reader": (r"\bscreen[- ]reader\b", r"\bannounce\b", r"\bnarrat", ),
    "cognitive_simplified": (r"\bsimpl", r"\bplain language\b", r"\beasy words\b", r"\bplain words\b"),
    "high_contrast": (r"\bhigh[- ]contrast\b", r"\bbigger text\b", r"\blarger (text|font)\b", r"\bzoom\b"),
}

SUBMIT_PATTERNS = (
    r"\bsubmit\b",
    r"\bsend (the |my )?(form|application)\b",
    r"\bapprove submission\b",
    r"\bfinish (the )?application\b",
)

RESET_PATTERNS = (
    r"\breset\b",
    r"\bstart over\b",
    r"\bclear (everything|the form|all)\b",
    r"\berase everything\b",
)

NEGATED_SUBMIT = (
    r"\b(do not|don'?t|never|not)\s+(submit|send)\b",
    r"\bbefore submit",
    r"\bnot ready to submit\b",
)


def _tokens(text: str) -> List[str]:
    return [t for t in re.findall(r"[a-z0-9']+", (text or "").lower()) if t not in STOPWORDS]


def _field_text(field: FormField) -> str:
    return " ".join(
        [
            field.label,
            field.accessible_name,
            field.aria_label,
            field.help_text,
            field.semantic_name,
            field.semantic_description,
            field.name,
            field.field_id.replace("_", " "),
        ]
    )


def _field_keyword_score(field: FormField, message: str) -> float:
    message_tokens = set(_tokens(message))
    field_tokens = set(_tokens(_field_text(field)))
    if not message_tokens or not field_tokens:
        return 0.0
    overlap = message_tokens & field_tokens
    if not overlap:
        return 0.0
    return len(overlap) / max(3.0, len(field_tokens) ** 0.5)


def _best_field(fields: List[FormField], message: str) -> Optional[FormField]:
    scored = [(f, _field_keyword_score(f, message)) for f in fields]
    scored = [item for item in scored if item[1] > 0]
    if not scored:
        return None
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[0][0]


def _parse_number(message: str) -> Optional[float]:
    lowered = message.lower()

    pattern = r"(-?\d[\d,]*(?:\.\d+)?)\s*(thousand|lakhs?|lac|crores?|million|k)\b"
    match = re.search(pattern, lowered)
    if match:
        base = float(match.group(1).replace(",", ""))
        return base * MULTIPLIERS[match.group(2).rstrip(".")]

    word_pattern = r"\b(" + "|".join(WORD_NUMBERS) + r")\s+(thousand|lakhs?|lac|crores?|million)\b"
    match = re.search(word_pattern, lowered)
    if match:
        return float(WORD_NUMBERS[match.group(1)]) * MULTIPLIERS[match.group(2).rstrip(".")]

    match = re.search(r"(-?\d[\d,]*(?:\.\d+)?)", lowered)
    if match:
        return float(match.group(1).replace(",", ""))
    return None


def _parse_date(message: str) -> Optional[str]:
    iso = re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", message)
    if iso:
        try:
            datetime.strptime(iso.group(0), "%Y-%m-%d")
            return iso.group(0)
        except ValueError:
            return None

    slashed = re.search(r"\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b", message)
    if slashed:
        day, month, year = (int(g) for g in slashed.groups())
        try:
            return datetime(year, month, day).strftime("%Y-%m-%d")
        except ValueError:
            return None

    named = re.search(
        r"\b(\d{1,2})\s+(" + "|".join(MONTHS) + r")\s+(\d{4})\b", message.lower()
    )
    if named:
        day, month_name, year = named.groups()
        try:
            return datetime(int(year), MONTHS[month_name], int(day)).strftime("%Y-%m-%d")
        except ValueError:
            return None

    named2 = re.search(
        r"\b(" + "|".join(MONTHS) + r")\s+(\d{1,2}),?\s+(\d{4})\b", message.lower()
    )
    if named2:
        month_name, day, year = named2.groups()
        try:
            return datetime(int(year), MONTHS[month_name], int(day)).strftime("%Y-%m-%d")
        except ValueError:
            return None
    return None


def _match_options(field: FormField, message: str) -> List[str]:
    """Return every option value plausibly referenced by the message.

    Matching is strict on purpose: generic words shared by several options
    (for example "Degree") must never decide a selection.
    """
    lowered = " " + message.lower() + " "

    def words(text: str) -> List[str]:
        return [w for w in re.findall(r"[a-z]{4,}", text.lower()) if w not in STOPWORDS]

    counts: Dict[str, int] = {}
    for option in field.options:
        for word in set(words(option.label) + words(option.value.replace("_", " "))):
            counts[word] = counts.get(word, 0) + 1

    hits: List[str] = []
    for option in field.options:
        label = option.label.lower()
        value_text = option.value.lower().replace("_", " ")
        if label and label in lowered:
            hits.append(option.value)
            continue
        if value_text and re.search(r"\b" + re.escape(value_text) + r"\b", lowered):
            hits.append(option.value)
            continue
        distinctive = [w for w in set(words(label) + words(value_text)) if counts.get(w, 0) == 1]
        if distinctive and all(re.search(r"\b" + re.escape(w), lowered) for w in distinctive):
            hits.append(option.value)
    return hits


def _detect_preference(message: str) -> Dict[str, Any]:
    lowered = message.lower()
    found: Dict[str, bool] = {}
    for key, patterns in PREFERENCE_PATTERNS.items():
        if any(re.search(p, lowered) for p in patterns):
            found[key] = True
    if not found:
        return {}
    mode = "standard"
    if found.get("voice"):
        mode = "voice"
    elif found.get("screen_reader"):
        mode = "screen_reader"
    elif found.get("cognitive_simplified"):
        mode = "cognitive_simplified"
    return {
        "accessibility_mode": mode,
        "simplified_language": bool(found.get("cognitive_simplified")),
        "high_contrast": bool(found.get("high_contrast")),
    }


def _is_question(message: str) -> bool:
    lowered = message.strip().lower()
    return bool(
        any(re.search(p, lowered) for p in QUESTION_PATTERNS) or lowered.endswith("?")
    )


def _is_submit(message: str) -> bool:
    lowered = message.lower()
    if any(re.search(p, lowered) for p in NEGATED_SUBMIT):
        return False
    return any(re.search(p, lowered) for p in SUBMIT_PATTERNS)


def _is_reset(message: str) -> bool:
    return any(re.search(p, message.lower()) for p in RESET_PATTERNS)


def _ambiguity_phrase(message: str) -> Optional[str]:
    lowered = message.lower()
    for pattern in AMBIGUITY_PATTERNS:
        if re.search(pattern, lowered):
            return pattern
    return None


def analyze_intent(message: str) -> Dict[str, Any]:
    """Deterministic high-level intent classification."""
    text = (message or "").strip()
    lowered = text.lower()

    preference = _detect_preference(text)
    accessibility_mode = preference.get("accessibility_mode", "standard")

    if not text:
        goal, confidence = "unknown", 0.2
    elif _is_submit(text):
        goal, confidence = "form_submission", 0.92
    elif _is_reset(text):
        goal, confidence = "form_reset", 0.92
    elif re.match(r"^https?://", lowered):
        goal, confidence = "website_navigation", 0.9
    elif preference:
        goal, confidence = "information_request" if _is_question(text) else "form_entry", 0.9
    elif _is_question(text):
        goal, confidence = "information_request", 0.6
    elif _ambiguity_phrase(text):
        goal, confidence = "form_entry", 0.45
    else:
        goal = "form_entry"
        confidence = 0.92 if _has_concrete_value(text) else _weak_confidence(text)

    ambiguities: List[str] = []
    if _ambiguity_phrase(text):
        ambiguities.append("The message does not commit to a single value.")

    return {
        "goal": goal,
        "intent_confidence": confidence,
        "accessibility_mode": accessibility_mode,
        "ambiguities": ambiguities,
        "urgency": "high" if re.search(r"\b(urgent|deadline|today|asap)\b", lowered) else "normal",
        "source": "deterministic_nlu",
    }


def _has_concrete_value(message: str) -> bool:
    if re.search(r"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b", message):
        return True
    if _parse_date(message):
        return True
    lowered = message.lower()
    if any(word in lowered for word in MONEY_CONTEXT) and re.search(r"\d|[a-z]+\s+(lakh|crore|thousand)", lowered):
        return True
    if re.search(r"\b(my|the)\s+[\w\s]{2,30}\s+(is|are|:)\s+\S+", lowered):
        return True
    if re.search(r"\b(enter|type|select|choose|set|fill|focus|update|change)\b\s+\S+", lowered):
        return True
    if any(lowered.startswith(word) for word in AFFIRMATIVE):
        return True
    return False


def _weak_confidence(message: str) -> float:
    """Confidence for a statement with no explicitly recognised value pattern.

    Ordinary, well-formed English answers still deserve a solid score; only
    unintelligible input should collapse the confidence.
    """
    words = re.findall(r"[a-z']{2,}", message.lower())
    if not words:
        return 0.3

    def looks_like_word(word: str) -> bool:
        if word in STOPWORDS or word in WORD_NUMBERS:
            return True
        # Real English words carry vowels and avoid long consonant runs.
        return bool(re.search(r"[aeiouy]", word)) and not re.search(r"[bcdfghjklmnpqrstvwxz]{4}", word)

    plausible = [w for w in words if looks_like_word(w)]
    ratio = len(plausible) / len(words)
    if ratio < 0.5:
        return 0.3
    if ratio < 0.8:
        return 0.55
    return 0.8


def map_answer(
    message: str,
    fields: List[FormField],
    current_field_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Map one natural-language answer onto zero or more concrete field updates."""
    text = (message or "").strip()
    visible = [f for f in fields if f.visible]

    def result(**kwargs: Any) -> Dict[str, Any]:
        base: Dict[str, Any] = {
            "intent": "answer_question",
            "field_updates": [],
            "action_type": "type",
            "confidence": 0.3,
            "is_ambiguous": False,
            "needs_clarification": False,
            "is_high_risk": False,
            "target_field_id": "",
            "reasoning": "Deterministic interpreter.",
            "source": "deterministic_nlu",
        }
        base.update(kwargs)
        return base

    if not text:
        return result(is_ambiguous=True, needs_clarification=True, reasoning="Empty message.")

    # 1. Accessibility preference change (no form field involved).
    preference = _detect_preference(text)
    if preference and not _is_question(text) and not _is_submit(text):
        return result(
            intent="update_preferences",
            action_type="preference",
            confidence=0.95,
            preferences=preference,
            reasoning="Recognised an accessibility preference change request.",
        )

    # 2. Submission / reset.
    if _is_submit(text):
        return result(
            intent="submit",
            action_type="submit",
            confidence=0.9,
            is_high_risk=True,
            target_field_id="submit_btn",
            reasoning="Recognised an explicit submission request.",
        )

    if _is_reset(text):
        return result(
            intent="reset",
            action_type="clear",
            confidence=0.9,
            is_high_risk=True,
            reasoning="Recognised an explicit reset request.",
        )

    # 3. Questions are answered by the knowledge layer, never by filling fields.
    if _is_question(text):
        target = _best_field(visible, text)
        return result(
            intent="information_request",
            confidence=0.55,
            is_ambiguous=True,
            needs_clarification=True,
            target_field_id=target.field_id if target else "",
            reasoning="The message asks a question rather than supplying a value.",
        )

    # 4. Explicit ambiguity: refuse to guess, but say which field it concerns.
    if _ambiguity_phrase(text):
        target = _best_field(visible, text)
        if target is None and current_field_id:
            target = next((f for f in visible if f.field_id == current_field_id), None)
        return result(
            intent="ambiguous_answer",
            confidence=0.3,
            is_ambiguous=True,
            needs_clarification=True,
            target_field_id=target.field_id if target else "",
            reasoning="The answer does not commit to a single value, so nothing was filled.",
        )

    updates: List[Dict[str, Any]] = []
    used_fields: set = set()

    def add(field: FormField, value: Any, action_type: str, confidence: float, why: str) -> None:
        if field.field_id in used_fields:
            return
        used_fields.add(field.field_id)
        updates.append(
            {
                "field_id": field.field_id,
                "value": value,
                "action_type": action_type,
                "confidence": confidence,
                "reasoning": why,
                "is_ambiguous": False,
                "is_high_risk": False,
            }
        )

    lowered = text.lower()

    # 5a. Email.
    email_field = next(
        (f for f in visible if f.type == "email" or "email" in _field_text(f).lower()), None
    )
    if email_field:
        match = re.search(r"\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b", text)
        if match:
            add(email_field, match.group(0), "type", 0.96, "Extracted a valid email address.")
        else:
            loose = re.search(r"(?:e-?mail|mail)(?:\s+address)?\s*(?:is|:)\s*([^\s,;]+)", lowered)
            if loose:
                add(email_field, loose.group(1), "type", 0.9, "Extracted the stated email address.")

    # 5b. Date.
    date_field = next((f for f in visible if f.type == "date"), None)
    parsed_date = _parse_date(text)
    if date_field and parsed_date:
        add(date_field, parsed_date, "type", 0.95, "Extracted and normalised a date.")

    # 5c. Numbers / money.
    number_fields = [f for f in visible if f.type == "number"]
    if number_fields:
        number_field = _best_field(number_fields, text) or (
            number_fields[0] if any(w in lowered for w in MONEY_CONTEXT) else None
        )
        if number_field is not None and (
            any(w in lowered for w in MONEY_CONTEXT)
            or _field_keyword_score(number_field, text) > 0
            or current_field_id == number_field.field_id
        ):
            value = _parse_number(text)
            if value is not None and not (parsed_date and str(int(value)) in (parsed_date or "")):
                numeric = int(value) if float(value).is_integer() else value
                add(number_field, numeric, "type", 0.95, "Extracted a numeric amount.")

    # 5d. Choice fields (select / radio).
    for field in visible:
        if field.type not in {"select", "radio"} or field.field_id in used_fields:
            continue
        hits = _match_options(field, text)
        if len(hits) > 1:
            return result(
                intent="contradictory_answer",
                confidence=0.3,
                is_ambiguous=True,
                needs_clarification=True,
                target_field_id=field.field_id,
                reasoning=f"The message mentions several conflicting options for '{field.label}'.",
            )
        if len(hits) == 1:
            add(
                field,
                hits[0],
                "select" if field.type == "select" else "click",
                0.93,
                "Matched a single available option.",
            )

    # 5e. Checkbox (yes / no answers).
    for field in visible:
        if field.type != "checkbox" or field.field_id in used_fields:
            continue
        relevant = _field_keyword_score(field, text) > 0 or current_field_id == field.field_id
        if not relevant:
            continue
        if any(lowered.startswith(a) or f" {a}" in lowered for a in AFFIRMATIVE):
            add(field, True, "click", 0.93, "Interpreted an affirmative answer.")
        elif any(n in lowered for n in NEGATIVE):
            add(field, False, "click", 0.93, "Interpreted a negative answer.")

    # 5f. Names and other free-text fields.
    for field in visible:
        if field.type not in {"text", "textarea", "tel", "url"} or field.field_id in used_fields:
            continue
        field_words = [w for w in _tokens(_field_text(field)) if len(w) > 2][:6]
        if "name" in field_words:
            match = re.search(
                r"(?i)(?:my\s+(?:full\s+)?(?:legal\s+)?name\s+is|i\s+am|this\s+is)\s+([A-Za-z][A-Za-z.'\- ]{1,60})",
                text,
            )
            if match:
                add(field, match.group(1).strip().rstrip(".,"), "type", 0.95, "Extracted a personal name.")
                continue
        pattern = (
            r"(?i)\b(?:" + "|".join(re.escape(w) for w in field_words) + r")\b[^.?!]{0,20}?\s+(?:is|:)\s+([^,.;!?]+)"
        ) if field_words else None
        if pattern:
            match = re.search(pattern, text)
            if match:
                add(field, match.group(1).strip(), "type", 0.88, "Extracted a stated value for this field.")

    # 5g. Bare value typed into the currently active field.
    if not updates and current_field_id:
        active = next((f for f in visible if f.field_id == current_field_id), None)
        conversational = re.search(
            r"\b(i|we|you|want|need|apply|help|please|could|would|should|do|don'?t)\b",
            text.lower(),
        )
        # A command aimed at a control we could not find is never a value:
        # typing "click the missing button" into a name box would be wrong.
        unresolved_command = re.match(
            r"^\s*(click|press|tap|open|navigate|go to|scroll|download|upload)\b",
            text.lower(),
        )
        if (
            active
            and len(text.split()) <= 4
            and not _is_question(text)
            and not conversational
            and not unresolved_command
        ):
            if active.type in {"select", "radio"}:
                hits = _match_options(active, text)
                if len(hits) == 1:
                    add(active, hits[0], "select" if active.type == "select" else "click", 0.85,
                        "Matched the answer to the active field's options.")
            elif active.type in {"text", "textarea", "email", "tel", "url"}:
                add(active, text, "type", 0.8, "Applied the short answer to the active field.")

    if not updates:
        target = _best_field(visible, text)
        return result(
            intent="unmapped_answer",
            confidence=0.3,
            is_ambiguous=True,
            needs_clarification=True,
            target_field_id=target.field_id if target else "",
            reasoning="No form field could be matched confidently to that message.",
        )

    return result(
        intent="provide_multiple_answers" if len(updates) > 1 else "answer_question",
        field_updates=updates,
        action_type="fill",
        confidence=min(u["confidence"] for u in updates),
        target_field_id=updates[0]["field_id"],
        reasoning="; ".join(u["reasoning"] for u in updates),
    )
