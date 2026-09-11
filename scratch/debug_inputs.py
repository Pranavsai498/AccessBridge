import asyncio
import sys
sys.path.insert(0, ".")
from backend.browser.playwright_engine import PlaywrightBrowserEngine

async def main():
    e = PlaywrightBrowserEngine()
    await e._ensure_browser()
    await e.page.goto(e.url)
    res = await e.page.evaluate("() => Array.from(document.querySelectorAll('input, select, textarea')).map(el => el.id)")
    print(f"Inputs found: {res}")
    s = await e.get_page_state()
    print(f"State fields count: {len(s.fields)}")
    await e.close()

if __name__ == "__main__":
    asyncio.run(main())
