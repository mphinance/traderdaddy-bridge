// One adapter per broker. Each maps a broker's native response shape INTO the
// canonical (Tradier) contract. Adding a broker is one entry in REGISTRY. This
// is a faithful TypeScript port of the Python engine in /engine.
//
// No em dashes anywhere in this file.

import {
  Balance,
  BrokerAdapter,
  Candle,
  Order,
  OrderRequest,
  Position,
  Quote,
  previewOrder,
  round,
} from "../contract";
import { Raw } from "../fixtures";

const f = (v: any): number | null => (v === null || v === undefined ? null : Number(v));
const i = (v: any): number | null => (v === null || v === undefined ? null : Math.trunc(Number(v)));
// epoch ms -> YYYY-MM-DD
const msDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);
// Databento fixed-point: int64 scaled by 1e-9 -> real price.
const dbPx = (v: any): number | null => (v === null || v === undefined ? null : Number(v) / 1e9);
// Databento ns timestamp -> YYYY-MM-DD. ns exceeds JS safe-int range, but day
// resolution survives: the rounding error is well under one second.
const nsDate = (ns: any): string => new Date(Math.floor(Number(ns) / 1e9) * 1000).toISOString().slice(0, 10);

// Data feeds are not brokers: they have no account surface, so the account
// methods throw. Quotes and candles are the universal market-data surface.
function noAccounts(name: string): Error {
  return new Error(`${name} is a market data feed, not a broker: no accounts, positions, or orders. Use getQuotes / getCandles.`);
}

// --- Tradier: near identity map. The reference. -----------------------------
class TradierAdapter implements BrokerAdapter {
  name = "tradier";
  constructor(private raw: Raw) {}
  getBalances(): Balance {
    const b = this.raw.balances.balances;
    return {
      total_equity: Number(b.total_equity),
      total_cash: Number(b.total_cash),
      buying_power: b.buying_power != null ? Number(b.buying_power) : null,
      account_number: b.account_number ?? null,
    };
  }
  getPositions(): Position[] {
    let rows = this.raw.positions.positions.position;
    if (!Array.isArray(rows)) rows = [rows];
    return rows.map((r: any) => ({
      symbol: r.symbol,
      quantity: Number(r.quantity),
      cost_basis: Number(r.cost_basis),
      date_acquired: r.date_acquired ? String(r.date_acquired).split("T")[0] : null,
    }));
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    let rows = this.raw.quotes.quotes.quote;
    if (!Array.isArray(rows)) rows = [rows];
    return rows
      .filter((q: any) => wanted.has(String(q.symbol).toUpperCase()))
      .map((q: any) => ({
        symbol: q.symbol,
        description: q.description ?? null,
        last: f(q.last),
        bid: f(q.bid),
        ask: f(q.ask),
        volume: i(q.volume),
      }));
  }
  getCandles(_symbol: string): Candle[] {
    return (this.raw.history?.history?.day ?? []).map((d: any) => ({
      date: d.date,
      open: Number(d.open),
      high: Number(d.high),
      low: Number(d.low),
      close: Number(d.close),
      volume: Number(d.volume),
    }));
  }
  previewOrder(req: OrderRequest): Order {
    return previewOrder(req);
  }
}

// --- tastytrade: hyphenated keys, string numbers, direction-as-sign. ---------
class TastytradeAdapter implements BrokerAdapter {
  name = "tastytrade";
  constructor(private raw: Raw) {}
  getBalances(): Balance {
    const d = this.raw.balances.data;
    return {
      total_equity: Number(d["net-liquidating-value"]),
      total_cash: Number(d["cash-balance"]),
      buying_power: d["equity-buying-power"] ? Number(d["equity-buying-power"]) : null,
      account_number: d["account-number"] ?? null,
    };
  }
  getPositions(): Position[] {
    return this.raw.positions.data.items.map((r: any) => {
      let qty = Number(r.quantity);
      if (String(r["quantity-direction"] ?? "Long").toLowerCase() === "short") qty = -qty;
      const avg = Number(r["average-open-price"]);
      const date = r["created-at"] ? String(r["created-at"]).split("T")[0] : null;
      return { symbol: r.symbol, quantity: qty, cost_basis: round(qty * avg, 6), date_acquired: date };
    });
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const out: Quote[] = [];
    // DXLink delivers two event types per symbol. Merge: bid/ask from Quote,
    // last + volume from Trade.
    for (const [sym, events] of Object.entries<any>(this.raw.quotes)) {
      if (!wanted.has(sym.toUpperCase())) continue;
      const quote = events.Quote ?? {};
      const trade = events.Trade ?? {};
      out.push({
        symbol: sym,
        description: null,
        last: f(trade.price),
        bid: f(quote.bid_price),
        ask: f(quote.ask_price),
        volume: i(trade.day_volume),
      });
    }
    return out;
  }
  getCandles(symbol: string): Candle[] {
    // dxfeed Candle events, time in epoch ms.
    const rows = this.raw.candles?.[symbol.toUpperCase()] ?? [];
    return rows.map((c: any) => ({
      date: msDate(Number(c.time)),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c["day-volume"]),
    }));
  }
  previewOrder(req: OrderRequest): Order {
    return previewOrder(req);
  }
}

