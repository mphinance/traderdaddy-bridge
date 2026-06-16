"""Local, read-only live Tradier backend for TraderDaddy Bridge.

Reads your Tradier credentials from the environment at runtime (never from git),
calls ONLY Tradier read endpoints (balances, positions, quotes, history), maps
the native responses through the SAME engine adapter the demo uses, and serves
the canonical result as JSON to the local web app.

Strictly read-only. There is no order, buy, sell, or money-movement call
anywhere in this file, by design.

Run (from the repo root):
    BRIDGE_SECRETS=/c/Users/mphan/OneDrive/Documents/GitHub/mphinance/secrets.env \
        python -m server.live_tradier
    # then open the web app and click "Live (local)"

Credentials it looks for (env vars, or KEY=VALUE lines in BRIDGE_SECRETS):
    TRADIER_ACCESS_TOKEN   required
    TRADIER_ACCOUNT_ID     required
    TRADIER_ENDPOINT       optional, defaults to https://api.tradier.com/v1

No em dashes anywhere in this file.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from engine.adapters import get_adapter
from engine.strategy import ema_crossover

PORT = int(os.environ.get("BRIDGE_PORT", "8787"))


def _load_secrets() -> None:
    """Load KEY=VALUE lines from BRIDGE_SECRETS into os.environ if not already set.
    The file path is not a secret; the values never leave this process or get logged."""
    path = os.environ.get("BRIDGE_SECRETS")
    if not path or not os.path.isfile(path):
        return
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key, val = key.strip(), val.strip().strip('"').strip("'")
            os.environ.setdefault(key, val)


def _config():
    token = os.environ.get("TRADIER_ACCESS_TOKEN")
    account = os.environ.get("TRADIER_ACCOUNT_ID")
    endpoint = os.environ.get("TRADIER_ENDPOINT", "https://api.tradier.com/v1").rstrip("/")
    if not token or not account:
        raise RuntimeError(
            "Missing TRADIER_ACCESS_TOKEN or TRADIER_ACCOUNT_ID. Set them in the "
            "environment or point BRIDGE_SECRETS at a file that defines them."
        )
    return token, account, endpoint


def _get(endpoint: str, path: str, token: str, params: dict | None = None) -> dict:
    """GET a Tradier read endpoint and return parsed JSON. Read-only."""
    url = f"{endpoint}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, method="GET")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/json")
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.loads(resp.read().decode("utf-8"))


def fetch_canonical(symbol: str = "AAPL") -> dict:
    token, account, endpoint = _config()

    balances = _get(endpoint, f"/accounts/{account}/balances", token)
    positions = _get(endpoint, f"/accounts/{account}/positions", token)
    quotes = _get(endpoint, "/markets/quotes", token, {"symbols": symbol})
    history = _get(endpoint, "/markets/history", token, {"symbol": symbol, "interval": "daily"})

    # Tradier returns "null" (string) for empty positions; normalize for the adapter.
    if not isinstance(positions.get("positions"), dict):
        positions = {"positions": {"position": []}}

    raw = {"balances": balances, "positions": positions, "quotes": quotes, "history": history}
    a = get_adapter("tradier", raw)

    bal = a.get_balances()
    candles = a.get_candles(symbol)
    strat = ema_crossover(candles) if candles else None

    acct_masked = None
    if bal.account_number:
        s = str(bal.account_number)
        acct_masked = "****" + s[-4:] if len(s) > 4 else "****"

    return {
        "live": True,
        "source": "api.tradier.com (read-only)",
        "account": acct_masked,
        "balance": {
            "total_equity": bal.total_equity,
            "total_cash": bal.total_cash,
            "buying_power": bal.buying_power,
        },
        "positions": [
            {"symbol": p.symbol, "quantity": p.quantity, "cost_basis": p.cost_basis, "avg_price": _avg(p)}
            for p in a.get_positions()
        ],
        "quotes": [
            {"symbol": q.symbol, "last": q.last, "bid": q.bid, "ask": q.ask, "volume": q.volume}
            for q in a.get_quotes([symbol])
        ],
        "candle_count": len(candles),
        "momentum": None
        if strat is None
        else {
            "fast": strat.fast,
            "slow": strat.slow,
            "stance": strat.stance,
            "signal": strat.signal,
            "cross_type": strat.cross_type,
            "bars_since_cross": strat.bars_since_cross,
        },
    }


def _avg(p) -> float | None:
    return round(p.cost_basis / p.quantity, 6) if p.quantity else None


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):  # noqa: N802
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):  # noqa: N802
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path not in ("/api/live", "/"):
            self.send_response(404)
            self._cors()
            self.end_headers()
            return
        qs = urllib.parse.parse_qs(parsed.query)
        symbol = (qs.get("symbol", ["AAPL"])[0] or "AAPL").upper()
        try:
            payload = fetch_canonical(symbol)
            body = json.dumps(payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:  # surface a clean error to the UI, no token in it
            body = json.dumps({"error": type(e).__name__, "detail": str(e)}).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self._cors()
            self.end_headers()
            self.wfile.write(body)

    def log_message(self, *args):  # quiet, and never log query strings with creds
        return


def main():
    _load_secrets()
    try:
        _config()  # fail fast with a clear message if creds are missing
    except RuntimeError as e:
        print(f"[bridge] {e}", file=sys.stderr)
        sys.exit(1)
    print(f"[bridge] read-only Tradier backend on http://localhost:{PORT}/api/live")
    print("[bridge] orders are never called. reads only: balances, positions, quotes, history.")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
