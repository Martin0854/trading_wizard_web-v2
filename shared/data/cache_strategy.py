"""Cache refresh strategy for Korean stock market.

Determines when to refresh cached data based on:
- Korean market trading hours (09:00-15:30 KST)
- Last trading day calculation (excluding weekends/holidays)
- Data freshness requirements
"""

from datetime import date, datetime, time, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

# Korean timezone
KST = ZoneInfo("Asia/Seoul")

# Korean market hours
MARKET_OPEN = time(9, 0)
MARKET_CLOSE = time(15, 30)

# Refresh settings
INTRADAY_REFRESH_MINUTES = 30  # During market hours, refresh every 30 min


def now_kst() -> datetime:
    """Get current time in KST."""
    return datetime.now(KST)


def today_kst() -> date:
    """Get today's date in KST."""
    return now_kst().date()


def is_weekend(d: date) -> bool:
    """Check if date is weekend (Saturday=5, Sunday=6)."""
    return d.weekday() >= 5


def is_korean_market_open() -> bool:
    """Check if Korean stock market is currently open.

    Returns:
        True if market is open (weekday 09:00-15:30 KST)
    """
    now = now_kst()

    # Weekend check
    if is_weekend(now.date()):
        return False

    # Time check
    current_time = now.time()
    return MARKET_OPEN <= current_time <= MARKET_CLOSE


def get_last_trading_date(reference_date: Optional[date] = None) -> date:
    """Get the most recent trading date.

    For weekdays after market close: returns today
    For weekdays before market close: returns previous trading day
    For weekends: returns Friday

    Args:
        reference_date: Date to calculate from (default: today KST)

    Returns:
        Most recent trading date
    """
    if reference_date is None:
        now = now_kst()
        ref_date = now.date()

        # If before market close, use previous day's data
        if now.time() < MARKET_CLOSE:
            ref_date = ref_date - timedelta(days=1)
    else:
        ref_date = reference_date

    # Move back from weekends to Friday
    while is_weekend(ref_date):
        ref_date = ref_date - timedelta(days=1)

    return ref_date


def should_refresh_history(
    last_fetched_at: Optional[datetime],
    cached_period_end: Optional[date],
) -> bool:
    """Determine if price history should be refreshed.

    Refresh logic:
    1. No cache exists: refresh
    2. After market close (15:30 KST):
       - If cache doesn't include today's close: refresh
       - Otherwise: use cache
    3. During market hours (09:00-15:30 KST):
       - If last fetch > 30 minutes ago: refresh
       - Otherwise: use cache
    4. Before market open:
       - Use previous day's close (same as after close)

    Args:
        last_fetched_at: When data was last fetched (timezone-aware)
        cached_period_end: Last date in cached data

    Returns:
        True if data should be refreshed from yfinance
    """
    # No cache exists
    if last_fetched_at is None or cached_period_end is None:
        return True

    now = now_kst()
    last_trading = get_last_trading_date()

    # Ensure last_fetched_at is timezone-aware in KST
    if last_fetched_at.tzinfo is None:
        last_fetched_at = last_fetched_at.replace(tzinfo=KST)
    else:
        last_fetched_at = last_fetched_at.astimezone(KST)

    # Case: Market is currently open
    if is_korean_market_open():
        elapsed = now - last_fetched_at
        return elapsed.total_seconds() > INTRADAY_REFRESH_MINUTES * 60

    # Case: Market is closed (after hours or weekend)
    # Check if we have the last trading day's close
    return cached_period_end < last_trading


def get_cache_ttl_seconds() -> int:
    """Get appropriate cache TTL based on market state.

    Returns:
        TTL in seconds:
        - 30 min during market hours
        - Until next market open after hours
    """
    if is_korean_market_open():
        return INTRADAY_REFRESH_MINUTES * 60

    # After market close: cache until tomorrow's market open
    # Simplified: use 1 hour TTL for L1 cache
    return 60 * 60


def calculate_period_start(period: str = "3mo") -> date:
    """Calculate start date for a period string.

    Args:
        period: yfinance period format (e.g., "3mo", "6mo", "1y")

    Returns:
        Start date for the period
    """
    today = today_kst()

    period_map = {
        "1mo": timedelta(days=30),
        "3mo": timedelta(days=90),
        "6mo": timedelta(days=180),
        "1y": timedelta(days=365),
        "2y": timedelta(days=730),
    }

    delta = period_map.get(period, timedelta(days=90))
    return today - delta
