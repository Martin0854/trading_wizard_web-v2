"""Sell signals API endpoint for My Portfolio Wizard.

POST /api/portfolio/sell-signals
"""

import logging
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.src.services.sell_signal import (
    PortfolioSettings,
    SellSignal,
    SellSignalType,
    generate_sell_signals,
)


def _get_stock_client():
    """Get stock data client (KRX preferred, yfinance fallback)."""
    try:
        from shared.data.krx_client import KRXClient
        return KRXClient()
    except ImportError:
        from shared.data.yfinance_client import YFinanceClient
        return YFinanceClient()


# Module-level client
_stock_client = None


def _get_client():
    global _stock_client
    if _stock_client is None:
        _stock_client = _get_stock_client()
    return _stock_client

logger = logging.getLogger(__name__)

router = APIRouter()


class PositionInput(BaseModel):
    """Input position data."""
    id: str
    symbol: str
    avg_buy_price: float = Field(alias="avgBuyPrice", gt=0)
    quantity: int = Field(gt=0)

    model_config = {"populate_by_name": True}


class SettingsInput(BaseModel):
    """Optional settings for sell signal calculation."""
    stop_loss_pct: float = Field(default=-4.5, alias="stopLossPct", ge=-20, le=0)
    take_profit_pct: float = Field(default=12.0, alias="takeProfitPct", ge=0, le=100)
    sell_on_middle_band: bool = Field(default=False, alias="sellOnMiddleBand")
    bollinger_period: int = Field(default=12, alias="bollingerPeriod", ge=5, le=50)
    bollinger_std_dev: float = Field(default=1.3, alias="bollingerStdDev", ge=0.5, le=3.0)

    model_config = {"populate_by_name": True}


class SellSignalRequest(BaseModel):
    """Request body for sell signals endpoint."""
    positions: list[PositionInput]
    settings: SettingsInput | None = None


class SellSignalResponse(BaseModel):
    """Response for a single sell signal."""
    position_id: str = Field(alias="positionId")
    type: SellSignalType
    reason: str
    current_price: float = Field(alias="currentPrice")
    pnl_percent: float = Field(alias="pnlPercent")
    trigger_value: float = Field(alias="triggerValue")

    model_config = {"populate_by_name": True, "from_attributes": True}

    @classmethod
    def from_sell_signal(cls, signal: SellSignal) -> "SellSignalResponse":
        """Create response from SellSignal dataclass."""
        return cls(
            position_id=signal.position_id,
            type=signal.signal_type,
            reason=signal.reason,
            current_price=signal.current_price,
            pnl_percent=signal.pnl_percent,
            trigger_value=signal.trigger_value
        )


class SellSignalListResponse(BaseModel):
    """Response body for sell signals endpoint."""
    signals: list[SellSignalResponse]
    calculated_at: datetime = Field(alias="calculatedAt")

    model_config = {"populate_by_name": True}


@router.post("/sell-signals", response_model=SellSignalListResponse)
async def get_sell_signals(request: SellSignalRequest) -> SellSignalListResponse:
    """Calculate sell signals for portfolio positions.

    Args:
        request: Positions and optional settings

    Returns:
        List of sell signals for positions that meet sell conditions
    """
    if not request.positions:
        return SellSignalListResponse(signals=[], calculated_at=datetime.now())

    # Convert settings
    settings_input = request.settings or SettingsInput()
    settings = PortfolioSettings(
        stop_loss_pct=settings_input.stop_loss_pct,
        take_profit_pct=settings_input.take_profit_pct,
        sell_on_middle_band=settings_input.sell_on_middle_band,
        bollinger_period=settings_input.bollinger_period,
        bollinger_std_dev=settings_input.bollinger_std_dev
    )

    all_signals: list[SellSignalResponse] = []

    for position in request.positions:
        try:
            # Get current price
            client = _get_client()
            price_response = client.get_current_price(position.symbol)
            if price_response is None:
                continue

            current_price = price_response.stock.current_price

            # Get historical prices if trend break is enabled
            prices = None
            if settings.sell_on_middle_band:
                history = client.get_price_history(
                    position.symbol,
                    period="1mo"  # 1 month for Bollinger calculation
                )
                if history is not None and "Close" in history.columns:
                    prices = history["Close"]

            # Generate signals
            signals = generate_sell_signals(
                position_id=position.id,
                symbol=position.symbol,
                avg_buy_price=position.avg_buy_price,
                current_price=current_price,
                prices=prices,
                settings=settings
            )

            # Convert to response format
            for signal in signals:
                all_signals.append(SellSignalResponse.from_sell_signal(signal))

        except Exception as e:
            # Log error but continue with other positions
            logger.warning("Error processing position %s: %s", position.id, e)
            continue

    return SellSignalListResponse(
        signals=all_signals,
        calculated_at=datetime.now()
    )
