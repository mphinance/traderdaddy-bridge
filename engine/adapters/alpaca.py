"""Alpaca adapter — maps Alpaca's native shapes INTO Tradier's.

Alpaca encodes every number as a string, expresses long/short as a side word,
and serves market data as a snapshot where the trade, quote, and bar live in
separate nested objects with one-letter keys (p, bp, ap, v). None of that
leaks past this file.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from typing import List, Sequence

from ..contract import Balance, Order, OrderRequest, Position, Quote


class AlpacaAdapter:
    name = "alpaca"

    def __init__(self, raw: dict):
        self._raw = raw

    def get_balances(self) -> Balance:
        a = self._raw["account"]
        return Balance(
            total_equity=float(a["equity"]),
            total_cash=float(a["cash"]),
            buying_power=float(a["buying_power"]) if a.get("buying_power") is not None else None,
            account_number=a.get("account_number"),
        )

    def get_positions(self) -> List[Position]:
        out = []
        for r in self._raw["positions"]:
            qty = float(r["qty"])
            # Alpaca carries magnitude in qty and direction in side.
            if str(r.get("side", "long")).lower() == "short":
                qty = -abs(qty)
            avg = float(r["avg_entry_price"])
            out.append(
                Position(
                    symbol=r["symbol"],
                    quantity=qty,
                    cost_basis=round(qty * avg, 6),
                    date_acquired=None,  # Alpaca's positions endpoint omits this
                )
            )
        return out

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        out = []
        # Alpaca snapshots are keyed by symbol; trade/quote/bar are nested.
        for sym, snap in self._raw["snapshots"].items():
            if sym.upper() not in wanted:
                continue
            trade = snap.get("latestTrade") or {}
            quote = snap.get("latestQuote") or {}
            bar = snap.get("dailyBar") or {}
            out.append(
                Quote(
                    symbol=sym,
                    description=None,  # not present on the snapshot payload
                    last=_f(trade.get("p")),
                    bid=_f(quote.get("bp")),
                    ask=_f(quote.get("ap")),
                    volume=_i(bar.get("v")),
                )
            )
        return out

    def get_option_chain(self, underlying: str, expiration: str):
        raise NotImplementedError("option chain mapping not wired in this slice")

    def preview_order(self, req: OrderRequest) -> Order:
        return Order(
            id=None,
            symbol=req.symbol,
            side=req.side,
            quantity=req.quantity,
            type=req.type,
            status="preview",
            price=req.price,
            duration=req.duration,
            klass=req.klass,
        )


def _f(v):
    return float(v) if v is not None else None


def _i(v):
    return int(float(v)) if v is not None else None
