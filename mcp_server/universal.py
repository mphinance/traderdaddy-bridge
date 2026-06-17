"""Universal MCP server, stdio transport (for local Claude Code).

One Tradier-shaped tool vocabulary, every broker. The tools live in core.py and
are served here over MCP stdio. For the hosted HTTP/SSE transport, run the
FastAPI app in server/app.py instead; both share the same FastMCP definition.

Add it to Claude Code:
    claude mcp add traderdaddy -- python -m mcp_server.universal

Broker selection and credentials are documented in mcp_server/core.py and
mcp_server/README.md. No em dashes anywhere.
"""

from __future__ import annotations

from mcp_server.core import load_secrets, mcp


def main():
    load_secrets()  # pull TRADIER_* from BRIDGE_SECRETS if provided
    mcp.run()  # stdio transport


if __name__ == "__main__":
    main()
