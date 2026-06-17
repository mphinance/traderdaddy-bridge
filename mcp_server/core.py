"""Shared brain: broker routing + the FastMCP tool definitions.

One source of truth for the universal MCP server. Both transports (stdio for
local Claude Code, HTTP/SSE for hosting) and the web app's /api/live read
endpoint call into this module. Tools mirror the Tradier-MCP vocabulary; the
broker underneath is swappable, because every call routes through the canonical
adapters in engine/.

No em dashes anywhere.
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from dataclasses import asdict
from typing import Optional

from fastmcp import FastMCP

from engine import fixtures
from engine.adapters import DATA_ONLY, get_adapter, supported_brokers
from engine.contract import OrderRequest
from engine.strategy import ema_crossover

# Map a broker name to its bundled raw sample payload in engine/fixtures.py.
_FIXTURES = {
    "tradier": "RAW_TRADIER",
    "tastytrade": "RAW_TASTYTRADE",
    "snaptrade": "RAW_SNAPTRADE",
    "alpaca": "RAW_ALPACA",
    "schwab": "RAW_SCHWAB",
    "ibkr": "RAW_IBKR",
    "massive": "RAW_MASSIVE",
    "databento": "RAW_DATABENTO",
}


# ---------------------------------------------------------------------------
# Config + credentials
# ---------------------------------------------------------------------------
def load_secrets() -> None:
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
            os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))


def _broker() -> str:
    return os.environ.get("BRIDGE_BROKER", "tradier").lower()


def _tradier_live_config():
    """Return (token, account, endpoint) if live Tradier creds are present, else None."""
    token = os.environ.get("TRADIER_ACCESS_TOKEN")
    account = os.environ.get("TRADIER_ACCOUNT_ID")
    if not token or not account:
        return None
    endpoint = os.environ.get("TRADIER_ENDPOINT", "https://api.tradier.com/v1").rstrip("/")
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


def _tradier_live_raw(symbol: str, expiration: Optional[str] = None) -> dict:
    """Assemble a Tradier raw payload from the live read endpoints. Read-only."""
    token, account, endpoint = _tradier_live_config()
    raw = {
        "balances": _get(endpoint, f"/accounts/{account}/balances", token),
        "positions": _get(endpoint, f"/accounts/{account}/positions", token),
        "quotes": _get(endpoint, "/markets/quotes", token, {"symbols": symbol}),
        "history": _get(endpoint, "/markets/history", token, {"symbol": symbol, "interval": "daily"}),
    }
    # Tradier returns the string "null" for an empty positions set; normalize it.
    if not isinstance(raw["positions"].get("positions"), dict):
        raw["positions"] = {"positions": {"position": []}}
    if expiration:
        raw["chains"] = _get(
            endpoint, "/markets/options/chains", token,
            {"symbol": symbol, "expiration": expiration, "greeks": "true"},
        )
    return raw


def adapter_for(symbol: str, expiration: Optional[str] = None):
    """Return (adapter, source_label) for the selected broker.

    Live Tradier when creds are present, otherwise the bundled sample payloads,
    so the server works out of the box and the universality is demonstrable with
    zero credentials.
    """
    broker = _broker()
    if broker not in _FIXTURES:
        raise KeyError(f"unknown broker '{broker}'. known: {supported_brokers()}")
    if broker == "tradier" and _tradier_live_config():
        return get_adapter("tradier", _tradier_live_raw(symbol, expiration)), "api.tradier.com (live, read-only)"
    return get_adapter(broker, getattr(fixtures, _FIXTURES[broker])), "engine/fixtures.py (sample payload)"


# ---------------------------------------------------------------------------
# The web app's /api/live read snapshot. Real Tradier account, read-only.
# Requires live creds by design; this is the "real account" panel, not a demo.
# ---------------------------------------------------------------------------
def live_snapshot(symbol: str = "AAPL") -> dict:
    cfg = _tradier_live_config()
    if not cfg:
        raise RuntimeError(
            "Missing TRADIER_ACCESS_TOKEN or TRADIER_ACCOUNT_ID. Set them in the "
            "environment or point BRIDGE_SECRETS at a file that defines them."
        )
    adapter = get_adapter("tradier", _tradier_live_raw(symbol))
    bal = adapter.get_balances()
    candles = adapter.get_candles(symbol)
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
            {"symbol": p.symbol, "quantity": p.quantity, "cost_basis": p.cost_basis, "avg_price": p.avg_price}
            for p in adapter.get_positions()
        ],
        "quotes": [
            {"symbol": q.symbol, "last": q.last, "bid": q.bid, "ask": q.ask, "volume": q.volume}
            for q in adapter.get_quotes([symbol])
        ],
        "candle_count": len(candles),
        "momentum": None if strat is None else {
            "fast": strat.fast, "slow": strat.slow, "stance": strat.stance,
            "signal": strat.signal, "cross_type": strat.cross_type,
            "bars_since_cross": strat.bars_since_cross,
        },
    }


# ---------------------------------------------------------------------------
# The universal MCP server. One FastMCP definition, served over stdio (local)
# and HTTP/SSE (hosted). Tools mirror the Tradier-MCP read vocabulary.
# ---------------------------------------------------------------------------
mcp = FastMCP(
    "traderdaddy-bridge",
    instructions=(
        "Tradier-shaped brokerage tools that run on ANY broker. The broker is "
        "selected by the BRIDGE_BROKER env var (default tradier). Every tool "
        "returns the canonical Tradier shape regardless of the broker underneath."
    ),
)


@mcp.tool
def list_brokers() -> dict:
    """List the brokers and data feeds this universal server can speak to, and which is selected."""
    return {
        "selected": _broker(),
        "brokers": [b for b in supported_brokers() if b not in DATA_ONLY],
        "data_feeds": sorted(DATA_ONLY),
        "note": "Set BRIDGE_BROKER to switch. Every tool below speaks the same Tradier shape.",
    }


@mcp.tool
def get_user_profile() -> dict:
    """Profile for the selected broker account (broker, masked account number, data source)."""
    adapter, source = adapter_for("AAPL")
    bal = adapter.get_balances()
    acct = bal.account_number
    masked = ("****" + str(acct)[-4:]) if acct and len(str(acct)) > 4 else (acct or None)
    return {"broker": _broker(), "account": masked, "source": source}


@mcp.tool
def get_balances() -> dict:
    """Account balances (total equity, cash, buying power) in the canonical Tradier shape."""
    adapter, source = adapter_for("AAPL")
    out = asdict(adapter.get_balances())
    out["source"] = source
    return out


@mcp.tool
def get_positions() -> list:
    """Open positions (symbol, quantity, cost basis, average price) in the canonical Tradier shape."""
    adapter, _ = adapter_for("AAPL")
    rows = []
    for p in adapter.get_positions():
        row = asdict(p)
        row["avg_price"] = p.avg_price
        rows.append(row)
    return rows


@mcp.tool
def get_quotes(symbols: str = "AAPL") -> list:
    """Real-time quotes in the canonical Tradier shape. Pass one symbol or a comma-separated list."""
    wanted = [s.strip().upper() for s in symbols.split(",") if s.strip()] or ["AAPL"]
    adapter, _ = adapter_for(wanted[0])
    return [asdict(q) for q in adapter.get_quotes(wanted)]


@mcp.tool
def get_history(symbol: str = "AAPL") -> dict:
    """Daily OHLCV candles in the canonical Tradier shape."""
    symbol = symbol.upper()
    adapter, source = adapter_for(symbol)
    candles = adapter.get_candles(symbol)
    return {"symbol": symbol, "source": source, "candles": [asdict(c) for c in candles], "count": len(candles)}


@mcp.tool
def get_option_chain(symbol: str, expiration: Optional[str] = None) -> dict:
    """Option chain (with Greeks where the source carries them) in the canonical Tradier shape."""
    underlying = symbol.upper()
    adapter, source = adapter_for(underlying, expiration)
    chain = adapter.get_option_chain(underlying, expiration or "")
    return {
        "underlying": underlying, "expiration": expiration, "source": source,
        "options": [asdict(o) for o in chain], "count": len(chain),
    }


@mcp.tool
def get_momentum(symbol: str = "AAPL") -> dict:
    """EMA 8 / 21 crossover signal computed on the canonical candles. Same algo, any broker."""
    symbol = symbol.upper()
    adapter, source = adapter_for(symbol)
    candles = adapter.get_candles(symbol)
    if not candles:
        return {"symbol": symbol, "source": source, "momentum": None,
                "note": "this source serves no daily history (e.g. SnapTrade)"}
    s = ema_crossover(candles)
    return {
        "symbol": symbol, "source": source,
        "momentum": {
            "fast": s.fast, "slow": s.slow, "stance": s.stance, "signal": s.signal,
            "cross_type": s.cross_type, "bars_since_cross": s.bars_since_cross,
        },
    }


@mcp.tool
def place_order(
    symbol: str,
    side: str,
    quantity: float,
    type: str = "market",
    price: Optional[float] = None,
    duration: str = "day",
    klass: str = "equity",
) -> dict:
    """Stage an order. PREVIEW ONLY by design: returns status 'preview'. Live execution
    is opt-in per adapter and never automatic. No money moves without a human."""
    req = OrderRequest(
        symbol=symbol.upper(), side=side, quantity=float(quantity), type=type,
        price=float(price) if price is not None else None, duration=duration, klass=klass,
    )
    adapter, _ = adapter_for(req.symbol)
    out = asdict(adapter.preview_order(req))
    out["note"] = "preview only. live execution is opt-in per adapter and never automatic."
    return out
