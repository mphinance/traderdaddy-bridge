"""Indicators ported from Michael's mur/quantlab/indicators.py (Pine ta
semantics), in pure Python over lists so the engine keeps zero dependencies.

No em dashes anywhere in this file.
"""

from __future__ import annotations

import math
from typing import List, Sequence


def ema(values: Sequence[float], length: int) -> List[float]:
    """Pine ta.ema: alpha = 2/(length+1), seeded with the first SMA window."""
    n = len(values)
    out: List[float] = [math.nan] * n
    if length <= 0 or n < length:
        return out
    alpha = 2.0 / (length + 1.0)
    seed = sum(values[:length]) / length
    prev = seed
    out[length - 1] = prev
    for i in range(length, n):
        prev = alpha * values[i] + (1.0 - alpha) * prev
        out[i] = prev
    return out


def _ok(v: float) -> bool:
    return not math.isnan(v)


def crossover(a: Sequence[float], b: Sequence[float], i: int) -> bool:
    """Pine ta.crossover: a was <= b on the previous bar AND a > b now."""
    if i < 1:
        return False
    if not (_ok(a[i]) and _ok(b[i]) and _ok(a[i - 1]) and _ok(b[i - 1])):
        return False
    return a[i] > b[i] and a[i - 1] <= b[i - 1]


def crossunder(a: Sequence[float], b: Sequence[float], i: int) -> bool:
    """Pine ta.crossunder: a was >= b on the previous bar AND a < b now."""
    if i < 1:
        return False
    if not (_ok(a[i]) and _ok(b[i]) and _ok(a[i - 1]) and _ok(b[i - 1])):
        return False
    return a[i] < b[i] and a[i - 1] >= b[i - 1]
