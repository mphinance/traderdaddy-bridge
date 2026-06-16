# tradier_canonical

**Tradier's API shape is the universal broker contract. Write an algo once, run it on any broker. Adding a broker is one file, not a rewrite.**

This is the working proof for the Tradier meeting (Wed 2026-06-17). Scope: equities and options.

## The thesis, proven

Six brokers return wildly different payloads for the same account:

- **Tradier** — clean flat JSON (`total_equity`, `cost_basis`)
- **tastytrade** — hyphenated keys, numbers as strings, long/short as a direction word, rows nested under `data.items`
- **SnapTrade** — aggregator shape, symbol is a nested object, balances are a per-account list, gives `units` + `average_purchase_price`
- **Alpaca** — every number a string, long/short as a `side` word, quotes served as a snapshot with the trade, quote, and bar in separate nested objects keyed `p` / `bp` / `ap` / `v`
- **Schwab** — everything buried under `securitiesAccount`, position size split across `longQuantity` and `shortQuantity`, ticker nested in an `instrument` object, quotes a dict keyed by symbol with fields split between `quote` and `reference`
- **IBKR** — balances are a ledger keyed by currency, instruments identified by `conid`, and market data fields keyed by NUMERIC codes (`"31"` last, `"84"` bid, `"86"` ask, `"87"` volume, `"55"` symbol), often strings with a price-status prefix

Every one of them maps INTO Tradier's shape through a thin adapter. Downstream, nothing knows the difference.

```
$ python -m engine.demo_algo

  tradier     cash=$25,000  AAPL 100 @ avg 180.00 last 190.00  uPnL $1,000.00  ABOVE cost
  tastytrade  cash=$25,000  AAPL 100 @ avg 180.00 last 190.00  uPnL $1,000.00  ABOVE cost
  snaptrade   cash=$25,000  AAPL 100 @ avg 180.00 last 190.00  uPnL $1,000.00  ABOVE cost
  alpaca      cash=$25,000  AAPL 100 @ avg 180.00 last 190.00  uPnL $1,000.00  ABOVE cost
  schwab      cash=$25,000  AAPL 100 @ avg 180.00 last 190.00  uPnL $1,000.00  ABOVE cost
  ibkr        cash=$25,000  AAPL 100 @ avg 180.00 last 190.00  uPnL $1,000.00  ABOVE cost

Six native shapes in. One canonical result out. The algo never moved.
```

## Converting an existing broker-locked algo

The migration story, made concrete. `convert_ibkr_algo.py` takes a real
ib_insync algo written against IBKR and converts it to the canonical contract:
swap the five broker-specific data-access lines, leave the strategy math
untouched, and the same algo now runs on all six brokers, IBKR included.

```bash
python -m engine.convert_ibkr_algo    # one broker, deep before/after
python -m engine.convert_onboarding    # five traders, five SDKs, onboarded
```

`convert_onboarding.py` is the sales motion: Bob (tastytrade), Jim (Schwab),
Fred (Alpaca), Dana (SnapTrade), and Will (IBKR) each wrote the same strategy
welded to their own broker's SDK. Each converts to the identical canonical
algo and runs on Tradier. That is the pitch direction: their code, pointed at
your contract.

The native shapes in each adapter and fixture were verified against the
brokers' official docs and SDKs. One nuance worth knowing for the demo: this
is a tested proof that runs on injected fixtures, not a live library hitting
broker REST endpoints with credentials. The mapping logic is real; the live
transport per adapter is the next step.

The one line that changes per broker is `get_adapter("tastytrade", ...)`. The strategy code is untouched.

## Why this is a Tradier pitch, not just engineering

Adapters map **other brokers INTO Tradier**, so a Schwab/tastytrade user adopts Tradier-native tooling and migrates toward Tradier. Tradier becomes the migration *target*, the lingua franca, the API every dev learns first. That is lower customer-acquisition cost and standard-setter status, sold as a developer experience.

The direction matters: mapping Tradier OUT to competitors would help them, so we never lead with that. Everything flows toward Tradier.

## Layout

```
tradier_canonical/
  contract.py            canonical shapes + BrokerAdapter interface (mirrors Tradier)
  adapters/
    tradier_native.py    reference (near identity map)
    tastytrade.py        tastytrade native -> canonical
    snaptrade.py         aggregator -> canonical (onboards SnapTrade's whole long tail)
    alpaca.py            Alpaca native -> canonical
    schwab.py            Schwab Trader API -> canonical
    ibkr.py              IBKR Client Portal Web API -> canonical
    __init__.py          registry + get_adapter() factory  <- add a broker here
  fixtures.py            real-shaped native payloads, no creds needed
  demo_algo.py           one algo, six brokers, zero changes
  convert_ibkr_algo.py   real ib_insync IBKR algo, converted to run on all six
  convert_onboarding.py  five traders on five SDKs, all onboarded to the contract
  tests/test_conformance.py   proves the six collapse to one identical object
```

## Run it

```bash
python -m engine.demo_algo            # the live demo
python engine/tests/test_conformance.py   # 5/5 pass, no pytest needed
```

## Adding a broker (the whole point)

1. Write `adapters/<broker>.py` mapping its native responses into `contract.py` shapes.
2. Register it in `adapters/__init__.py`.
3. Done. Every existing algo now runs on that broker.

In production each adapter takes credentials and a base URL and makes live REST calls instead of consuming injected fixtures. `place_order` is preview-only by design here; live execution is opt-in per adapter and never automatic.

## Status

Vertical slice: balances, positions, quotes, and order preview across 6 brokers (Tradier, tastytrade, SnapTrade, Alpaca, Schwab, IBKR), fully tested, plus a working IBKR-algo convert demo. Next: option chains + Greeks (Tradier's chain shape as the target).
