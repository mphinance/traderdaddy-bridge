# Tradier MCP reference (ingested)

Captured from https://docs.tradier.com/docs/tradier-mcp so we have it locally.
This is the tool vocabulary the TraderDaddy Bridge universal MCP server mirrors.
See [`mcp_server/`](../mcp_server/README.md) for the broker-agnostic implementation.

## What it is

A custom Model Context Protocol server from Tradier that links brokerage
capabilities to LLMs (ChatGPT, Claude, Cursor, and more): market data, account
details, documentation search, and trade execution, all from inside an AI
assistant.

## Connection

- **MCP server URL:** `https://mcp.tradier.com/mcp`
- **Transport:** Streamable HTTP
- **Auth:** API key, passed via header / query
  - Live: `api_key={YOUR_API_KEY}&paper_trading=false`
  - Paper: `api_key={YOUR_API_KEY}&paper_trading=true`
- API tokens come from your Tradier Brokerage account at `tradier.com` under API settings.

## Claude Code setup

```bash
# install the CLI if needed
brew install --cask claude-code

# add the Tradier MCP server
claude mcp add --transport http tradier https://mcp.tradier.com/mcp \
  --header "API_KEY: your_api_key_here" \
  --header "PAPER_TRADING: false"

# then launch
claude
# test
@tool get_user_profile
```

## The 24 tools (by category)

**Account & portfolio**
- User profile retrieval
- Account balances (current and historical)
- Positions
- Gain/loss reports
- Account transaction history (trades, dividends, options activity)

**Trading**
- Equity orders
- Single-leg and multileg options orders
- Advanced order types: OCO (one-cancels-other), OTO (one-triggers-other), OTOCO
- Order cancellation

**Market data**
- Real-time quotes
- Options chains with Greeks
- Historical price data
- Watchlist management (retrieve, add symbols)

**Reference**
- Market calendar
- Documentation search (order types, strategies, trading concepts)

## Why this matters to TraderDaddy Bridge

Tradier's MCP tools are shaped like Tradier's REST API, which is the exact shape
this repo's canonical contract targets. So the bridge makes a Tradier-shaped MCP
server **broker-agnostic for free**: keep the tool names and shapes, swap the
broker underneath. One tool vocabulary, every broker. That is the universal MCP
server in [`mcp_server/`](../mcp_server/README.md).
