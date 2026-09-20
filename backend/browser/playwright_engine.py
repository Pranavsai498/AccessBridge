"""Playwright browser engine used for real website discovery and interaction."""

import asyncio
import base64
from typing import Any, Dict, Optional

from playwright.async_api import Browser, Page, Playwright, async_playwright

from backend.browser.engine_base import BaseBrowserEngine
from backend.config import BASE_DIR, settings
from backend.models.schemas import FormField, FormOption, WebPageState
from backend.safety.injection_defense import InjectionDefense


class PlaywrightBrowserEngine(BaseBrowserEngine):
    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self.url = f"http://{settings.HOST}:{settings.DEMO_PORT}/index.html"
        self._lock = asyncio.Lock()

    async def _ensure_browser(self) -> None:
        async with self._lock:
            if not self.playwright:
                self.playwright = await async_playwright().start()
            if not self.browser or not self.browser.is_connected():
                self.browser = await self.playwright.chromium.launch(
                    headless=settings.HEADLESS_BROWSER,
                    args=["--no-sandbox"],
                )
            if not self.page or self.page.is_closed():
                self.page = await self.browser.new_page()
                await self._open_initial_page()

    async def _open_initial_page(self) -> None:
        targets = [
            self.url,
            f"http://{settings.HOST}:{settings.PORT}/demo/index.html",
            f"file:///{BASE_DIR.as_posix()}/demo_site/index.html",
        ]
        for target in targets:
            try:
                await self.page.goto(target, wait_until="domcontentloaded", timeout=8000)
                self.url = self.page.url
                return
            except Exception:
                continue

    async def navigate(self, url: str) -> WebPageState:
        await self._ensure_browser()
        if not url.startswith(("http://", "https://", "file://")):
            raise ValueError("Only http://, https://, and local file:// URLs are supported by the browser engine.")

        try:
            response = await self.page.goto(
                url,
                wait_until="domcontentloaded",
                timeout=20000,
            )
            self.url = self.page.url
            try:
                await self.page.wait_for_load_state("networkidle", timeout=3000)
            except Exception:
                pass
            try:
                await self.page.wait_for_selector(
                    "form, input, select, textarea, button, body",
                    timeout=5000,
                )
            except Exception:
                pass

            if response and response.status >= 400:
                raise RuntimeError(f"Website returned HTTP {response.status}.")
        except Exception:
            # Keep the actual browser page available for diagnostics while
            # reporting the navigation failure to the API caller.
            self.url = self.page.url if self.page else url
            raise

        return await self.get_page_state()

    async def get_page_state(self) -> WebPageState:
        await self._ensure_browser()

        if self.page.url == "about:blank":
            await self._open_initial_page()

        try:
            await self.page.wait_for_selector(
                "form, input, select, textarea, button, body",
                timeout=3000,
            )
        except Exception:
            pass

        self.url = self.page.url
        title = await self.page.title()

        raw = await self.page.evaluate(
            """
            () => {
              const visible = (el) => {
                const style = window.getComputedStyle(el);
                const rect = el.getBoundingClientRect();
                return style.display !== 'none' &&
                       style.visibility !== 'hidden' &&
                       rect.width > 0 && rect.height > 0;
              };

              const text = (el) => (el?.innerText || el?.textContent || '').trim();

              const labelledBy = (el) => {
                const ids = (el.getAttribute('aria-labelledby') || '').split(/\\s+/).filter(Boolean);
                return ids.map(id => document.getElementById(id)).filter(Boolean).map(text).join(' ').trim();
              };

              const describedBy = (el) => {
                const ids = (el.getAttribute('aria-describedby') || '').split(/\\s+/).filter(Boolean);
                return ids.map(id => document.getElementById(id)).filter(Boolean).map(text).join(' ').trim();
              };

              const getLabel = (el) => {
                if (el.labels && el.labels.length) return text(el.labels[0]);
                const byAria = labelledBy(el);
                if (byAria) return byAria;
                const aria = el.getAttribute('aria-label');
                if (aria) return aria.trim();
                const parent = el.closest('label');
                if (parent) return text(parent);
                return '';
              };

              const controls = Array.from(document.querySelectorAll('input, select, textarea'))
                .filter(el => visible(el))
                .filter(el => {
                  const type = (el.getAttribute('type') || '').toLowerCase();
                  return !['hidden', 'submit', 'button', 'reset', 'image'].includes(type);
                });

              const fields = controls.map((el, index) => {
                const tag = el.tagName.toLowerCase();
                let type = tag === 'select' ? 'select' : (el.getAttribute('type') || 'text').toLowerCase();
                if (tag === 'textarea') type = 'textarea';

                const fieldset = el.closest('fieldset');
                const legend = fieldset?.querySelector('legend');
                const help = describedBy(el) || el.getAttribute('placeholder') || '';
                const label = getLabel(el) || el.getAttribute('name') || el.id || `field_${index + 1}`;
                const options = tag === 'select'
                  ? Array.from(el.options).map(o => ({ value: o.value, label: text(o), selected: o.selected }))
                  : [];

                let value = '';
                if (type === 'checkbox' || type === 'radio') value = el.checked ? 'true' : 'false';
                else value = el.value ?? '';

                return {
                  id: el.id || el.getAttribute('name') || `accessbridge_field_${index + 1}`,
                  name: el.getAttribute('name') || el.id || '',
                  type,
                  label,
                  required: Boolean(el.required || el.getAttribute('aria-required') === 'true'),
                  value,
                  placeholder: el.getAttribute('placeholder') || '',
                  autocomplete: el.getAttribute('autocomplete') || '',
                  aria_label: el.getAttribute('aria-label') || '',
                  aria_describedby: el.getAttribute('aria-describedby') || '',
                  accessible_name: labelledBy(el) || el.getAttribute('aria-label') || label,
                  help_text: help,
                  fieldset_label: legend ? text(legend) : '',
                  options,
                  is_focused: document.activeElement === el
                };
              });

              const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"]'))
                .filter(visible)
                .map((button, index) => ({
                  id: button.id || button.getAttribute('name') || `button_${index + 1}`,
                  label: text(button) || button.getAttribute('aria-label') || button.value || 'Button',
                  type: button.getAttribute('type') || 'button'
                }));

              const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
                .filter(visible)
                .map(text)
                .filter(Boolean)
                .slice(0, 20);

              const form = document.querySelector('form');
              const formLegend = form?.querySelector('legend');

              return {
                pageTitle: document.title || '',
                headings,
                formName: form?.getAttribute('aria-label') || formLegend?.innerText?.trim() || '',
                formDescription: form?.getAttribute('aria-describedby') || '',
                fields,
                buttons,
                bodyText: (document.body?.innerText || '').slice(0, 12000)
              };
            }
            """
        )

        fields = []
        untrusted_snippets = []
        has_injection = False

        for item in raw.get("fields", []):
            field_id = item.get("id") or item.get("name") or "unnamed_field"
            label = str(item.get("label", "")).strip()
            help_text = str(item.get("help_text", "")).strip()

            is_malicious, matches = InjectionDefense.inspect_text(
                f"{label} {help_text} {item.get('fieldset_label', '')}"
            )
            if is_malicious:
                has_injection = True
                untrusted_snippets.extend(matches)

            options = [FormOption(**option) for option in item.get("options", [])]
            normalized_type = item.get("type", "text")
            allowed_types = {
                "text", "email", "number", "date", "select", "radio",
                "checkbox", "textarea", "file", "password", "tel", "url"
            }
            if normalized_type not in allowed_types:
                normalized_type = "text"

            fields.append(
                FormField(
                    field_id=field_id,
                    name=item.get("name", ""),
                    label=label,
                    type=normalized_type,
                    required=bool(item.get("required", False)),
                    current_value=item.get("value", ""),
                    placeholder=item.get("placeholder", ""),
                    autocomplete=item.get("autocomplete", ""),
                    aria_label=item.get("aria_label", ""),
                    aria_describedby=item.get("aria_describedby", ""),
                    accessible_name=item.get("accessible_name", label),
                    help_text=help_text,
                    fieldset_label=item.get("fieldset_label", ""),
                    options=options,
                    is_focused=bool(item.get("is_focused", False)),
                    aria_required=bool(item.get("required", False)),
                    visible=True,
                )
            )

        buttons = raw.get("buttons", [])
        submit_button = next(
            (button for button in buttons if str(button.get("type", "")).lower() == "submit"),
            None,
        )
        if submit_button:
            buttons = buttons + [
                {
                    "id": "submit_btn",
                    "label": submit_button.get("label", "Submit"),
                    "type": "submit",
                    "dom_id": submit_button.get("id"),
                }
            ]
        elif fields:
            # The executor knows that this logical target means "the page's
            # submit control" and resolves it dynamically.
            buttons = buttons + [{"id": "submit_btn", "label": "Submit", "type": "submit"}]

        required_fields = [field for field in fields if field.required]

        def answered(field: FormField) -> bool:
            if field.type == "checkbox":
                return str(field.current_value).lower() in {"true", "yes", "checked", "1"}
            if field.type == "radio":
                return str(field.current_value).lower() not in {"", "false", "none", "null"}
            return field.current_value not in {"", None}

        is_valid = all(answered(field) for field in required_fields) and not any(
            field.validation_error for field in fields
        )

        return WebPageState(
            url=self.url,
            title=title or raw.get("pageTitle", ""),
            form_name=str(raw.get("formName", "")),
            form_description=str(raw.get("formDescription", "")),
            fields=fields,
            buttons=buttons,
            headings=raw.get("headings", []),
            current_focus=next(
                (field.field_id for field in fields if field.is_focused),
                None,
            ),
            form_accessible_summary=(
                f"Page '{title or raw.get('pageTitle', '')}' contains "
                f"{len(fields)} visible form controls and "
                f"{len(required_fields)} required controls."
            ),
            untrusted_content_detected=has_injection,
            untrusted_snippets=untrusted_snippets,
            is_form_valid=is_valid,
        )

    async def get_accessibility_tree(self) -> Dict[str, Any]:
        await self._ensure_browser()
        try:
            cdp = await self.page.context.new_cdp_session(self.page)
            ax = await cdp.send("Accessibility.getFullAXTree")
            await cdp.detach()
            if ax and "nodes" in ax:
                return {
                    "role": "WebArea",
                    "name": self.url,
                    "title": await self.page.title(),
                    "nodes_count": len(ax["nodes"]),
                    "nodes": ax["nodes"][:200],
                }
        except Exception:
            pass

        try:
            return {
                "role": "WebArea",
                "name": self.url,
                "title": await self.page.title(),
                "aria_yaml": await self.page.aria_snapshot(),
            }
        except Exception:
            state = await self.get_page_state()
            return {
                "role": "WebArea",
                "name": state.url,
                "title": state.title,
                "children": [
                    {
                        "role": field.type,
                        "name": field.accessible_name or field.label,
                        "required": field.required,
                    }
                    for field in state.fields
                ],
            }

    async def _locator(self, target_id: str):
        # Match by DOM id first, then by name.  CSS.escape is executed in the
        # page so unusual user-site identifiers do not break the selector.
        escaped = await self.page.evaluate(
            "id => CSS.escape(id)",
            target_id,
        )
        id_locator = self.page.locator(f"#{escaped}")
        if await id_locator.count():
            return id_locator.first

        name_locator = self.page.locator('[name="' + target_id.replace('"', '\\"') + '"]')
        if await name_locator.count():
            return name_locator.first
        return None

    async def type_text(self, target_id: str, text: str) -> bool:
        await self._ensure_browser()
        try:
            locator = await self._locator(target_id)
            if locator is None:
                return False
            await locator.fill(str(text))
            await locator.dispatch_event("input")
            await locator.dispatch_event("change")
            return True
        except Exception:
            return False

    async def click_element(self, target_id: str) -> bool:
        await self._ensure_browser()
        try:
            if target_id == "submit_btn":
                return await self._click_submit()
            locator = await self._locator(target_id)
            if locator is None:
                return False
            await locator.click()
            return True
        except Exception:
            return False

    async def _click_submit(self) -> bool:
        submit = self.page.locator(
            'button[type="submit"], input[type="submit"], button:has-text("Submit")'
        )
        if await submit.count():
            await submit.first.click()
            return True
        return False

    async def select_option(self, target_id: str, value: str) -> bool:
        await self._ensure_browser()
        try:
            locator = await self._locator(target_id)
            if locator is None:
                return False
            await locator.select_option(value=value)
            return True
        except Exception:
            return False

    async def get_value(self, target_id: str) -> Any:
        await self._ensure_browser()
        try:
            locator = await self._locator(target_id)
            if locator is None:
                return None
            return await locator.input_value()
        except Exception:
            return None

    async def focus_element(self, target_id: str) -> bool:
        await self._ensure_browser()
        try:
            locator = await self._locator(target_id)
            if locator is None:
                return False
            await locator.focus()
            return True
        except Exception:
            return False

    async def submit_form(self) -> Dict[str, Any]:
        await self._ensure_browser()
        try:
            if not await self._click_submit():
                return {
                    "success": False,
                    "status": "ERROR",
                    "message": "No submit control was found on the page.",
                }
            await asyncio.sleep(0.5)
            content = await self.page.content()
            lowered = content.lower()
            success = "success" in lowered or "submitted" in lowered or "thank you" in lowered
            return {
                "success": success,
                "status": "SUBMITTED" if success else "SUBMIT_CLICKED",
                "message": "Submission action executed on the live browser.",
            }
        except Exception as exc:
            return {"success": False, "status": "ERROR", "message": str(exc)}

    async def get_screenshot_base64(self) -> Optional[str]:
        await self._ensure_browser()
        try:
            image = await self.page.screenshot(type="png", full_page=False)
            return base64.b64encode(image).decode("utf-8")
        except Exception:
            return None

    async def close(self):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
