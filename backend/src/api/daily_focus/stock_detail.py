"""Daily Focus stock detail API endpoint.

GET /api/daily-focus/stock/{symbol} - Get detailed stock analysis
"""

import re

from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.db.database import get_db
from backend.src.services.signal_scanner import get_stock_detail

from .schemas import (
    BollingerBandsResponse,
    ErrorResponse,
    MACDIndicatorResponse,
    StockResponse,
    TechnicalIndicatorsResponse,
)

router = APIRouter(prefix="/api/daily-focus", tags=["Daily Focus"])

# Korean stock symbol pattern: 6 digits + .KS or .KQ
SYMBOL_PATTERN = re.compile(r"^\d{6}\.(KS|KQ)$")


class BuyRecommendationShort(BaseModel):
    symbol: str
    confidenceScore: float
    signalReason: str
    generatedAt: str


class PriceHistoryItem(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockDetailResponse(BaseModel):
    stock: StockResponse
    indicators: TechnicalIndicatorsResponse
    recommendation: BuyRecommendationShort | None = None
    priceHistory: list[PriceHistoryItem]


@router.get(
    "/stock/{symbol}",
    response_model=StockDetailResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    }
)
async def get_stock_analysis(
    symbol: str = Path(..., description="Stock symbol (e.g., 005930.KS)"),
    confidence_threshold: float = Query(55.0, ge=0, le=100, alias="confidence_threshold"),
    bollinger_period: int = Query(12, ge=5, le=50, alias="bollinger_period"),
    bollinger_std_dev: float = Query(1.3, ge=0.5, le=3.0, alias="bollinger_std_dev"),
    trend_lookback_days: int = Query(20, ge=5, le=60, alias="trend_lookback_days"),
    trend_below_ma_threshold: int = Query(15, ge=1, le=60, alias="trend_below_ma_threshold"),
    trend_ma_slope_lookback: int = Query(10, ge=1, le=30, alias="trend_ma_slope_lookback"),
    db: AsyncSession = Depends(get_db),
) -> StockDetailResponse:
    """Get detailed technical analysis for a specific stock.

    Returns all technical indicators and buy recommendation status if applicable.
    Uses two-tier caching (Redis + PostgreSQL) to minimize yfinance API calls.
    """
    # Validate symbol format
    if not SYMBOL_PATTERN.match(symbol):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "INVALID_SYMBOL",
                "message": f"잘못된 종목 코드 형식입니다: {symbol}. 형식: 6자리숫자.KS 또는 6자리숫자.KQ",
            },
        )

    result = await get_stock_detail(
        symbol,
        confidence_threshold=confidence_threshold,
        bollinger_period=bollinger_period,
        bollinger_std_dev=bollinger_std_dev,
        trend_lookback_days=trend_lookback_days,
        trend_below_ma_threshold=trend_below_ma_threshold,
        trend_ma_slope_lookback=trend_ma_slope_lookback,
        db_session=db
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail={"error": "NOT_FOUND", "message": f"종목을 찾을 수 없습니다: {symbol}"},
        )

    stock = result["stock"]
    indicators = result["indicators"]

    recommendation = None
    if result["recommendation"]:
        recommendation = BuyRecommendationShort(
            symbol=result["recommendation"]["symbol"],
            confidenceScore=result["recommendation"]["confidenceScore"],
            signalReason=result["recommendation"]["signalReason"],
            generatedAt=result["recommendation"]["generatedAt"],
        )

    return StockDetailResponse(
        stock=StockResponse(
            symbol=stock.symbol,
            name=stock.name,
            market=stock.market,
            currentPrice=stock.current_price,
            previousClose=stock.previous_close,
            changePercent=stock.change_percent,
            volume=stock.volume,
            updatedAt=stock.updated_at,
        ),
        indicators=TechnicalIndicatorsResponse(
            bollinger=BollingerBandsResponse(
                upper=indicators.bollinger.upper,
                middle=indicators.bollinger.middle,
                lower=indicators.bollinger.lower,
                width=indicators.bollinger.width,
                widthMA=indicators.bollinger.width_ma,
                isInSqueeze=indicators.bollinger.is_in_squeeze,
                isExpanding=indicators.bollinger.is_expanding,
            ),
            rsi=indicators.rsi,
            macd=MACDIndicatorResponse(
                macd=indicators.macd.macd,
                signal=indicators.macd.signal,
                histogram=indicators.macd.histogram,
            ),
            volumeRatio=indicators.volume_ratio,
            isCorrectionTrend=indicators.is_correction_trend,
            calculatedAt=indicators.calculated_at,
        ),
        recommendation=recommendation,
        priceHistory=[
            PriceHistoryItem(**item) for item in result["priceHistory"]
        ],
    )
