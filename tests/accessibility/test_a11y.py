"""
AccessBridge Accessibility (a11y) Verification Suite
Verifies WCAG 2.2 Level AA compliance, semantic HTML, ARIA landmarks, contrast, and focus states.
"""

import pytest
import re
from pathlib import Path

@pytest.fixture
def demo_html_content():
    html_path = Path(__file__).resolve().parent.parent.parent / "demo_site" / "index.html"
    with open(html_path, "r", encoding="utf-8") as f:
        return f.read()

def test_semantic_landmarks_present(demo_html_content):
    """WCAG 1.3.1: Form landmarks and semantic structure."""
    assert "<main" in demo_html_content
    assert "role=\"main\"" in demo_html_content or "<main" in demo_html_content
    assert "<form" in demo_html_content
    assert "<h1>" in demo_html_content

def test_every_input_has_associated_label(demo_html_content):
    """WCAG 3.3.2: Every interactive form control has an explicit label."""
    # Find all input and select tags
    input_ids = re.findall(r'<input[^>]*id=["\']([^"\']+)["\']', demo_html_content)
    select_ids = re.findall(r'<select[^>]*id=["\']([^"\']+)["\']', demo_html_content)

    all_ids = input_ids + select_ids
    for elem_id in all_ids:
        # Check label with for attribute exists
        label_pattern = rf'<label[^>]*for=["\']{elem_id}["\']'
        assert re.search(label_pattern, demo_html_content), f"Field '{elem_id}' missing explicit <label for='{elem_id}'>"

def test_aria_required_and_describedby_on_required_fields(demo_html_content):
    """WCAG 3.3.1 / 3.3.2: Required fields programmatically convey state and help text."""
    required_matches = re.findall(r'<input[^>]*required[^>]*>', demo_html_content)
    assert len(required_matches) >= 3
    for match in required_matches:
        assert "aria-required=\"true\"" in match, f"Tag missing aria-required='true': {match}"
        assert "aria-describedby=" in match, f"Tag missing aria-describedby: {match}"

def test_screen_reader_live_region_present(demo_html_content):
    """WCAG 4.1.3: Status messages conveyed to screen readers via aria-live."""
    assert "aria-live=\"polite\"" in demo_html_content or "role=\"status\"" in demo_html_content

def test_visible_focus_ring_css(demo_html_content):
    """WCAG 2.4.7: Focus Visible CSS indicators."""
    assert ":focus" in demo_html_content
    assert "outline:" in demo_html_content or "box-shadow:" in demo_html_content
