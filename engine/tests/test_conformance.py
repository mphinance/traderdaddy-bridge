"""Conformance: three divergent native payloads must collapse into ONE
identical canonical object. This is the proof the thesis holds.

Run:  python -m pytest tradier_canonical/tests/ -q
  or: python tradier_canonical/tests/test_conformance.py

No em dashes anywhere in this file.
"""

from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from engine import fixtures  # noqa: E402
from engine.adapters import get_adapter, supported_brokers  # noqa: E402

RAWS = {
    "tradier": fixtures.RAW_TRADIER,
    "tastytrade": fixtures.RAW_TASTYTRADE,
    "snaptrade": fixtures.RAW_SNAPTRADE,
    "alpaca": fixtures.RAW_ALPACA,
    "schwab": fixtures.RAW_SCHWAB,
    "ibkr": fixtures.RAW_IBKR,
}


def test_all_brokers_registered():
    assert set(supported_brokers()) == set(RAWS)


def test_positions_are_identical_across_brokers():
    results = {}
    for name, raw in RAWS.items():
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
    for name, raw in RAWS.items():
        b = get_adapter(name, raw).get_balances()
        assert b.total_equity == 44000.0, name
        assert b.total_cash == 25000.0, name
        assert b.buying_power == 50000.0, name


def test_quotes_are_identical_across_brokers():
    for name, raw in RAWS.items():
        q = get_adapter(name, raw).get_quotes(["AAPL"])
        assert len(q) == 1, name
        assert q[0].symbol == "AAPL", name
        assert q[0].last == 190.0, name
        assert q[0].bid == 189.95, name
        assert q[0].ask == 190.05, name


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
