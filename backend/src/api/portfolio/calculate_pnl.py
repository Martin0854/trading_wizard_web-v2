"""PnL calculation API endpoint for My Portfolio Wizard.

POST /api/portfolio/calculate-pnl
"""

import logging
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.src.services.pnl_calculator import (
    PositionPnL,
    calculate_portfolio_pnl,
    calculate_position_pnl,
)
from shared.data.yfinance_client import get_stock_price

logger = logging.getLogger(__name__)

router = APIRouter()


class PositionInput(BaseModel):
    """Input position data."""
    id: str
    symbol: str
    avg_buy_price: float = Field(alias="avgBuyPrice", gt=0)
    quantity: int = Field(gt=0)

    model_config = {"populate_by_name": True}


class PnLCalculationRequest(BaseModel):
    """Request body for PnL calculation endpoint."""
    positions: list[PositionInput]


class PositionPnLResponse(BaseModel):
    """Response for a single position PnL."""
    id: str
    symbol: str
    current_price: float = Field(alias="currentPrice")
    current_value: float = Field(alias="currentValue")
    pnl: float
    pnl_percent: float = Field(alias="pnlPercent")

    model_config = {"populate_by_name": True}

    @classmethod
    def from_position_pnl(cls, pnl: PositionPnL) -> "PositionPnLResponse":
        """Create response from PositionPnL dataclass."""
        return cls(
            id=pnl.position_id,
            symbol=pnl.symbol,
            current_price=pnl.current_price,
            current_value=pnl.current_value,
            pnl=pnl.pnl,
            pnl_percent=pnl.pnl_percent
        )


class PortfolioSummary(BaseModel):
    """Portfolio summary with totals."""
    total_invested: float = Field(alias="totalInvested")
    total_current_value: float = Field(alias="totalCurrentValue")
    total_pnl: float = Field(alias="totalPnl")
    total_pnl_percent: float = Field(alias="totalPnlPercent")

    model_config = {"populate_by_name": True}


class PnLCalculationResponse(BaseModel):
    """Response body for PnL calculation endpoint."""
    positions: list[PositionPnLResponse]
    summary: PortfolioSummary
    calculated_at: datetime = Field(alias="calculatedAt")

    model_config = {"populate_by_name": True}


@router.post("/calculate-pnl", response_model=PnLCalculationResponse)
async def calculate_pnl(request: PnLCalculationRequest) -> PnLCalculationResponse:
    """Calculate PnL for portfolio positions.

    Args:
        request: List of positions

    Returns:
        PnL for each position and portfolio summary
    """
    if not request.positions:
        return PnLCalculationResponse(
            positions=[],
            summary=PortfolioSummary(
                total_invested=0,
                total_current_value=0,
                total_pnl=0,
                total_pnl_percent=0
            ),
            calculated_at=datetime.now()
        )

    position_pnls: list[PositionPnL] = []
    position_responses: list[PositionPnLResponse] = []

    for position in request.positions:
        try:
            # Get current price
            price_data = get_stock_price(position.symbol)
            current_price = 0.0 if price_data is None else price_data.current_price

            # Calculate PnL
            pnl = calculate_position_pnl(
                position_id=position.id,
                symbol=position.symbol,
                avg_buy_price=position.avg_buy_price,
                quantity=position.quantity,
                current_price=current_price
            )
            position_pnls.append(pnl)
            position_responses.append(PositionPnLResponse.from_position_pnl(pnl))

        except Exception as e:
            logger.warning("Error calculating PnL for position %s: %s", position.id, e)
            continue

    # Calculate portfolio totals
    portfolio = calculate_portfolio_pnl(position_pnls)

    return PnLCalculationResponse(
        positions=position_responses,
        summary=PortfolioSummary(
            total_invested=portfolio.total_invested,
            total_current_value=portfolio.total_current_value,
            total_pnl=portfolio.total_pnl,
            total_pnl_percent=portfolio.total_pnl_percent
        ),
        calculated_at=portfolio.calculated_at
    )
