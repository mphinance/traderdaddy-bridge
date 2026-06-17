"""Unified FastAPI app: the read backend AND the universal MCP server, one process.

This is both halves of the bridge on one ASGI stack:
  - GET /api/live        the web app's read-only Tradier snapshot (real account)
  - /mcp                 the universal MCP server over HTTP/SSE (every broker),
                         the same FastMCP definition that mcp_server/universal.py
                         serves over stdio.

Run it:
    BRIDGE_SECRETS=/path/to/secrets.env python -m server.app
    # or: uvicorn server.app:app --host 127.0.0.1 --port 8787

The web app calls http://localhost:8787/api/live?symbol=AAPL (unchanged). An MCP
agent connects to http://localhost:8787/mcp. Hostable anywhere uvicorn runs
(Railway, like StrikeForge), which is how Tradier ships its own MCP over HTTP.

/api/live requires live Tradier creds by design (it reads a real account). The
MCP tools work with or without creds, falling back to sample payloads. Orders
preview only. No money moves without a human. No em dashes anywhere.
"""

from __future__ import annotations

import os

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from mcp_server.core import live_snapshot, load_secrets, mcp

load_secrets()  # pull TRADIER_* from BRIDGE_SECRETS if provided, at import time

# Mount the FastMCP HTTP app at /mcp. Its lifespan must be handed to the parent
# FastAPI app or the MCP session manager never starts.
mcp_app = mcp.http_app(path="/")

app = FastAPI(
    title="TraderDaddy Bridge",
    summary="Read-only Tradier snapshot + universal MCP server, one process.",
    lifespan=mcp_app.lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/live")
def api_live(symbol: str = "AAPL"):
    """Read-only canonical snapshot of the real Tradier account."""
    try:
        return live_snapshot(symbol.upper())
    except Exception as e:  # clean error to the UI, never a token in it
        return JSONResponse(status_code=502, content={"error": type(e).__name__, "detail": str(e)})


@app.get("/healthz")
def healthz():
    return {"ok": True}


app.mount("/mcp", mcp_app)


def main():
    port = int(os.environ.get("BRIDGE_PORT", "8787"))
    print(f"[bridge] read backend on  http://localhost:{port}/api/live")
    print(f"[bridge] universal MCP on  http://localhost:{port}/mcp")
    print("[bridge] reads only on /api/live. orders preview only. no money moves without a human.")
    uvicorn.run(app, host="127.0.0.1", port=port)


if __name__ == "__main__":
    main()
