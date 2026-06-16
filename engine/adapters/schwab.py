"""Schwab adapter — maps the Schwab Trader API's native shapes INTO Tradier's.

Schwab buries everything under securitiesAccount, splits a position's size
across longQuantity and shortQuantity, nests the ticker inside an instrument
object, and returns quotes as a dict keyed by symbol with the fields split
between quote and reference sub-objects. None of that leaks past this file.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from typing import List, Sequence

from ..contract import Balance, Order, OrderRequest, Position, Quote


class SchwabAdapter:
    name = "schwab"

    def __init__(self, raw: dict):
        self._raw = raw

    def _account(self) -> dict:
        # Schwab wraps the whole account under securitiesAccount.
        return self._raw["account"]["securitiesAccount"]

    def get_balances(self) -> Balance:
        acct = self._account()
        bal = acct["currentBalances"]
        return Balance(
            total_equity=float(bal["liquidationValue"]),
            total_cash=float(bal["cashBalance"]),
            buying_power=float(bal["buyingPower"]) if bal.get("buyingPower") is not None else None,
            account_number=acct.get("accountNumber"),
        )

    def get_positions(self) -> List[Position]:
        out = []
        for r in self._account().get("positions", []):
            # Size is split across two fields; net them into a signed quantity.
            qty = float(r.get("longQuantity", 0)) - float(r.get("shortQuantity", 0))
            avg = float(r["averagePrice"])
            out.append(
                Position(
                    symbol=r["instrument"]["symbol"],
                    quantity=qty,
                    cost_basis=round(qty * avg, 6),
                    date_acquired=None,  # not carried on the positions payload
                )
            )
        return out

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        out = []
        # Schwab returns a dict keyed by symbol; fields split quote/reference.
        for sym, node in self._raw["quotes"].items():
            if sym.upper() not in wanted:
                continue
            q = node.get("quote", {})
            ref = node.get("reference", {})
            out.append(
                Quote(
                    symbol=sym,
                    description=ref.get("description"),
                    last=_f(q.get("lastPrice")),
                    bid=_f(q.get("bidPrice")),
                    ask=_f(q.get("askPrice")),
                    volume=_i(q.get("totalVolume")),
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
