"""Canonical broker contract — Tradier's shapes are the source of truth.

Every broker adapter maps its native API responses INTO these objects. The
rest of the world (algos, dashboards, the Edge Score brain) only ever speaks
these shapes, never a broker-specific field name. Adding a broker means
writing one adapter that fills these in. Nothing downstream changes.

Field names mirror the Tradier Brokerage API responses (equities + options)
so that an algo written against Tradier's JSON runs unmodified here.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional, Protocol, Sequence


# ---------------------------------------------------------------------------
# Canonical data shapes (mirror Tradier responses, equities + options)
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Quote:
    """A market quote. Mirrors /v1/markets/quotes. Greeks present for options."""

    symbol: str
    description: Optional[str] = None
    last: Optional[float] = None
    bid: Optional[float] = None
    ask: Optional[float] = None
    volume: Optional[int] = None
    # Options-only fields. None for equities.
    option_type: Optional[str] = None  # "call" | "put"
    strike: Optional[float] = None
    expiration_date: Optional[str] = None  # YYYY-MM-DD
    underlying: Optional[str] = None
    greeks: Optional[dict] = None


@dataclass(frozen=True)
class Position:
    """An open position. Mirrors /v1/accounts/{id}/positions."""

    symbol: str
    quantity: float
    cost_basis: float
    date_acquired: Optional[str] = None

    @property
    def avg_price(self) -> Optional[float]:
        if not self.quantity:
            return None
        return round(self.cost_basis / self.quantity, 6)


@dataclass(frozen=True)
class Balance:
    """Account balances. Mirrors /v1/accounts/{id}/balances."""

    total_equity: float
    total_cash: float
    buying_power: Optional[float] = None
    account_number: Optional[str] = None


@dataclass(frozen=True)
class OptionContract:
    """One option in a chain. Mirrors a /v1/markets/options/chains row."""

    symbol: str  # OCC symbol, e.g. AAPL220617C00270000
    underlying: str
    option_type: str  # "call" | "put"
    strike: float
    expiration_date: str  # YYYY-MM-DD
    bid: Optional[float] = None
    ask: Optional[float] = None
    last: Optional[float] = None
    greeks: Optional[dict] = None


@dataclass(frozen=True)
class Order:
    """An order, post-submit or as a preview. Mirrors /v1/accounts/{id}/orders."""

    id: Optional[str]
    symbol: str
    side: str  # buy | sell | buy_to_open | sell_to_close | ...
    quantity: float
    type: str  # market | limit | stop | stop_limit
    status: str  # pending | filled | canceled | rejected | preview
    price: Optional[float] = None  # limit/stop price
    duration: str = "day"  # day | gtc
    klass: str = "equity"  # equity | option | multileg
    reject_reason: Optional[str] = None


@dataclass(frozen=True)
class OrderRequest:
    """A broker-agnostic order intent handed to an adapter."""

    symbol: str
    side: str
    quantity: float
    type: str = "market"
    price: Optional[float] = None
    duration: str = "day"
    klass: str = "equity"


# ---------------------------------------------------------------------------
# The adapter interface. One implementation per broker.
# ---------------------------------------------------------------------------
class BrokerAdapter(Protocol):
    """Every broker satisfies this. Reads are the universal surface.

    place_order exists because a real broker interface needs it, but live
    execution must be explicitly enabled per adapter and is never automatic.
    Read-only adapters and the demo route it to preview only.
    """

    name: str

    def get_balances(self) -> Balance: ...

    def get_positions(self) -> List[Position]: ...

    def get_quotes(self, symbols: Sequence[str]) -> List[Quote]: ...

    def get_option_chain(
        self, underlying: str, expiration: str
    ) -> List[OptionContract]: ...

    def preview_order(self, req: OrderRequest) -> Order: ...
