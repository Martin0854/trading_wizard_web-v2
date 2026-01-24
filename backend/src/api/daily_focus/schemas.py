"""Shared Pydantic schemas for Daily Focus API endpoints."""

from datetime import datetime

from pydantic import BaseModel


class BollingerBandsResponse(BaseModel):
    upper: float
    middle: float
    lower: float
    width: float
    widthMA: float
    isInSqueeze: bool
    isExpanding: bool


class MACDIndicatorResponse(BaseModel):
    macd: float
    signal: float
    histogram: float


class TechnicalIndicatorsResponse(BaseModel):
    bollinger: BollingerBandsResponse
    rsi: float
    macd: MACDIndicatorResponse
    volumeRatio: float
    calculatedAt: datetime


class StockResponse(BaseModel):
    symbol: str
    name: str
    market: str
    currentPrice: float
    previousClose: float
    changePercent: float
    volume: int
    updatedAt: datetime


class ErrorResponse(BaseModel):
    error: str
    message: str
