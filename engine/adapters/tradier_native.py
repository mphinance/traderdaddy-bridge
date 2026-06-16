"""Tradier native adapter — the reference implementation.

Tradier IS the canonical shape, so this adapter is nearly an identity map.
It exists to prove the interface round-trips Tradier's own responses and to
serve as the template every other adapter is measured against.

In production each method would hit the matching Tradier REST endpoint. Here
the raw payloads are injected so the mapping is testable without live creds.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from typing import List, Sequence

from ..contract import Balance, Candle, OptionContract, Order, OrderRequest, Position, Quote


def _as_list(node):
    """Tradier returns a single object when there is one result, a list when many."""
    if node is None:
        return []
    return node if isinstance(node, list) else [node]


class TradierAdapter:
    name = "tradier"

    def __init__(self, raw: dict):
        self._raw = raw

    def get_balances(self) -> Balance:
        b = self._raw["balances"]["balances"]
        return Balance(
            total_equity=float(b["total_equity"]),
            total_cash=float(b["total_cash"]),
            buying_power=float(b["buying_power"]) if b.get("buying_power") is not None else None,
            account_number=b.get("account_number"),
        )

    def get_positions(self) -> List[Position]:
        rows = _as_list(self._raw["positions"]["positions"].get("position"))
        out = []
        for r in rows:
            date = r.get("date_acquired")
            if date:
                date = date.split("T")[0]
            out.append(
                Position(
                    symbol=r["symbol"],
                    quantity=float(r["quantity"]),
                    cost_basis=float(r["cost_basis"]),
                    date_acquired=date,
                )
            )
        return out

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        rows = _as_list(self._raw["quotes"]["quotes"].get("quote"))
        wanted = {s.upper() for s in symbols}
        out = []
        for q in rows:
            if q["symbol"].upper() not in wanted:
                continue
            out.append(
                Quote(
                    symbol=q["symbol"],
                    description=q.get("description"),
                    last=_f(q.get("last")),
                    bid=_f(q.get("bid")),
                    ask=_f(q.get("ask")),
                    volume=_i(q.get("volume")),
                )
            )
        return out

    def get_candles(self, symbol: str) -> List[Candle]:
        days = self._raw.get("history", {}).get("history", {}).get("day", [])
        return [
            Candle(
                date=d["date"],
                open=float(d["open"]),
                high=float(d["high"]),
                low=float(d["low"]),
                close=float(d["close"]),
                volume=float(d["volume"]),
            )
            for d in days
        ]

    def get_option_chain(self, underlying: str, expiration: str) -> List[OptionContract]:
        # Tradier's /markets/options/chains is the canonical chain shape, so this
        # is a near-identity map like the rest of this adapter.
        rows = _as_list(self._raw.get("chains", {}).get("options", {}).get("option"))
        out = []
        for o in rows:
            if o.get("underlying", underlying).upper() != underlying.upper():
                continue
            if expiration and o.get("expiration_date") != expiration:
                continue
            out.append(
                OptionContract(
                    symbol=o["symbol"],
                    underlying=o.get("underlying", underlying),
                    option_type=o["option_type"],
                    strike=_f(o["strike"]),
                    expiration_date=o["expiration_date"],
                    bid=_f(o.get("bid")),
                    ask=_f(o.get("ask")),
                    last=_f(o.get("last")),
                    greeks=o.get("greeks"),  # Tradier ships native greeks inline
                )
            )
        return out

    def preview_order(self, req: OrderRequest) -> Order:
        # Read-only / preview by design. Live execution is opt-in and never automatic.
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
    return int(v) if v is not None else None
