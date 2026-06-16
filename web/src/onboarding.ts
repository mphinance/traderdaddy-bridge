// The onboarding story. Five traders each wrote the SAME "trim winners >=5%"
// strategy against a different broker in a different SDK. The "before" snippets
// use the real class and method names from each broker's official SDK
// (verified against their docs). Each converts to one canonical algo.
//
// No em dashes anywhere in this file.

export interface Person {
  who: string;
  broker: string;
  sdk: string;
  before: string;
}

export const PEOPLE: Person[] = [
  {
    who: "Bob",
    broker: "tastytrade",
    sdk: "tastytrade (async SDK)",
    before: `session = Session(user, pw)
account = (await Account.get(session))[0]
positions = await account.get_positions(session)   # CurrentPosition objs
sym, avg = positions[0].symbol, positions[0].average_open_price
async with DXLinkStreamer(session) as streamer:     # quotes via WebSocket
    await streamer.subscribe(Trade, [sym])
    last = (await streamer.get_event(Trade)).price`,
  },
  {
    who: "Jim",
    broker: "schwab",
    sdk: "schwab-py",
    before: `c = easy_client(api_key, app_secret, callback_url, token_path)
acct_hash = c.get_account_numbers().json()[0]['hashValue']
acct = c.get_account(acct_hash, fields=[Client.Account.Fields.POSITIONS]).json()
p = acct['securitiesAccount']['positions'][0]
sym, avg = p['instrument']['symbol'], p['averagePrice']
last = c.get_quote(sym).json()[sym]['quote']['lastPrice']`,
  },
  {
    who: "Fred",
    broker: "alpaca",
    sdk: "alpaca-py",
    before: `trading = TradingClient(key, secret)
data = StockHistoricalDataClient(key, secret)
p = trading.get_all_positions()[0]
sym, avg = p.symbol, float(p.avg_entry_price)        # strings on the wire
snap = data.get_stock_snapshot(StockSnapshotRequest(symbol_or_symbols=sym))
last = snap[sym].latest_trade.price`,
  },
  {
    who: "Dana",
    broker: "snaptrade",
    sdk: "snaptrade-python-sdk",
    before: `st = SnapTrade(consumer_key=ck, client_id=cid)
pos = st.account_information.get_all_account_positions(
    user_id=uid, user_secret=us, account_id=aid).body
p = pos[0]
sym = p['symbol']['symbol']['raw_symbol']            # nested 3 deep
avg, last = p['average_purchase_price'], p['price']`,
  },
  {
    who: "Will",
    broker: "ibkr",
    sdk: "ib_insync (TWS/Gateway)",
    before: `ib = IB(); ib.connect('127.0.0.1', 7497, clientId=1)
pos = ib.positions()[0]
sym, avg = pos.contract.symbol, pos.avgCost
[ticker] = ib.reqTickers(Stock(sym, 'SMART', 'USD'))
last = ticker.last`,
  },
];

// The single canonical algo every "before" collapses into.
export const CANONICAL_AFTER = `positions = broker.get_positions()
quotes = {q.symbol: q for q in broker.get_quotes([p.symbol for p in positions])}
for p in positions:
    gain = (quotes[p.symbol].last - p.avg_price) / p.avg_price
    if gain >= threshold:
        flag(p.symbol, p.quantity, gain)   # same math, any broker`;
