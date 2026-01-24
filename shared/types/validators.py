"""Validation helpers for Trading Wizard.

These validators ensure data integrity for stock symbols and price data.
"""

import re
from dataclasses import dataclass
from typing import Optional


# Symbol pattern: 6 digits followed by .KS (KOSPI) or .KQ (KOSDAQ)
SYMBOL_PATTERN = re.compile(r"^[0-9]{6}\.(KS|KQ)$")

# User ID hash pattern: 64 hex characters (SHA-256)
USER_ID_HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")


def validate_symbol(symbol: str) -> bool:
    """Validate stock symbol format.

    Args:
        symbol: Stock symbol (e.g., "005930.KS")

    Returns:
        True if valid, False otherwise
    """
    if not symbol or not isinstance(symbol, str):
        return False
    return bool(SYMBOL_PATTERN.match(symbol))


def validate_user_id_hash(hash_value: str) -> bool:
    """Validate user ID hash format.

    Args:
        hash_value: SHA-256 hash in hex format

    Returns:
        True if valid, False otherwise
    """
    if not hash_value or not isinstance(hash_value, str):
        return False
    return bool(USER_ID_HASH_PATTERN.match(hash_value))


@dataclass
class PriceData:
    """Price data for validation."""
    open: float
    high: float
    low: float
    close: float
    volume: int


def validate_price_data(data: PriceData) -> tuple[bool, Optional[str]]:
    """Validate OHLCV price data.

    Validates:
    - All prices are positive
    - OHLC relationship: low <= open, close <= high
    - Volume is non-negative

    Args:
        data: Price data to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check positive prices
    if data.open <= 0:
        return False, "Open price must be positive"
    if data.high <= 0:
        return False, "High price must be positive"
    if data.low <= 0:
        return False, "Low price must be positive"
    if data.close <= 0:
        return False, "Close price must be positive"

    # Check OHLC relationship
    if data.low > data.open:
        return False, "Low price cannot be greater than open price"
    if data.low > data.close:
        return False, "Low price cannot be greater than close price"
    if data.high < data.open:
        return False, "High price cannot be less than open price"
    if data.high < data.close:
        return False, "High price cannot be less than close price"
    if data.low > data.high:
        return False, "Low price cannot be greater than high price"

    # Check volume
    if data.volume < 0:
        return False, "Volume must be non-negative"

    return True, None


def validate_daily_focus_settings(settings: dict) -> list[str]:
    """Validate Daily Focus settings.

    Args:
        settings: Settings dictionary to validate

    Returns:
        List of error messages (empty if valid)
    """
    errors: list[str] = []

    if "bollinger_period" in settings:
        val = settings["bollinger_period"]
        if not (5 <= val <= 50):
            errors.append("볼린저 기간은 5-50 범위여야 합니다.")

    if "bollinger_std_dev" in settings:
        val = settings["bollinger_std_dev"]
        if not (0.5 <= val <= 3.0):
            errors.append("표준편차 배수는 0.5-3.0 범위여야 합니다.")

    if "confidence_threshold" in settings:
        val = settings["confidence_threshold"]
        if not (0 <= val <= 100):
            errors.append("신뢰도 임계값은 0-100 범위여야 합니다.")

    if "squeeze_threshold_pct" in settings:
        val = settings["squeeze_threshold_pct"]
        if not (30 <= val <= 80):
            errors.append("스퀴즈 임계값은 30-80 범위여야 합니다.")

    if "rsi_period" in settings:
        val = settings["rsi_period"]
        if not (7 <= val <= 28):
            errors.append("RSI 기간은 7-28 범위여야 합니다.")

    return errors


def validate_portfolio_settings(settings: dict) -> list[str]:
    """Validate Portfolio settings.

    Args:
        settings: Settings dictionary to validate

    Returns:
        List of error messages (empty if valid)
    """
    errors: list[str] = []

    if "stop_loss_pct" in settings:
        val = settings["stop_loss_pct"]
        if not (-20 <= val <= 0):
            errors.append("손절매 기준은 -20% ~ 0% 범위여야 합니다.")

    if "take_profit_pct" in settings:
        val = settings["take_profit_pct"]
        if not (0 <= val <= 100):
            errors.append("익절매 기준은 0% ~ 100% 범위여야 합니다.")

    if "bollinger_period" in settings:
        val = settings["bollinger_period"]
        if not (5 <= val <= 50):
            errors.append("볼린저 기간은 5-50 범위여야 합니다.")

    if "bollinger_std_dev" in settings:
        val = settings["bollinger_std_dev"]
        if not (0.5 <= val <= 3.0):
            errors.append("표준편차 배수는 0.5-3.0 범위여야 합니다.")

    return errors
