"""Price data validators for Trading Wizard.

Validates OHLCV data integrity before processing.
"""

from dataclasses import dataclass
from typing import Optional

import pandas as pd


@dataclass
class ValidationResult:
    """Result of price data validation."""
    is_valid: bool
    error_message: Optional[str] = None


def validate_ohlcv_row(
    open_price: float,
    high: float,
    low: float,
    close: float,
    volume: int
) -> ValidationResult:
    """Validate a single OHLCV row.

    Validates:
    - All prices are positive
    - OHLC relationship: low <= open, close <= high
    - Volume is non-negative

    Args:
        open_price: Opening price
        high: High price
        low: Low price
        close: Closing price
        volume: Trading volume

    Returns:
        ValidationResult with is_valid and optional error message
    """
    # Check positive prices
    if open_price <= 0:
        return ValidationResult(False, "Open price must be positive")
    if high <= 0:
        return ValidationResult(False, "High price must be positive")
    if low <= 0:
        return ValidationResult(False, "Low price must be positive")
    if close <= 0:
        return ValidationResult(False, "Close price must be positive")

    # Check OHLC relationships
    if low > open_price:
        return ValidationResult(False, "Low cannot be greater than open")
    if low > close:
        return ValidationResult(False, "Low cannot be greater than close")
    if high < open_price:
        return ValidationResult(False, "High cannot be less than open")
    if high < close:
        return ValidationResult(False, "High cannot be less than close")
    if low > high:
        return ValidationResult(False, "Low cannot be greater than high")

    # Check volume
    if volume < 0:
        return ValidationResult(False, "Volume must be non-negative")

    return ValidationResult(True)


def validate_price_dataframe(df: pd.DataFrame) -> ValidationResult:
    """Validate a DataFrame of OHLCV data.

    Args:
        df: DataFrame with columns: Open, High, Low, Close, Volume

    Returns:
        ValidationResult with is_valid and optional error message
    """
    required_columns = ["Open", "High", "Low", "Close", "Volume"]

    # Check required columns
    missing = [col for col in required_columns if col not in df.columns]
    if missing:
        return ValidationResult(False, f"Missing columns: {missing}")

    # Check for empty DataFrame
    if df.empty:
        return ValidationResult(False, "DataFrame is empty")

    # Check for NaN values
    if df[required_columns].isna().any().any():
        return ValidationResult(False, "DataFrame contains NaN values")

    # Validate each row
    for idx, row in df.iterrows():
        result = validate_ohlcv_row(
            open_price=row["Open"],
            high=row["High"],
            low=row["Low"],
            close=row["Close"],
            volume=int(row["Volume"])
        )
        if not result.is_valid:
            return ValidationResult(
                False,
                f"Row {idx}: {result.error_message}"
            )

    return ValidationResult(True)


def clean_price_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Clean OHLCV DataFrame by removing invalid rows.

    Args:
        df: DataFrame with OHLCV columns

    Returns:
        Cleaned DataFrame with invalid rows removed
    """
    if df.empty:
        return df

    # Remove rows with NaN
    df = df.dropna(subset=["Open", "High", "Low", "Close", "Volume"])

    # Remove rows with non-positive prices
    df = df[
        (df["Open"] > 0) &
        (df["High"] > 0) &
        (df["Low"] > 0) &
        (df["Close"] > 0)
    ]

    # Remove rows with negative volume
    df = df[df["Volume"] >= 0]

    # Remove rows with invalid OHLC relationships
    df = df[
        (df["Low"] <= df["Open"]) &
        (df["Low"] <= df["Close"]) &
        (df["High"] >= df["Open"]) &
        (df["High"] >= df["Close"]) &
        (df["Low"] <= df["High"])
    ]

    return df
