"""Signal scanner service for Daily Focus Wizard.

Scans KOSPI Top 100 stocks for buy signals based on Bollinger Band squeeze strategy.
"""

import asyncio
import logging
from dataclasses import dataclass
from datetime import datetime

from shared.data.batch_fetcher import BatchFetcher
from shared.data.kospi100 import get_kospi100_list
from shared.indicators import (
    TechnicalIndicatorsResult,
    calculate_all_indicators,
    check_buy_signal,
)
from shared.types.models import BollingerBands, MACDIndicator, Stock, TechnicalIndicators

logger = logging.getLogger(__name__)


@dataclass
class BuyRecommendation:
    """Buy recommendation with all details."""
    symbol: str
    stock: Stock
    confidence_score: float
    signal_reason: str
    indicators: TechnicalIndicators
    generated_at: datetime


@dataclass
class ScanResult:
    """Result of a full scan."""
    recommendations: list[BuyRecommendation]
    total_scanned: int
    generated_at: datetime
    parameters: dict


def _convert_indicators(result: TechnicalIndicatorsResult) -> TechnicalIndicators:
    """Convert internal indicator result to API model."""
    return TechnicalIndicators(
        bollinger=BollingerBands(
            upper=result.bollinger.upper,
            middle=result.bollinger.middle,
            lower=result.bollinger.lower,
            width=result.bollinger.width,
            width_ma=result.bollinger.width_ma,
            is_in_squeeze=result.bollinger.is_in_squeeze,
            is_expanding=result.bollinger.is_expanding,
        ),
        rsi=result.rsi,
        macd=MACDIndicator(
            macd=result.macd.macd,
            signal=result.macd.signal,
            histogram=result.macd.histogram,
        ),
        volume_ratio=result.volume_ratio,
        calculated_at=result.calculated_at,
    )


async def scan_for_buy_signals(
    confidence_threshold: float = 55.0,
    bollinger_period: int = 12,
    bollinger_std_dev: float = 1.3,
    squeeze_threshold_pct: float = 55,
    squeeze_lookback_days: int = 5,
    bb_width_ma_period: int = 10,
    rsi_period: int = 14,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    volume_avg_period: int = 20,
) -> ScanResult:
    """Scan KOSPI Top 100 for buy signals.

    Args:
        confidence_threshold: Minimum confidence score for recommendations
        bollinger_period: Bollinger Band period
        bollinger_std_dev: BB standard deviation multiplier
        squeeze_threshold_pct: Squeeze threshold percentage
        squeeze_lookback_days: Squeeze lookback days
        bb_width_ma_period: BB Width MA period
        rsi_period: RSI period
        macd_fast: MACD fast period
        macd_slow: MACD slow period
        macd_signal: MACD signal period
        volume_avg_period: Volume average period

    Returns:
        ScanResult with recommendations sorted by confidence score
    """
    stocks = get_kospi100_list()
    fetcher = BatchFetcher()

    recommendations: list[BuyRecommendation] = []
    scanned_count = 0

    for stock_info in stocks:
        symbol = stock_info["symbol"]
        try:
            # Fetch historical data
            data = await asyncio.to_thread(
                fetcher.fetch_single,
                symbol,
                period="3mo"
            )
            if data is None or data.empty:
                continue

            scanned_count += 1
            prices = data["Close"]
            volumes = data["Volume"]
            current_price = float(prices.iloc[-1])

            # Calculate indicators
            indicators = calculate_all_indicators(
                prices=prices,
                volumes=volumes,
                bollinger_period=bollinger_period,
                bollinger_std_dev=bollinger_std_dev,
                bb_width_ma_period=bb_width_ma_period,
                squeeze_threshold_pct=squeeze_threshold_pct,
                squeeze_lookback_days=squeeze_lookback_days,
                rsi_period=rsi_period,
                macd_fast=macd_fast,
                macd_slow=macd_slow,
                macd_signal=macd_signal,
                volume_avg_period=volume_avg_period,
            )
            if indicators is None:
                continue

            # Check for buy signal
            signal_result = check_buy_signal(
                current_price=current_price,
                indicators=indicators,
                confidence_threshold=confidence_threshold,
            )

            if signal_result.is_buy_signal:
                stock = Stock(
                    symbol=symbol,
                    name=stock_info["name"],
                    market=stock_info["market"],
                    current_price=current_price,
                    previous_close=float(data["Close"].iloc[-2]) if len(data) > 1 else current_price,
                    change_percent=((current_price - float(data["Close"].iloc[-2])) / float(data["Close"].iloc[-2]) * 100) if len(data) > 1 else 0,
                    volume=int(volumes.iloc[-1]),
                    updated_at=datetime.now(),
                )

                recommendations.append(BuyRecommendation(
                    symbol=symbol,
                    stock=stock,
                    confidence_score=signal_result.confidence_score,
                    signal_reason=signal_result.signal_reason,
                    indicators=_convert_indicators(indicators),
                    generated_at=datetime.now(),
                ))

        except Exception as e:
            logger.warning(f"Failed to scan stock {symbol}: {e}")
            continue

    # Sort by confidence score descending
    recommendations.sort(key=lambda x: x.confidence_score, reverse=True)

    return ScanResult(
        recommendations=recommendations,
        total_scanned=scanned_count,
        generated_at=datetime.now(),
        parameters={
            "bollingerPeriod": bollinger_period,
            "bollingerStdDev": bollinger_std_dev,
            "confidenceThreshold": confidence_threshold,
        },
    )


