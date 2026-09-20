const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

async function parseResponse(res) {
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const detail = payload?.detail || res.statusText || `HTTP ${res.status}`;
    throw new Error(String(detail));
  }
  return payload;
}

export async function sendInteraction({ sessionId, message, profile, engine = 'playwright', confirmed = null }) {
  const res = await fetch(`${API_BASE}/api/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      accessibility_profile: profile,
      engine,
      confirmed
    })
  });
  return parseResponse(res);
}

export async function fetchFormState() {
  const res = await fetch(`${API_BASE}/api/form/state`);
  return parseResponse(res);
}

export async function fetchTraces(sessionId) {
  const res = await fetch(`${API_BASE}/api/traces/${sessionId}`);
  return parseResponse(res);
}

export async function fetchProfiles() {
  const res = await fetch(`${API_BASE}/api/profiles`);
  return parseResponse(res);
}

export async function switchEngine(engine) {
  const res = await fetch(`${API_BASE}/api/engine/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine })
  });
  return parseResponse(res);
}

export async function resetForm() {
  const res = await fetch(`${API_BASE}/api/form/reset`, { method: 'POST' });
  return parseResponse(res);
}

export async function fetchMcpTools() {
  const res = await fetch(`${API_BASE}/api/mcp/tools`);
  return parseResponse(res);
}

export async function fetchEvaluationResults() {
  const res = await fetch(`${API_BASE}/api/evaluation/results`);
  return parseResponse(res);
}

export async function fetchSafetySummary() {
  const res = await fetch(`${API_BASE}/api/safety/summary`);
  return parseResponse(res);
}

export async function fetchSystemStatus() {
  const res = await fetch(`${API_BASE}/api/status/system`);
  return parseResponse(res);
}

export async function fetchBrowserScreenshot() {
  const res = await fetch(`${API_BASE}/api/browser/screenshot`);
  return parseResponse(res);
}

export async function fetchBrowserStatus() {
  const res = await fetch(`${API_BASE}/api/browser/status`);
  return parseResponse(res);
}

export async function fetchA11yTree() {
  const res = await fetch(`${API_BASE}/api/browser/a11y-tree`);
  return parseResponse(res);
}

export async function navigateBrowser(url) {
  const res = await fetch(`${API_BASE}/api/browser/navigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return parseResponse(res);
}
