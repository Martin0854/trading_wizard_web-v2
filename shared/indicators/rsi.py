"""RSI (Relative Strength Index) calculator.

Implements RSI indicator per TRADING_STRATEGY_ALGORITHM.md:
- RSI = 100 - (100 / (1 + RS))
- RS = Average Gain / Average Loss over period
- Default period: 14 days
"""

from typing import Optional

import numpy as np
import pandas as pd


def calculate_rsi(
    prices: pd.Series,
    period: int = 14
) -> pd.Series:
    """Calculate RSI (Relative Strength Index).

    RSI = 100 - (100 / (1 + RS))
    RS = Average Gain / Average Loss

    Args:
        prices: Series of closing prices
        period: RSI period (default: 14)

    Returns:
        RSI series (0-100)
    """
    # Calculate price changes
    delta = prices.diff()

    # Separate gains and losses
    gains = delta.where(delta > 0, 0.0)
    losses = (-delta).where(delta < 0, 0.0)

    # Calculate average gains and losses using exponential moving average
    # This is the Wilder's smoothing method (more accurate than SMA)
    avg_gain = gains.ewm(alpha=1/period, min_periods=period).mean()
    avg_loss = losses.ewm(alpha=1/period, min_periods=period).mean()

    # Calculate RS and RSI
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))

    # Handle edge cases
    rsi = rsi.fillna(50)  # Default to neutral if no data
    rsi = rsi.clip(0, 100)  # Ensure within bounds

    return rsi


def get_latest_rsi(
    prices: pd.Series,
    period: int = 14
) -> Optional[float]:
    """Get the latest RSI value.

    Args:
        prices: Series of closing prices
        period: RSI period (default: 14)

    Returns:
        Latest RSI value or None if insufficient data
    """
    if len(prices) < period + 1:
        return None

    rsi = calculate_rsi(prices, period)
    latest = rsi.iloc[-1]

    if pd.isna(latest):
        return None

    return float(latest)


def calculate_rsi_score(rsi: float) -> float:
    """Calculate RSI contribution to confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - RSI between 40-60: Maximum score (20 points)
    - RSI outside this range: Decreasing score

    Args:
        rsi: RSI value (0-100)

    Returns:
        RSI score (0-20)
    """
    # Optimal RSI is around 50 (neutral zone)
    # Score decreases as RSI moves away from 50
    optimal = 50
    max_score = 20

    # Calculate distance from optimal
    distance = abs(rsi - optimal)

    # Score formula: max at 50, decreasing linearly
    # At RSI 30 or 70, distance is 20, score is still positive
    # At RSI 20 or 80, distance is 30, score approaches 0
    score = max(0, max_score - distance * 0.5)

    return score


def is_rsi_overbought(rsi: float, threshold: float = 70) -> bool:
    """Check if RSI indicates overbought condition.

    Args:
        rsi: RSI value
        threshold: Overbought threshold (default: 70)

    Returns:
        True if overbought
    """
    return rsi >= threshold


def is_rsi_oversold(rsi: float, threshold: float = 30) -> bool:
    """Check if RSI indicates oversold condition.

    Args:
        rsi: RSI value
        threshold: Oversold threshold (default: 30)

    Returns:
        True if oversold
    """
    return rsi <= threshold


def is_rsi_neutral(rsi: float, lower: float = 40, upper: float = 60) -> bool:
    """Check if RSI is in neutral zone.

    Neutral zone is considered the ideal buying zone for momentum.

    Args:
        rsi: RSI value
        lower: Lower bound (default: 40)
        upper: Upper bound (default: 60)

    Returns:
        True if in neutral zone
    """
    return lower <= rsi <= upper
