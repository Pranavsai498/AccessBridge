/**
 * AccessBridge content script.
 *
 * Responsibilities:
 *  1. Snapshot the form controls of the page the user is on (labels, help
 *     text, options, current values) in an accessibility-first way.
 *  2. Apply the actions the backend's safety gate approved - typing,
 *     selecting, toggling, focusing and (only after explicit confirmation)
 *     submitting.
 *  3. Apply visual accessibility preferences (high contrast, larger text).
 *
 * The script never sends anything on its own; it only responds to messages
 * from the AccessBridge side panel.
 */

(() => {
  if (window.__accessBridgeInjected) return;
  window.__accessBridgeInjected = true;

  const SKIP_TYPES = new Set(["hidden", "submit", "button", "reset", "image", "file"]);
  const SENSITIVE = /(password|card|cvv|cvc|ssn|social security|account number|pin)/i;

  const clean = (text) => (text || "").replace(/\s+/g, " ").trim().slice(0, 400);

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function labelFor(el) {
    if (el.getAttribute("aria-label")) return clean(el.getAttribute("aria-label"));
    const labelledBy = el.getAttribute("aria-labelledby");
    if (labelledBy) {
      const parts = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((n) => n.textContent);
      if (parts.length) return clean(parts.join(" "));
    }
    if (el.id) {
      const lab = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (lab) return clean(lab.textContent);
    }
    const wrapping = el.closest("label");
    if (wrapping) return clean(wrapping.textContent);
    if (el.placeholder) return clean(el.placeholder);
    if (el.name) return clean(el.name.replace(/[_-]+/g, " "));
    return "";
  }

  function helpFor(el) {
    const describedBy = el.getAttribute("aria-describedby");
    if (describedBy) {
      const parts = describedBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter(Boolean)
        .map((n) => n.textContent);
      if (parts.length) return clean(parts.join(" "));
    }
    if (el.title) return clean(el.title);
    return "";
  }

  function fieldKey(el, index) {
    if (el.id) return `#${el.id}`;
    if (el.name) return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
    if (!el.dataset.accessbridgeId) el.dataset.accessbridgeId = `ab-${index}`;
    return `[data-accessbridge-id="${el.dataset.accessbridgeId}"]`;
  }

  function resolve(fieldId) {
    try {
      return document.querySelector(fieldId);
    } catch {
      return null;
    }
  }

  function describeType(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === "textarea") return "textarea";
    if (tag === "select") return "select";
    if (el.isContentEditable) return "text";
    const type = (el.type || "text").toLowerCase();
    return type;
  }

  function snapshot() {
    const nodes = Array.from(
      document.querySelectorAll("input, select, textarea, [contenteditable='true']")
    );

    const radioGroups = new Map();
    const fields = [];

    nodes.forEach((el, index) => {
      const type = describeType(el);
      if (SKIP_TYPES.has(type)) return;
      if (el.disabled || el.readOnly) return;
      if (!isVisible(el)) return;

      const label = labelFor(el);
      // Never expose credential-style fields to the assistant.
      if (SENSITIVE.test(`${label} ${el.name || ""} ${el.id || ""}`) || type === "password") return;

      if (type === "radio") {
        const groupName = el.name || label;
        if (!groupName) return;
        if (!radioGroups.has(groupName)) {
          radioGroups.set(groupName, {
            field_id: fieldKey(el, index),
            name: groupName,
            label: clean(
              el.closest("fieldset")?.querySelector("legend")?.textContent || label || groupName
            ),
            type: "radio",
            required: el.required,
            current_value: "",
            options: [],
            help_text: helpFor(el),
            _elements: {},
          });
        }
        const group = radioGroups.get(groupName);
        const optionValue = el.value || label;
        group.options.push({ value: optionValue, label: label || optionValue, selected: el.checked });
        group._elements[optionValue] = fieldKey(el, index);
        if (el.checked) group.current_value = optionValue;
        return;
      }

      const field = {
        field_id: fieldKey(el, index),
        name: el.name || el.id || "",
        label: label || el.name || "field",
        accessible_name: label || el.name || "field",
        type,
        required: !!el.required || el.getAttribute("aria-required") === "true",
        current_value:
          type === "checkbox" ? (el.checked ? "yes" : "") : clean(el.value ?? el.textContent),
        help_text: helpFor(el),
        options:
          type === "select"
            ? Array.from(el.options)
                .filter((o) => o.value !== "")
                .map((o) => ({ value: o.value, label: clean(o.textContent), selected: o.selected }))
            : [],
      };
      fields.push(field);
    });

    radioGroups.forEach((group) => {
      const { _elements, ...rest } = group;
      window.__accessBridgeRadioMap = window.__accessBridgeRadioMap || {};
      window.__accessBridgeRadioMap[rest.field_id] = _elements;
      fields.push(rest);
    });

    const focused = document.activeElement;
    const currentFocus = fields.find((f) => resolve(f.field_id) === focused)?.field_id || null;

    return {
      url: location.href,
      title: clean(document.title),
      headings: Array.from(document.querySelectorAll("h1, h2"))
        .slice(0, 12)
        .map((h) => clean(h.textContent))
        .filter(Boolean),
      fields,
      current_focus: currentFocus,
    };
  }

  function highlight(el) {
    const previous = el.style.outline;
    el.style.outline = "3px solid #1d4ed8";
    el.style.outlineOffset = "2px";
    setTimeout(() => {
      el.style.outline = previous;
    }, 1800);
  }

  function setNativeValue(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
  }

  function applyAction(action) {
    const radioMap = window.__accessBridgeRadioMap || {};
    let selector = action.field_id;
    if (action.action === "select" && radioMap[selector] && radioMap[selector][action.value]) {
      selector = radioMap[selector][action.value];
    }
    const el = selector ? resolve(selector) : null;

    if (action.action === "submit") {
      const form = document.querySelector("form");
      const button =
        document.querySelector("button[type=submit], input[type=submit]") ||
        Array.from(document.querySelectorAll("button")).find((b) => /submit|send|apply/i.test(b.textContent));
      if (button) button.click();
      else if (form) form.submit();
      return { ok: !!(button || form), action: action.action };
    }

    if (!el) return { ok: false, action: action.action, field_id: action.field_id };

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
    highlight(el);

    if (action.action === "focus") return { ok: true, action: "focus", field_id: action.field_id };

    if (el.tagName.toLowerCase() === "select") {
      el.value = action.value;
      if (el.selectedIndex === -1) {
        const match = Array.from(el.options).find(
          (o) => o.textContent.trim().toLowerCase() === String(action.value).toLowerCase()
        );
        if (match) el.value = match.value;
      }
    } else if (el.type === "checkbox" || el.type === "radio") {
      el.checked = action.action === "click" ? !el.checked : String(action.value) !== "no";
    } else if (el.isContentEditable) {
      el.textContent = action.value ?? "";
    } else {
      setNativeValue(el, action.value ?? "");
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return { ok: true, action: action.action, field_id: action.field_id, value: action.value };
  }

  function applyPreferences(prefs) {
    const id = "accessbridge-preferences";
    let style = document.getElementById(id);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      document.documentElement.appendChild(style);
    }
    const rules = [];
    if (prefs.high_contrast) {
      rules.push(
        "html { filter: contrast(1.35) !important; }",
        "*:focus { outline: 3px solid #1d4ed8 !important; outline-offset: 2px !important; }"
      );
    }
    if (prefs.larger_text || prefs.simplified_language) {
      rules.push("html { font-size: 118% !important; line-height: 1.7 !important; }");
    }
    style.textContent = rules.join("\n");
    return { ok: true, applied: rules.length > 0 };
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    try {
      if (msg?.type === "AB_SNAPSHOT") sendResponse({ ok: true, data: snapshot() });
      else if (msg?.type === "AB_APPLY")
        sendResponse({ ok: true, results: (msg.actions || []).map(applyAction) });
      else if (msg?.type === "AB_PREFS") sendResponse(applyPreferences(msg.preferences || {}));
      else sendResponse({ ok: false, error: "Unknown message" });
    } catch (error) {
      sendResponse({ ok: false, error: String(error) });
    }
    return true;
  });
})();
