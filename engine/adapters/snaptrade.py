"""SnapTrade adapter — maps the aggregator's native shapes INTO Tradier's.

SnapTrade is the zero-effort path for the long tail of brokers that have no
real API of their own (it already normalized them once). Its shape differs
from Tradier: symbol is a nested object, balances are a list per account,
and it gives units + average_purchase_price rather than a cost basis.

This single adapter therefore onboards every broker SnapTrade supports.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from typing import List, Sequence

from ..contract import Balance, Order, OrderRequest, Position, Quote


def _raw_symbol(node) -> str:
    """SnapTrade nests the ticker a couple of ways. Dig out the raw symbol."""
    sym = node.get("symbol", node)
    if isinstance(sym, dict):
        if "raw_symbol" in sym:
            return sym["raw_symbol"]
        inner = sym.get("symbol")
        if isinstance(inner, dict):
            return inner.get("raw_symbol", "")
    return str(sym)


class SnapTradeAdapter:
    name = "snaptrade"

    def __init__(self, raw: dict):
        self._raw = raw

    def get_balances(self) -> Balance:
        # Total account value lives at account.balance.total; cash + buying
        # power come from the per-currency balances list (USD row here).
        acct = self._raw["account"]
        usd = self._raw["balances"][0]
        return Balance(
            total_equity=float(acct["balance"]["total"]["amount"]),
            total_cash=float(usd["cash"]),
            buying_power=float(usd["buying_power"]) if usd.get("buying_power") is not None else None,
            account_number=acct.get("id"),
        )

    def get_positions(self) -> List[Position]:
        out = []
        for r in self._raw["positions"]:
            qty = float(r["units"])
            avg = float(r["average_purchase_price"])
            out.append(
                Position(
                    symbol=_raw_symbol(r),
                    quantity=qty,
                    cost_basis=round(qty * avg, 6),
                    date_acquired=None,  # not on a position; only per tax lot
                )
            )
        return out

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        out = []
        for q in self._raw["quotes"]:
            sym = _raw_symbol(q)
            if sym.upper() not in wanted:
                continue
            desc = None
            sn = q.get("symbol")
            if isinstance(sn, dict):
                desc = sn.get("description")
            out.append(
                Quote(
                    symbol=sym,
                    description=desc,
                    last=_f(q.get("last_trade_price")),
                    bid=_f(q.get("bid_price")),
                    ask=_f(q.get("ask_price")),
                    volume=_i(q.get("volume")),
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
    return int(v) if v is not None else None
