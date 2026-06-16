// EMA momentum crossover. The classic golden-cross / death-cross: a fast EMA
// crossing a slow EMA. Written ONCE against the canonical Candle shape, so it
// runs on any broker that serves candles. The math is Michael's mur EMA + Pine
// crossover semantics.
//
// No em dashes anywhere in this file.

import { Candle } from "./contract";
import { crossover, crossunder, ema } from "./indicators";

export type Stance = "BULLISH" | "BEARISH" | "FLAT";
export type Signal = "BUY" | "SELL" | "HOLD";

export interface StrategyResult {
  fast: number;
  slow: number;
  closes: number[];
  dates: string[];
  emaFast: number[];
  emaSlow: number[];
  signal: Signal; // what to do on the latest bar
  stance: Stance; // current fast-vs-slow regime
  crossIndex: number; // index of the most recent cross, or -1
  crossType: "golden" | "death" | null;
  barsSinceCross: number | null;
}

export function emaCrossover(candles: Candle[], fast = 8, slow = 21): StrategyResult {
  const closes = candles.map((c) => c.close);
  const dates = candles.map((c) => c.date);
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  let crossIndex = -1;
  let crossType: "golden" | "death" | null = null;
  for (let i = 1; i < closes.length; i++) {
    if (crossover(emaFast, emaSlow, i)) {
      crossIndex = i;
      crossType = "golden";
    } else if (crossunder(emaFast, emaSlow, i)) {
      crossIndex = i;
      crossType = "death";
    }
  }

  const last = closes.length - 1;
  let stance: Stance = "FLAT";
  if (!Number.isNaN(emaFast[last]) && !Number.isNaN(emaSlow[last])) {
    stance = emaFast[last] >= emaSlow[last] ? "BULLISH" : "BEARISH";
  }

  // A signal fires only on the bar the cross happens. Otherwise hold the stance.
  let signal: Signal = "HOLD";
  if (crossIndex === last) signal = crossType === "golden" ? "BUY" : "SELL";

  const barsSinceCross = crossIndex >= 0 ? last - crossIndex : null;
  return { fast, slow, closes, dates, emaFast, emaSlow, signal, stance, crossIndex, crossType, barsSinceCross };
}
