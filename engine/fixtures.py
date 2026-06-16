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
    # /markets/options/chains?greeks=true. This IS the canonical chain shape.
    "chains": {
        "options": {
            "option": [
                {
                    "symbol": "AAPL260619C00190000",
                    "description": "AAPL Jun 19 2026 $190.00 Call",
                    "underlying": "AAPL",
                    "strike": 190.0,
                    "option_type": "call",
                    "expiration_date": "2026-06-19",
                    "bid": 5.10,
                    "ask": 5.30,
                    "last": 5.20,
                    "greeks": {
                        "delta": 0.55,
                        "gamma": 0.03,
                        "theta": -0.08,
                        "vega": 0.12,
                        "mid_iv": 0.286,
                    },
                }
            ]
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


# --- massive.com (Polygon.io rebranded): market DATA feed, NO accounts. --------
# Terse snapshot keys: lastTrade.p = last, lastQuote.p = bid, lastQuote.P = ask,
# day.v = volume. Options chain snapshot carries native greeks and an "O:" OCC.
# Daily candles arrive from the aggregates endpoint (added in the history block).
RAW_MASSIVE = {
    "snapshot": {
        "ticker": {
            "ticker": "AAPL",
            "lastTrade": {"p": 190.00, "s": 100, "x": 4, "t": 1750000000000000000},
            "lastQuote": {
                "P": 190.05,  # ask price
                "S": 3,       # ask size
                "p": 189.95,  # bid price
                "s": 2,       # bid size
                "t": 1750000000000000000,
            },
            "day": {"o": 188.0, "h": 191.0, "l": 187.5, "c": 190.0, "v": 51234567, "vw": 189.6},
        }
    },
    "option_chain": {
        "results": [
            {
                "ticker": "O:AAPL260619C00190000",
                "details": {
                    "contract_type": "call",
                    "exercise_style": "american",
                    "expiration_date": "2026-06-19",
                    "strike_price": 190.0,
                    "shares_per_contract": 100,
                    "underlying_ticker": "AAPL",
                },
                "last_quote": {"bid": 5.10, "bid_size": 40, "ask": 5.30, "ask_size": 55, "midpoint": 5.20},
                "last_trade": {"price": 5.20, "size": 3},
                "greeks": {"delta": 0.55, "gamma": 0.03, "theta": -0.08, "vega": 0.12},
                "implied_volatility": 0.286,
                "open_interest": 12345,
                "underlying_asset": {"ticker": "AAPL", "price": 190.0},
            }
        ]
    },
}


# --- Databento: raw market DATA feed, NO accounts. The most divergent shape. ---
# Prices are int64 scaled 1e-9. Records carry a numeric instrument_id resolved by
# the symbology map. TBBO carries the trade plus top of book; option metadata
# comes from the definition schema. Daily candles (OHLCV-1d) added below.
RAW_DATABENTO = {
    "symbology": {
        "9001": "AAPL",
        "55001": "AAPL  260619C00190000",  # OPRA OSI: root padded to 6 chars
    },
    # TBBO = trade carried with the BBO at the time. *_px are int * 1e-9.
    "tbbo": [
        {
            "instrument_id": 9001,
            "ts_event": 1750000000000000000,
            "price": 190000000000,      # last trade -> 190.00
            "size": 100,
            "side": "B",
            "bid_px_00": 189950000000,  # -> 189.95
            "ask_px_00": 190050000000,  # -> 190.05
            "bid_sz_00": 200,
            "ask_sz_00": 300,
        }
    ],
    # definition schema: instrument_class 'C'/'P'/'K', strike scaled 1e-9,
    # expiration as nanoseconds since the UTC epoch (1781827200e9 = 2026-06-19).
    "definition": [
        {
            "instrument_id": 55001,
            "raw_symbol": "AAPL  260619C00190000",
            "instrument_class": "C",
            "strike_price": 190000000000,
            "expiration": 1781827200000000000,
            "underlying": "AAPL",
        }
    ],
    # Per-option TBBO (bid/ask/last). Databento carries no greeks.
    "option_tbbo": [
        {
            "instrument_id": 55001,
            "price": 5200000000,       # -> 5.20
            "size": 3,
            "bid_px_00": 5100000000,   # -> 5.10
            "ask_px_00": 5300000000,   # -> 5.30
            "bid_sz_00": 40,
            "ask_sz_00": 55,
        }
    ],
}


# ---------------------------------------------------------------------------
# Daily OHLCV history for the momentum-crossover example. One base close series
# (a decline then a rally ending at 190.00), shaped natively per broker. They
# all normalize to one identical canonical series. SnapTrade has no history
# endpoint and is intentionally omitted.
# ---------------------------------------------------------------------------
import datetime as _dt  # noqa: E402

_BASE_CLOSES = [
    184.0, 183.6, 183.2, 182.7, 182.2, 181.6, 181.0, 180.5, 180.0, 179.5,
    179.0, 178.6, 178.2, 177.8, 177.4, 177.0, 176.7, 176.4, 176.1, 176.0,
    176.2, 177.5, 179.0, 181.0, 183.0, 185.0, 186.8, 188.2, 189.2, 190.0,
]


def _gen_dates(n, end_iso):
    out = []
    d = _dt.date.fromisoformat(end_iso)
    while len(out) < n:
        if d.weekday() < 5:  # Mon-Fri
            out.insert(0, d.isoformat())
        d -= _dt.timedelta(days=1)
    return out


_DATES = _gen_dates(len(_BASE_CLOSES), "2026-06-12")


def _ms(date_str):
    return int(_dt.datetime.fromisoformat(date_str + "T00:00:00+00:00").timestamp() * 1000)


_BASE_BARS = []
for _idx, _close in enumerate(_BASE_CLOSES):
    _open = _close if _idx == 0 else _BASE_CLOSES[_idx - 1]
    _BASE_BARS.append(
        {
            "date": _DATES[_idx],
            "ms": _ms(_DATES[_idx]),
            "open": round(_open, 2),
            "high": round(max(_open, _close) + 0.4, 2),
            "low": round(min(_open, _close) - 0.4, 2),
            "close": _close,
            "volume": 50_000_000 + _idx * 100_000,
        }
    )

# Tradier: /v1/markets/history -> { history: { day: [...] } }, plain keys.
RAW_TRADIER["history"] = {
    "history": {
        "day": [
            {"date": b["date"], "open": b["open"], "high": b["high"], "low": b["low"], "close": b["close"], "volume": b["volume"]}
            for b in _BASE_BARS
        ]
    }
}

# tastytrade: dxfeed Candle events, time in epoch ms.
RAW_TASTYTRADE["candles"] = {
    "AAPL": [
        {"time": b["ms"], "open": b["open"], "high": b["high"], "low": b["low"], "close": b["close"], "day-volume": b["volume"]}
        for b in _BASE_BARS
    ]
}

# Alpaca: /v2/stocks/bars -> { bars: { AAPL: [...] } }, one-letter keys.
RAW_ALPACA["bars"] = {
    "AAPL": [
        {"t": b["date"] + "T00:00:00Z", "o": b["open"], "h": b["high"], "l": b["low"], "c": b["close"], "v": b["volume"]}
        for b in _BASE_BARS
    ]
}

# Schwab: /marketdata/v1/pricehistory -> { candles: [...] }, datetime epoch ms.
RAW_SCHWAB["priceHistory"] = {
    "symbol": "AAPL",
    "candles": [
        {"datetime": b["ms"], "open": b["open"], "high": b["high"], "low": b["low"], "close": b["close"], "volume": b["volume"]}
        for b in _BASE_BARS
    ],
}

# IBKR: /iserver/marketdata/history -> { data: [...] }, t epoch ms, o/h/l/c/v.
RAW_IBKR["historyData"] = {
    "symbol": "AAPL",
    "data": [
        {"t": b["ms"], "o": b["open"], "h": b["high"], "l": b["low"], "c": b["close"], "v": b["volume"]}
        for b in _BASE_BARS
    ],
}

# massive.com: /v2/aggs/ticker/AAPL/range/1/day -> { results: [...] }, t epoch ms.
RAW_MASSIVE["aggregates"] = {
    "ticker": "AAPL",
    "results": [
        {"t": b["ms"], "o": b["open"], "h": b["high"], "l": b["low"], "c": b["close"], "v": b["volume"]}
        for b in _BASE_BARS
    ],
}

# Databento: OHLCV-1d schema. Prices are int64 scaled 1e-9, ts_event in ns.
def _scaled(px):
    return int(round(px * 1_000_000_000))


RAW_DATABENTO["ohlcv"] = [
    {
        "instrument_id": 9001,
        "ts_event": b["ms"] * 1_000_000,  # ms -> ns
        "open": _scaled(b["open"]),
        "high": _scaled(b["high"]),
        "low": _scaled(b["low"]),
        "close": _scaled(b["close"]),
        "volume": b["volume"],
    }
    for b in _BASE_BARS
]
