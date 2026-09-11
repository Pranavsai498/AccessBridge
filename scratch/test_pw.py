import asyncio
import sys
sys.path.insert(0, ".")
from backend.browser.playwright_engine import PlaywrightBrowserEngine

async def main():
    e = PlaywrightBrowserEngine()
    print("[*] Ensuring browser...")
    await e._ensure_browser()
    print(f"[*] Page URL: {e.page.url}")
    try:
        res = await e.page.goto(e.url, timeout=5000)
        print(f"[*] Goto response: {res.status if res else 'None'}")
    except Exception as exc:
        print(f"[!] Goto failed: {exc}")
    
    state = await e.get_page_state()
    print(f"[*] State fields count: {len(state.fields)}")
    for f in state.fields:
        print(f"    - {f.field_id} ({f.label}) = '{f.current_value}'")
    await e.close()

if __name__ == "__main__":
    asyncio.run(main())
