# Universal MCP server: one Tradier-shaped vocabulary, every broker

Tradier ships an [MCP server](../docs/tradier-mcp.md) whose tools are shaped like
its REST API. This repo already maps every broker INTO that same Tradier shape.
So we expose the Tradier-MCP tool names and shapes **once**, and route each call
through the canonical adapter for whichever broker is selected.

Any agent that already speaks Tradier-MCP runs unchanged on tastytrade, Schwab,
Alpaca, IBKR, SnapTrade, or the massive.com / databento data feeds. One tool
vocabulary, every broker. That is the universal MCP server.

```
agent (speaks Tradier-MCP)
        |
        v
  mcp_server/core.py  (FastMCP)  ---- get_balances / get_quotes / get_history / place_order ...
        |
        v
  engine/ canonical adapters  ----  tradier | tastytrade | schwab | alpaca | ibkr | snaptrade | massive | databento
```

Built on **FastMCP**. The tools are defined once in [`core.py`](core.py) and
served over two transports:

- **stdio** for local Claude Code: `python -m mcp_server.universal`
- **HTTP/SSE** for hosting: mounted at `/mcp` by the FastAPI app in
  [`server/app.py`](../server/README.md), the way Tradier serves its own MCP over HTTP.

## Tools

Mirrors the Tradier-MCP read surface, plus two bridge extras:

| tool | shape |
| --- | --- |
| `list_brokers` | which brokers/feeds exist and which is selected |
| `get_user_profile` | broker + masked account + data source |
| `get_balances` | total equity, cash, buying power |
| `get_positions` | symbol, quantity, cost basis, avg price |
| `get_quotes` | last, bid, ask, volume (+ Greeks for options) |
| `get_history` | daily OHLCV candles |
| `get_option_chain` | strikes, bid/ask/last, Greeks where the source carries them |
| `get_momentum` | EMA 8/21 crossover (bridge extra: same algo, any broker) |
| `place_order` | **preview only** by design, no money moves without a human |

## Run it in Claude Code (stdio)

```bash
pip install -e .            # one time: fastmcp (+ fastapi/uvicorn for the HTTP half)
claude mcp add traderdaddy -- python -m mcp_server.universal
```

Or wire it by hand in an MCP client config:

```json
{
  "mcpServers": {
    "traderdaddy": {
      "command": "python",
      "args": ["-m", "mcp_server.universal"],
      "env": { "BRIDGE_BROKER": "tradier" }
    }
  }
}
```

## Run it over HTTP (hosted)

```bash
python -m server.app        # serves /mcp (and /api/live) on http://localhost:8787
```

Connect an MCP client to `http://localhost:8787/mcp`. Then ask: *"get me AAPL
quotes and the momentum signal."* Switch the broker underneath with
`BRIDGE_BROKER` and ask the exact same question. The answer comes back in the
identical shape every time.

## Brokers and data

- `BRIDGE_BROKER` selects the broker: `tradier` (default), `tastytrade`,
  `snaptrade`, `alpaca`, `schwab`, `ibkr`, plus the `massive` / `databento` data
  feeds (which serve market data only and refuse account/order tools honestly).
- **Live Tradier:** set `TRADIER_ACCESS_TOKEN` + `TRADIER_ACCOUNT_ID` (or point
  `BRIDGE_SECRETS` at a `KEY=VALUE` file holding them) and the `tradier` broker
  reads your real account through Tradier's read endpoints.
- **No credentials:** every broker answers from the bundled sample payloads in
  `engine/fixtures.py`, so the server works out of the box and the universality
  is demonstrable with zero setup.

## Honest status

Tradier is wired live; the other brokers answer from sample payloads today.
Wiring any of them live is the same one-file move as the rest of the bridge: give
its adapter a base URL and token and make the real REST calls. `place_order`
previews by design; live execution is opt-in per adapter and never automatic.

## Quick smoke test (in-memory, no network)

```bash
python -c "
import asyncio
from fastmcp import Client
from mcp_server.core import mcp
async def main():
    async with Client(mcp) as c:
        print([t.name for t in await c.list_tools()])
        print((await c.call_tool('get_quotes', {'symbols': 'AAPL'})).data)
asyncio.run(main())
"
```
