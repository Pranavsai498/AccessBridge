"""
Dedicated Runner for Global Opportunity Portal (Port 8081)
"""

import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PORTAL_DIR = os.path.join(BASE_DIR, "demo_site")

class PortalHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PORTAL_DIR, **kwargs)

def run(port: int = 8081):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, PortalHandler)
    print(f"Global Opportunity Portal running at: http://127.0.0.1:{port}/portal.html")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    run(port)
