"""
AccessBridge: Master Launch Script
Starts Demo Site (8080), Backend API (8000), and Frontend Vite Server (5173).
"""

import sys
import os
import subprocess
import time
import signal

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    print("=" * 65)
    print("   ACCESSBRIDGE: Agentic Accessibility Layer Launcher")
    print("=" * 65)
    print(f"[*] Root Directory: {root_dir}")
    print("[*] Starting Demo Web Server on http://127.0.0.1:8080...")
    demo_proc = subprocess.Popen(
        [sys.executable, os.path.join(root_dir, "demo_site", "server.py")],
        cwd=root_dir
    )
    
    time.sleep(1)
    print("[*] Starting AccessBridge FastAPI Backend on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        [sys.executable, os.path.join(root_dir, "run_server.py")],
        cwd=root_dir
    )
    
    time.sleep(2)
    print("[*] Starting AccessBridge React Frontend on http://localhost:5173...")
    # On Windows npm is npm.cmd
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=frontend_dir
    )
    
    print("\n" + "=" * 65)
    print("   ALL SERVICES OPERATIONAL")
    print("=" * 65)
    print("   🌐 Frontend UI:    http://localhost:5173")
    print("   ⚙️  Backend API:    http://127.0.0.1:8000/docs")
    print("   📄 Target Form:    http://127.0.0.1:8080")
    print("   ⚠️  Malicious Site: http://127.0.0.1:8080/malicious_site.html")
    print("=" * 65)
    print("Press Ctrl+C to stop all services.\n")
    
    procs = [demo_proc, backend_proc, frontend_proc]
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Shutting down AccessBridge services...")
        for p in procs:
            try:
                p.terminate()
                p.wait(timeout=3)
            except Exception:
                p.kill()
        print("[*] Shutdown complete. Goodbye!")

if __name__ == "__main__":
    main()
