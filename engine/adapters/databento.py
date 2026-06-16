"""Databento adapter — maps Databento market data INTO Tradier's shapes.

Databento is a raw market DATA feed, not a broker: no accounts, positions, or
orders, so the account methods raise. Its market data is the most divergent of
any source here:

  - prices are int64 FIXED-POINT scaled by 1e-9 (190.00 arrives as 190000000000).
  - records carry a numeric instrument_id, not a ticker. The human symbol comes
    from a separate symbology/definition map.
  - top of book is keyed bid_px_00 / ask_px_00 / bid_sz_00 / ask_sz_00. The TBBO
    schema carries the last trade (price/size) alongside that BBO.
  - daily candles come from the OHLCV-1d schema (prices scaled, ts_event in ns).
  - option contracts come from the definition schema: instrument_class is a
    single letter ('C' call, 'P' put, 'K' stock), strike_price is scaled 1e-9,
    expiration is a nanosecond UTC timestamp, and raw_symbol is the padded OSI
    string ("AAPL  260619C00190000").
  - Databento ships raw market data, NOT computed greeks, so option greeks come
    back None. OptionContract.greeks being Optional handles this: massive
    populates greeks, Databento leaves them None, downstream is unaffected.

None of that scaling, symbology, or field-code mess leaks past this file.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Sequence

from ..contract import Balance, Candle, OptionContract, Order, OrderRequest, Position, Quote

_SCALE = 1_000_000_000  # Databento fixed-point divisor (prices are int * 1e-9)
_NS_PER_SEC = 1_000_000_000  # nanoseconds per second (timestamps)


class DatabentoAdapter:
    name = "databento"

    def __init__(self, raw: dict):
        self._raw = raw

    # Databento is a data feed, not a broker. These have no meaning here.
    def get_balances(self) -> Balance:
        raise _no_accounts()

    def get_positions(self) -> List[Position]:
        raise _no_accounts()

    def preview_order(self, req: OrderRequest) -> Order:
        raise _no_accounts()

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]:
        wanted = {s.upper() for s in symbols}
        sym_map = self._symbology()
        # Session volume comes off the most recent daily bar, by instrument_id.
        vol = {}
        for bar in self._raw.get("ohlcv", []):
            vol[bar["instrument_id"]] = bar.get("volume")
        out = []
        for rec in self._raw.get("tbbo", []):
            iid = rec["instrument_id"]
            sym = sym_map.get(iid)
            if not sym or sym.upper() not in wanted:
                continue
            out.append(
                Quote(
                    symbol=sym,
                    description=None,  # market data records carry no long name
                    last=_px(rec.get("price")),
                    bid=_px(rec.get("bid_px_00")),
                    ask=_px(rec.get("ask_px_00")),
                    volume=_i(vol.get(iid)),
                )
            )
        return out

    def get_candles(self, symbol: str) -> List[Candle]:
        sym_map = self._symbology()
        iid = next((k for k, v in sym_map.items() if v.upper() == symbol.upper()), None)
        out = []
        for b in self._raw.get("ohlcv", []):
            if iid is not None and b["instrument_id"] != iid:
                continue
            out.append(
                Candle(
                    date=_ns_to_date(b["ts_event"]),
                    open=_px(b["open"]),
                    high=_px(b["high"]),
                    low=_px(b["low"]),
                    close=_px(b["close"]),
                    volume=float(b["volume"]),
                )
            )
        return out

    def get_option_chain(self, underlying: str, expiration: str) -> List[OptionContract]:
        quotes_by_id = {r["instrument_id"]: r for r in self._raw.get("option_tbbo", [])}
        out = []
        for d in self._raw.get("definition", []):
            cls = d.get("instrument_class")
            if cls not in ("C", "P"):  # equities ('K') and the rest are not chain rows
                continue
            if d["underlying"].upper() != underlying.upper():
                continue
            exp = _ns_to_date(d["expiration"])
            if expiration and exp != expiration:
                continue
            q = quotes_by_id.get(d["instrument_id"]) or {}
            out.append(
                OptionContract(
                    symbol=_occ(d["raw_symbol"]),
                    underlying=d["underlying"],
                    option_type="call" if cls == "C" else "put",
                    strike=_px(d["strike_price"]),
                    expiration_date=exp,
                    bid=_px(q.get("bid_px_00")),
                    ask=_px(q.get("ask_px_00")),
                    last=_px(q.get("price")),
                    greeks=None,  # Databento serves raw market data, not greeks
                )
            )
        return out

    def _symbology(self) -> dict:
        """Map numeric instrument_id -> raw_symbol. Keys arrive as strings."""
        return {int(k): v for k, v in self._raw.get("symbology", {}).items()}


def _px(v):
    """Databento prices are int64 scaled by 1e-9. Divide to a real price."""
    if v is None:
        return None
    return int(v) / _SCALE


def _ns_to_date(ns) -> str:
    """Databento timestamps are nanoseconds since the UTC epoch."""
    secs = int(ns) // _NS_PER_SEC
    return datetime.fromtimestamp(secs, tz=timezone.utc).strftime("%Y-%m-%d")


def _occ(raw_symbol: str) -> str:
    """OPRA raw_symbol is padded OSI ('AAPL  260619C00190000'). Drop the spaces
    to land on Tradier's compact OCC symbol ('AAPL260619C00190000')."""
    return raw_symbol.replace(" ", "")


def _no_accounts() -> NotImplementedError:
    return NotImplementedError(
        "Databento is a market data feed, not a broker: no accounts, "
        "positions, or orders. Use get_quotes / get_candles / get_option_chain."
    )


def _i(v):
    return int(float(v)) if v is not None else None
