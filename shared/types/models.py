"""Shared data models for Trading Wizard.

These models are used by both Daily Focus and My Portfolio wizards.
They correspond to the TypeScript types in contracts/types.ts.
"""

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class Market(str, Enum):
    """Stock market type."""
    KOSPI = "KOSPI"
    KOSDAQ = "KOSDAQ"


class SellSignalType(str, Enum):
    """Sell signal type."""
    STOP_LOSS = "stop_loss"
    TAKE_PROFIT = "take_profit"
    TREND_BREAK = "trend_break"


class PositionStatus(str, Enum):
    """Portfolio position status."""
    HOLDING = "holding"
    SOLD = "sold"


class TradingHistoryType(str, Enum):
    """Trading history type."""
    BUY = "buy"
    SELL = "sell"


@dataclass
class Stock:
    """Stock basic information from yfinance."""
    symbol: str
    name: str
    market: Market
    current_price: float
    previous_close: Optional[float] = None
    change_percent: Optional[float] = None
    volume: Optional[int] = None
    updated_at: Optional[datetime] = None


@dataclass
class BollingerBands:
    """Bollinger Bands indicator values."""
    upper: float
    middle: float
    lower: float
    width: float  # (upper - lower) / middle * 100
    width_ma: float  # Moving average of width
    is_in_squeeze: bool  # width < width_ma * 0.55
    is_expanding: bool  # width[today] > width[yesterday]


@dataclass
class MACDIndicator:
    """MACD indicator values."""
    macd: float  # EMA(12) - EMA(26)
    signal: float  # EMA(9) of MACD
    histogram: float  # macd - signal


@dataclass
class TechnicalIndicators:
    """Combined technical indicators for a stock."""
    bollinger: BollingerBands
    rsi: float  # 0-100
    macd: MACDIndicator
    volume_ratio: float  # Today's volume / 20-day average volume
    is_correction_trend: bool  # True if in correction/downtrend
    calculated_at: datetime


@dataclass
class BuyRecommendation:
    """Buy recommendation from Daily Focus Wizard."""
    symbol: str
    stock: Stock
    confidence_score: float  # 0-100
    signal_reason: str
    indicators: TechnicalIndicators
    generated_at: datetime


@dataclass
class SellSignal:
    """Sell signal from My Portfolio Wizard."""
    position_id: str
    type: SellSignalType
    reason: str
    current_price: float
    pnl_percent: float
    trigger_value: float


@dataclass
class PositionInput:
    """Input for position-based calculations."""
    id: str
    symbol: str
    avg_buy_price: float
    quantity: int


@dataclass
class PositionPnL:
    """Position with calculated PnL."""
    id: str
    symbol: str
    current_price: float
    current_value: float
    pnl: float
    pnl_percent: float


@dataclass
class PnLSummary:
    """Portfolio PnL summary."""
    total_invested: float
    total_current_value: float
    total_pnl: float
    total_pnl_percent: float


@dataclass
class PriceHistoryItem:
    """OHLCV price history item."""
    date: str  # YYYY-MM-DD
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass
class PortfolioPosition:
    """Portfolio position entity."""
    id: str
    symbol: str
    stock_name: str
    avg_buy_price: float
    quantity: int
    total_invested: float
    first_buy_date: str  # YYYY-MM-DD
    last_buy_date: str  # YYYY-MM-DD
    status: PositionStatus = PositionStatus.HOLDING
    sold_price: Optional[float] = None
    sold_date: Optional[str] = None
    sold_quantity: Optional[int] = None


@dataclass
class TradingHistory:
    """Trading history record."""
    id: str
    position_id: str
    symbol: str
    type: TradingHistoryType
    price: float
    quantity: int
    total_amount: float
    traded_at: datetime
    note: Optional[str] = None
