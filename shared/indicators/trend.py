"""Trend analysis indicators.

This module provides functions to analyze price trends for the Bollinger Band strategy.
It focuses on detecting correction or downtrend phases before a potential breakout.
"""

import pandas as pd


def calculate_trend_status(
    prices: pd.Series,
    middle_band: pd.Series,
    trend_lookback_days: int = 20,
    trend_below_ma_threshold: int = 15,
    trend_ma_slope_lookback: int = 10
) -> bool:
    """Calculate if the stock is in a correction or downtrend status.
    
    A stock is considered in correction/downtrend if EITHER:
    1. limit(Price Position): Close price was below Middle Band for 'trend_below_ma_threshold' days 
       within the last 'trend_lookback_days'.
    2. limit(MA Slope): Current Middle Band is lower than 'trend_ma_slope_lookback' days ago
       (indicating negative slope or downtrend).

    Args:
        prices: Series of closing prices
        middle_band: Series of Bollinger Middle Band (SMA) values
        trend_lookback_days: Number of days to look back for price position check (default: 20)
        trend_below_ma_threshold: Minimum number of days price must be below MA (default: 15)
        trend_ma_slope_lookback: Days to look back for MA slope calculation (default: 10)

    Returns:
        True if correction or downtrend is detected, False otherwise.
    """
    if len(prices) < trend_lookback_days or len(middle_band) < max(trend_lookback_days, trend_ma_slope_lookback):
        return False

    # 1. Price Position Check
    # Check last 'trend_lookback_days' (excluding current day makes sense for "pre-breakout", 
    # but usually we include up to yesterday if checking "status before today", 
    # or just recent history. Strategy says "immediately before breakout".
    # Using last N days inclusive or exclusive? 
    # Usually "recent 20 days" implies including the current signal day or just before.
    # If today is breakout, we want to know if *recent history* was downtrend.
    # Let's check the window [today-lookback+1 : today+1] effectively.
    
    # We will use the last 'trend_lookback_days' data points.
    recent_prices = prices.iloc[-trend_lookback_days:]
    recent_ma = middle_band.iloc[-trend_lookback_days:]
    
    # Count days where Close < Middle Band
    days_below = (recent_prices < recent_ma).sum()
    is_price_below_trend = days_below >= trend_below_ma_threshold

    # 2. MA Slope Check
    # Compare current MA with MA 'trend_ma_slope_lookback' days ago
    current_ma = middle_band.iloc[-1]
    prev_ma = middle_band.iloc[-(trend_ma_slope_lookback + 1)] # +1 for offset
    
    is_negative_slope = current_ma < prev_ma

    return bool(is_price_below_trend or is_negative_slope)
