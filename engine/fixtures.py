"""Representative RAW native API responses from each broker.

These are the shapes each broker actually returns. They look nothing alike.
The whole point of the conformance test is that all three collapse into one
identical canonical object after their adapter runs. No live creds needed.

The scenario across all three brokers is the same real-world account:
  - Long 100 AAPL, average cost 180.00 (cost basis 18,000), last 190.00
  - Total cash 25,000, total equity 44,000

No em dashes anywhere in this file.
"""

# --- Tradier: clean, flat REST/JSON. This is our canonical reference shape. ---
RAW_TRADIER = {
    "balances": {
        "balances": {
            "account_number": "VA000001",
            "total_equity": 44000.0,
            "total_cash": 25000.0,
            "buying_power": 50000.0,
        }
    },
    "positions": {
        "positions": {
            "position": [
                {
                    "symbol": "AAPL",
                    "quantity": 100.0,
                    "cost_basis": 18000.0,
                    "date_acquired": "2026-01-05T00:00:00.000Z",
                }
            ]
        }
    },
    "quotes": {
        "quotes": {
            "quote": {
                "symbol": "AAPL",
                "description": "Apple Inc",
                "last": 190.0,
                "bid": 189.95,
                "ask": 190.05,
                "volume": 51234567,
            }
        }
    },
}


# --- tastytrade: hyphenated keys, nested under data.items, direction strings. --
RAW_TASTYTRADE = {
    "balances": {
        "data": {
            "account-number": "5WX12345",
            "net-liquidating-value": "44000.00",
            "cash-balance": "25000.00",
            "equity-buying-power": "50000.00",
        }
    },
    "positions": {
        "data": {
            "items": [
                {
                    "symbol": "AAPL",
                    "instrument-type": "Equity",
                    "quantity": "100",
                    "quantity-direction": "Long",
                    "average-open-price": "180.00",
                    "created-at": "2026-01-05T14:30:00.000Z",
                }
            ]
        }
    },
    # No REST quote endpoint. This is the DXLink streamer view, merged by
    # symbol: a Quote event (bid/ask) plus a Trade event (last + day volume).
    "quotes": {
        "AAPL": {
            "Quote": {
                "event_symbol": "AAPL",
                "bid_price": "189.95",
                "ask_price": "190.05",
                "bid_size": "200",
                "ask_size": "300",
            },
            "Trade": {
                "event_symbol": "AAPL",
                "price": "190.00",
                "day_volume": "51234567",
            },
        }
    },
}


# --- SnapTrade: aggregator shape, symbol nested 3 deep, snake_case. -----------
# This models the /holdings response: account total lives at account.balance.total,
# cash/buying power in the per-currency balances list (no total_value, no
# account_id on a balance row), and quotes carry no volume.
RAW_SNAPTRADE = {
    "account": {
        "id": "snap-abc-123",
        "balance": {"total": {"amount": 44000.0, "currency": "USD"}},
    },
    "balances": [
        {
            "currency": {"code": "USD", "name": "US Dollar"},
            "cash": 25000.0,
            "buying_power": 50000.0,
        }
    ],
    "positions": [
        {
            "symbol": {
                "symbol": {"raw_symbol": "AAPL", "description": "Apple Inc."},
            },
            "units": 100.0,
            "price": 190.0,  # position-level last price; SnapTrade gives this
            "average_purchase_price": 180.0,
        }
    ],
    "quotes": [
        {
            "symbol": {"raw_symbol": "AAPL", "description": "Apple Inc."},
            "last_trade_price": 190.0,
            "bid_price": 189.95,
            "ask_price": 190.05,
            # no volume field: SnapTrade quotes do not carry trading volume
        }
    ],
}


# --- Alpaca: every number a string, side word, snapshot with 1-letter keys. ----
RAW_ALPACA = {
    "account": {
        "account_number": "PA0ABCDEFGHI",
        "equity": "44000",
        "cash": "25000",
        "buying_power": "50000",
        "portfolio_value": "44000",
    },
    "positions": [
        {
            "symbol": "AAPL",
            "qty": "100",
            "side": "long",
            "avg_entry_price": "180.00",
            "cost_basis": "18000",
            "market_value": "19000",
            "current_price": "190.00",
        }
    ],
    "snapshots": {
        "AAPL": {
            "latestTrade": {"p": 190.0, "s": 100},
            "latestQuote": {"bp": 189.95, "ap": 190.05, "bs": 2, "as": 3},
            "dailyBar": {"o": 188.0, "h": 191.0, "l": 187.5, "c": 190.0, "v": 51234567},
        }
    },
}


# --- Schwab: nested under securitiesAccount, split long/short qty, keyed quotes -
RAW_SCHWAB = {
    "account": {
        "securitiesAccount": {
            "accountNumber": "98765432",
            "type": "MARGIN",
            "currentBalances": {
                "liquidationValue": 44000.0,
                "cashBalance": 25000.0,
                "buyingPower": 50000.0,
            },
            "positions": [
                {
                    "instrument": {"symbol": "AAPL", "assetType": "EQUITY"},
                    "longQuantity": 100.0,
                    "shortQuantity": 0.0,
                    "averagePrice": 180.0,
                    "marketValue": 19000.0,
                }
            ],
        }
    },
    "quotes": {
        "AAPL": {
            "assetMainType": "EQUITY",
            "quote": {
                "lastPrice": 190.0,
                "bidPrice": 189.95,
                "askPrice": 190.05,
                "totalVolume": 51234567,
            },
            "reference": {"description": "APPLE INC"},
        }
    },
}


# --- IBKR: ledger keyed by currency, conids, market data by numeric field code -
RAW_IBKR = {
    "account": {
        "acctId": "U1234567",
        "buyingpower": 50000.0,
        "ledger": {
            "USD": {
                "currency": "USD",
                "cashbalance": 25000.0,
                "netliquidationvalue": 44000.0,
                "settledcash": 25000.0,
            }
        },
    },
    "positions": [
        {
            "conid": 265598,
            "contractDesc": "AAPL",
            "assetClass": "STK",
            "position": 100.0,
            "avgCost": 180.0,
            "mktPrice": 190.0,
            "mktValue": 19000.0,
            "currency": "USD",
        }
    ],
    # iserver/marketdata/snapshot rows: fields keyed by numeric code, as strings.
    "snapshot": [
        {
            "conid": 265598,
            "55": "AAPL",     # symbol
            "31": "190.00",   # last
            "84": "189.95",   # bid
            "86": "190.05",   # ask
            "87": "51234567", # volume
        }
    ],
}
