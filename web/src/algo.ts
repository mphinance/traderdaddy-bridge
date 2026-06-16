// The portable algos. Written once against the canonical (Tradier) contract,
// they run unmodified on every broker. No broker SDK, no broker field name.
//
// No em dashes anywhere in this file.

import { BrokerAdapter, avgPrice, round } from "./contract";

export interface Signal {
  symbol: string;
  qty: number;
  avgPrice: number | null;
  last: number | null;
  unrealizedPnl: number;
  aboveCost: boolean;
}

export interface AlgoRun {
  broker: string;
  totalCash: number;
  marketValue: number;
  signals: Signal[];
}

// A tiny read-only momentum check: value each position at the live quote and
// flag names trading above their average cost. Stands in for any strategy.
export function runAlgo(broker: BrokerAdapter): AlgoRun {
  const positions = broker.getPositions();
  const quotes = new Map(broker.getQuotes(positions.map((p) => p.symbol)).map((q) => [q.symbol, q]));
  const balances = broker.getBalances();

  let marketValue = 0;
  const signals: Signal[] = [];
  for (const p of positions) {
    const q = quotes.get(p.symbol);
    const last = q ? q.last : null;
    if (last === null) continue;
    marketValue += last * p.quantity;
    const ap = avgPrice(p);
    signals.push({
      symbol: p.symbol,
      qty: p.quantity,
      avgPrice: ap,
      last,
      unrealizedPnl: round((last - (ap ?? 0)) * p.quantity, 2),
      aboveCost: last > (ap ?? 0),
    });
  }
  return { broker: broker.name, totalCash: balances.total_cash, marketValue: round(marketValue, 2), signals };
}

// The "trim winners" screen: flag positions trading >= threshold above cost.
// This is the algo that gets converted from each broker's native SDK.
export function trimCandidates(broker: BrokerAdapter, threshold = 0.05): Array<[string, number, number]> {
  const positions = broker.getPositions();
  const quotes = new Map(broker.getQuotes(positions.map((p) => p.symbol)).map((q) => [q.symbol, q]));
  const out: Array<[string, number, number]> = [];
  for (const p of positions) {
    const q = quotes.get(p.symbol);
    const ap = avgPrice(p);
    if (!q || q.last === null || ap === null) continue;
    const gain = (q.last - ap) / ap;
    if (gain >= threshold) out.push([p.symbol, p.quantity, round(gain * 100, 1)]);
  }
  return out;
}
