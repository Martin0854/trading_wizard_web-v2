"""Bollinger Bands calculator.

Implements Bollinger Bands indicator per TRADING_STRATEGY_ALGORITHM.md:
- Upper Band = SMA(period) + (stdDev * std(period))
- Middle Band = SMA(period)
- Lower Band = SMA(period) - (stdDev * std(period))
- BB Width = (Upper - Lower) / Middle * 100
- Squeeze = BB Width < BB Width MA * squeezeThreshold%
"""

from dataclasses import dataclass
from typing import Optional

import numpy as np
import pandas as pd


@dataclass
class BollingerBandsResult:
    """Result of Bollinger Bands calculation."""
    upper: float
    middle: float
    lower: float
    width: float  # (upper - lower) / middle * 100
    width_ma: float  # Moving average of width
    is_in_squeeze: bool  # width < width_ma * squeeze_threshold
    is_expanding: bool  # width[today] > width[yesterday]


def calculate_bands(
    prices: pd.Series,
    period: int = 12,
    std_dev: float = 1.3
) -> tuple[pd.Series, pd.Series, pd.Series]:
    """Calculate Bollinger Bands.

    Args:
        prices: Series of closing prices
        period: Moving average period (default: 12)
        std_dev: Standard deviation multiplier (default: 1.3)

    Returns:
        Tuple of (upper_band, middle_band, lower_band) Series
    """
    middle = prices.rolling(window=period).mean()
    std = prices.rolling(window=period).std()

    upper = middle + (std_dev * std)
    lower = middle - (std_dev * std)

    return upper, middle, lower


def calculate_width(
    upper: pd.Series,
    middle: pd.Series,
    lower: pd.Series
) -> pd.Series:
    """Calculate Bollinger Band Width.

    BB Width = (Upper - Lower) / Middle * 100

    Args:
        upper: Upper band series
        middle: Middle band series
        lower: Lower band series

    Returns:
        Band width as percentage series
    """
    # Avoid division by zero
    width = ((upper - lower) / middle.replace(0, np.nan)) * 100
    return width


def calculate_width_ma(
    width: pd.Series,
    period: int = 10
) -> pd.Series:
    """Calculate moving average of Bollinger Band Width.

    Args:
        width: Band width series
        period: MA period (default: 10)

    Returns:
        Width moving average series
    """
    return width.rolling(window=period).mean()


def detect_squeeze(
    width: pd.Series,
    width_ma: pd.Series,
    threshold_pct: float = 55,
    lookback_days: int = 5
) -> pd.Series:
    """Detect Bollinger Band squeeze condition.

    Squeeze = width < width_ma * (threshold_pct / 100)

    Args:
        width: Band width series
        width_ma: Width MA series
        threshold_pct: Squeeze threshold percentage (default: 55)
        lookback_days: Days the squeeze must persist (default: 5)

    Returns:
        Boolean series indicating squeeze condition
    """
    threshold = width_ma * (threshold_pct / 100)
    squeeze = width < threshold

    # Check if squeeze persisted for lookback period
    squeeze_persistent = squeeze.rolling(window=lookback_days).min().astype(bool)

    return squeeze_persistent


def detect_expansion(width: pd.Series) -> pd.Series:
    """Detect if bands are expanding.

    Expansion = width[today] > width[yesterday]

    Args:
        width: Band width series

    Returns:
        Boolean series indicating expansion
    """
    return width > width.shift(1)


def calculate_bollinger_bands(
    prices: pd.Series,
    period: int = 12,
    std_dev: float = 1.3,
    width_ma_period: int = 10,
    squeeze_threshold_pct: float = 55,
    squeeze_lookback_days: int = 5
) -> Optional[BollingerBandsResult]:
    """Calculate complete Bollinger Bands indicator.

    Args:
        prices: Series of closing prices
        period: BB period (default: 12)
        std_dev: Standard deviation multiplier (default: 1.3)
        width_ma_period: Width MA period (default: 10)
        squeeze_threshold_pct: Squeeze threshold (default: 55)
        squeeze_lookback_days: Squeeze lookback (default: 5)

    Returns:
        BollingerBandsResult or None if insufficient data
    """
    if len(prices) < max(period, width_ma_period, squeeze_lookback_days):
        return None

    # Calculate bands
    upper, middle, lower = calculate_bands(prices, period, std_dev)

    # Calculate width and its MA
    width = calculate_width(upper, middle, lower)
    width_ma = calculate_width_ma(width, width_ma_period)

    # Detect conditions
    squeeze = detect_squeeze(width, width_ma, squeeze_threshold_pct, squeeze_lookback_days)
    expansion = detect_expansion(width)

    # Get latest values
    latest_upper = upper.iloc[-1]
    latest_middle = middle.iloc[-1]
    latest_lower = lower.iloc[-1]
    latest_width = width.iloc[-1]
    latest_width_ma = width_ma.iloc[-1]
    latest_squeeze = squeeze.iloc[-1] if not pd.isna(squeeze.iloc[-1]) else False
    latest_expansion = expansion.iloc[-1] if not pd.isna(expansion.iloc[-1]) else False

    # Handle NaN values
    if any(pd.isna([latest_upper, latest_middle, latest_lower, latest_width])):
        return None

    return BollingerBandsResult(
        upper=float(latest_upper),
        middle=float(latest_middle),
        lower=float(latest_lower),
        width=float(latest_width),
        width_ma=float(latest_width_ma) if not pd.isna(latest_width_ma) else 0.0,
        is_in_squeeze=bool(latest_squeeze),
        is_expanding=bool(latest_expansion)
    )


def is_price_above_upper(price: float, upper_band: float) -> bool:
    """Check if price is above upper Bollinger Band.

    This is a key buy signal indicator in the squeeze breakout strategy.

    Args:
        price: Current price
        upper_band: Upper Bollinger Band value

    Returns:
        True if price is above upper band
    """
    return price > upper_band


def is_price_below_middle(price: float, middle_band: float) -> bool:
    """Check if price is below middle Bollinger Band.

    This is a sell signal indicator (trend break).

    Args:
        price: Current price
        middle_band: Middle Bollinger Band value

    Returns:
        True if price is below middle band
    """
    return price < middle_band
