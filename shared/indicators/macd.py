"""MACD (Moving Average Convergence Divergence) calculator.

Implements MACD indicator per TRADING_STRATEGY_ALGORITHM.md:
- MACD Line = EMA(fast) - EMA(slow)
- Signal Line = EMA(signal) of MACD Line
- Histogram = MACD Line - Signal Line
- Default: fast=12, slow=26, signal=9
"""

from dataclasses import dataclass
from typing import Optional

import pandas as pd


@dataclass
class MACDResult:
    """Result of MACD calculation."""
    macd: float  # MACD line value
    signal: float  # Signal line value
    histogram: float  # MACD - Signal


def calculate_ema(prices: pd.Series, period: int) -> pd.Series:
    """Calculate Exponential Moving Average.

    Args:
        prices: Series of prices
        period: EMA period

    Returns:
        EMA series
    """
    return prices.ewm(span=period, adjust=False).mean()


def calculate_macd_line(
    prices: pd.Series,
    fast_period: int = 12,
    slow_period: int = 26
) -> pd.Series:
    """Calculate MACD line.

    MACD = EMA(fast) - EMA(slow)

    Args:
        prices: Series of closing prices
        fast_period: Fast EMA period (default: 12)
        slow_period: Slow EMA period (default: 26)

    Returns:
        MACD line series
    """
    fast_ema = calculate_ema(prices, fast_period)
    slow_ema = calculate_ema(prices, slow_period)

    return fast_ema - slow_ema


def calculate_signal_line(
    macd_line: pd.Series,
    signal_period: int = 9
) -> pd.Series:
    """Calculate MACD signal line.

    Signal = EMA(signal_period) of MACD line

    Args:
        macd_line: MACD line series
        signal_period: Signal line EMA period (default: 9)

    Returns:
        Signal line series
    """
    return calculate_ema(macd_line, signal_period)


def calculate_histogram(macd_line: pd.Series, signal_line: pd.Series) -> pd.Series:
    """Calculate MACD histogram.

    Histogram = MACD - Signal

    Args:
        macd_line: MACD line series
        signal_line: Signal line series

    Returns:
        Histogram series
    """
    return macd_line - signal_line


def calculate_macd(
    prices: pd.Series,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate complete MACD indicator.

    Args:
        prices: Series of closing prices
        fast_period: Fast EMA period (default: 12)
        slow_period: Slow EMA period (default: 26)
        signal_period: Signal EMA period (default: 9)

    Returns:
        Tuple of (macd_line, signal_line, histogram) Series
    """
    macd_line = calculate_macd_line(prices, fast_period, slow_period)
    signal_line = calculate_signal_line(macd_line, signal_period)
    histogram = calculate_histogram(macd_line, signal_line)

    return macd_line, signal_line, histogram


def get_latest_macd(
    prices: pd.Series,
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9
) -> Optional[MACDResult]:
    """Get latest MACD values.

    Args:
        prices: Series of closing prices
        fast_period: Fast EMA period (default: 12)
        slow_period: Slow EMA period (default: 26)
        signal_period: Signal EMA period (default: 9)

    Returns:
        MACDResult or None if insufficient data
    """
    min_periods = max(fast_period, slow_period, signal_period)
    if len(prices) < min_periods:
        return None

    macd_line, signal_line, histogram = calculate_macd(
        prices, fast_period, slow_period, signal_period
    )

    latest_macd = macd_line.iloc[-1]
    latest_signal = signal_line.iloc[-1]
    latest_histogram = histogram.iloc[-1]

    if any(pd.isna([latest_macd, latest_signal, latest_histogram])):
        return None

    return MACDResult(
        macd=float(latest_macd),
        signal=float(latest_signal),
        histogram=float(latest_histogram)
    )


def calculate_macd_score(histogram: float, signal: float) -> float:
    """Calculate MACD contribution to confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - Positive histogram indicates bullish momentum
    - Score based on histogram magnitude relative to signal

    Args:
        histogram: MACD histogram value
        signal: MACD signal line value

    Returns:
        MACD score (0-30)
    """
    max_score = 30

    # Positive histogram is bullish
    if histogram <= 0:
        return 0

    # Normalize by signal magnitude to get relative strength
    if abs(signal) < 0.001:
        # If signal is near zero, use absolute histogram
        ratio = min(histogram * 100, 1.0)
    else:
        ratio = min(histogram / abs(signal), 1.0)

    return max_score * ratio


def is_macd_bullish_crossover(
    macd_line: pd.Series,
    signal_line: pd.Series
) -> bool:
    """Check if MACD crossed above signal line (bullish signal).

    Args:
        macd_line: MACD line series
        signal_line: Signal line series

    Returns:
        True if bullish crossover occurred
    """
    if len(macd_line) < 2 or len(signal_line) < 2:
        return False

    # Previous: MACD below signal
    # Current: MACD above signal
    prev_below = macd_line.iloc[-2] < signal_line.iloc[-2]
    curr_above = macd_line.iloc[-1] > signal_line.iloc[-1]

    return prev_below and curr_above


def is_macd_bearish_crossover(
    macd_line: pd.Series,
    signal_line: pd.Series
) -> bool:
    """Check if MACD crossed below signal line (bearish signal).

    Args:
        macd_line: MACD line series
        signal_line: Signal line series

    Returns:
        True if bearish crossover occurred
    """
    if len(macd_line) < 2 or len(signal_line) < 2:
        return False

    # Previous: MACD above signal
    # Current: MACD below signal
    prev_above = macd_line.iloc[-2] > signal_line.iloc[-2]
    curr_below = macd_line.iloc[-1] < signal_line.iloc[-1]

    return prev_above and curr_below


def is_macd_histogram_positive(histogram: float) -> bool:
    """Check if MACD histogram is positive (bullish momentum).

    Args:
        histogram: MACD histogram value

    Returns:
        True if histogram is positive
    """
    return histogram > 0
