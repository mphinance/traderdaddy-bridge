"""IBKR adapter — maps Interactive Brokers' Client Portal Web API INTO Tradier's.

IBKR's REST surface is the strangest of the bunch. Balances come back as a
ledger keyed by CURRENCY. Positions describe the instrument with contractDesc
and a numeric conid. And market data is the kicker: the snapshot endpoint
returns fields keyed by NUMERIC CODES ("31" is last, "84" bid, "86" ask,
"87" volume, "55" symbol), often as strings with the odd "C"/"H" price prefix.
None of that leaks past this file.

This is the adapter that makes the migration story concrete: an algo written
against IBKR keeps running, and now runs everywhere else too.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from typing import List, Sequence

from ..contract import Balance, Order, OrderRequest, Position, Quote

# IBKR market-data snapshot field codes (the documented iserver field ids).
_LAST, _BID, _ASK, _VOLUME, _SYMBOL = "31", "84", "86", "87", "55"


class IBKRAdapter:
    name = "ibkr"

    def __init__(self, raw: dict):
        self._raw = raw

    def get_balances(self) -> Balance:
        acct = self._raw["account"]
        # The ledger is keyed by currency; the USD row holds the cash + NLV.
        usd = acct["ledger"]["USD"]
        return Balance(
            total_equity=float(usd["netliquidationvalue"]),
            total_cash=float(usd["cashbalance"]),
            buying_power=float(acct["buyingpower"]) if acct.get("buyingpower") is not None else None,
            account_number=acct.get("acctId"),
        )

    def get_positions(self) -> List[Position]:
        out = []
        for r in self._raw["positions"]:
            qty = float(r["position"])
            avg = float(r["avgCost"])  # per-share average cost for equities
            out.append(
                Position(
                    symbol=r["contractDesc"],
                    quantity=qty,
                    cost_basis=round(qty * avg, 6),
                    date_acquired=None,  # not carried on the positions payload
                )
            )
        return out

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        out = []
        for row in self._raw["snapshot"]:
            sym = str(row.get(_SYMBOL, "")).upper()
            if sym not in wanted:
                continue
            out.append(
                Quote(
                    symbol=row.get(_SYMBOL),
                    description=None,  # snapshot carries no long name
                    last=_price(row.get(_LAST)),
                    bid=_price(row.get(_BID)),
                    ask=_price(row.get(_ASK)),
                    volume=_volume(row.get(_VOLUME)),
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


def _price(v):
    """IBKR sometimes prefixes a price with a status letter (e.g. 'C190.00'
    for a prior close). Strip a single leading non-numeric marker, then float."""
    if v is None:
        return None
    s = str(v).strip()
    if s and s[0].isalpha():
        s = s[1:]
    return float(s) if s else None


_SUFFIX = {"K": 1_000, "M": 1_000_000, "B": 1_000_000_000}


def _volume(v):
    """IBKR volume (field 87) can arrive abbreviated, e.g. '42.1M' or '1.2K'.
    Expand the suffix to a real integer; pass plain numbers straight through."""
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    mult = _SUFFIX.get(s[-1].upper())
    if mult is not None:
        return int(float(s[:-1]) * mult)
    return int(float(s))
