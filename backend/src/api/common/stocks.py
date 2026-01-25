"""Stock API endpoints.

Provides stock search, KOSPI 100 list, and price information.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from shared.data.kospi100 import get_kospi100_stocks
from shared.data.kospi100 import search_stocks as search_kospi

router = APIRouter()


def _get_stock_client():
    """Get stock data client (KRX preferred, yfinance fallback)."""
    try:
        from shared.data.krx_client import KRXClient
        return KRXClient()
    except ImportError:
        from shared.data.yfinance_client import YFinanceClient
        return YFinanceClient()


# Create stock client (KRX preferred for Korean stocks)
stock_client = _get_stock_client()


class StockResponse(BaseModel):
    """Stock information response."""
    symbol: str
    name: str
    market: str
    currentPrice: float
    previousClose: float | None = None
    changePercent: float | None = None
    volume: int | None = None
    updatedAt: datetime | None = None


class StockListResponse(BaseModel):
    """Stock list response."""
    stocks: list[StockResponse]
    updatedAt: datetime


class StockSearchResponse(BaseModel):
    """Stock search response."""
    results: list[StockResponse]
    total: int


class StockPriceResponse(BaseModel):
    """Stock price response."""
    symbol: str
    currentPrice: float
    previousClose: float
    changePercent: float
    updatedAt: datetime


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    message: str


@router.get(
    "/search",
    response_model=StockSearchResponse,
)
async def search_stocks(
    q: str = Query(..., min_length=2, description="검색어 (종목코드 또는 종목명)"),
    limit: int = Query(10, ge=1, le=50, description="최대 결과 수"),
) -> StockSearchResponse:
    """Search stocks by name or symbol.

    Searches within KOSPI 100 stock list.
    """
    results = search_kospi(q, limit=limit)

    stocks = [
        StockResponse(
            symbol=stock.symbol,
            name=stock.name,
            market=stock.market.value,
            currentPrice=0,  # Price not fetched in search
        )
        for stock in results
    ]

    return StockSearchResponse(results=stocks, total=len(stocks))


@router.get(
    "/kospi100",
    response_model=StockListResponse,
)
async def get_kospi100_list() -> StockListResponse:
    """Get KOSPI Top 100 stock list.

    Returns the static list of KOSPI 100 stocks.
    """
    kospi_stocks = get_kospi100_stocks()

    stocks = [
        StockResponse(
            symbol=stock.symbol,
            name=stock.name,
            market=stock.market.value,
            currentPrice=0,  # Price not fetched in list
        )
        for stock in kospi_stocks
    ]

    return StockListResponse(stocks=stocks, updatedAt=datetime.now())


@router.get(
    "/{symbol}/price",
    response_model=StockPriceResponse,
    responses={
        404: {"model": ErrorResponse, "description": "종목을 찾을 수 없음"},
        503: {"model": ErrorResponse, "description": "데이터 조회 실패"},
    }
)
async def get_stock_price(symbol: str) -> StockPriceResponse:
    """Get current stock price.

    Fetches price from KRX (pykrx) or yfinance with caching.
    """
    response = stock_client.get_current_price(symbol)

    if response is None:
        raise HTTPException(
            status_code=503,
            detail={
                "error": "DATA_FETCH_ERROR",
                "message": f"종목 {symbol}의 가격 정보를 조회할 수 없습니다."
            }
        )

    stock = response.stock

    return StockPriceResponse(
        symbol=stock.symbol,
        currentPrice=stock.current_price,
        previousClose=stock.previous_close or stock.current_price,
        changePercent=stock.change_percent or 0.0,
        updatedAt=response.fetched_at
    )
