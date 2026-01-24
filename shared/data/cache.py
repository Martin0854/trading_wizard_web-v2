"""Redis cache wrapper for Trading Wizard.

Provides caching with TTL configuration per Constitution III:
- Caching First: Always check cache before external API calls
- 30min TTL for realtime price data
- 24hr TTL for historical data
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Optional

import redis

logger = logging.getLogger(__name__)

# Cache TTL configuration (in seconds)
CACHE_TTL_REALTIME = 30 * 60  # 30 minutes for realtime prices
CACHE_TTL_HISTORY = 24 * 60 * 60  # 24 hours for historical data
CACHE_TTL_KOSPI_LIST = 7 * 24 * 60 * 60  # 7 days for KOSPI 100 list


class CacheClient:
    """Redis cache client with TTL support."""

    def __init__(self, redis_url: str = "redis://localhost:6379/0"):
        """Initialize cache client.

        Args:
            redis_url: Redis connection URL
        """
        self._client = redis.from_url(redis_url, decode_responses=True)
        self._prefix = "trading_wizard:"

    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self._prefix}{key}"

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found/expired
        """
        try:
            full_key = self._make_key(key)
            data = self._client.get(full_key)
            if data is None:
                return None
            return json.loads(data)
        except redis.RedisError as e:
            logger.warning(f"Cache get error for {key}: {e}")
            return None
        except json.JSONDecodeError as e:
            logger.warning(f"Cache decode error for {key}: {e}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl_seconds: int = CACHE_TTL_REALTIME
    ) -> bool:
        """Set value in cache with TTL.

        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl_seconds: Time-to-live in seconds

        Returns:
            True if successful, False otherwise
        """
        try:
            full_key = self._make_key(key)
            data = json.dumps(value, default=str)
            self._client.setex(full_key, ttl_seconds, data)
            return True
        except redis.RedisError as e:
            logger.warning(f"Cache set error for {key}: {e}")
            return False
        except (TypeError, ValueError) as e:
            logger.warning(f"Cache serialize error for {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted, False otherwise
        """
        try:
            full_key = self._make_key(key)
            self._client.delete(full_key)
            return True
        except redis.RedisError as e:
            logger.warning(f"Cache delete error for {key}: {e}")
            return False

    def get_with_freshness(self, key: str) -> tuple[Optional[Any], Optional[datetime]]:
        """Get value from cache with freshness timestamp.

        Args:
            key: Cache key

        Returns:
            Tuple of (value, cached_at) or (None, None) if not found
        """
        try:
            full_key = self._make_key(key)
            pipe = self._client.pipeline()
            pipe.get(full_key)
            pipe.ttl(full_key)
            data, ttl = pipe.execute()

            if data is None:
                return None, None

            value = json.loads(data)

            # Calculate when the data was cached based on remaining TTL
            # This is approximate since we don't know the original TTL
            if ttl > 0:
                # Assume standard TTLs based on key pattern
                if "history" in key.lower():
                    original_ttl = CACHE_TTL_HISTORY
                elif "kospi" in key.lower():
                    original_ttl = CACHE_TTL_KOSPI_LIST
                else:
                    original_ttl = CACHE_TTL_REALTIME

                elapsed = original_ttl - ttl
                cached_at = datetime.now() - timedelta(seconds=elapsed)
            else:
                cached_at = datetime.now()

            return value, cached_at

        except redis.RedisError as e:
            logger.warning(f"Cache get_with_freshness error for {key}: {e}")
            return None, None

    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern.

        Args:
            pattern: Key pattern (e.g., "price:*")

        Returns:
            Number of keys deleted
        """
        try:
            full_pattern = self._make_key(pattern)
            keys = self._client.keys(full_pattern)
            if keys:
                return self._client.delete(*keys)
            return 0
        except redis.RedisError as e:
            logger.warning(f"Cache clear_pattern error for {pattern}: {e}")
            return 0

    def ping(self) -> bool:
        """Check if cache is available.

        Returns:
            True if Redis is reachable, False otherwise
        """
        try:
            return self._client.ping()
        except redis.RedisError:
            return False


# Convenience functions for specific cache types
def cache_key_price(symbol: str) -> str:
    """Generate cache key for stock price."""
    return f"price:{symbol}"


def cache_key_history(symbol: str, period: str = "1y") -> str:
    """Generate cache key for price history."""
    return f"history:{symbol}:{period}"


def cache_key_indicators(symbol: str) -> str:
    """Generate cache key for technical indicators."""
    return f"indicators:{symbol}"


def cache_key_kospi100() -> str:
    """Generate cache key for KOSPI 100 list."""
    return "kospi100:list"
