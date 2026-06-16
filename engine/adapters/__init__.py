"""Adapter registry + factory.

Adding a broker is: write one adapter module, register it here. Nothing
downstream changes. This is the seam that turns "broker coming soon" from a
rewrite into a one-file pull request.

No em dashes anywhere in this file.
"""

from __future__ import annotations

from .alpaca import AlpacaAdapter
from .databento import DatabentoAdapter
from .ibkr import IBKRAdapter
from .massive import MassiveAdapter
from .schwab import SchwabAdapter
from .snaptrade import SnapTradeAdapter
from .tastytrade import TastytradeAdapter
from .tradier_native import TradierAdapter

# Brokers: full account surface (balances, positions, quotes, candles, orders).
REGISTRY = {
    TradierAdapter.name: TradierAdapter,
    TastytradeAdapter.name: TastytradeAdapter,
    SnapTradeAdapter.name: SnapTradeAdapter,
    AlpacaAdapter.name: AlpacaAdapter,
    SchwabAdapter.name: SchwabAdapter,
    IBKRAdapter.name: IBKRAdapter,
    # Market data feeds: quotes + candles + option chains only, no accounts.
    MassiveAdapter.name: MassiveAdapter,
    DatabentoAdapter.name: DatabentoAdapter,
}

# Sources with no broker account surface (data feeds, not brokers). They satisfy
# the market-data side of the contract and raise on balances/positions/orders.
DATA_ONLY = {MassiveAdapter.name, DatabentoAdapter.name}


def get_adapter(name: str, raw: dict):
    """Return a broker adapter satisfying the BrokerAdapter contract.

    `raw` injects native API payloads for testing/demo. In production an
    adapter would instead take credentials and a base URL and make live calls.
    """
    key = name.lower()
    if key not in REGISTRY:
        raise KeyError(f"unknown broker '{name}'. known: {sorted(REGISTRY)}")
    return REGISTRY[key](raw)


def supported_brokers():
    return sorted(REGISTRY)
