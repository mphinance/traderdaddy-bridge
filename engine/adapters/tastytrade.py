"""tastytrade adapter — maps tastytrade's native shapes INTO Tradier's.

tastytrade returns hyphenated keys, nests rows under data.items, encodes
numbers as strings, and expresses long/short as a direction string rather
than a signed quantity. Quotes are the sharp edge: tastytrade has NO REST
quote endpoint. Live quotes arrive over a DXLink (dxfeed) WebSocket, and the
fields are split across two event types: a Quote event carries bid/ask, a
Trade event carries last price + day volume. You subscribe to both and merge
them by symbol. The fixture models that merged-by-symbol view. None of this
leaks past this file.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from typing import List, Sequence

from ..contract import Balance, Order, OrderRequest, Position, Quote


class TastytradeAdapter:
    name = "tastytrade"

    def __init__(self, raw: dict):
        self._raw = raw

    def get_balances(self) -> Balance:
        d = self._raw["balances"]["data"]
        return Balance(
            total_equity=float(d["net-liquidating-value"]),
            total_cash=float(d["cash-balance"]),
            buying_power=float(d["equity-buying-power"]) if d.get("equity-buying-power") else None,
            account_number=d.get("account-number"),
        )

    def get_positions(self) -> List[Position]:
        out = []
        for r in self._raw["positions"]["data"]["items"]:
            qty = float(r["quantity"])
            # tastytrade carries magnitude in quantity and sign in direction.
            if str(r.get("quantity-direction", "Long")).lower() == "short":
                qty = -qty
            avg = float(r["average-open-price"])
            date = r.get("created-at")
            if date:
                date = date.split("T")[0]
            out.append(
                Position(
                    symbol=r["symbol"],
                    quantity=qty,
                    cost_basis=round(qty * avg, 6),
                    date_acquired=date,
                )
            )
        return out

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        out = []
        # DXLink delivers two event types per symbol. Merge them: bid/ask from
        # the Quote event, last + volume from the Trade event.
        for sym, events in self._raw["quotes"].items():
            if sym.upper() not in wanted:
                continue
            quote = events.get("Quote", {})
            trade = events.get("Trade", {})
            out.append(
                Quote(
                    symbol=sym,
                    description=None,  # the streamer carries no long name
                    last=_f(trade.get("price")),
                    bid=_f(quote.get("bid_price")),
                    ask=_f(quote.get("ask_price")),
                    volume=_i(trade.get("day_volume")),
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
