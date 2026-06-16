"""massive.com adapter — maps massive.com market data INTO Tradier's shapes.

massive.com is Polygon.io rebranded (renamed October 2025). It is a market
DATA feed, not a broker: there are no accounts, positions, or orders, so the
account methods raise. What it does carry maps cleanly onto Tradier's market
shapes:

  - equity snapshot: lastTrade.p = last, lastQuote.p = bid, lastQuote.P = ask,
    day.v = volume (Polygon's terse one/two-letter snapshot keys).
  - daily candles: the aggregates endpoint, t in epoch ms, o/h/l/c/v keys.
  - options chain snapshot: contract_type as a word, an "O:" ticker prefix on
    the OCC symbol, and NATIVE greeks (delta/gamma/theta/vega + IV).

This is the reach beyond brokers: TraderDaddy keeps reading Tradier-shaped
quotes, candles, and chains, and massive.com can sit behind them unchanged.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Sequence

from ..contract import Balance, Candle, OptionContract, Order, OrderRequest, Position, Quote


class MassiveAdapter:
    name = "massive"

    def __init__(self, raw: dict):
        self._raw = raw

    # massive.com is a data feed, not a broker. These have no meaning here.
    def get_balances(self) -> Balance:
        raise _no_accounts()

    def get_positions(self) -> List[Position]:
        raise _no_accounts()

    def preview_order(self, req: OrderRequest) -> Order:
        raise _no_accounts()

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        t = self._raw["snapshot"]["ticker"]
        if t["ticker"].upper() not in wanted:
            return []
        trade = t.get("lastTrade") or {}
        quote = t.get("lastQuote") or {}
        day = t.get("day") or {}
        return [
            Quote(
                symbol=t["ticker"],
                description=None,  # snapshot carries no long name
                last=_f(trade.get("p")),
                bid=_f(quote.get("p")),  # lower-case p is the BID price
                ask=_f(quote.get("P")),  # upper-case P is the ASK price
                volume=_i(day.get("v")),
            )
        ]

    def get_candles(self, symbol: str) -> List[Candle]:
        rows = self._raw.get("aggregates", {}).get("results", [])
        return [
            Candle(
                date=_ms_to_date(b["t"]),
                open=float(b["o"]),
                high=float(b["h"]),
                low=float(b["l"]),
                close=float(b["c"]),
                volume=float(b["v"]),
            )
            for b in rows
        ]

    def get_option_chain(self, underlying: str, expiration: str) -> List[OptionContract]:
        out = []
        for r in self._raw["option_chain"]["results"]:
            d = r["details"]
            if d["underlying_ticker"].upper() != underlying.upper():
                continue
            if expiration and d["expiration_date"] != expiration:
                continue
            lq = r.get("last_quote") or {}
            lt = r.get("last_trade") or {}
            out.append(
                OptionContract(
                    symbol=_occ(r["ticker"]),
                    underlying=d["underlying_ticker"],
                    option_type=d["contract_type"],  # already "call" | "put"
                    strike=float(d["strike_price"]),  # massive sends a plain number
                    expiration_date=d["expiration_date"],
                    bid=_f(lq.get("bid")),
                    ask=_f(lq.get("ask")),
                    last=_f(lt.get("price")),
                    greeks=_greeks(r),
                )
            )
        return out


def _occ(ticker: str) -> str:
    """massive prefixes option tickers with 'O:'. Strip it to the OCC symbol."""
    return ticker[2:] if ticker.upper().startswith("O:") else ticker


def _greeks(row: dict):
    """massive ships native greeks. Carry them plus IV in the canonical dict."""
    g = row.get("greeks")
    if not g:
        return None
    out = dict(g)
    if row.get("implied_volatility") is not None:
        out["iv"] = row["implied_volatility"]
    return out


def _ms_to_date(ms) -> str:
    """massive aggregate timestamps are epoch milliseconds."""
    return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


def _no_accounts() -> NotImplementedError:
    return NotImplementedError(
        "massive.com is a market data feed, not a broker: no accounts, "
        "positions, or orders. Use get_quotes / get_candles / get_option_chain."
    )


def _f(v):
    return float(v) if v is not None else None


def _i(v):
    return int(float(v)) if v is not None else None
