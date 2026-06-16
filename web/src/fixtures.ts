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

// --- massive.com (Polygon.io rebranded): market DATA feed, NO accounts. -------
// Terse snapshot keys: lastTrade.p = last, lastQuote.p = bid, lastQuote.P = ask,
// day.v = volume. Daily candles arrive from the aggregates endpoint (below).
export const RAW_MASSIVE: Raw = {
  snapshot: {
    ticker: {
      ticker: "AAPL",
      lastTrade: { p: 190.0, s: 100, x: 4, t: 1750000000000000000 },
      lastQuote: { P: 190.05, S: 3, p: 189.95, s: 2, t: 1750000000000000000 },
      day: { o: 188.0, h: 191.0, l: 187.5, c: 190.0, v: 51234567, vw: 189.6 },
    },
  },
};

// --- Databento: raw market DATA feed, NO accounts. The most divergent shape. --
// Prices are int64 scaled 1e-9 (190.00 -> 190000000000). Records carry a numeric
// instrument_id resolved by the symbology map. OHLCV-1d candles added below.
export const RAW_DATABENTO: Raw = {
  symbology: { "9001": "AAPL" },
  // TBBO = trade carried with the BBO at the time. *_px are int * 1e-9.
  tbbo: [
    {
      instrument_id: 9001,
      ts_event: 1750000000000000000,
      price: 190000000000, // last trade -> 190.00
      size: 100,
      side: "B",
      bid_px_00: 189950000000, // -> 189.95
      ask_px_00: 190050000000, // -> 190.05
      bid_sz_00: 200,
      ask_sz_00: 300,
    },
  ],
};

// ---------------------------------------------------------------------------
// Daily OHLCV history for the momentum-crossover example. One base close series
// (a dip then a rally, ending at the same 190.00 the quotes show), shaped
// natively per broker. They all normalize to one identical canonical series.
// ---------------------------------------------------------------------------
// A steady decline through ~bar 20 (so the slow EMA is above the fast as it
// warms up), then a sharp rally that produces a clean golden cross late in the
// window, ending at the same 190.00 the quotes show.
const BASE_CLOSES = [
  184.0, 183.6, 183.2, 182.7, 182.2, 181.6, 181.0, 180.5, 180.0, 179.5,
  179.0, 178.6, 178.2, 177.8, 177.4, 177.0, 176.7, 176.4, 176.1, 176.0,
  176.2, 177.5, 179.0, 181.0, 183.0, 185.0, 186.8, 188.2, 189.2, 190.0,
];

const round2 = (n: number) => Math.round(n * 100) / 100;

function genDates(n: number, endISO: string): string[] {
  const out: string[] = [];
  const d = new Date(endISO + "T00:00:00Z");
  let guard = 0;
  while (out.length < n && guard++ < 5000) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.unshift(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out;
}

const DATES = genDates(BASE_CLOSES.length, "2026-06-12");

export interface BaseBar {
  date: string;
  ms: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BASE_BARS: BaseBar[] = BASE_CLOSES.map((close, idx, arr) => {
  const open = idx === 0 ? close : arr[idx - 1];
  return {
    date: DATES[idx],
    ms: Date.parse(DATES[idx] + "T00:00:00Z"),
    open: round2(open),
    high: round2(Math.max(open, close) + 0.4),
    low: round2(Math.min(open, close) - 0.4),
    close,
    volume: 50_000_000 + idx * 100_000,
  };
});

// Tradier: /v1/markets/history -> { history: { day: [...] } }, plain keys.
RAW_TRADIER.history = {
  history: {
    day: BASE_BARS.map((b) => ({ date: b.date, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume })),
  },
};

// tastytrade: dxfeed Candle events, time in epoch ms.
RAW_TASTYTRADE.candles = {
  AAPL: BASE_BARS.map((b) => ({ time: b.ms, open: b.open, high: b.high, low: b.low, close: b.close, "day-volume": b.volume })),
};

// SnapTrade: aggregator, NO history endpoint. Intentionally absent.

// Alpaca: /v2/stocks/bars -> { bars: { AAPL: [...] } }, one-letter keys.
RAW_ALPACA.bars = {
  AAPL: BASE_BARS.map((b) => ({ t: b.date + "T00:00:00Z", o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume })),
};

// Schwab: /marketdata/v1/pricehistory -> { candles: [...] }, datetime in epoch ms.
RAW_SCHWAB.priceHistory = {
  symbol: "AAPL",
  candles: BASE_BARS.map((b) => ({ datetime: b.ms, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume })),
};

// IBKR: /iserver/marketdata/history -> { data: [...] }, t in epoch ms, o/h/l/c/v.
RAW_IBKR.historyData = {
  symbol: "AAPL",
  data: BASE_BARS.map((b) => ({ t: b.ms, o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume })),
};

// massive.com: /v2/aggs/ticker/AAPL/range/1/day -> { results: [...] }, t epoch ms.
RAW_MASSIVE.aggregates = {
  ticker: "AAPL",
  results: BASE_BARS.map((b) => ({ t: b.ms, o: b.open, h: b.high, l: b.low, c: b.close, v: b.volume })),
};

// Databento: OHLCV-1d. Prices int64 scaled 1e-9, ts_event in nanoseconds.
const scaled = (px: number) => Math.round(px * 1e9);
RAW_DATABENTO.ohlcv = BASE_BARS.map((b) => ({
  instrument_id: 9001,
  ts_event: b.ms * 1e6, // ms -> ns
  open: scaled(b.open),
  high: scaled(b.high),
  low: scaled(b.low),
  close: scaled(b.close),
  volume: b.volume,
}));

// Market data feeds (no accounts): quotes + candles only. Listed apart from the
// brokers so account-driven UI sections never call balances/positions on them.
export const FEEDS: BrokerMeta[] = [
  {
    key: "massive",
    label: "massive.com",
    raw: RAW_MASSIVE,
    blurb: "Polygon.io rebranded. Terse snapshot keys (lastTrade.p, lastQuote.p/P, day.v). A pure data feed: no accounts.",
  },
  {
    key: "databento",
    label: "Databento",
    raw: RAW_DATABENTO,
    blurb: "Raw market data. Prices are int64 scaled by 1e-9 and symbols are numeric instrument ids resolved via a symbology map. A pure data feed: no accounts.",
  },
];

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
