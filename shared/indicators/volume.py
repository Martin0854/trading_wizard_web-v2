"""Volume Ratio calculator.

Implements volume analysis per TRADING_STRATEGY_ALGORITHM.md:
- Volume Ratio = Today's Volume / Average Volume (20-day)
- Higher ratio indicates stronger conviction in price movement
"""

from typing import Optional

import pandas as pd


def calculate_volume_ratio(
    volumes: pd.Series,
    avg_period: int = 20
) -> pd.Series:
    """Calculate volume ratio.

    Volume Ratio = Current Volume / Average Volume

    Args:
        volumes: Series of trading volumes
        avg_period: Period for average calculation (default: 20)

    Returns:
        Volume ratio series
    """
    avg_volume = volumes.rolling(window=avg_period).mean()

    # Avoid division by zero
    avg_volume = avg_volume.replace(0, float('nan'))

    return volumes / avg_volume


def get_latest_volume_ratio(
    volumes: pd.Series,
    avg_period: int = 20
) -> Optional[float]:
    """Get latest volume ratio.

    Args:
        volumes: Series of trading volumes
        avg_period: Period for average calculation (default: 20)

    Returns:
        Latest volume ratio or None if insufficient data
    """
    if len(volumes) < avg_period:
        return None

    ratio = calculate_volume_ratio(volumes, avg_period)
    latest = ratio.iloc[-1]

    if pd.isna(latest):
        return None

    return float(latest)


def calculate_volume_score(volume_ratio: float) -> float:
    """Calculate volume contribution to confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - Volume ratio >= 2.0: Maximum 25 points
    - Volume ratio 1.0-2.0: Proportional score
    - Volume ratio < 1.0: Reduced score

    Args:
        volume_ratio: Volume ratio value

    Returns:
        Volume score (0-25)
    """
    max_score = 25

    if volume_ratio >= 2.0:
        return max_score
    elif volume_ratio >= 1.0:
        # Linear scaling from 1.0 to 2.0
        return (volume_ratio - 1.0) * max_score
    else:
        # Below average volume, reduced score
        return volume_ratio * max_score * 0.5


def is_volume_above_average(volume_ratio: float) -> bool:
    """Check if current volume is above average.

    Args:
        volume_ratio: Volume ratio value

    Returns:
        True if volume is above average (ratio >= 1.0)
    """
    return volume_ratio >= 1.0


def is_volume_spike(volume_ratio: float, threshold: float = 2.0) -> bool:
    """Check if current volume is a spike (unusually high).

    Args:
        volume_ratio: Volume ratio value
        threshold: Spike threshold (default: 2.0x average)

    Returns:
        True if volume is a spike
    """
    return volume_ratio >= threshold


def is_volume_declining(volumes: pd.Series, days: int = 5) -> bool:
    """Check if volume is declining over recent days.

    Args:
        volumes: Series of trading volumes
        days: Number of days to check

    Returns:
        True if volume has been declining
    """
    if len(volumes) < days:
        return False

    recent = volumes.tail(days)

    # Check if each day's volume is less than the previous
    declining = all(
        recent.iloc[i] < recent.iloc[i - 1]
        for i in range(1, len(recent))
    )

    return declining


def calculate_average_volume(volumes: pd.Series, period: int = 20) -> Optional[float]:
    """Calculate average volume.

    Args:
        volumes: Series of trading volumes
        period: Period for average calculation

    Returns:
        Average volume or None if insufficient data
    """
    if len(volumes) < period:
        return None

    avg = volumes.tail(period).mean()

    if pd.isna(avg):
        return None

    return float(avg)
