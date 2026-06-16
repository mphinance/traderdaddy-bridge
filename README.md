# TraderDaddy Bridge

**Every broker, one Tradier-shaped contract. Write an algo once, run it on any broker. Adding a broker is one file, not a rewrite.**

A universal broker adapter for US equities and options. Tradier's API is the cleanest in the business, so it becomes the canonical contract that every other broker maps INTO. Write your strategy once against the Tradier shape and it runs unchanged on tastytrade, Schwab, Alpaca, SnapTrade, and IBKR.

**Live demo:** https://mphinance.github.io/traderdaddy-bridge/

![TraderDaddy Bridge](docs/hero.png)

## The thesis

Six brokers return wildly different payloads for the same account. Every one of them maps into Tradier's shape through a thin adapter, and downstream nothing knows the difference.

![Native to canonical](docs/transform.png)

- **Tradier** clean flat JSON, the reference shape
- **tastytrade** hyphenated keys, string numbers, direction word, quotes over a DXLink WebSocket
- **SnapTrade** aggregator, ticker nested three deep, no volume on quotes
- **Alpaca** every number a string, snapshot quotes with one-letter keys
- **Schwab** everything under `securitiesAccount`, size split across long/short quantity
- **IBKR** ledger keyed by currency, market data by numeric field code (31=last, 84=bid)

Pick a broker on the live demo and watch its raw payload collapse into the canonical object in real time. The transform is real TypeScript running in your browser, not a recording.

## Why Tradier-shaped, not neutral

Other unified APIs (OpenAlgo for India, ccxt for crypto) map brokers into a deliberately neutral schema. This one does the opposite on purpose: it favors Tradier. When other brokers' users adopt Tradier-native tooling, they migrate toward Tradier. Tradier becomes the lingua franca, the API every developer learns first. That is the whole point. It is a business thesis, not a neutral utility.

## What is in here

```
traderdaddy-bridge/
  engine/        Python reference engine (the canonical contract + 6 adapters + tests)
  web/           Vite + TypeScript live demo (deployed to GitHub Pages)
  docs/          screenshots
```

### The Python engine
The source of truth. Canonical contract, six adapters, conformance tests, and two convert demos.

```bash
# from the repo root
python -m engine.demo_algo              # one algo, six brokers, identical result
python -m engine.convert_onboarding     # five traders, five SDKs, all onboarded
python engine/tests/test_conformance.py # proves the six collapse to one object
```

### The web demo
The interactive, deployable face of it. The six adapters are ported to TypeScript and run client-side, so the transform you see is genuinely executing.

```bash
cd web
npm install
npm run dev        # local dev server
npm run build      # static build into web/dist
```

## Adding a broker

1. Write one adapter mapping the broker's native responses into the contract (`engine/adapters/<broker>.py` and `web/src/adapters/index.ts`).
2. Register it.
3. Every existing algo now runs on that broker.

## The agentic angle

Tradier ships an MCP server whose tools are shaped like its API, the exact shapes this layer targets. So the canonical layer makes a Tradier-shaped MCP broker-agnostic for free. Every algo written for Tradier runs on any broker (developer acquisition), and every agent speaking Tradier-MCP runs on any broker (the agentic-trading wave). One tool vocabulary, every broker.

## Honest status

This is a working, tested proof, not a live trading library. The canonical contract, all six adapters, the conformance tests, and every transform in the demo are real and run on sample payloads that were verified against each broker's official docs and SDK. What is not wired yet: live authenticated REST calls to each broker. That needs credentials and a backend host and is deliberately kept out of a static site. The mapping logic is done; the live transport is the next step.

Reads are the universal surface. Order placement previews by design. Live execution is opt-in per adapter and never automatic. No money moves without a human.

## License

MIT. Permissive on purpose: this is meant to be adopted, including by Tradier.
