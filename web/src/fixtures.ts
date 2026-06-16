// Representative RAW native API responses from each broker. These are the
// shapes each broker actually returns, verified against each broker's official
// docs and SDK. They look nothing alike. The whole point is that all six
// collapse into one identical canonical object after their adapter runs.
//
// The scenario across all brokers is the same account:
//   Long 100 AAPL, average cost 180.00 (cost basis 18,000), last 190.00
//   Total cash 25,000, total equity 44,000, buying power 50,000
//
// No em dashes anywhere in this file.

export type Raw = Record<string, any>;

// --- Tradier: clean, flat REST/JSON. The canonical reference shape. ---------
export const RAW_TRADIER: Raw = {
  balances: {
    balances: {
      account_number: "VA000001",
      total_equity: 44000.0,
      total_cash: 25000.0,
      buying_power: 50000.0,
    },
  },
  positions: {
    positions: {
      position: [
        {
          symbol: "AAPL",
          quantity: 100.0,
          cost_basis: 18000.0,
          date_acquired: "2026-01-05T00:00:00.000Z",
        },
      ],
    },
  },
  quotes: {
    quotes: {
      quote: {
        symbol: "AAPL",
        description: "Apple Inc",
        last: 190.0,
        bid: 189.95,
        ask: 190.05,
        volume: 51234567,
      },
    },
  },
};

// --- tastytrade: hyphenated keys, nested under data.items, direction word. ---
// Quotes are NOT REST: this models the DXLink streamer view, merged by symbol
// from a Quote event (bid/ask) plus a Trade event (last + day volume).
export const RAW_TASTYTRADE: Raw = {
  balances: {
    data: {
      "account-number": "5WX12345",
      "net-liquidating-value": "44000.00",
      "cash-balance": "25000.00",
      "equity-buying-power": "50000.00",
    },
  },
  positions: {
    data: {
      items: [
        {
          symbol: "AAPL",
          "instrument-type": "Equity",
          quantity: "100",
          "quantity-direction": "Long",
          "average-open-price": "180.00",
          "created-at": "2026-01-05T14:30:00.000Z",
        },
      ],
    },
  },
  quotes: {
    AAPL: {
      Quote: {
        event_symbol: "AAPL",
        bid_price: "189.95",
        ask_price: "190.05",
        bid_size: "200",
        ask_size: "300",
      },
      Trade: {
        event_symbol: "AAPL",
        price: "190.00",
        day_volume: "51234567",
      },
    },
  },
};

// --- SnapTrade: aggregator shape, symbol nested 3 deep, snake_case. ----------
export const RAW_SNAPTRADE: Raw = {
  account: {
    id: "snap-abc-123",
    balance: { total: { amount: 44000.0, currency: "USD" } },
  },
  balances: [
    { currency: { code: "USD", name: "US Dollar" }, cash: 25000.0, buying_power: 50000.0 },
  ],
  positions: [
    {
      symbol: { symbol: { raw_symbol: "AAPL", description: "Apple Inc." } },
      units: 100.0,
      price: 190.0,
      average_purchase_price: 180.0,
    },
  ],
  quotes: [
    {
      symbol: { raw_symbol: "AAPL", description: "Apple Inc." },
      last_trade_price: 190.0,
      bid_price: 189.95,
      ask_price: 190.05,
    },
  ],
};

// --- Alpaca: every number a string, side word, snapshot with 1-letter keys. --
export const RAW_ALPACA: Raw = {
  account: {
    account_number: "PA0ABCDEFGHI",
    equity: "44000",
    cash: "25000",
    buying_power: "50000",
    portfolio_value: "44000",
  },
  positions: [
    {
      symbol: "AAPL",
      qty: "100",
      side: "long",
      avg_entry_price: "180.00",
      cost_basis: "18000",
      market_value: "19000",
      current_price: "190.00",
    },
  ],
  snapshots: {
    AAPL: {
      latestTrade: { p: 190.0, s: 100 },
      latestQuote: { bp: 189.95, ap: 190.05, bs: 2, as: 3 },
      dailyBar: { o: 188.0, h: 191.0, l: 187.5, c: 190.0, v: 51234567 },
    },
  },
};

// --- Schwab: nested under securitiesAccount, split long/short qty, keyed quotes
export const RAW_SCHWAB: Raw = {
  account: {
    securitiesAccount: {
      accountNumber: "98765432",
      type: "MARGIN",
      currentBalances: {
        liquidationValue: 44000.0,
        cashBalance: 25000.0,
        buyingPower: 50000.0,
      },
      positions: [
        {
          instrument: { symbol: "AAPL", assetType: "EQUITY" },
          longQuantity: 100.0,
          shortQuantity: 0.0,
          averagePrice: 180.0,
          marketValue: 19000.0,
        },
      ],
    },
  },
  quotes: {
    AAPL: {
      assetMainType: "EQUITY",
      quote: {
        lastPrice: 190.0,
        bidPrice: 189.95,
        askPrice: 190.05,
        totalVolume: 51234567,
      },
      reference: { description: "APPLE INC" },
    },
  },
};

// --- IBKR: ledger keyed by currency, conids, market data by NUMERIC code. ----
export const RAW_IBKR: Raw = {
  account: {
    acctId: "U1234567",
    buyingpower: 50000.0,
    ledger: {
      USD: {
        currency: "USD",
        cashbalance: 25000.0,
        netliquidationvalue: 44000.0,
        settledcash: 25000.0,
      },
    },
  },
  positions: [
    {
      conid: 265598,
      contractDesc: "AAPL",
      assetClass: "STK",
      position: 100.0,
      avgCost: 180.0,
      mktPrice: 190.0,
      mktValue: 19000.0,
      currency: "USD",
    },
  ],
  // iserver/marketdata/snapshot: fields keyed by numeric code, as strings.
  snapshot: [
    {
      conid: 265598,
      "55": "AAPL", // symbol
      "31": "190.00", // last
      "84": "189.95", // bid
      "86": "190.05", // ask
      "87": "51234567", // volume
    },
  ],
};

export interface BrokerMeta {
  key: string;
  label: string;
  raw: Raw;
  blurb: string;
}

export const BROKERS: BrokerMeta[] = [
  { key: "tradier", label: "Tradier", raw: RAW_TRADIER, blurb: "Clean flat JSON. The canonical reference shape." },
  { key: "tastytrade", label: "tastytrade", raw: RAW_TASTYTRADE, blurb: "Hyphenated keys, string numbers, direction word. Quotes via DXLink WebSocket (Quote + Trade events merged)." },
  { key: "snaptrade", label: "SnapTrade", raw: RAW_SNAPTRADE, blurb: "Aggregator. Ticker nested three deep at symbol.symbol.raw_symbol. No volume on quotes." },
  { key: "alpaca", label: "Alpaca", raw: RAW_ALPACA, blurb: "Every number a string. Snapshot quotes with one-letter keys (p, bp, ap, v)." },
  { key: "schwab", label: "Schwab", raw: RAW_SCHWAB, blurb: "Everything under securitiesAccount. Size split across longQuantity / shortQuantity." },
  { key: "ibkr", label: "IBKR", raw: RAW_IBKR, blurb: "Ledger keyed by currency. Market data by NUMERIC field code: 31=last, 84=bid, 86=ask, 87=volume." },
];
