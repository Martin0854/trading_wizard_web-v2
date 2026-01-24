"""Data fetching and caching package.

Provides:
- yfinance_client: yfinance API client with rate limiting
- cache: Redis cache wrapper
- cache_strategy: Smart cache refresh logic for Korean market
- persistent_cache: Two-tier caching (Redis + PostgreSQL)
"""

from shared.data.cache_strategy import (
    get_last_trading_date,
    is_korean_market_open,
    should_refresh_history,
)
from shared.data.persistent_cache import PersistentCacheClient, create_persistent_cache

__all__ = [
    "PersistentCacheClient",
    "create_persistent_cache",
    "get_last_trading_date",
    "is_korean_market_open",
    "should_refresh_history",
]
