"""PnL (Profit and Loss) calculator service for My Portfolio Wizard.

This module provides functions to calculate PnL at both position and portfolio levels.
"""

from dataclasses import dataclass
from datetime import datetime


@dataclass
class PositionPnL:
    """PnL calculation result for a single position."""
    position_id: str
    symbol: str
    current_price: float
    current_value: float
    invested_amount: float
    pnl: float
    pnl_percent: float


@dataclass
class PortfolioPnL:
    """PnL calculation result for entire portfolio."""
    positions: list[PositionPnL]
    total_invested: float
    total_current_value: float
    total_pnl: float
    total_pnl_percent: float
    calculated_at: datetime


def calculate_position_pnl(
    position_id: str,
    symbol: str,
    avg_buy_price: float,
    quantity: int,
    current_price: float
) -> PositionPnL:
    """Calculate PnL for a single position.

    Args:
        position_id: Unique position identifier
        symbol: Stock symbol
        avg_buy_price: Average purchase price
        quantity: Number of shares held
        current_price: Current stock price

    Returns:
        PositionPnL with calculated values
    """
    invested_amount = avg_buy_price * quantity
    current_value = current_price * quantity
    pnl = current_value - invested_amount

    pnl_percent = (pnl / invested_amount) * 100 if invested_amount > 0 else 0.0

    return PositionPnL(
        position_id=position_id,
        symbol=symbol,
        current_price=current_price,
        current_value=current_value,
        invested_amount=invested_amount,
        pnl=pnl,
        pnl_percent=pnl_percent
    )


def calculate_portfolio_pnl(positions: list[PositionPnL]) -> PortfolioPnL:
    """Calculate total portfolio PnL.

    Args:
        positions: List of position PnL results

    Returns:
        PortfolioPnL with aggregated values
    """
    total_invested = sum(p.invested_amount for p in positions)
    total_current_value = sum(p.current_value for p in positions)
    total_pnl = total_current_value - total_invested

    total_pnl_percent = (total_pnl / total_invested) * 100 if total_invested > 0 else 0.0

    return PortfolioPnL(
        positions=positions,
        total_invested=total_invested,
        total_current_value=total_current_value,
        total_pnl=total_pnl,
        total_pnl_percent=total_pnl_percent,
        calculated_at=datetime.now()
    )


def calculate_average_buy_price(
    current_avg_price: float,
    current_quantity: int,
    new_price: float,
    new_quantity: int
) -> float:
    """Calculate new average buy price after additional purchase.

    Formula: newAvgPrice = (oldAvgPrice * oldQty + newPrice * newQty) / (oldQty + newQty)

    Args:
        current_avg_price: Current average purchase price
        current_quantity: Current number of shares
        new_price: New purchase price
        new_quantity: Number of new shares

    Returns:
        New average purchase price
    """
    total_quantity = current_quantity + new_quantity
    if total_quantity == 0:
        return 0.0

    total_cost = (current_avg_price * current_quantity) + (new_price * new_quantity)
    return total_cost / total_quantity
