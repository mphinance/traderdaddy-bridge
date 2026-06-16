"""Onboarding demo: convert anybody's broker-locked algo to the Tradier contract.

The sales motion. Five traders each wrote the SAME strategy ("flag positions
trading at least 5% above cost") against five different brokers, in five
different SDKs that look nothing alike. We onboard each of them by writing one
adapter per broker (already done) and swapping their data-access lines for the
canonical, Tradier-shaped contract. The strategy logic does not change. After
conversion every one of them runs the IDENTICAL canonical algo, and it runs on
Tradier too.

The native "before" snippets below use the real class and method names from
each broker's official SDK (verified against their docs), so they read like
code these people actually wrote.

Run:  python -m tradier_canonical.convert_onboarding

No em dashes anywhere in this file.
"""

from __future__ import annotations

from . import fixtures
from .adapters import get_adapter
from .convert_ibkr_algo import trim_candidates  # the one converted algo, shared


# Each entry: who, their broker, the SDK, and the broker-specific lines that
# would have to be rewritten to move off that broker (the "before").
PEOPLE = [
    {
        "who": "Bob",
        "broker": "tastytrade",
        "sdk": "tastytrade (async SDK)",
        "before": """
    session = Session(user, pw)
    account = (await Account.get(session))[0]
    positions = await account.get_positions(session)        # CurrentPosition objs
    sym, avg = positions[0].symbol, positions[0].average_open_price
    async with DXLinkStreamer(session) as streamer:         # quotes via WebSocket
        await streamer.subscribe(Trade, [sym])
        last = (await streamer.get_event(Trade)).price""",
    },
    {
        "who": "Jim",
        "broker": "schwab",
        "sdk": "schwab-py",
        "before": """
    c = easy_client(api_key, app_secret, callback_url, token_path)
    acct_hash = c.get_account_numbers().json()[0]['hashValue']
    acct = c.get_account(acct_hash, fields=[Client.Account.Fields.POSITIONS]).json()
    p = acct['securitiesAccount']['positions'][0]
    sym, avg = p['instrument']['symbol'], p['averagePrice']
    last = c.get_quote(sym).json()[sym]['quote']['lastPrice']""",
    },
    {
        "who": "Fred",
        "broker": "alpaca",
        "sdk": "alpaca-py",
        "before": """
    trading = TradingClient(key, secret)
    data = StockHistoricalDataClient(key, secret)
    p = trading.get_all_positions()[0]
    sym, avg = p.symbol, float(p.avg_entry_price)            # strings on the wire
    snap = data.get_stock_snapshot(StockSnapshotRequest(symbol_or_symbols=sym))
    last = snap[sym].latest_trade.price""",
    },
    {
        "who": "Dana",
        "broker": "snaptrade",
        "sdk": "snaptrade-python-sdk",
        "before": """
    st = SnapTrade(consumer_key=ck, client_id=cid)
    pos = st.account_information.get_all_account_positions(
        user_id=uid, user_secret=us, account_id=aid).body
    p = pos[0]
    sym = p['symbol']['symbol']['raw_symbol']               # nested 3 deep
    avg, last = p['average_purchase_price'], p['price']""",
    },
    {
        "who": "Will",
        "broker": "ibkr",
        "sdk": "ib_insync (TWS/Gateway)",
        "before": """
    ib = IB(); ib.connect('127.0.0.1', 7497, clientId=1)
    pos = ib.positions()[0]
    sym, avg = pos.contract.symbol, pos.avgCost
    [ticker] = ib.reqTickers(Stock(sym, 'SMART', 'USD'))
    last = ticker.last""",
    },
]

RAWS = {
    "tradier": fixtures.RAW_TRADIER,
    "tastytrade": fixtures.RAW_TASTYTRADE,
    "snaptrade": fixtures.RAW_SNAPTRADE,
    "alpaca": fixtures.RAW_ALPACA,
    "schwab": fixtures.RAW_SCHWAB,
    "ibkr": fixtures.RAW_IBKR,
}


# The single canonical algo everyone converges on. This is what every "before"
# above collapses into once their broker has an adapter.
CANONICAL_AFTER = """
    positions = broker.get_positions()
    quotes = {q.symbol: q for q in broker.get_quotes([p.symbol for p in positions])}
    for p in positions:
        gain = (quotes[p.symbol].last - p.avg_price) / p.avg_price
        if gain >= threshold: flag(p.symbol, p.quantity, gain)
"""


def main():
    print("ONBOARDING  five traders, five brokers, five SDKs, one strategy.\n")
    print("Each wrote the same 'trim winners up >=5%' algo, welded to their broker:\n")

    for person in PEOPLE:
        print(f"  {person['who']:5s} on {person['broker']:11s} ({person['sdk']})")
        print(person["before"])
        print()

    print("=" * 70)
    print("CONVERT  every one of those collapses to the SAME canonical algo:")
    print(CANONICAL_AFTER)
    print("=" * 70)
    print("\nRun the converted algo on each person's broker. Same code, same result:\n")

    for person in PEOPLE:
        broker = get_adapter(person["broker"], RAWS[person["broker"]])
        result = trim_candidates(broker)
        print(f"  {person['who']:5s} {person['broker']:11s} -> {result}")

    # And the punchline: it also runs on Tradier, the contract everyone mapped to.
    tradier = get_adapter("tradier", fixtures.RAW_TRADIER)
    print(f"\n  {'(you)':5s} {'tradier':11s} -> {trim_candidates(tradier)}")
    print(
        "\nFive brokers onboarded. One contract. Everyone's algo now runs on Tradier."
        "\nThat is the migration: write once against Tradier, drop in any broker."
    )


if __name__ == "__main__":
    main()
