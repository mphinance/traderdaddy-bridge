"""Convert demo: take a real IBKR (ib_insync) algo and make it broker-agnostic.

This is the migration story made concrete. Someone wrote a "trim the winners"
screen against Interactive Brokers using ib_insync, the de-facto IBKR Python
library. It is welded to IBKR: it imports the IBKR SDK, opens an IBKR socket,
and reads IBKR-shaped objects (pos.contract.symbol, pos.avgCost, ticker.last).

Converting it to run on ANY broker is a small, mechanical edit: replace the
five broker-specific data-access calls with the canonical (Tradier-shaped)
contract. The strategy math does not move one character. Then the same algo
runs on Tradier, tastytrade, SnapTrade, Alpaca, Schwab, and IBKR itself.

Run:  python -m tradier_canonical.convert_ibkr_algo

No em dashes anywhere in this file.
"""

from __future__ import annotations

from . import fixtures
from .adapters import get_adapter, supported_brokers


# ---------------------------------------------------------------------------
# BEFORE: the original IBKR algo, exactly as it was written against ib_insync.
# Shown verbatim (not executed here, it needs a live IBKR Gateway socket).
# Every line touching the broker is IBKR-specific and would have to be
# rewritten to support any other broker.
# ---------------------------------------------------------------------------
ORIGINAL_IBKR_ALGO = '''
from ib_insync import IB, Stock                       # IBKR SDK

ib = IB()
ib.connect("127.0.0.1", 7497, clientId=1)            # IBKR socket

def trim_candidates(threshold=0.05):
    out = []
    for pos in ib.positions():                       # IBKR Position objects
        sym = pos.contract.symbol                     # IBKR field
        avg = pos.avgCost                             # IBKR field
        [ticker] = ib.reqTickers(Stock(sym, "SMART", "USD"))  # IBKR call
        last = ticker.last                            # IBKR field
        gain = (last - avg) / avg                     # <-- strategy math
        if gain >= threshold:                         # <-- strategy math
            out.append((sym, pos.position, round(gain * 100, 1)))
    return out
'''


# ---------------------------------------------------------------------------
# AFTER: the same algo, converted to the canonical contract. The only thing
# that changed is the five data-access lines (now broker-agnostic). The
# strategy math (the two lines that matter) is byte-for-byte identical.
# ---------------------------------------------------------------------------
def trim_candidates(broker, threshold=0.05):
    """Flag positions trading at least `threshold` above their average cost."""
    positions = broker.get_positions()                       # was ib.positions()
    quotes = {q.symbol: q for q in broker.get_quotes([p.symbol for p in positions])}
    out = []
    for p in positions:
        sym = p.symbol                                       # was pos.contract.symbol
        avg = p.avg_price                                    # was pos.avgCost
        last = quotes[sym].last                              # was ticker.last
        gain = (last - avg) / avg                            # <-- unchanged
        if gain >= threshold:                                # <-- unchanged
            out.append((sym, p.quantity, round(gain * 100, 1)))
    return out


RAWS = {
    "tradier": fixtures.RAW_TRADIER,
    "tastytrade": fixtures.RAW_TASTYTRADE,
    "snaptrade": fixtures.RAW_SNAPTRADE,
    "alpaca": fixtures.RAW_ALPACA,
    "schwab": fixtures.RAW_SCHWAB,
    "ibkr": fixtures.RAW_IBKR,
}


def main():
    print("BEFORE  an IBKR-only algo (ib_insync). Every broker line is IBKR-shaped:")
    print(ORIGINAL_IBKR_ALGO)

    print("CONVERT  swap 5 data-access lines for the canonical contract. Math untouched.\n")

    # First prove it still runs on IBKR itself, through the new adapter.
    ibkr = get_adapter("ibkr", fixtures.RAW_IBKR)
    print(f"AFTER   same algo on IBKR via the adapter -> {trim_candidates(ibkr)}")

    # Then the payoff: the very same converted algo now runs on every broker.
    print("\nAnd now, with zero further changes, on every other broker too:\n")
    for name in supported_brokers():
        broker = get_adapter(name, RAWS[name])
        print(f"  {name:11s} trim candidates: {trim_candidates(broker)}")

    print(
        "\nThe IBKR algo is now broker-agnostic. Same logic, runs on Tradier."
        "\nThat is the migration: their code, pointed at your contract."
    )


if __name__ == "__main__":
    main()
