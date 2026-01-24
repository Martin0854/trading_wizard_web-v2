"""Unit tests for yfinance client with mocked responses."""

from unittest.mock import MagicMock, patch

import pandas as pd
import pytest

from shared.data.yfinance_client import YFinanceClient, RateLimiter
from shared.data.validators import validate_ohlcv_row, validate_price_dataframe
from shared.types.models import Market


class TestRateLimiter:
    """Test rate limiter functionality."""

    def test_acquire_tokens(self):
        """Test token acquisition."""
        limiter = RateLimiter(max_tokens=10)
        assert limiter.acquire(1) is True
        assert limiter.tokens == 9

    def test_acquire_all_tokens(self):
        """Test acquiring all tokens."""
        limiter = RateLimiter(max_tokens=5)
        for _ in range(5):
            assert limiter.acquire(1) is True
        # Should fail when depleted
        assert limiter.acquire(1) is False

    def test_token_refill(self):
        """Test token refill over time."""
        limiter = RateLimiter(max_tokens=10, refill_rate=10.0)  # 10 tokens/sec
        limiter.acquire(5)  # Use 5 tokens

        # Simulate time passing
        import time
        time.sleep(0.2)  # Wait 0.2 seconds

        # Should have refilled some tokens
        assert limiter.tokens > 5


class TestYFinanceClient:
    """Test yfinance client with mocked responses."""

    @patch('yfinance.Ticker')
    def test_get_current_price_success(self, mock_ticker_class):
        """Test successful price fetch."""
        # Setup mock
        mock_ticker = MagicMock()
        mock_ticker.info = {
            'currentPrice': 72500,
            'previousClose': 72000,
            'shortName': '삼성전자',
            'volume': 12345678
        }
        mock_ticker_class.return_value = mock_ticker

        client = YFinanceClient()
        response = client.get_current_price('005930.KS')

        assert response is not None
        assert response.stock.current_price == 72500
        assert response.stock.name == '삼성전자'
        assert response.stock.market == Market.KOSPI

    @patch('yfinance.Ticker')
    def test_get_current_price_no_data(self, mock_ticker_class):
        """Test price fetch with no data."""
        mock_ticker = MagicMock()
        mock_ticker.info = {}  # Empty info
        mock_ticker_class.return_value = mock_ticker

        client = YFinanceClient()
        response = client.get_current_price('INVALID.KS')

        assert response is None

    @patch('yfinance.Ticker')
    def test_get_price_history_success(self, mock_ticker_class):
        """Test successful history fetch."""
        # Create mock DataFrame
        mock_df = pd.DataFrame({
            'Open': [100, 101, 102],
            'High': [105, 106, 107],
            'Low': [98, 99, 100],
            'Close': [103, 104, 105],
            'Volume': [1000000, 1100000, 1200000]
        }, index=pd.date_range('2026-01-01', periods=3))

        mock_ticker = MagicMock()
        mock_ticker.history.return_value = mock_df
        mock_ticker_class.return_value = mock_ticker

        client = YFinanceClient()
        result = client.get_price_history('005930.KS', period='5d')

        assert result is not None
        assert len(result) == 3
        assert 'Close' in result.columns

    @patch('yfinance.Ticker')
    def test_get_price_history_empty(self, mock_ticker_class):
        """Test history fetch with empty data."""
        mock_ticker = MagicMock()
        mock_ticker.history.return_value = pd.DataFrame()
        mock_ticker_class.return_value = mock_ticker

        client = YFinanceClient()
        result = client.get_price_history('INVALID.KS')

        assert result is None

    def test_determine_market_kospi(self):
        """Test market determination for KOSPI."""
        client = YFinanceClient()
        assert client._determine_market('005930.KS') == Market.KOSPI

    def test_determine_market_kosdaq(self):
        """Test market determination for KOSDAQ."""
        client = YFinanceClient()
        assert client._determine_market('035720.KQ') == Market.KOSDAQ


class TestValidators:
    """Test price data validators."""

    def test_validate_ohlcv_valid(self):
        """Test validation of valid OHLCV data."""
        result = validate_ohlcv_row(
            open_price=100,
            high=105,
            low=98,
            close=103,
            volume=1000000
        )
        assert result.is_valid is True

    def test_validate_ohlcv_negative_price(self):
        """Test validation with negative price."""
        result = validate_ohlcv_row(
            open_price=-100,
            high=105,
            low=98,
            close=103,
            volume=1000000
        )
        assert result.is_valid is False
        assert 'positive' in result.error_message.lower()

    def test_validate_ohlcv_invalid_relationship(self):
        """Test validation with invalid OHLC relationship."""
        result = validate_ohlcv_row(
            open_price=100,
            high=95,  # High below open
            low=98,
            close=103,
            volume=1000000
        )
        assert result.is_valid is False

    def test_validate_ohlcv_negative_volume(self):
        """Test validation with negative volume."""
        result = validate_ohlcv_row(
            open_price=100,
            high=105,
            low=98,
            close=103,
            volume=-1000
        )
        assert result.is_valid is False

    def test_validate_dataframe_valid(self):
        """Test DataFrame validation with valid data."""
        df = pd.DataFrame({
            'Open': [100, 101],
            'High': [105, 106],
            'Low': [98, 99],
            'Close': [103, 104],
            'Volume': [1000000, 1100000]
        })
        result = validate_price_dataframe(df)
        assert result.is_valid is True

    def test_validate_dataframe_missing_column(self):
        """Test DataFrame validation with missing column."""
        df = pd.DataFrame({
            'Open': [100, 101],
            'High': [105, 106],
            'Low': [98, 99],
            'Close': [103, 104]
            # Missing Volume
        })
        result = validate_price_dataframe(df)
        assert result.is_valid is False
        assert 'Volume' in result.error_message


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
