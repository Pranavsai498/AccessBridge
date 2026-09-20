# AccessBridge Browser Extension

The extension brings the AccessBridge assistant to **any** website, not just the
bundled demo form. It opens as a side panel next to the page, reads the page's
form controls, sends them to your local AccessBridge backend, and applies only
the actions the backend's safety gate approved.

## What it does

- **Plain-language form filling** — "my email is priya@example.com" fills the
  right field, even if the site labels it "Contact e-mail".
- **Voice input and spoken replies** — uses the browser's own speech engine, so
  nothing extra is installed.
- **Accessibility preferences** — high contrast and larger text can be applied
  to the page you are on.
- **Safety first** — the assistant never submits a form without an explicit
  yes, and page text that tries to give the AI instructions is ignored and
  reported to you.
- **Privacy** — password fields and anything that looks like a card number,
  CVV, SSN, PIN or account number are never read or sent.

## Install (developer mode)

1. Start the backend:
   ```bash
   python run_server.py        # serves http://127.0.0.1:8000
   ```
2. Open `chrome://extensions` in Chrome, Edge, Brave, Arc or Opera.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select this `extension/` folder
   (or unzip `accessbridge-extension.zip` and select the unzipped folder).
5. Pin **AccessBridge Assistant** and click it on any page with a form.

If your backend runs somewhere else, change the server address under
**Settings** in the side panel.

## How it is wired

```
side panel  --(page snapshot + your message)-->  POST /api/extension/assist
                                                  |
                          intake -> profile -> understanding -> RAG
                          -> proposal -> verification -> confidence gate
                                                  |
side panel  <--(approved actions only)-----------  RemoteDOMEngine
   |
   '--> content script types/selects/focuses inside your own tab
```

The backend never drives your browser. `RemoteDOMEngine`
(`backend/browser/remote_engine.py`) records what the agents decided; the
content script is the only thing that touches the page.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 definition |
| `background.js` | Service worker; opens the side panel |
| `content.js` | Page snapshot, action application, contrast/text preferences |
| `sidepanel.html/.css/.js` | Accessible conversation UI |
