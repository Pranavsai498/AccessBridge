"""
Unit Tests for AccessBridge FastMCP Tools
"""

import pytest
import asyncio
from backend.mcp.tools import (
    browser_get_page,
    browser_get_accessibility_tree,
    browser_get_form,
    browser_focus_element,
    browser_type,
    browser_click,
    browser_select,
    browser_get_value,
    browser_validate_form,
    user_get_preferences,
    user_update_preferences,
    knowledge_search,
    audit_log,
    request_user_confirmation,
    set_active_browser_engine
)
from backend.browser.simulated_engine import SimulatedBrowserEngine

@pytest.fixture(autouse=True)
def setup_engine():
    engine = SimulatedBrowserEngine()
    set_active_browser_engine(engine)

@pytest.mark.asyncio
async def test_browser_get_page_and_form():
    page = await browser_get_page()
    assert "fields" in page
    assert len(page["fields"]) >= 5

    form = await browser_get_form()
    assert len(form) >= 5
    field_ids = [f["field_id"] for f in form]
    assert "full_name" in field_ids
    assert "email" in field_ids

@pytest.mark.asyncio
async def test_browser_type_and_get_value():
    success = await browser_type("full_name", "Sarah Connor")
    assert success is True

    val = await browser_get_value("full_name")
    assert val == "Sarah Connor"

@pytest.mark.asyncio
async def test_browser_select_option():
    success = await browser_select("education_level", "masters")
    assert success is True

    val = await browser_get_value("education_level")
    assert val == "masters"

@pytest.mark.asyncio
async def test_browser_validate_form():
    # Empty form should be invalid
    res = await browser_validate_form()
    assert res["is_valid"] is False
    assert len(res["missing_required"]) > 0

@pytest.mark.asyncio
async def test_browser_accessibility_tree():
    tree = await browser_get_accessibility_tree()
    assert "role" in tree
    assert "children" in tree

def test_user_preferences_tools():
    prefs = user_get_preferences()
    assert "visual" in prefs
    assert "motor" in prefs

    updated = user_update_preferences({"high_contrast": True, "step_by_step": True})
    assert updated["high_contrast"] is True

def test_knowledge_search_tool():
    citations = knowledge_search("keyboard focus indicator")
    assert len(citations) > 0
    assert "rule_id" in citations[0]

def test_audit_log_and_confirmation():
    assert audit_log({"event": "test_event"}) is True
    res = request_user_confirmation("Review final application before submitting", "HIGH")
    assert res["status"] == "AWAITING_CONFIRMATION"
    assert res["risk_level"] == "HIGH"
