"""Demo: one algo, written once against the canonical (Tradier) contract,
runs UNMODIFIED across Tradier, tastytrade, and SnapTrade.

This is the Wednesday money shot. The algo never imports a broker SDK and
never sees a broker-specific field name. Swapping the data source is a one
word change. The algo code does not move.

Run:  python -m tradier_canonical.demo_algo

No em dashes anywhere in this file.
"""

from __future__ import annotations

from . import fixtures
from .adapters import get_adapter


def run_algo(broker) -> dict:
    """A tiny read-only momentum check. Pure canonical contract, no broker code.

    For each open position, value it at the live quote and flag names trading
    above their average cost. This stands in for any real strategy.
    """
    positions = broker.get_positions()
    symbols = [p.symbol for p in positions]
    quotes = {q.symbol: q for q in broker.get_quotes(symbols)}
    balances = broker.get_balances()

    signals = []
    market_value = 0.0
    for p in positions:
        q = quotes.get(p.symbol)
        last = q.last if q else None
        if last is None:
            continue
        mv = last * p.quantity
        market_value += mv
        unrealized = (last - (p.avg_price or 0)) * p.quantity
        signals.append(
            {
                "symbol": p.symbol,
                "qty": p.quantity,
                "avg_price": p.avg_price,
                "last": last,
                "unrealized_pnl": round(unrealized, 2),
                "above_cost": last > (p.avg_price or 0),
            }
        )

    return {
        "broker": broker.name,
        "total_cash": balances.total_cash,
        "positions_market_value": round(market_value, 2),
        "signals": signals,
    }


def main():
    raws = {
        "tradier": fixtures.RAW_TRADIER,
        "tastytrade": fixtures.RAW_TASTYTRADE,
        "snaptrade": fixtures.RAW_SNAPTRADE,
        "alpaca": fixtures.RAW_ALPACA,
        "schwab": fixtures.RAW_SCHWAB,
        "ibkr": fixtures.RAW_IBKR,
    }
    print(f"Same algo, {len(raws)} brokers, zero algo changes:\n")
    for name, raw in raws.items():
        broker = get_adapter(name, raw)  # <-- the ONLY thing that changes
        result = run_algo(broker)
        sig = result["signals"][0]
        print(
            f"  {name:11s} cash=${result['total_cash']:,.0f}  "
            f"{sig['symbol']} {sig['qty']:g} @ avg {sig['avg_price']:.2f} "
            f"last {sig['last']:.2f}  uPnL ${sig['unrealized_pnl']:,.2f}  "
            f"{'ABOVE' if sig['above_cost'] else 'below'} cost"
        )
    print(f"\n{len(raws)} native shapes in. One canonical result out. The algo never moved.")


if __name__ == "__main__":
    main()
