# server: local read-only live backend

A tiny stdlib-only server that reads a real Tradier account live and serves it
as canonical JSON to the web app. It exists so the demo can show real data
without a static site ever holding a token.

It is strictly read-only. It calls only Tradier read endpoints (balances,
positions, quotes, history) and maps them through the same `engine` adapter the
rest of the project uses. There is no order, buy, sell, or money-movement call
anywhere in it.

## Run it

```bash
# from the repo root. Point BRIDGE_SECRETS at a file that defines the vars below,
# or just have them in your environment.
BRIDGE_SECRETS=/path/to/secrets.env python -m server.live_tradier
```

It listens on `http://localhost:8787/api/live?symbol=AAPL`.

Credentials it reads (env vars, or `KEY=VALUE` lines in `BRIDGE_SECRETS`):

| var | required | notes |
|-----|----------|-------|
| `TRADIER_ACCESS_TOKEN` | yes | your token, read at runtime, never logged or committed |
| `TRADIER_ACCOUNT_ID` | yes | the account to read |
| `TRADIER_ENDPOINT` | no | defaults to `https://api.tradier.com/v1` |
| `BRIDGE_PORT` | no | defaults to `8787` |

The token never enters git. `secrets.env` / `.env` are gitignored and the
`block_secrets_commit` hook guards against it.

## Use it with the web app (live mode)

Run the web app locally so it can reach `http://localhost:8787`:

```bash
cd web && npm run dev      # serves http://localhost:5173 (http, so no mixed-content block)
```

Open the local app, scroll to the Live section, and click **Connect**. You will
see your real balances, positions, quote, and the momentum signal, all mapped
by the canonical adapter.

Note: the public GitHub Pages site is served over https and browsers block
https pages from calling `http://localhost`, so live mode is a local-only
feature. The hosted site is the shareable demo; everything except live works
there.

## Production note

`place_order` stays preview-only everywhere. If live execution is ever added it
must be opt-in per adapter and never automatic. No money moves without a human.
