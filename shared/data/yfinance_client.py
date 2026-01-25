"""yfinance client with rate limiting and caching.

Implements Constitution III requirements:
- Caching First: Check cache before API calls
- Request Throttling: Token bucket rate limiting (2000 req/hr)
- Batch Processing: Support for KOSPI 100 batch fetching
- Graceful Degradation: Error messages on failure
- Retry Logic: Exponential backoff for transient failures
"""

import logging
import random
import time
from dataclasses import dataclass, field
from datetime import datetime
from threading import Lock
from typing import Optional

import pandas as pd
import yfinance as yf

from shared.data.cache import (
    CACHE_TTL_HISTORY,
    CACHE_TTL_REALTIME,
    CacheClient,
    cache_key_history,
    cache_key_price,
)
from shared.data.validators import clean_price_dataframe, validate_price_dataframe
from shared.types.models import Market, Stock

logger = logging.getLogger(__name__)

# Retry configuration
MAX_RETRIES = 3
BASE_DELAY = 2.0  # Base delay in seconds (increased for 429 errors)
MAX_DELAY = 30.0  # Maximum delay in seconds (increased for 429 errors)

# Rate limiting configuration - conservative to avoid 429
MIN_REQUEST_INTERVAL = 2.0  # Minimum 2 seconds between requests


def is_rate_limit_error(error: Exception) -> bool:
    """Check if the error is a rate limit (429) error."""
    error_str = str(error).lower()
    return "429" in error_str or "too many requests" in error_str or "rate limit" in error_str


