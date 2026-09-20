/**
 * AccessBridge side panel.
 *
 * Talks to the local AccessBridge backend, snapshots the active tab's form
 * through the content script, and applies only the actions the backend's
 * safety gate approved.
 */

const DEFAULT_API = "http://127.0.0.1:8000";

const el = {
  log: document.getElementById("log"),
  summary: document.getElementById("page-summary"),
  form: document.getElementById("composer"),
  message: document.getElementById("message"),
  mic: document.getElementById("mic"),
  confidence: document.getElementById("confidence"),
  confidenceValue: document.getElementById("confidence-value"),
  decision: document.getElementById("decision"),
  confirmBar: document.getElementById("confirm-bar"),
  confirmText: document.getElementById("confirm-text"),
  confirmYes: document.getElementById("confirm-yes"),
  confirmNo: document.getElementById("confirm-no"),
  apiBase: document.getElementById("api-base"),
  speak: document.getElementById("speak-replies"),
  contrast: document.getElementById("high-contrast"),
  rescan: document.getElementById("rescan"),
};

const sessionId = `ext-${Math.random().toString(36).slice(2, 10)}`;
let settings = { apiBase: DEFAULT_API, speak: false, contrast: false };
let pendingMessage = null;
let busy = false;

/* --------------------------------------------------------------- helpers */

function addMessage(text, kind = "bot") {
  const node = document.createElement("div");
  node.className = `ab-msg ab-msg-${kind}`;
  node.textContent = text;
  el.log.appendChild(node);
  el.log.scrollTop = el.log.scrollHeight;
  if (kind === "bot" && settings.speak) speak(text);
}

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* speech is a nicety, never a requirement */
  }
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function sendToTab(payload) {
  const tab = await activeTab();
  if (!tab?.id) throw new Error("No active tab.");
  try {
    return await chrome.tabs.sendMessage(tab.id, payload);
  } catch {
    // The content script may not be injected yet (e.g. after an install).
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    return chrome.tabs.sendMessage(tab.id, payload);
  }
}

/* -------------------------------------------------------------- settings */

async function loadSettings() {
  const stored = await chrome.storage.local.get(["apiBase", "speak", "contrast"]);
  settings = {
    apiBase: (stored.apiBase || DEFAULT_API).replace(/\/$/, ""),
    speak: !!stored.speak,
    contrast: !!stored.contrast,
  };
  el.apiBase.value = settings.apiBase;
  el.speak.checked = settings.speak;
  el.contrast.checked = settings.contrast;
}

function persist() {
  chrome.storage.local.set(settings);
}

/* ----------------------------------------------------------- page status */

async function refreshPageSummary() {
  try {
    const response = await sendToTab({ type: "AB_SNAPSHOT" });
    const count = response?.data?.fields?.length || 0;
    el.summary.textContent = count
      ? `${count} fillable field${count === 1 ? "" : "s"} found on “${response.data.title || "this page"}”.`
      : "No fillable form fields found on this page yet.";
    return response.data;
  } catch {
    el.summary.textContent = "I can't read this page. Try a normal website tab, then re-scan.";
    return null;
  }
}

/* ------------------------------------------------------------ main cycle */

async function ask(message, confirmed = null) {
  if (busy) return;
  busy = true;
  el.decision.textContent = "Thinking…";

  try {
    const snapshot = await refreshPageSummary();
    if (!snapshot || !snapshot.fields.length) {
      addMessage("I couldn't find any form fields on this page, so there's nothing to fill in.", "error");
      return;
    }

    const res = await fetch(`${settings.apiBase}/api/extension/assist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, message, confirmed, ...snapshot }),
    });

    const payload = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(payload?.detail || `Server error ${res.status}`);
    }

    addMessage(payload.assistant_message || "Done.");
    if (payload.explanation) addMessage(payload.explanation, "note");

    const confidence = Math.round((payload.confidence || 0) * 100);
    el.confidence.value = confidence;
    el.confidenceValue.textContent = `${confidence}%`;
    el.decision.textContent = payload.decision ? `Decision: ${payload.decision}` : "";

    if (payload.untrusted_content_detected) {
      addMessage("Heads up: this page contains text trying to give me instructions. I ignored it.", "error");
    }

    if (payload.preferences && Object.keys(payload.preferences).length) {
      await sendToTab({ type: "AB_PREFS", preferences: payload.preferences });
    }

    if (payload.actions?.length) {
      const result = await sendToTab({ type: "AB_APPLY", actions: payload.actions });
      const failed = (result?.results || []).filter((r) => !r.ok);
      if (failed.length) {
        addMessage("I couldn't reach one of the fields on the page. It may have changed — re-scanning.", "error");
      }
      await refreshPageSummary();
    }

    if (payload.needs_confirmation) {
      pendingMessage = message;
      el.confirmText.textContent =
        payload.assistant_message || "Shall I go ahead and submit this form?";
      el.confirmBar.hidden = false;
      el.confirmYes.focus();
    } else {
      pendingMessage = null;
      el.confirmBar.hidden = true;
    }
  } catch (error) {
    addMessage(
      `I couldn't reach the AccessBridge server at ${settings.apiBase}. Start it, then try again. (${error.message})`,
      "error"
    );
    el.decision.textContent = "";
  } finally {
    busy = false;
  }
}

/* --------------------------------------------------------------- events */

el.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = el.message.value.trim();
  if (!text) return;
  addMessage(text, "user");
  el.message.value = "";
  ask(text);
});

el.message.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    el.form.requestSubmit();
  }
});

el.confirmYes.addEventListener("click", () => {
  el.confirmBar.hidden = true;
  if (pendingMessage) ask(pendingMessage, true);
});

el.confirmNo.addEventListener("click", () => {
  el.confirmBar.hidden = true;
  pendingMessage = null;
  addMessage("Cancelled. Nothing was submitted.", "note");
});

el.apiBase.addEventListener("change", () => {
  settings.apiBase = (el.apiBase.value || DEFAULT_API).replace(/\/$/, "");
  persist();
});

el.speak.addEventListener("change", () => {
  settings.speak = el.speak.checked;
  persist();
});

el.contrast.addEventListener("change", async () => {
  settings.contrast = el.contrast.checked;
  persist();
  await sendToTab({
    type: "AB_PREFS",
    preferences: { high_contrast: settings.contrast, larger_text: settings.contrast },
  }).catch(() => {});
});

el.rescan.addEventListener("click", refreshPageSummary);

/* Voice input via the browser's own speech recognition, when available. */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.interimResults = false;
  let listening = false;

  el.mic.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
      return;
    }
    recognition.start();
    listening = true;
    el.mic.setAttribute("aria-pressed", "true");
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript;
    el.message.value = transcript;
    el.form.requestSubmit();
  });

  recognition.addEventListener("end", () => {
    listening = false;
    el.mic.setAttribute("aria-pressed", "false");
  });
} else {
  el.mic.hidden = true;
}

/* ----------------------------------------------------------------- init */

(async function init() {
  await loadSettings();
  addMessage(
    "Hi, I'm AccessBridge. Tell me what to put on this page in your own words — for example “my email is priya@example.com”. I'll always ask before submitting.",
    "bot"
  );
  await refreshPageSummary();
  if (settings.contrast) {
    sendToTab({ type: "AB_PREFS", preferences: { high_contrast: true, larger_text: true } }).catch(() => {});
  }
  el.message.focus();
})();
