"""Daily Focus recommendations API endpoint.

GET /api/daily-focus/recommendations - Get buy recommendations
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.src.services.signal_scanner import scan_for_buy_signals

from .schemas import (
    BollingerBandsResponse,
    ErrorResponse,
    MACDIndicatorResponse,
    StockResponse,
    TechnicalIndicatorsResponse,
)

router = APIRouter(prefix="/api/daily-focus", tags=["Daily Focus"])


class BuyRecommendationResponse(BaseModel):
    symbol: str
    stock: StockResponse
    confidenceScore: float
    signalReason: str
    indicators: TechnicalIndicatorsResponse
    generatedAt: datetime


class ParametersResponse(BaseModel):
    bollingerPeriod: int
    bollingerStdDev: float
    confidenceThreshold: float


class RecommendationsListResponse(BaseModel):
    recommendations: list[BuyRecommendationResponse]
    totalScanned: int
    generatedAt: datetime
    parameters: ParametersResponse


@router.get(
    "/recommendations",
    response_model=RecommendationsListResponse,
    responses={503: {"model": ErrorResponse}}
)
async def get_recommendations(
    confidence_threshold: float = Query(55.0, ge=0, le=100, alias="confidence_threshold"),
    bollinger_period: int = Query(12, ge=5, le=50, alias="bollinger_period"),
    bollinger_std_dev: float = Query(1.3, ge=0.5, le=3.0, alias="bollinger_std_dev"),
) -> RecommendationsListResponse:
    """Get buy recommendations based on Bollinger Band squeeze strategy.

    Scans KOSPI Top 100 stocks and returns recommendations sorted by confidence score.
    """
    try:
        result = await scan_for_buy_signals(
            confidence_threshold=confidence_threshold,
            bollinger_period=bollinger_period,
            bollinger_std_dev=bollinger_std_dev,
        )

        recommendations = []
        for rec in result.recommendations:
            recommendations.append(BuyRecommendationResponse(
                symbol=rec.symbol,
                stock=StockResponse(
                    symbol=rec.stock.symbol,
                    name=rec.stock.name,
                    market=rec.stock.market,
                    currentPrice=rec.stock.current_price,
                    previousClose=rec.stock.previous_close,
                    changePercent=rec.stock.change_percent,
                    volume=rec.stock.volume,
                    updatedAt=rec.stock.updated_at,
                ),
                confidenceScore=rec.confidence_score,
                signalReason=rec.signal_reason,
                indicators=TechnicalIndicatorsResponse(
                    bollinger=BollingerBandsResponse(
                        upper=rec.indicators.bollinger.upper,
                        middle=rec.indicators.bollinger.middle,
                        lower=rec.indicators.bollinger.lower,
                        width=rec.indicators.bollinger.width,
                        widthMA=rec.indicators.bollinger.width_ma,
                        isInSqueeze=rec.indicators.bollinger.is_in_squeeze,
                        isExpanding=rec.indicators.bollinger.is_expanding,
                    ),
                    rsi=rec.indicators.rsi,
                    macd=MACDIndicatorResponse(
                        macd=rec.indicators.macd.macd,
                        signal=rec.indicators.macd.signal,
                        histogram=rec.indicators.macd.histogram,
                    ),
                    volumeRatio=rec.indicators.volume_ratio,
                    calculatedAt=rec.indicators.calculated_at,
                ),
                generatedAt=rec.generated_at,
            ))

        return RecommendationsListResponse(
            recommendations=recommendations,
            totalScanned=result.total_scanned,
            generatedAt=result.generated_at,
            parameters=ParametersResponse(
                bollingerPeriod=result.parameters["bollingerPeriod"],
                bollingerStdDev=result.parameters["bollingerStdDev"],
                confidenceThreshold=result.parameters["confidenceThreshold"],
            ),
        )

    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={"error": "SERVICE_UNAVAILABLE", "message": f"데이터 조회에 실패했습니다: {str(e)}"},
        ) from e