// --- SnapTrade: aggregator, symbol nested 3 deep. ---------------------------
function rawSymbol(node: any): string {
  let sym = node.symbol ?? node;
  if (sym && typeof sym === "object") {
    if ("raw_symbol" in sym) return sym.raw_symbol;
    const inner = sym.symbol;
    if (inner && typeof inner === "object") return inner.raw_symbol ?? "";
  }
  return String(sym);
}
class SnapTradeAdapter implements BrokerAdapter {
  name = "snaptrade";
  constructor(private raw: Raw) {}
  getBalances(): Balance {
    const acct = this.raw.account;
    const usd = this.raw.balances[0];
    return {
      total_equity: Number(acct.balance.total.amount),
      total_cash: Number(usd.cash),
      buying_power: usd.buying_power != null ? Number(usd.buying_power) : null,
      account_number: acct.id ?? null,
    };
  }
  getPositions(): Position[] {
    return this.raw.positions.map((r: any) => {
      const qty = Number(r.units);
      const avg = Number(r.average_purchase_price);
      return { symbol: rawSymbol(r), quantity: qty, cost_basis: round(qty * avg, 6), date_acquired: null };
    });
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const out: Quote[] = [];
    for (const q of this.raw.quotes) {
      const sym = rawSymbol(q);
      if (!wanted.has(sym.toUpperCase())) continue;
      let desc: string | null = null;
      if (q.symbol && typeof q.symbol === "object") desc = q.symbol.description ?? null;
      out.push({
        symbol: sym,
        description: desc,
        last: f(q.last_trade_price),
        bid: f(q.bid_price),
        ask: f(q.ask_price),
        volume: i(q.volume), // SnapTrade quotes carry no volume
      });
    }
    return out;
  }
  getCandles(_symbol: string): Candle[] {
    // SnapTrade is an aggregator with no price-history endpoint. Honest empty.
    return [];
  }
  previewOrder(req: OrderRequest): Order {
    return previewOrder(req);
  }
}

// --- Alpaca: string numbers, side word, snapshot quotes. --------------------
class AlpacaAdapter implements BrokerAdapter {
  name = "alpaca";
  constructor(private raw: Raw) {}
  getBalances(): Balance {
    const a = this.raw.account;
    return {
      total_equity: Number(a.equity),
      total_cash: Number(a.cash),
      buying_power: a.buying_power != null ? Number(a.buying_power) : null,
      account_number: a.account_number ?? null,
    };
  }
  getPositions(): Position[] {
    return this.raw.positions.map((r: any) => {
      let qty = Number(r.qty);
      if (String(r.side ?? "long").toLowerCase() === "short") qty = -Math.abs(qty);
      const avg = Number(r.avg_entry_price);
      return { symbol: r.symbol, quantity: qty, cost_basis: round(qty * avg, 6), date_acquired: null };
    });
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const out: Quote[] = [];
    for (const [sym, snap] of Object.entries<any>(this.raw.snapshots)) {
      if (!wanted.has(sym.toUpperCase())) continue;
      const trade = snap.latestTrade ?? {};
      const quote = snap.latestQuote ?? {};
      const bar = snap.dailyBar ?? {};
      out.push({
        symbol: sym,
        description: null,
        last: f(trade.p),
        bid: f(quote.bp),
        ask: f(quote.ap),
        volume: i(bar.v),
      });
    }
    return out;
  }
  getCandles(symbol: string): Candle[] {
    // /v2/stocks/bars: { bars: { AAPL: [{t,o,h,l,c,v}] } }
    const rows = this.raw.bars?.[symbol.toUpperCase()] ?? [];
    return rows.map((b: any) => ({
      date: String(b.t).split("T")[0],
      open: Number(b.o),
      high: Number(b.h),
      low: Number(b.l),
      close: Number(b.c),
      volume: Number(b.v),
    }));
  }
  previewOrder(req: OrderRequest): Order {
    return previewOrder(req);
  }
}

