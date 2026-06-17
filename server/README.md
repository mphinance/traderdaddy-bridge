# server: read backend + universal MCP, one process

`server/app.py` is a FastAPI app that serves **both halves of the bridge** on one
ASGI stack:

- `GET /api/live` the web app's read-only Tradier snapshot (a real account)
- `/mcp` the universal MCP server over HTTP/SSE (every broker), the same FastMCP
  definition that `mcp_server/universal.py` serves over stdio

One uvicorn process feeds the web app's data and an agent's MCP tools. It is
hostable anywhere uvicorn runs (Railway, like StrikeForge), which is how Tradier
ships its own MCP over HTTP at `mcp.tradier.com`.

The read side is strictly read-only: it calls only Tradier read endpoints
(balances, positions, quotes, history) and maps them through the same `engine`
adapter the rest of the project uses. `place_order` previews only. No order,
buy, sell, or money-movement call exists in the read path.

## Run it

```bash
# from the repo root. Point BRIDGE_SECRETS at a file that defines the vars below,
# or just have them in your environment.
BRIDGE_SECRETS=/path/to/secrets.env python -m server.app
# or, equivalently:
uvicorn server.app:app --host 127.0.0.1 --port 8787
```

- read backend: `http://localhost:8787/api/live?symbol=AAPL`
- universal MCP: `http://localhost:8787/mcp`

Install the deps first (`pip install -e .`, or `pip install fastapi uvicorn fastmcp`).
The `engine/` reference and the stdio MCP server stay pure stdlib; these deps are
only for this hosted half.

Credentials it reads (env vars, or `KEY=VALUE` lines in `BRIDGE_SECRETS`):

| var | required | notes |
|-----|----------|-------|
| `TRADIER_ACCESS_TOKEN` | for `/api/live` | your token, read at runtime, never logged or committed |
| `TRADIER_ACCOUNT_ID` | for `/api/live` | the account to read |
| `TRADIER_ENDPOINT` | no | defaults to `https://api.tradier.com/v1` |
| `BRIDGE_PORT` | no | defaults to `8787` |
| `BRIDGE_BROKER` | no | which broker the MCP tools speak to, defaults to `tradier` |

`/api/live` requires live Tradier creds by design (it reads a real account). The
MCP tools work with or without creds, falling back to the sample payloads in
`engine/fixtures.py`. The token never enters git. `secrets.env` / `.env` are
gitignored and the `block_secrets_commit` hook guards against it.

## Use it with the web app (live mode)

Run the web app locally so it can reach `http://localhost:8787`:

```bash
cd web && npm run dev      # serves http://localhost:5173 (http, so no mixed-content block)
```

Open the local app, scroll to the Live section, and click **Connect**. You will
see your real balances, positions, quote, and the momentum signal, all mapped by
the canonical adapter.

Note: the public GitHub Pages site is served over https and browsers block https
pages from calling `http://localhost`, so live mode is a local-only feature. The
hosted site is the shareable demo; everything except live works there.

## Production note

`place_order` stays preview-only everywhere. If live execution is ever added it
must be opt-in per adapter and never automatic. No money moves without a human.
