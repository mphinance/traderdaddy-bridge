"""EMA momentum crossover. Fast EMA over slow EMA (golden / death cross).

Written once against the canonical Candle shape, so it runs on any broker that
serves candles. Math is Michael's mur EMA + Pine crossover semantics.

Run:  python -m engine.strategy

No em dashes anywhere in this file.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import List, Optional, Sequence

from .contract import Candle
from .indicators import crossover, crossunder, ema


@dataclass(frozen=True)
class StrategyResult:
    fast: int
    slow: int
    closes: List[float]
    ema_fast: List[float]
    ema_slow: List[float]
    signal: str  # BUY | SELL | HOLD on the latest bar
    stance: str  # BULLISH | BEARISH | FLAT
    cross_index: int  # index of the most recent cross, or -1
    cross_type: Optional[str]  # "golden" | "death" | None
    bars_since_cross: Optional[int]


def ema_crossover(candles: Sequence[Candle], fast: int = 8, slow: int = 21) -> StrategyResult:
    closes = [c.close for c in candles]
    ef = ema(closes, fast)
    es = ema(closes, slow)

    cross_index = -1
    cross_type: Optional[str] = None
    for i in range(1, len(closes)):
        if crossover(ef, es, i):
            cross_index, cross_type = i, "golden"
        elif crossunder(ef, es, i):
            cross_index, cross_type = i, "death"

    last = len(closes) - 1
    stance = "FLAT"
    if last >= 0 and not math.isnan(ef[last]) and not math.isnan(es[last]):
        stance = "BULLISH" if ef[last] >= es[last] else "BEARISH"

    signal = "HOLD"
    if cross_index == last:
        signal = "BUY" if cross_type == "golden" else "SELL"

    bars_since = (last - cross_index) if cross_index >= 0 else None
    return StrategyResult(fast, slow, closes, ef, es, signal, stance, cross_index, cross_type, bars_since)


def main():
    from . import fixtures
    from .adapters import get_adapter, supported_brokers

    raws = {
        "tradier": fixtures.RAW_TRADIER,
        "tastytrade": fixtures.RAW_TASTYTRADE,
        "snaptrade": fixtures.RAW_SNAPTRADE,
        "alpaca": fixtures.RAW_ALPACA,
        "schwab": fixtures.RAW_SCHWAB,
        "ibkr": fixtures.RAW_IBKR,
    }
    print("EMA 8/21 crossover, one strategy, every broker that serves candles:\n")
    for name in supported_brokers():
        candles = get_adapter(name, raws[name]).get_candles("AAPL")
        if not candles:
            print(f"  {name:11s} no history endpoint (aggregator), candles unsupported")
            continue
        r = ema_crossover(candles)
        when = "latest bar" if r.bars_since_cross == 0 else f"{r.bars_since_cross} bars ago"
        print(f"  {name:11s} {r.stance:8s} {r.cross_type} cross {when}  ({len(candles)} bars)")
    print("\nIdentical candles in, identical signal out. The strategy never moved.")


if __name__ == "__main__":
    main()
