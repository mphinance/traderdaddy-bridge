"""Demo: one algo, written once against the canonical (Tradier) contract,
runs UNMODIFIED across all six brokers (Tradier, tastytrade, SnapTrade, Alpaca,
Schwab, IBKR), then the same contract absorbs two market-data feeds.

This is the Wednesday money shot. The algo never imports a broker SDK and
never sees a broker-specific field name. Swapping the data source is a one
word change. The algo code does not move.

Run:  python -m engine.demo_algo

No em dashes anywhere in this file.
"""

from __future__ import annotations

from . import fixtures
from .adapters import DATA_ONLY, get_adapter


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


def main():
    # The broker/feed split is owned by the registry's DATA_ONLY set.
    brokers = {k: v for k, v in ALL_RAWS.items() if k not in DATA_ONLY}
    print(f"Same algo, {len(brokers)} brokers, zero algo changes:\n")
    for name, raw in brokers.items():
        broker = get_adapter(name, raw)  # <-- the ONLY thing that changes
        result = run_algo(broker)
        sig = result["signals"][0]
        print(
            f"  {name:11s} cash=${result['total_cash']:,.0f}  "
            f"{sig['symbol']} {sig['qty']:g} @ avg {sig['avg_price']:.2f} "
            f"last {sig['last']:.2f}  uPnL ${sig['unrealized_pnl']:,.2f}  "
            f"{'ABOVE' if sig['above_cost'] else 'below'} cost"
        )
    print(f"\n{len(brokers)} native shapes in. One canonical result out. The algo never moved.")

    feeds = {k: v for k, v in ALL_RAWS.items() if k in DATA_ONLY}
    _market_data_demo(feeds)


def _market_data_demo(feeds: dict):
    """The reach beyond brokers: pure market DATA feeds map into the same Tradier
    shapes too. massive.com and databento have no accounts, but they speak the
    same canonical quote, candle, and option chain. Tradier's shape is the
    market-data lingua franca, not only the broker one: any feed flows INTO it.
    """
    print("\nMarket data feeds (no accounts), same canonical quote + chain:\n")
    for name, raw in feeds.items():
        feed = get_adapter(name, raw)
        q = feed.get_quotes(["AAPL"])[0]
        candles = feed.get_candles("AAPL")
        c = feed.get_option_chain("AAPL", "2026-06-19")[0]
        greeks = "greeks" if c.greeks else "no greeks"
        print(
            f"  {name:11s} {q.symbol} last {q.last:.2f} bid {q.bid:.2f} ask {q.ask:.2f}"
            f"  {len(candles)} candles  |  {c.symbol} {c.option_type} @ {c.strike:.0f} "
            f"last {c.last:.2f} ({greeks})"
        )
    print("\nTwo unrelated data feeds in. One canonical quote, candle, and chain out.")


if __name__ == "__main__":
    main()
