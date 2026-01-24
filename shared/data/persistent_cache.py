"""Two-tier persistent cache for stock price data.

Architecture:
    Request -> Redis (L1, fast) -> PostgreSQL (L2, persistent) -> yfinance API

L1 Cache (Redis):
    - 1 hour TTL
    - Fast access for repeated requests
    - Lost on server restart

L2 Cache (PostgreSQL):
    - 7 day retention
    - Survives server restarts
    - Restores L1 cache on miss
"""

import asyncio
import logging
from datetime import date
from typing import Optional

import pandas as pd
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from shared.data.cache import CacheClient, cache_key_history
from shared.data.cache_strategy import (
    calculate_period_start,
    get_cache_ttl_seconds,
    now_kst,
    should_refresh_history,
)
from shared.data.yfinance_client import YFinanceClient

logger = logging.getLogger(__name__)

# L1 (Redis) TTL: 1 hour
L1_TTL_SECONDS = 60 * 60

# L2 (PostgreSQL) retention: 7 days
L2_RETENTION_DAYS = 7


class PersistentCacheClient:
    """Two-tier cache client for stock price history.

    Uses Redis as L1 cache and PostgreSQL as L2 persistent storage.
    Falls back to yfinance API when both caches miss.
    """

    def __init__(
        self,
        db_session: AsyncSession,
        redis_client: Optional[CacheClient] = None,
        yfinance_client: Optional[YFinanceClient] = None,
    ):
        """Initialize persistent cache client.

        Args:
            db_session: SQLAlchemy async session for PostgreSQL
            redis_client: Optional Redis cache client (L1)
            yfinance_client: Optional yfinance client for API calls
        """
        self._db = db_session
        self._redis = redis_client
        self._yfinance = yfinance_client or YFinanceClient()

    async def get_price_history(
        self,
        symbol: str,
        period: str = "3mo",
    ) -> Optional[pd.DataFrame]:
        """Get price history with two-tier caching.

        Lookup order:
        1. Redis (L1) - fast, short-lived
        2. PostgreSQL (L2) - persistent
        3. yfinance API - source of truth

        Args:
            symbol: Stock symbol (e.g., "005930.KS")
            period: History period (e.g., "3mo")

        Returns:
            DataFrame with OHLCV data or None on error
        """
        cache_key = cache_key_history(symbol, period)

        # L1: Check Redis cache
        if self._redis:
            cached = self._redis.get(cache_key)
            if cached:
                logger.debug(f"L1 cache hit for {symbol}")
                df = pd.DataFrame(cached)
                df.index = pd.to_datetime(df.index)
                return df

        # L2: Check PostgreSQL cache
        metadata = await self._get_cache_metadata(symbol)
        if metadata:
            last_fetched_at = metadata["last_fetched_at"]
            period_end = metadata["period_end"]

            if not should_refresh_history(last_fetched_at, period_end):
                logger.debug(f"L2 cache hit for {symbol}")
                df = await self._load_from_postgres(symbol, period)
                if df is not None and not df.empty:
                    # Restore L1 cache
                    self._save_to_redis(cache_key, df)
                    return df

        # Cache miss: fetch from yfinance
        logger.info(f"Cache miss for {symbol}, fetching from yfinance")
        df = await self._fetch_from_yfinance(symbol, period)

        if df is not None and not df.empty:
            # Save to both caches
            await self._save_to_postgres(symbol, df)
            self._save_to_redis(cache_key, df)

        return df

    async def _get_cache_metadata(self, symbol: str) -> Optional[dict]:
        """Get cache metadata from PostgreSQL."""
        # Import here to avoid circular imports
        from backend.src.db.models import StockCacheMetadata

        try:
            result = await self._db.execute(
                select(StockCacheMetadata).where(StockCacheMetadata.symbol == symbol)
            )
            row = result.scalar_one_or_none()
            if row:
                return {
                    "last_fetched_at": row.last_fetched_at,
                    "period_start": row.period_start,
                    "period_end": row.period_end,
                }
        except Exception as e:
            logger.warning(f"Error getting cache metadata for {symbol}: {e}")
        return None

    async def _load_from_postgres(
        self,
        symbol: str,
        period: str,
    ) -> Optional[pd.DataFrame]:
        """Load price history from PostgreSQL."""
        from backend.src.db.models import StockPriceHistory

        try:
            period_start = calculate_period_start(period)

            result = await self._db.execute(
                select(StockPriceHistory)
                .where(StockPriceHistory.symbol == symbol)
                .where(StockPriceHistory.trade_date >= period_start)
                .order_by(StockPriceHistory.trade_date)
            )
            rows = result.scalars().all()

            if not rows:
                return None

            data = {
                "Open": [],
                "High": [],
                "Low": [],
                "Close": [],
                "Volume": [],
            }
            dates = []

            for row in rows:
                dates.append(pd.Timestamp(row.trade_date))
                data["Open"].append(row.open)
                data["High"].append(row.high)
                data["Low"].append(row.low)
                data["Close"].append(row.close)
                data["Volume"].append(row.volume)

            df = pd.DataFrame(data, index=pd.DatetimeIndex(dates))
            return df

        except Exception as e:
            logger.error(f"Error loading from PostgreSQL for {symbol}: {e}")
            return None

    async def _save_to_postgres(self, symbol: str, df: pd.DataFrame) -> None:
        """Save price history to PostgreSQL with upsert."""
        from backend.src.db.models import StockCacheMetadata, StockPriceHistory

        try:
            # Prepare price history records
            records = []
            for idx, row in df.iterrows():
                trade_date = idx.date() if hasattr(idx, "date") else idx
                records.append({
                    "symbol": symbol,
                    "trade_date": trade_date,
                    "open": float(row["Open"]),
                    "high": float(row["High"]),
                    "low": float(row["Low"]),
                    "close": float(row["Close"]),
                    "volume": int(row["Volume"]),
                })

            # Upsert price history (ON CONFLICT DO UPDATE)
            if records:
                stmt = pg_insert(StockPriceHistory).values(records)
                stmt = stmt.on_conflict_do_update(
                    index_elements=["symbol", "trade_date"],
                    set_={
                        "open": stmt.excluded.open,
                        "high": stmt.excluded.high,
                        "low": stmt.excluded.low,
                        "close": stmt.excluded.close,
                        "volume": stmt.excluded.volume,
                    }
                )
                await self._db.execute(stmt)

            # Update metadata
            period_start = df.index.min().date() if hasattr(df.index.min(), "date") else df.index.min()
            period_end = df.index.max().date() if hasattr(df.index.max(), "date") else df.index.max()

            metadata_stmt = pg_insert(StockCacheMetadata).values(
                symbol=symbol,
                last_fetched_at=now_kst(),
                period_start=period_start,
                period_end=period_end,
            )
            metadata_stmt = metadata_stmt.on_conflict_do_update(
                index_elements=["symbol"],
                set_={
                    "last_fetched_at": now_kst(),
                    "period_start": period_start,
                    "period_end": period_end,
                    "updated_at": now_kst(),
                }
            )
            await self._db.execute(metadata_stmt)
            await self._db.commit()

            logger.debug(f"Saved {len(records)} records to PostgreSQL for {symbol}")

        except Exception as e:
            logger.error(f"Error saving to PostgreSQL for {symbol}: {e}")
            await self._db.rollback()

    def _save_to_redis(self, cache_key: str, df: pd.DataFrame) -> None:
        """Save price history to Redis."""
        if not self._redis:
            return

        try:
            cache_data = df.to_dict()
            ttl = get_cache_ttl_seconds()
            self._redis.set(cache_key, cache_data, ttl)
            logger.debug(f"Saved to Redis: {cache_key}")
        except Exception as e:
            logger.warning(f"Error saving to Redis: {e}")

    async def _fetch_from_yfinance(
        self,
        symbol: str,
        period: str,
    ) -> Optional[pd.DataFrame]:
        """Fetch price history from yfinance API."""
        try:
            df = await asyncio.to_thread(
                self._yfinance.get_price_history,
                symbol,
                period,
                validate=True,
            )
            return df
        except Exception as e:
            logger.error(f"Error fetching from yfinance for {symbol}: {e}")
            return None

    async def cleanup_old_data(self, retention_days: int = L2_RETENTION_DAYS) -> int:
        """Delete old price history data beyond retention period.

        Args:
            retention_days: Number of days to retain

        Returns:
            Number of deleted records
        """
        from backend.src.db.models import StockPriceHistory

        try:
            cutoff_date = date.today() - pd.Timedelta(days=retention_days)

            result = await self._db.execute(
                delete(StockPriceHistory).where(
                    StockPriceHistory.trade_date < cutoff_date
                )
            )
            await self._db.commit()

            deleted = result.rowcount
            if deleted > 0:
                logger.info(f"Cleaned up {deleted} old price history records")
            return deleted

        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            await self._db.rollback()
            return 0


# Module-level factory for creating cache clients
async def create_persistent_cache(
    db_session: AsyncSession,
    redis_url: str = "redis://localhost:6379/0",
) -> PersistentCacheClient:
    """Create a PersistentCacheClient with configured connections.

    Args:
        db_session: SQLAlchemy async session
        redis_url: Redis connection URL

    Returns:
        Configured PersistentCacheClient
    """
    try:
        redis_client = CacheClient(redis_url)
        if not redis_client.ping():
            logger.warning("Redis not available, using PostgreSQL-only caching")
            redis_client = None
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}, using PostgreSQL-only caching")
        redis_client = None

    return PersistentCacheClient(
        db_session=db_session,
        redis_client=redis_client,
    )