// --- Schwab: nested under securitiesAccount, split long/short qty. -----------
class SchwabAdapter implements BrokerAdapter {
  name = "schwab";
  constructor(private raw: Raw) {}
  private acct() {
    return this.raw.account.securitiesAccount;
  }
  getBalances(): Balance {
    const acct = this.acct();
    const bal = acct.currentBalances;
    return {
      total_equity: Number(bal.liquidationValue),
      total_cash: Number(bal.cashBalance),
      buying_power: bal.buyingPower != null ? Number(bal.buyingPower) : null,
      account_number: acct.accountNumber ?? null,
    };
  }
  getPositions(): Position[] {
    return (this.acct().positions ?? []).map((r: any) => {
      const qty = Number(r.longQuantity ?? 0) - Number(r.shortQuantity ?? 0);
      const avg = Number(r.averagePrice);
      return { symbol: r.instrument.symbol, quantity: qty, cost_basis: round(qty * avg, 6), date_acquired: null };
    });
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const out: Quote[] = [];
    for (const [sym, node] of Object.entries<any>(this.raw.quotes)) {
      if (!wanted.has(sym.toUpperCase())) continue;
      const q = node.quote ?? {};
      const ref = node.reference ?? {};
      out.push({
        symbol: sym,
        description: ref.description ?? null,
        last: f(q.lastPrice),
        bid: f(q.bidPrice),
        ask: f(q.askPrice),
        volume: i(q.totalVolume),
      });
    }
    return out;
  }
  getCandles(_symbol: string): Candle[] {
    // /marketdata/v1/pricehistory: { candles: [{datetime,open,high,low,close,volume}] }
    return (this.raw.priceHistory?.candles ?? []).map((c: any) => ({
      date: msDate(Number(c.datetime)),
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume),
    }));
  }
  previewOrder(req: OrderRequest): Order {
    return previewOrder(req);
  }
}

// --- IBKR: ledger keyed by currency, market data by numeric field code. ------
const IB = { LAST: "31", BID: "84", ASK: "86", VOLUME: "87", SYMBOL: "55" };
const SUFFIX: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 };
function ibPrice(v: any): number | null {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  if (s && /[a-zA-Z]/.test(s[0])) s = s.slice(1); // strip status letter, e.g. "C190.00"
  return s ? Number(s) : null;
}
function ibVolume(v: any): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const mult = SUFFIX[s[s.length - 1].toUpperCase()];
  if (mult != null) return Math.trunc(Number(s.slice(0, -1)) * mult);
  return Math.trunc(Number(s));
}
class IBKRAdapter implements BrokerAdapter {
  name = "ibkr";
  constructor(private raw: Raw) {}
  getBalances(): Balance {
    const acct = this.raw.account;
    const usd = acct.ledger.USD;
    return {
      total_equity: Number(usd.netliquidationvalue),
      total_cash: Number(usd.cashbalance),
      buying_power: acct.buyingpower != null ? Number(acct.buyingpower) : null,
      account_number: acct.acctId ?? null,
    };
  }
  getPositions(): Position[] {
    return this.raw.positions.map((r: any) => {
      const qty = Number(r.position);
      const avg = Number(r.avgCost);
      return { symbol: r.contractDesc, quantity: qty, cost_basis: round(qty * avg, 6), date_acquired: null };
    });
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const out: Quote[] = [];
    for (const row of this.raw.snapshot) {
      const sym = String(row[IB.SYMBOL] ?? "").toUpperCase();
      if (!wanted.has(sym)) continue;
      out.push({
        symbol: row[IB.SYMBOL],
        description: null,
        last: ibPrice(row[IB.LAST]),
        bid: ibPrice(row[IB.BID]),
        ask: ibPrice(row[IB.ASK]),
        volume: ibVolume(row[IB.VOLUME]),
      });
    }
    return out;
  }
  getCandles(_symbol: string): Candle[] {
    // /iserver/marketdata/history: { data: [{t,o,h,l,c,v}] }, t in epoch ms.
    return (this.raw.historyData?.data ?? []).map((b: any) => ({
      date: msDate(Number(b.t)),
      open: Number(b.o),
      high: Number(b.h),
      low: Number(b.l),
      close: Number(b.c),
      volume: Number(b.v),
    }));
  }
  previewOrder(req: OrderRequest): Order {
    return previewOrder(req);
  }
}

