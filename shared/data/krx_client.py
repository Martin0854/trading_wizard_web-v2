"""KRX client using pykrx for Korean stock data.

Replaces yfinance for Korean stocks (KOSPI/KOSDAQ) with more reliable
data source from KRX (Korea Exchange) and Naver Finance.

Features:
- No rate limiting issues (unlike yfinance 429 errors)
- Native Korean stock support
- Adjusted price data available
- Caching support (same interface as YFinanceClient)
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import pandas as pd
from pykrx import stock as krx

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


def _strip_market_suffix(symbol: str) -> str:
    """Strip .KS or .KQ suffix from symbol.

    pykrx uses pure ticker codes (e.g., "005930") without market suffix.
    """
    if symbol.endswith(".KS") or symbol.endswith(".KQ"):
        return symbol[:-3]
    return symbol


def _determine_market(symbol: str) -> Market:
    """Determine market from symbol suffix."""
    if symbol.endswith(".KQ"):
        return Market.KOSDAQ
    return Market.KOSPI  # Default to KOSPI


def _period_to_days(period: str) -> int:
    """Convert period string to number of days.

    Args:
        period: Period string (e.g., "1y", "6mo", "3mo", "1mo")

    Returns:
        Number of days
    """
    period_map = {
        "1y": 365,
        "6mo": 180,
        "3mo": 90,
        "1mo": 30,
        "5d": 5,
        "1d": 1,
    }
    return period_map.get(period, 90)  # Default 3 months


@dataclass
class PriceResponse:
    """Response from price fetch with freshness tracking."""
    stock: Stock
    fetched_at: datetime
    from_cache: bool


class KRXClient:
    """KRX client with caching using pykrx.

    Drop-in replacement for YFinanceClient for Korean stocks.
    """

    def __init__(
        self,
        cache_client: Optional[CacheClient] = None,
    ):
        """Initialize KRX client.

        Args:
            cache_client: Redis cache client (optional)
        """
        self._cache = cache_client
        # Cache for ticker name lookups (ticker -> name)
        self._ticker_names: dict[str, str] = {}

    def _get_ticker_name(self, ticker: str) -> str:
        """Get stock name for ticker with caching.

        Args:
            ticker: Pure ticker code (e.g., "005930")

        Returns:
            Stock name or ticker if not found
        """
        if ticker in self._ticker_names:
            return self._ticker_names[ticker]

        try:
            name = krx.get_market_ticker_name(ticker)
            if name:
                self._ticker_names[ticker] = name
                return name
        except Exception as e:
            logger.warning(f"Failed to get ticker name for {ticker}: {e}")

        return ticker

    def get_current_price(self, symbol: str) -> Optional[PriceResponse]:
        """Get current stock price with caching.

        Args:
            symbol: Stock symbol (e.g., "005930.KS" or "005930")

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

        ticker = _strip_market_suffix(symbol)
        market = _determine_market(symbol)

        try:
            # Get today's date and try to fetch OHLCV
            today = datetime.now().strftime("%Y%m%d")

            # Try fetching last 5 days to handle weekends/holidays
            start_date = (datetime.now() - timedelta(days=7)).strftime("%Y%m%d")
            df = krx.get_market_ohlcv(start_date, today, ticker)

            if df.empty:
                logger.warning(f"No price data for {symbol}")
                return None

            # Get the latest data
            latest = df.iloc[-1]
            previous = df.iloc[-2] if len(df) > 1 else None

            current_price = float(latest["종가"])
            previous_close = float(previous["종가"]) if previous is not None else None
            volume = int(latest["거래량"])

            # Calculate change percent
            change_percent = None
            if previous_close and previous_close > 0:
                change_percent = ((current_price - previous_close) / previous_close) * 100

            # Get stock name
            name = self._get_ticker_name(ticker)

            stock = Stock(
                symbol=symbol,
                name=name,
                market=market,
                current_price=current_price,
                previous_close=previous_close,
                change_percent=change_percent,
                volume=volume,
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
            logger.error(f"Error fetching price for {symbol}: {e}")
            return None

    def get_price_history(
        self,
        symbol: str,
        period: str = "3mo",
        validate: bool = True
    ) -> Optional[pd.DataFrame]:
        """Get historical OHLCV data with caching.

        Args:
            symbol: Stock symbol (e.g., "005930.KS" or "005930")
            period: History period (e.g., "1y", "6mo", "3mo")
            validate: Whether to validate and clean data

        Returns:
            DataFrame with OHLCV data (columns: Open, High, Low, Close, Volume)
            or None on error
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

        ticker = _strip_market_suffix(symbol)

        try:
            # Calculate date range
            days = _period_to_days(period)
            end_date = datetime.now().strftime("%Y%m%d")
            start_date = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")

            # Fetch OHLCV from pykrx
            df = krx.get_market_ohlcv(start_date, end_date, ticker)

            if df.empty:
                logger.warning(f"No history data for {symbol}")
                return None

            # Rename columns to match yfinance format
            df = df.rename(columns={
                "시가": "Open",
                "고가": "High",
                "저가": "Low",
                "종가": "Close",
                "거래량": "Volume"
            })

            # Keep only required columns
            df = df[["Open", "High", "Low", "Close", "Volume"]]

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
            logger.error(f"Error fetching history for {symbol}: {e}")
            return None

    def get_multiple_prices(
        self,
        symbols: list[str],
        batch_delay: float = 0.1  # Less delay needed than yfinance
    ) -> dict[str, Optional[PriceResponse]]:
        """Get prices for multiple symbols.

        Args:
            symbols: List of stock symbols
            batch_delay: Delay between requests (seconds)

        Returns:
            Dict mapping symbol to PriceResponse
        """
        import time

        results: dict[str, Optional[PriceResponse]] = {}

        for i, symbol in enumerate(symbols):
            results[symbol] = self.get_current_price(symbol)

            # Add small delay between requests (pykrx is more lenient)
            if i < len(symbols) - 1:
                time.sleep(batch_delay)

        return results

    def get_market_tickers(
        self,
        date: Optional[str] = None,
        market: str = "KOSPI"
    ) -> list[str]:
        """Get list of tickers for a market.

        Args:
            date: Date string YYYYMMDD (defaults to latest)
            market: Market type ("KOSPI", "KOSDAQ", "KONEX")

        Returns:
            List of ticker codes
        """
        try:
            if date is None:
                date = datetime.now().strftime("%Y%m%d")
            return krx.get_market_ticker_list(date, market=market)
        except Exception as e:
            logger.error(f"Error fetching market tickers: {e}")
            return []


# Module-level singleton instance
_default_client: Optional[KRXClient] = None


def _get_default_client() -> KRXClient:
    """Get or create the default KRXClient instance."""
    global _default_client
    if _default_client is None:
        _default_client = KRXClient()
    return _default_client


def get_stock_price(symbol: str) -> Optional[PriceResponse]:
    """Get current stock price (convenience function).

    Args:
        symbol: Stock symbol (e.g., "005930.KS" or "005930")

    Returns:
        PriceResponse with stock data or None on error
    """
    return _get_default_client().get_current_price(symbol)


def get_stock_history(
    symbol: str,
    period: str = "3mo",
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
