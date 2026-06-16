"""tradier_canonical — Tradier's API shape as the universal broker contract.

Every broker maps INTO this shape. Write one algo against it, run it on any
broker. Adding a broker is one adapter file, not a rewrite.
"""

from .adapters import get_adapter, supported_brokers
from .contract import (
    Balance,
    BrokerAdapter,
    OptionContract,
    Order,
    OrderRequest,
    Position,
    Quote,
)

__all__ = [
    "get_adapter",
    "supported_brokers",
    "Balance",
    "BrokerAdapter",
    "OptionContract",
    "Order",
    "OrderRequest",
    "Position",
    "Quote",
]