def retry_with_backoff(
    max_retries: int = MAX_RETRIES,
    base_delay: float = BASE_DELAY,
    max_delay: float = MAX_DELAY,
):
    """Decorator for retry with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries:
                        # Use longer delay for rate limit errors
                        if is_rate_limit_error(e):
                            delay = min(base_delay * (3 ** attempt), max_delay)  # More aggressive backoff for 429
                            logger.warning(
                                f"Rate limit hit (429) for {func.__name__}. "
                                f"Waiting {delay:.1f}s before retry {attempt + 2}/{max_retries + 1}..."
                            )
                        else:
                            delay = min(base_delay * (2 ** attempt), max_delay)
                            logger.warning(
                                f"Attempt {attempt + 1}/{max_retries + 1} failed for {func.__name__}: {e}. "
                                f"Retrying in {delay:.2f}s..."
                            )
                        jitter = random.uniform(0, delay * 0.1)
                        time.sleep(delay + jitter)
                    else:
                        logger.error(
                            f"All {max_retries + 1} attempts failed for {func.__name__}: {e}"
                        )
            raise last_exception
        return wrapper
    return decorator


@dataclass
class RateLimiter:
    """Token bucket rate limiter for API calls with minimum interval enforcement."""

    max_tokens: int = 100  # Max requests per hour (reduced from 2000 to be conservative)
    refill_rate: float = 100 / 3600  # Tokens per second
    tokens: float = 100
    last_refill: float = field(default_factory=time.time)
    last_request: float = field(default_factory=lambda: 0.0)
    min_interval: float = MIN_REQUEST_INTERVAL  # Minimum seconds between requests
    lock: Lock = field(default_factory=Lock)

    def acquire(self, tokens: int = 1) -> bool:
        """Acquire tokens for API request.

        Args:
            tokens: Number of tokens to acquire

        Returns:
            True if tokens acquired, False if rate limited
        """
        with self.lock:
            now = time.time()
            elapsed = now - self.last_refill
            self.tokens = min(self.max_tokens, self.tokens + elapsed * self.refill_rate)
            self.last_refill = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

    def wait_for_token(self, tokens: int = 1) -> None:
        """Wait until tokens are available and minimum interval has passed.

        Args:
            tokens: Number of tokens needed
        """
        with self.lock:
            # Enforce minimum interval between requests
            now = time.time()
            time_since_last = now - self.last_request
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                time.sleep(sleep_time)

        while not self.acquire(tokens):
            time.sleep(0.1)

        # Update last request time
        with self.lock:
            self.last_request = time.time()


@dataclass
class PriceResponse:
    """Response from price fetch with freshness tracking."""
    stock: Stock
    fetched_at: datetime
    from_cache: bool


class YFinanceClient:
    """yfinance client with caching and rate limiting."""

    def __init__(
        self,
        cache_client: Optional[CacheClient] = None,
        rate_limiter: Optional[RateLimiter] = None
    ):
        """Initialize yfinance client.

        Args:
            cache_client: Redis cache client (optional)
            rate_limiter: Rate limiter instance (optional)
        """
        self._cache = cache_client
        self._rate_limiter = rate_limiter or RateLimiter()

    def _determine_market(self, symbol: str) -> Market:
        """Determine market from symbol suffix."""
        if symbol.endswith(".KS"):
            return Market.KOSPI
        elif symbol.endswith(".KQ"):
            return Market.KOSDAQ
        return Market.KOSPI  # Default

    def get_current_price(self, symbol: str) -> Optional[PriceResponse]:
        """Get current stock price with caching.

        Args:
            symbol: Stock symbol (e.g., "005930.KS")

        Returns:
            PriceResponse with stock data or None on error
        """
        # Check cache first
        if self._cache:
            cached = self._cache.get(cache_key_price(symbol))
            if cached:
                logger.debug(f"Cache hit for {symbol}")
                stock = Stock(
                    symbol=cached["symbol"],
                    name=cached["name"],
                    market=Market(cached["market"]),
                    current_price=cached["current_price"],
                    previous_close=cached.get("previous_close"),
                    change_percent=cached.get("change_percent"),
                    volume=cached.get("volume"),
                    updated_at=datetime.fromisoformat(cached["updated_at"]) if cached.get("updated_at") else None
                )
                return PriceResponse(
                    stock=stock,
                    fetched_at=datetime.now(),
                    from_cache=True
                )

        # Rate limit check
        self._rate_limiter.wait_for_token()

        try:
            # Use retry wrapper for yfinance API call
            @retry_with_backoff()
            def fetch_ticker_info():
                ticker = yf.Ticker(symbol)
                return ticker.info

            info = fetch_ticker_info()

            # Extract price data
            current_price = info.get("currentPrice") or info.get("regularMarketPrice", 0)
            previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")

            if current_price == 0:
                logger.warning(f"No price data for {symbol}")
                return None

            change_percent = None
            if previous_close and previous_close > 0:
                change_percent = ((current_price - previous_close) / previous_close) * 100

            stock = Stock(
                symbol=symbol,
                name=info.get("shortName") or info.get("longName", symbol),
                market=self._determine_market(symbol),
                current_price=current_price,
                previous_close=previous_close,
                change_percent=change_percent,
                volume=info.get("volume") or info.get("regularMarketVolume"),
                updated_at=datetime.now()
            )

            # Cache the result
            if self._cache:
                cache_data = {
                    "symbol": stock.symbol,
                    "name": stock.name,
                    "market": stock.market.value,
                    "current_price": stock.current_price,
                    "previous_close": stock.previous_close,
                    "change_percent": stock.change_percent,
                    "volume": stock.volume,
                    "updated_at": stock.updated_at.isoformat() if stock.updated_at else None
                }
                self._cache.set(cache_key_price(symbol), cache_data, CACHE_TTL_REALTIME)

            return PriceResponse(
                stock=stock,
                fetched_at=datetime.now(),
                from_cache=False
            )

        except Exception as e:
            logger.error(f"Error fetching price for {symbol} after retries: {e}")
            return None

    def get_price_history(
        self,
        symbol: str,
        period: str = "1y",
        validate: bool = True
    ) -> Optional[pd.DataFrame]:
        """Get historical OHLCV data with caching.

        Args:
            symbol: Stock symbol
            period: History period (e.g., "1y", "6mo", "3mo")
            validate: Whether to validate and clean data

        Returns:
            DataFrame with OHLCV data or None on error
        """
        cache_key = cache_key_history(symbol, period)

        # Check cache first
        if self._cache:
            cached = self._cache.get(cache_key)
            if cached:
                logger.debug(f"Cache hit for history {symbol}")
                df = pd.DataFrame(cached)
                df.index = pd.to_datetime(df.index)
                return df

        # Rate limit check
        self._rate_limiter.wait_for_token()

        try:
            # Use retry wrapper for yfinance API call
            @retry_with_backoff()
            def fetch_ticker_history():
                ticker = yf.Ticker(symbol)
                return ticker.history(period=period)

            df = fetch_ticker_history()

            if df.empty:
                logger.warning(f"No history data for {symbol}")
                return None

            # Validate and clean data
            if validate:
                validation = validate_price_dataframe(df)
                if not validation.is_valid:
                    logger.warning(f"Invalid data for {symbol}: {validation.error_message}")
                    df = clean_price_dataframe(df)

            # Cache the result
            if self._cache and not df.empty:
                cache_data = df.to_dict()
                self._cache.set(cache_key, cache_data, CACHE_TTL_HISTORY)

            return df

        except Exception as e:
            logger.error(f"Error fetching history for {symbol} after retries: {e}")
            return None

    def get_multiple_prices(
        self,
        symbols: list[str],
        batch_delay: float = 0.5
    ) -> dict[str, Optional[PriceResponse]]:
        """Get prices for multiple symbols with batching.

        Args:
            symbols: List of stock symbols
            batch_delay: Delay between batches (seconds)

        Returns:
            Dict mapping symbol to PriceResponse
        """
        results: dict[str, Optional[PriceResponse]] = {}

        for i, symbol in enumerate(symbols):
            results[symbol] = self.get_current_price(symbol)

            # Add delay between requests
            if i < len(symbols) - 1:
                time.sleep(batch_delay)

        return results


# Module-level singleton instance for convenience functions
_default_client: Optional[YFinanceClient] = None


def _get_default_client() -> YFinanceClient:
    """Get or create the default YFinanceClient instance."""
    global _default_client
    if _default_client is None:
        _default_client = YFinanceClient()
    return _default_client


def get_stock_price(symbol: str) -> Optional[PriceResponse]:
    """Get current stock price (convenience function).

    Args:
        symbol: Stock symbol (e.g., "005930.KS")

    Returns:
        PriceResponse with stock data or None on error
    """
    return _get_default_client().get_current_price(symbol)


def get_stock_history(
    symbol: str,
    period: str = "1y",
    validate: bool = True
) -> Optional[pd.DataFrame]:
    """Get historical OHLCV data (convenience function).

    Args:
        symbol: Stock symbol
        period: History period (e.g., "1y", "6mo", "3mo")
        validate: Whether to validate and clean data

    Returns:
        DataFrame with OHLCV data or None on error
    """
    return _get_default_client().get_price_history(symbol, period, validate)
