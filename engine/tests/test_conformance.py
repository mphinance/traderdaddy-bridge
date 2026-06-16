"""Conformance: divergent native payloads must collapse into ONE identical
canonical object. This is the proof the thesis holds.

Two tiers of source:
  - BROKERS map a full account surface (balances, positions, quotes, candles,
    orders).
  - DATA FEEDS (massive, databento) carry market data only: quotes, candles,
    and option chains. They raise on the account methods and still produce the
    exact same canonical objects as everyone else.

Run:  python -m pytest engine/tests/ -q
  or: python engine/tests/test_conformance.py

No em dashes anywhere in this file.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from engine import fixtures  # noqa: E402
from engine.adapters import DATA_ONLY, get_adapter, supported_brokers  # noqa: E402

# Every registered source, with its native payload.
ALL_RAWS = {
    "tradier": fixtures.RAW_TRADIER,
    "tastytrade": fixtures.RAW_TASTYTRADE,
    "snaptrade": fixtures.RAW_SNAPTRADE,
    "alpaca": fixtures.RAW_ALPACA,
    "schwab": fixtures.RAW_SCHWAB,
    "ibkr": fixtures.RAW_IBKR,
    "massive": fixtures.RAW_MASSIVE,
    "databento": fixtures.RAW_DATABENTO,
}

# The broker/feed split is owned by the registry's DATA_ONLY set, not redeclared.
DATA_RAWS = {k: v for k, v in ALL_RAWS.items() if k in DATA_ONLY}
BROKER_RAWS = {k: v for k, v in ALL_RAWS.items() if k not in DATA_ONLY}


def test_all_sources_registered():
    assert set(supported_brokers()) == set(ALL_RAWS)


def test_positions_are_identical_across_brokers():
    results = {}
    for name, raw in BROKER_RAWS.items():
        pos = get_adapter(name, raw).get_positions()
        assert len(pos) == 1, f"{name} should map exactly one position"
        results[name] = pos[0]

    ref = results["tradier"]
    for name, p in results.items():
        assert p.symbol == ref.symbol == "AAPL", name
        assert p.quantity == ref.quantity == 100.0, name
        assert p.cost_basis == ref.cost_basis == 18000.0, name
        assert p.avg_price == ref.avg_price == 180.0, name


def test_balances_are_identical_across_brokers():
    for name, raw in BROKER_RAWS.items():
        b = get_adapter(name, raw).get_balances()
        assert b.total_equity == 44000.0, name
        assert b.total_cash == 25000.0, name
        assert b.buying_power == 50000.0, name


def test_quotes_are_identical_across_all_sources():
    # Brokers AND data feeds collapse to the same canonical equity quote.
    for name, raw in ALL_RAWS.items():
        q = get_adapter(name, raw).get_quotes(["AAPL"])
        assert len(q) == 1, name
        assert q[0].symbol == "AAPL", name
        assert q[0].last == 190.0, name
        assert q[0].bid == 189.95, name
        assert q[0].ask == 190.05, name


def test_candles_identical_where_supported():
    # Every source that serves history must produce the same canonical candles.
    # SnapTrade (aggregator, no history endpoint) returns an empty list.
    series = {}
    for name, raw in ALL_RAWS.items():
        candles = get_adapter(name, raw).get_candles("AAPL")
        if name == "snaptrade":
            assert candles == [], "snaptrade has no history endpoint"
            continue
        assert len(candles) == 30, f"{name} should map 30 daily bars"
        series[name] = [(c.date, c.close) for c in candles]

    ref = series["tradier"]
    for name, s in series.items():
        assert s == ref, f"{name} candles diverge from tradier"


def test_momentum_signal_agrees_across_sources():
    from engine.strategy import ema_crossover

    stances = set()
    for name, raw in ALL_RAWS.items():
        candles = get_adapter(name, raw).get_candles("AAPL")
        if not candles:
            continue
        r = ema_crossover(candles)
        assert r.cross_type == "golden", f"{name} should see a golden cross"
        stances.add(r.stance)
    assert stances == {"BULLISH"}, "all history sources must agree on stance"


def test_option_chains_collapse_across_sources():
    # The Tradier reference broker and the two data feeds describe the same
    # AAPL 190 call. Core fields must be byte-identical after mapping, despite
    # wildly different native shapes.
    sources = {
        "tradier": fixtures.RAW_TRADIER,
        "massive": fixtures.RAW_MASSIVE,
        "databento": fixtures.RAW_DATABENTO,
    }
    contracts = {}
    for name, raw in sources.items():
        chain = get_adapter(name, raw).get_option_chain("AAPL", "2026-06-19")
        assert len(chain) == 1, name
        contracts[name] = chain[0]

    ref = contracts["tradier"]
    for name, c in contracts.items():
        assert c.symbol == ref.symbol == "AAPL260619C00190000", name
        assert c.underlying == ref.underlying == "AAPL", name
        assert c.option_type == ref.option_type == "call", name
        assert c.strike == ref.strike == 190.0, name
        assert c.expiration_date == ref.expiration_date == "2026-06-19", name
        assert c.bid == ref.bid == 5.10, name
        assert c.ask == ref.ask == 5.30, name
        assert c.last == ref.last == 5.20, name

    # Tradier and massive ship native greeks; databento serves raw data, none.
    assert contracts["tradier"].greeks is not None
    assert contracts["massive"].greeks is not None
    assert contracts["massive"].greeks["delta"] == 0.55
    assert contracts["databento"].greeks is None


def test_data_feeds_have_no_account_surface():
    from engine import OrderRequest

    for name, raw in DATA_RAWS.items():
        feed = get_adapter(name, raw)
        for call in (feed.get_balances, feed.get_positions):
            try:
                call()
            except NotImplementedError:
                pass
            else:
                raise AssertionError(f"{name} should not expose an account surface")
        try:
            feed.preview_order(OrderRequest(symbol="AAPL", side="buy", quantity=1))
        except NotImplementedError:
            pass
        else:
            raise AssertionError(f"{name} should not place orders")


def test_preview_order_never_executes():
    broker = get_adapter("tradier", fixtures.RAW_TRADIER)
    from engine import OrderRequest

    order = broker.preview_order(
        OrderRequest(symbol="AAPL", side="buy", quantity=10, type="market")
    )
    assert order.status == "preview"
    assert order.id is None


def _run_all():
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"PASS  {fn.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL  {fn.__name__}: {e}")
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    return failed


if __name__ == "__main__":
    sys.exit(1 if _run_all() else 0)
