// Canonical broker contract. Tradier's shapes are the source of truth.
// Every adapter maps its native API responses INTO these objects. Everything
// downstream (algos, dashboards) speaks only these shapes, never a
// broker-specific field name. Mirrors the Python engine in /engine.
//
// No em dashes anywhere in this file.

export interface Quote {
  symbol: string;
  description: string | null;
  last: number | null;
  bid: number | null;
  ask: number | null;
  volume: number | null;
}

export interface Position {
  symbol: string;
  quantity: number;
  cost_basis: number;
  date_acquired: string | null;
}

export function avgPrice(p: Position): number | null {
  if (!p.quantity) return null;
  return round(p.cost_basis / p.quantity, 6);
}

export interface Balance {
  total_equity: number;
  total_cash: number;
  buying_power: number | null;
  account_number: string | null;
}

// One OHLCV bar. Mirrors a Tradier /v1/markets/history "day" row.
export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderRequest {
  symbol: string;
  side: string;
  quantity: number;
  type?: string;
  price?: number | null;
  duration?: string;
  klass?: string;
}

export interface Order {
  id: string | null;
  symbol: string;
  side: string;
  quantity: number;
  type: string;
  status: string;
  price: number | null;
  duration: string;
  klass: string;
}

// Every adapter satisfies this. Reads are the universal surface. place_order
// is preview only here; live execution is opt-in per adapter and never
// automatic.
export interface BrokerAdapter {
  name: string;
  getBalances(): Balance;
  getPositions(): Position[];
  getQuotes(symbols: string[]): Quote[];
  // Daily OHLCV history. Returns [] for brokers with no history endpoint
  // (SnapTrade, an aggregator, is the honest example).
  getCandles(symbol: string): Candle[];
  previewOrder(req: OrderRequest): Order;
}

export function round(n: number, places: number): number {
  const f = Math.pow(10, places);
  return Math.round(n * f) / f;
}

export function previewOrder(req: OrderRequest): Order {
  return {
    id: null,
    symbol: req.symbol,
    side: req.side,
    quantity: req.quantity,
    type: req.type ?? "market",
    status: "preview",
    price: req.price ?? null,
    duration: req.duration ?? "day",
    klass: req.klass ?? "equity",
  };
}
