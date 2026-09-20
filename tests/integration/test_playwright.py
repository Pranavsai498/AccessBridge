"""
Integration Tests for AccessBridge Playwright Real Browser Engine
"""

import pytest
import os
from pathlib import Path
from backend.browser.playwright_engine import PlaywrightBrowserEngine

@pytest.mark.asyncio
async def test_playwright_inspect_and_interact():
    engine = PlaywrightBrowserEngine()
    demo_path = Path(__file__).resolve().parent.parent.parent / "demo_site" / "index.html"
    file_url = demo_path.as_uri()

    try:
        # Navigate to local file URL
        page_state = await engine.navigate(file_url)
        assert page_state.title == "AccessBridge Global Fellowship Application"
        assert len(page_state.fields) >= 5

        # Type text
        typed = await engine.type_text("full_name", "Alex Rivera")
        assert typed is True

        val = await engine.get_value("full_name")
        assert val == "Alex Rivera"

        # Select option
        selected = await engine.select_option("education_level", "masters")
        assert selected is True

        sel_val = await engine.get_value("education_level")
        assert sel_val == "masters"

        # Inspect accessibility tree snapshot
        snapshot = await engine.get_accessibility_tree()
        assert snapshot is not None
        assert "children" in snapshot or "role" in snapshot

    finally:
        await engine.close()
