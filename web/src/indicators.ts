// Indicators ported faithfully from Michael's mur/quantlab/indicators.py
// (Pine Script ta semantics). Same math the rest of his stack uses, so a
// strategy validated there behaves identically here.
//
// No em dashes anywhere in this file.

// Pine ta.ema: alpha = 2/(length+1), seeded with the first SMA window.
export function ema(values: number[], length: number): number[] {
  const n = values.length;
  const out = new Array<number>(n).fill(NaN);
  if (length <= 0 || n < length) return out;
  const alpha = 2.0 / (length + 1.0);
  let sum = 0;
  for (let j = 0; j < length; j++) sum += values[j];
  let prev = sum / length; // seed = SMA of first `length` bars
  out[length - 1] = prev;
  for (let i = length; i < n; i++) {
    prev = alpha * values[i] + (1.0 - alpha) * prev;
    out[i] = prev;
  }
  return out;
}

// Pine ta.crossover: a was <= b on the previous bar AND a > b now.
export function crossover(a: number[], b: number[], i: number): boolean {
  if (i < 1) return false;
  const ok = (v: number) => !Number.isNaN(v);
  if (!ok(a[i]) || !ok(b[i]) || !ok(a[i - 1]) || !ok(b[i - 1])) return false;
  return a[i] > b[i] && a[i - 1] <= b[i - 1];
}

// Pine ta.crossunder: a was >= b on the previous bar AND a < b now.
export function crossunder(a: number[], b: number[], i: number): boolean {
  if (i < 1) return false;
  const ok = (v: number) => !Number.isNaN(v);
  if (!ok(a[i]) || !ok(b[i]) || !ok(a[i - 1]) || !ok(b[i - 1])) return false;
  return a[i] < b[i] && a[i - 1] >= b[i - 1];
}
