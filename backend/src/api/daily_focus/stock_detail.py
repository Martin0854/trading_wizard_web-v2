"""Daily Focus stock detail API endpoint.

GET /api/daily-focus/stock/{symbol} - Get detailed stock analysis
"""

import re

from fastapi import APIRouter, HTTPException, Path
from pydantic import BaseModel

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
    symbol: str = Path(..., description="Stock symbol (e.g., 005930.KS)")
) -> StockDetailResponse:
    """Get detailed technical analysis for a specific stock.

    Returns all technical indicators and buy recommendation status if applicable.
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

    result = await get_stock_detail(symbol)

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
            calculatedAt=indicators.calculated_at,
        ),
        recommendation=recommendation,
        priceHistory=[
            PriceHistoryItem(**item) for item in result["priceHistory"]
        ],
    )
