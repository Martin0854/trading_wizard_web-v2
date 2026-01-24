"""Sell signal service for My Portfolio Wizard.

This module provides functions to analyze portfolio positions and generate
sell recommendations based on various conditions:
- Stop loss: PnL below threshold
- Take profit: PnL above threshold
- Trend break: Price below middle Bollinger Band
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum

import pandas as pd

from shared.indicators import calculate_bollinger_bands


class SellSignalType(str, Enum):
    """Types of sell signals."""
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    TREND_BREAK = "trend_break"


@dataclass
class SellSignal:
    """A sell recommendation signal."""
    position_id: str
    signal_type: SellSignalType
    reason: str
    current_price: float
    pnl_percent: float
    trigger_value: float
    generated_at: datetime


@dataclass
class PortfolioSettings:
    """Settings for sell signal calculation."""
    stop_loss_pct: float = -4.5
    take_profit_pct: float = 12.0
    sell_on_middle_band: bool = False
    bollinger_period: int = 12
    bollinger_std_dev: float = 1.3


def calculate_pnl_percent(
    current_price: float,
    avg_buy_price: float
) -> float:
    """Calculate PnL percentage.

    Args:
        current_price: Current stock price
        avg_buy_price: Average purchase price

    Returns:
        PnL as a percentage (e.g., -4.5 for -4.5%)
    """
    if avg_buy_price <= 0:
        return 0.0
    return ((current_price - avg_buy_price) / avg_buy_price) * 100


def check_stop_loss(
    pnl_percent: float,
    stop_loss_pct: float
) -> bool:
    """Check if stop loss condition is met.

    Args:
        pnl_percent: Current PnL percentage
        stop_loss_pct: Stop loss threshold (negative value, e.g., -4.5)

    Returns:
        True if stop loss triggered
    """
    return pnl_percent <= stop_loss_pct


def check_take_profit(
    pnl_percent: float,
    take_profit_pct: float
) -> bool:
    """Check if take profit condition is met.

    Args:
        pnl_percent: Current PnL percentage
        take_profit_pct: Take profit threshold (positive value, e.g., 12.0)

    Returns:
        True if take profit triggered
    """
    return pnl_percent >= take_profit_pct


def check_trend_break(
    current_price: float,
    prices: pd.Series,
    bollinger_period: int = 12,
    bollinger_std_dev: float = 1.3
) -> tuple[bool, float | None]:
    """Check if price has broken below middle Bollinger Band.

    Args:
        current_price: Current stock price
        prices: Historical price series
        bollinger_period: Bollinger Band period
        bollinger_std_dev: Bollinger Band standard deviation

    Returns:
        Tuple of (is_trend_break, middle_band_value)
    """
    if len(prices) < bollinger_period:
        return False, None

    bb = calculate_bollinger_bands(
        prices,
        period=bollinger_period,
        std_dev=bollinger_std_dev
    )

    if bb is None:
        return False, None

    is_break = current_price < bb.middle
    return is_break, bb.middle


def generate_sell_signals(
    position_id: str,
    _symbol: str,  # noqa: ARG001 - reserved for future logging/analytics
    avg_buy_price: float,
    current_price: float,
    prices: pd.Series | None,
    settings: PortfolioSettings
) -> list[SellSignal]:
    """Generate sell signals for a position.

    Args:
        position_id: Unique position identifier
        symbol: Stock symbol
        avg_buy_price: Average purchase price
        current_price: Current stock price
        prices: Historical price series (for trend break detection)
        settings: Portfolio settings

    Returns:
        List of sell signals (can have multiple signals)
    """
    signals: list[SellSignal] = []
    now = datetime.now()

    # Calculate PnL
    pnl_percent = calculate_pnl_percent(current_price, avg_buy_price)

    # Check stop loss
    if check_stop_loss(pnl_percent, settings.stop_loss_pct):
        signals.append(SellSignal(
            position_id=position_id,
            signal_type=SellSignalType.STOP_LOSS,
            reason=f"손실률 {pnl_percent:.1f}%가 손절매 기준 {settings.stop_loss_pct}% 이하입니다.",
            current_price=current_price,
            pnl_percent=pnl_percent,
            trigger_value=settings.stop_loss_pct,
            generated_at=now
        ))

    # Check take profit
    if check_take_profit(pnl_percent, settings.take_profit_pct):
        signals.append(SellSignal(
            position_id=position_id,
            signal_type=SellSignalType.TAKE_PROFIT,
            reason=f"수익률 {pnl_percent:.1f}%가 익절매 기준 {settings.take_profit_pct}% 이상입니다.",
            current_price=current_price,
            pnl_percent=pnl_percent,
            trigger_value=settings.take_profit_pct,
            generated_at=now
        ))

    # Check trend break (if enabled and prices available)
    if settings.sell_on_middle_band and prices is not None and len(prices) > 0:
        is_break, middle_band = check_trend_break(
            current_price,
            prices,
            settings.bollinger_period,
            settings.bollinger_std_dev
        )
        if is_break and middle_band is not None:
            signals.append(SellSignal(
                position_id=position_id,
                signal_type=SellSignalType.TREND_BREAK,
                reason=f"현재가 {current_price:,.0f}원이 볼린저 중심선 {middle_band:,.0f}원을 하향 돌파했습니다.",
                current_price=current_price,
                pnl_percent=pnl_percent,
                trigger_value=middle_band,
                generated_at=now
            ))

    return signals
