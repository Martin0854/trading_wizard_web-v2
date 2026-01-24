"""Technical indicators package.

This module provides a unified facade for calculating all technical indicators
required for the Trading Wizard system.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import pandas as pd

from shared.indicators.bollinger import (
    BollingerBandsResult,
    calculate_bollinger_bands,
    is_price_above_upper,
    is_price_below_middle,
)
from shared.indicators.confidence import (
    ConfidenceScoreBreakdown,
    calculate_confidence_score,
    calculate_confidence_score_breakdown,
    generate_signal_reason,
    is_above_threshold,
)
from shared.indicators.macd import (
    MACDResult,
    calculate_macd,
    get_latest_macd,
    is_macd_bullish_crossover,
    is_macd_histogram_positive,
)
from shared.indicators.rsi import (
    calculate_rsi,
    get_latest_rsi,
    is_rsi_neutral,
    is_rsi_overbought,
    is_rsi_oversold,
)
from shared.indicators.volume import (
    calculate_volume_ratio,
    get_latest_volume_ratio,
    is_volume_above_average,
    is_volume_spike,
)

# Re-export individual module functions
__all__ = [
    # Bollinger
    "BollingerBandsResult",
    "calculate_bollinger_bands",
    "is_price_above_upper",
    "is_price_below_middle",
    # RSI
    "calculate_rsi",
    "get_latest_rsi",
    "is_rsi_neutral",
    "is_rsi_overbought",
    "is_rsi_oversold",
    # MACD
    "MACDResult",
    "calculate_macd",
    "get_latest_macd",
    "is_macd_bullish_crossover",
    "is_macd_histogram_positive",
    # Volume
    "calculate_volume_ratio",
    "get_latest_volume_ratio",
    "is_volume_above_average",
    "is_volume_spike",
    # Confidence
    "ConfidenceScoreBreakdown",
    "calculate_confidence_score",
    "calculate_confidence_score_breakdown",
    "generate_signal_reason",
    "is_above_threshold",
    # Facade
    "TechnicalIndicatorsResult",
    "BuySignalResult",
    "calculate_all_indicators",
    "check_buy_signal",
]


@dataclass
class TechnicalIndicatorsResult:
    """Complete technical indicators for a stock."""
    bollinger: BollingerBandsResult
    rsi: float
    macd: MACDResult
    volume_ratio: float
    calculated_at: datetime


@dataclass
class BuySignalResult:
    """Result of buy signal check."""
    is_buy_signal: bool
    confidence_score: float
    signal_reason: str
    indicators: TechnicalIndicatorsResult
    breakdown: ConfidenceScoreBreakdown


def calculate_all_indicators(
    prices: pd.Series,
    volumes: pd.Series,
    bollinger_period: int = 12,
    bollinger_std_dev: float = 1.3,
    bb_width_ma_period: int = 10,
    squeeze_threshold_pct: float = 55,
    squeeze_lookback_days: int = 5,
    rsi_period: int = 14,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    volume_avg_period: int = 20
) -> Optional[TechnicalIndicatorsResult]:
    """Calculate all technical indicators for a stock.

    Args:
        prices: Series of closing prices
        volumes: Series of trading volumes
        bollinger_period: BB period
        bollinger_std_dev: BB standard deviation multiplier
        bb_width_ma_period: BB Width MA period
        squeeze_threshold_pct: Squeeze threshold percentage
        squeeze_lookback_days: Squeeze lookback days
        rsi_period: RSI period
        macd_fast: MACD fast EMA period
        macd_slow: MACD slow EMA period
        macd_signal: MACD signal period
        volume_avg_period: Volume average period

    Returns:
        TechnicalIndicatorsResult or None if insufficient data
    """
    # Check minimum data requirements
    min_periods = max(
        bollinger_period + bb_width_ma_period,
        rsi_period + 1,
        macd_slow + macd_signal,
        volume_avg_period
    )
    if len(prices) < min_periods or len(volumes) < min_periods:
        return None

    # Calculate Bollinger Bands
    bollinger = calculate_bollinger_bands(
        prices,
        period=bollinger_period,
        std_dev=bollinger_std_dev,
        width_ma_period=bb_width_ma_period,
        squeeze_threshold_pct=squeeze_threshold_pct,
        squeeze_lookback_days=squeeze_lookback_days
    )
    if bollinger is None:
        return None

    # Calculate RSI
    rsi = get_latest_rsi(prices, period=rsi_period)
    if rsi is None:
        return None

    # Calculate MACD
    macd = get_latest_macd(
        prices,
        fast_period=macd_fast,
        slow_period=macd_slow,
        signal_period=macd_signal
    )
    if macd is None:
        return None

    # Calculate Volume Ratio
    volume_ratio = get_latest_volume_ratio(volumes, avg_period=volume_avg_period)
    if volume_ratio is None:
        return None

    return TechnicalIndicatorsResult(
        bollinger=bollinger,
        rsi=rsi,
        macd=macd,
        volume_ratio=volume_ratio,
        calculated_at=datetime.now()
    )


def check_buy_signal(
    current_price: float,
    indicators: TechnicalIndicatorsResult,
    confidence_threshold: float = 55.0
) -> BuySignalResult:
    """Check if a buy signal is present and calculate confidence.

    Buy signal conditions:
    1. Price is above upper Bollinger Band (breakout)
    2. Either in squeeze or bands are expanding

    Args:
        current_price: Current stock price
        indicators: Calculated technical indicators
        confidence_threshold: Minimum confidence score threshold

    Returns:
        BuySignalResult with signal status and details
    """
    # Check price breakout condition
    price_breakout = is_price_above_upper(current_price, indicators.bollinger.upper)

    # Check squeeze/expansion condition
    squeeze_or_expansion = (
        indicators.bollinger.is_in_squeeze or
        indicators.bollinger.is_expanding
    )

    # Buy signal requires both conditions
    is_buy = price_breakout and squeeze_or_expansion

    # Calculate confidence score
    breakdown = calculate_confidence_score_breakdown(
        volume_ratio=indicators.volume_ratio,
        rsi=indicators.rsi,
        macd_histogram=indicators.macd.histogram,
        macd_signal=indicators.macd.signal
    )

    # Only count as buy signal if above threshold
    if is_buy and breakdown.total < confidence_threshold:
        is_buy = False

    # Generate signal reason
    if is_buy:
        signal_reason = generate_signal_reason(breakdown)
    else:
        signal_reason = ""

    return BuySignalResult(
        is_buy_signal=is_buy,
        confidence_score=breakdown.total,
        signal_reason=signal_reason,
        indicators=indicators,
        breakdown=breakdown
    )
