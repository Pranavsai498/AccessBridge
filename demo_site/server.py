"""
Lightweight Static HTTP Server for AccessBridge Demo Site
"""

import os
import sys

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from http.server import HTTPServer, SimpleHTTPRequestHandler
from backend.config import settings

class DemoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        directory = os.path.dirname(os.path.abspath(__file__))
        super().__init__(*args, directory=directory, **kwargs)

def run_server(port: int = 8080):
    server_address = (settings.HOST, port)
    httpd = HTTPServer(server_address, DemoHandler)
    print(f"AccessBridge Demo Site running at http://{settings.HOST}:{port}/index.html")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else settings.DEMO_PORT
    run_server(port)