// --- massive.com (Polygon.io rebranded): market DATA feed, no accounts. ------
class MassiveAdapter implements BrokerAdapter {
  name = "massive";
  constructor(private raw: Raw) {}
  getBalances(): Balance {
    throw noAccounts("massive.com");
  }
  getPositions(): Position[] {
    throw noAccounts("massive.com");
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const t = this.raw.snapshot?.ticker;
    if (!t || !wanted.has(String(t.ticker).toUpperCase())) return [];
    const trade = t.lastTrade ?? {};
    const quote = t.lastQuote ?? {};
    const day = t.day ?? {};
    return [
      {
        symbol: t.ticker,
        description: null,
        last: f(trade.p),
        bid: f(quote.p), // lower-case p is the BID
        ask: f(quote.P), // upper-case P is the ASK
        volume: i(day.v),
      },
    ];
  }
  getCandles(_symbol: string): Candle[] {
    // /v2/aggs: { results: [{t,o,h,l,c,v}] }, t in epoch ms.
    return (this.raw.aggregates?.results ?? []).map((b: any) => ({
      date: msDate(Number(b.t)),
      open: Number(b.o),
      high: Number(b.h),
      low: Number(b.l),
      close: Number(b.c),
      volume: Number(b.v),
    }));
  }
  previewOrder(_req: OrderRequest): Order {
    throw noAccounts("massive.com");
  }
}

// --- Databento: raw market data, int64 1e-9 prices, numeric instrument ids. --
class DatabentoAdapter implements BrokerAdapter {
  name = "databento";
  constructor(private raw: Raw) {}
  private symbology(): Record<number, string> {
    const m: Record<number, string> = {};
    for (const [k, v] of Object.entries<any>(this.raw.symbology ?? {})) m[Number(k)] = v;
    return m;
  }
  getBalances(): Balance {
    throw noAccounts("Databento");
  }
  getPositions(): Position[] {
    throw noAccounts("Databento");
  }
  getQuotes(symbols: string[]): Quote[] {
    const wanted = new Set(symbols.map((s) => s.toUpperCase()));
    const symMap = this.symbology();
    const vol: Record<number, any> = {};
    for (const b of this.raw.ohlcv ?? []) vol[b.instrument_id] = b.volume;
    const out: Quote[] = [];
    for (const rec of this.raw.tbbo ?? []) {
      const sym = symMap[rec.instrument_id];
      if (!sym || !wanted.has(sym.toUpperCase())) continue;
      out.push({
        symbol: sym,
        description: null,
        last: dbPx(rec.price),
        bid: dbPx(rec.bid_px_00),
        ask: dbPx(rec.ask_px_00),
        volume: i(vol[rec.instrument_id]),
      });
    }
    return out;
  }
  getCandles(symbol: string): Candle[] {
    const symMap = this.symbology();
    let iid: number | null = null;
    for (const [k, v] of Object.entries(symMap)) if (v.toUpperCase() === symbol.toUpperCase()) iid = Number(k);
    return (this.raw.ohlcv ?? [])
      .filter((b: any) => iid === null || b.instrument_id === iid)
      .map((b: any) => ({
        date: nsDate(b.ts_event),
        open: dbPx(b.open)!,
        high: dbPx(b.high)!,
        low: dbPx(b.low)!,
        close: dbPx(b.close)!,
        volume: Number(b.volume),
      }));
  }
  previewOrder(_req: OrderRequest): Order {
    throw noAccounts("Databento");
  }
}

type AdapterCtor = new (raw: Raw) => BrokerAdapter;

export const REGISTRY: Record<string, AdapterCtor> = {
  tradier: TradierAdapter,
  tastytrade: TastytradeAdapter,
  snaptrade: SnapTradeAdapter,
  alpaca: AlpacaAdapter,
  schwab: SchwabAdapter,
  ibkr: IBKRAdapter,
  massive: MassiveAdapter,
  databento: DatabentoAdapter,
};

// Sources with no broker account surface (data feeds, not brokers).
export const DATA_ONLY = new Set(["massive", "databento"]);

export function getAdapter(name: string, raw: Raw): BrokerAdapter {
  const Ctor = REGISTRY[name.toLowerCase()];
  if (!Ctor) throw new Error(`unknown broker '${name}'`);
  return new Ctor(raw);
}

// Brokers only (full account surface). Account-driven UI iterates this, so it
// never calls balances/positions on a data feed.
export function supportedBrokers(): string[] {
  return Object.keys(REGISTRY)
    .filter((k) => !DATA_ONLY.has(k))
    .sort();
}

export function dataFeeds(): string[] {
  return Object.keys(REGISTRY)
    .filter((k) => DATA_ONLY.has(k))
    .sort();
}
