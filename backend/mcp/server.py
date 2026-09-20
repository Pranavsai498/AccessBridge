"""
FastMCP Server Entrypoint for AccessBridge
"""

from backend.mcp.tools import mcp_server

def get_mcp_app():
    return mcp_server

if __name__ == "__main__":
    mcp_server.run()