async def get_stock_detail(
    symbol: str,
    bollinger_period: int = 12,
    bollinger_std_dev: float = 1.3,
    squeeze_threshold_pct: float = 55,
    squeeze_lookback_days: int = 5,
    bb_width_ma_period: int = 10,
    rsi_period: int = 14,
    macd_fast: int = 12,
    macd_slow: int = 26,
    macd_signal: int = 9,
    volume_avg_period: int = 20,
    confidence_threshold: float = 55.0,
) -> dict | None:
    """Get detailed stock information with technical indicators.

    Args:
        symbol: Stock symbol
        Other args: Strategy parameters

    Returns:
        Dictionary with stock details or None if not found
    """
    fetcher = BatchFetcher()
    stocks = {s["symbol"]: s for s in get_kospi100_list()}

    stock_info = stocks.get(symbol)
    if not stock_info:
        return None

    try:
        data = await asyncio.to_thread(
            fetcher.fetch_single,
            symbol,
            period="3mo"
        )
        if data is None or data.empty:
            return None

        prices = data["Close"]
        volumes = data["Volume"]
        current_price = float(prices.iloc[-1])

        # Calculate indicators
        indicators = calculate_all_indicators(
            prices=prices,
            volumes=volumes,
            bollinger_period=bollinger_period,
            bollinger_std_dev=bollinger_std_dev,
            bb_width_ma_period=bb_width_ma_period,
            squeeze_threshold_pct=squeeze_threshold_pct,
            squeeze_lookback_days=squeeze_lookback_days,
            rsi_period=rsi_period,
            macd_fast=macd_fast,
            macd_slow=macd_slow,
            macd_signal=macd_signal,
            volume_avg_period=volume_avg_period,
        )
        if indicators is None:
            return None

        # Check for buy signal
        signal_result = check_buy_signal(
            current_price=current_price,
            indicators=indicators,
            confidence_threshold=confidence_threshold,
        )

        stock = Stock(
            symbol=symbol,
            name=stock_info["name"],
            market=stock_info["market"],
            current_price=current_price,
            previous_close=float(data["Close"].iloc[-2]) if len(data) > 1 else current_price,
            change_percent=((current_price - float(data["Close"].iloc[-2])) / float(data["Close"].iloc[-2]) * 100) if len(data) > 1 else 0,
            volume=int(volumes.iloc[-1]),
            updated_at=datetime.now(),
        )

        # Build price history
        price_history = []
        for i in range(-30, 0):
            if abs(i) <= len(data):
                idx = i
                price_history.append({
                    "date": data.index[idx].strftime("%Y-%m-%d"),
                    "open": float(data["Open"].iloc[idx]),
                    "high": float(data["High"].iloc[idx]),
                    "low": float(data["Low"].iloc[idx]),
                    "close": float(data["Close"].iloc[idx]),
                    "volume": int(data["Volume"].iloc[idx]),
                })

        recommendation = None
        if signal_result.is_buy_signal:
            recommendation = {
                "symbol": symbol,
                "confidenceScore": signal_result.confidence_score,
                "signalReason": signal_result.signal_reason,
                "generatedAt": datetime.now().isoformat(),
            }

        return {
            "stock": stock,
            "indicators": _convert_indicators(indicators),
            "recommendation": recommendation,
            "priceHistory": price_history,
        }

    except Exception as e:
        logger.warning(f"Failed to get stock detail for {symbol}: {e}")
        return None
