"""Batch fetcher for KOSPI 100 stocks.

Fetches price and indicator data for multiple stocks with:
- Configurable batch size and delays
- Progress tracking
- Error handling for failed fetches
"""

import logging
import time
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, Optional

from shared.data.kospi100 import get_kospi100_symbols
from shared.data.yfinance_client import PriceResponse, YFinanceClient

logger = logging.getLogger(__name__)


@dataclass
class BatchResult:
    """Result of batch fetch operation."""
    successful: dict[str, PriceResponse]
    failed: list[str]
    started_at: datetime
    completed_at: datetime
    total_symbols: int

    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_symbols == 0:
            return 0.0
        return (len(self.successful) / self.total_symbols) * 100


@dataclass
class BatchFetcherConfig:
    """Configuration for batch fetcher."""
    batch_size: int = 10  # Symbols per batch
    batch_delay: float = 1.0  # Seconds between batches
    request_delay: float = 0.1  # Seconds between requests within batch
    max_retries: int = 2  # Retries for failed fetches
    retry_delay: float = 2.0  # Seconds before retry


ProgressCallback = Callable[[int, int, str], None]


class BatchFetcher:
    """Batch fetcher for stock data."""

    def __init__(
        self,
        client: YFinanceClient,
        config: Optional[BatchFetcherConfig] = None
    ):
        """Initialize batch fetcher.

        Args:
            client: YFinance client instance
            config: Batch fetcher configuration
        """
        self._client = client
        self._config = config or BatchFetcherConfig()

    def fetch_kospi100_prices(
        self,
        progress_callback: Optional[ProgressCallback] = None
    ) -> BatchResult:
        """Fetch prices for all KOSPI 100 stocks.

        Args:
            progress_callback: Optional callback for progress updates
                               (current, total, symbol)

        Returns:
            BatchResult with successful and failed fetches
        """
        symbols = get_kospi100_symbols()
        return self.fetch_prices(symbols, progress_callback)

    def fetch_prices(
        self,
        symbols: list[str],
        progress_callback: Optional[ProgressCallback] = None
    ) -> BatchResult:
        """Fetch prices for given symbols.

        Args:
            symbols: List of stock symbols to fetch
            progress_callback: Optional callback for progress updates

        Returns:
            BatchResult with successful and failed fetches
        """
        started_at = datetime.now()
        successful: dict[str, PriceResponse] = {}
        failed: list[str] = []

        total = len(symbols)
        batches = [
            symbols[i:i + self._config.batch_size]
            for i in range(0, total, self._config.batch_size)
        ]

        current_index = 0
        for batch_idx, batch in enumerate(batches):
            logger.info(f"Processing batch {batch_idx + 1}/{len(batches)}")

            for symbol in batch:
                current_index += 1

                # Progress callback
                if progress_callback:
                    progress_callback(current_index, total, symbol)

                # Fetch with retry
                response = self._fetch_with_retry(symbol)

                if response:
                    successful[symbol] = response
                else:
                    failed.append(symbol)
                    logger.warning(f"Failed to fetch {symbol}")

                # Delay between requests
                if symbol != batch[-1]:
                    time.sleep(self._config.request_delay)

            # Delay between batches
            if batch_idx < len(batches) - 1:
                time.sleep(self._config.batch_delay)

        completed_at = datetime.now()

        result = BatchResult(
            successful=successful,
            failed=failed,
            started_at=started_at,
            completed_at=completed_at,
            total_symbols=total
        )

        logger.info(
            f"Batch fetch complete: {len(successful)}/{total} successful "
            f"({result.success_rate:.1f}%)"
        )

        return result

    def _fetch_with_retry(self, symbol: str) -> Optional[PriceResponse]:
        """Fetch price with retry on failure.

        Args:
            symbol: Stock symbol to fetch

        Returns:
            PriceResponse or None if all retries failed
        """
        for attempt in range(self._config.max_retries + 1):
            response = self._client.get_current_price(symbol)

            if response:
                return response

            if attempt < self._config.max_retries:
                logger.debug(f"Retry {attempt + 1} for {symbol}")
                time.sleep(self._config.retry_delay)

        return None
