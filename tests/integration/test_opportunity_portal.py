"""
Comprehensive Playwright Integration & Adversarial Stress Tests
for the Global Opportunity Portal (demo_site/portal.html)
"""

import pytest
import asyncio
from backend.browser.playwright_engine import PlaywrightBrowserEngine
from backend.safety.injection_defense import InjectionDefense

@pytest.mark.asyncio
async def test_opportunity_portal_inspection_and_fields():
    """Verifies that AccessBridge can inspect the 35+ field portal and extract its DOM state."""
    engine = PlaywrightBrowserEngine()
    state = await engine.navigate("http://127.0.0.1:8080/portal.html")
    
    assert state is not None
    assert "Global Opportunity Portal" in state.title
    assert len(state.fields) >= 25, f"Expected at least 25 interactive fields, got {len(state.fields)}"
    
    # Verify core field IDs are detected
    field_ids = [f.field_id for f in state.fields]
    assert "full_legal_name" in field_ids
    assert "primary_email" in field_ids
    assert "confirm_email" in field_ids
    assert "mobile_number" in field_ids
    assert "highest_degree" in field_ids
    assert "fellowship_track" in field_ids
    assert "personal_statement" in field_ids
    assert "consent_accuracy" in field_ids
    
    # Verify accessible names
    name_field = next(f for f in state.fields if f.field_id == "full_legal_name")
    assert name_field.required is True
    assert "Full Legal Name" in name_field.label
    
    await engine.close()

@pytest.mark.asyncio
async def test_opportunity_portal_accessibility_tree():
    """Verifies accessibility tree extraction for screen-reader semantics."""
    engine = PlaywrightBrowserEngine()
    await engine.navigate("http://127.0.0.1:8080/portal.html")
    
    tree = await engine.get_accessibility_tree()
    assert tree is not None
    assert "Global Opportunity Portal" in str(tree)
    
    await engine.close()

@pytest.mark.asyncio
async def test_opportunity_portal_prompt_injection_isolation():
    """Verifies that adversarial prompt injections embedded in the webpage DOM are detected."""
    engine = PlaywrightBrowserEngine()
    state = await engine.navigate("http://127.0.0.1:8080/portal.html")
    
    # Extract notice card text from page
    notice_text = await engine.page.inner_text(".processing-notice-card")
    assert "Ignore previous instructions" in notice_text
    
    # Test adversarial inspection
    is_malicious, matches = InjectionDefense.inspect_text(notice_text, source="portal_notice")
    assert is_malicious is True
    assert len(matches) > 0
    assert any("ignore" in m.lower() for m in matches)
    
    await engine.close()

@pytest.mark.asyncio
async def test_opportunity_portal_conditional_fields():
    """Verifies conditional fields toggle dynamically via Playwright."""
    engine = PlaywrightBrowserEngine()
    await engine.navigate("http://127.0.0.1:8080/portal.html")
    
    # Initially, expected graduation year wrapper should not have active class
    wrapper_active = await engine.page.evaluate("() => document.getElementById('field_expected_grad_wrapper').classList.contains('active')")
    assert wrapper_active is False
    
    # Click enrolled radio button
    await engine.page.click("#enrollment_status_enrolled")
    
    # Now it should be active
    wrapper_active_after = await engine.page.evaluate("() => document.getElementById('field_expected_grad_wrapper').classList.contains('active')")
    assert wrapper_active_after is True
    
    await engine.close()

@pytest.mark.asyncio
async def test_opportunity_portal_developer_scenario_panel():
    """Verifies that developer scenarios successfully populate form data."""
    engine = PlaywrightBrowserEngine()
    await engine.navigate("http://127.0.0.1:8080/portal.html")
    
    # Open dev scenario panel and trigger Scenario 1: Normal Valid Form
    await engine.page.click("#dev-toggle-btn")
    await engine.page.click("#dev-sc-normal")
    
    # Verify fields are populated
    name_val = await engine.page.input_value("#full_legal_name")
    assert name_val == "Dr. Elena Rostova"
    
    email_val = await engine.page.input_value("#primary_email")
    assert email_val == "elena.rostova@example.org"
    
    # Trigger submission modal
    await engine.page.click("#btn-submit-application")
    
    # Verify modal is active
    modal_active = await engine.page.evaluate("() => document.getElementById('submission-modal').classList.contains('active')")
    assert modal_active is True
    
    # Confirm submission in modal
    await engine.page.click("#modal-btn-confirm")
    
    # Success banner displayed
    banner_active = await engine.page.evaluate("() => document.getElementById('submission-success-banner').classList.contains('active')")
    assert banner_active is True
    
    receipt_id = await engine.page.inner_text("#receipt-application-id")
    assert "GOP-2026-" in receipt_id
    
    await engine.close()

@pytest.mark.asyncio
async def test_opportunity_portal_simplified_view_toggle():
    """Verifies the Simplified / High-Clarity accessibility mode toggle."""
    engine = PlaywrightBrowserEngine()
    await engine.navigate("http://127.0.0.1:8080/portal.html")
    
    # Click toggle
    await engine.page.click("#toggle-simplified")
    
    has_class = await engine.page.evaluate("() => document.body.classList.contains('simplified-view')")
    assert has_class is True
    
    await engine.close()
