"""Integration tests for sell signals API endpoint.

Tests POST /api/portfolio/sell-signals endpoint.
"""

from datetime import datetime
from unittest.mock import MagicMock, patch

import pandas as pd
import pytest
from fastapi.testclient import TestClient

from backend.src.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_stock_client():
    """Mock stock client for testing."""
    mock_client = MagicMock()

    # Mock get_current_price response
    mock_price_response = MagicMock()
    mock_price_response.stock.current_price = 9500  # -5% from 10000
    mock_client.get_current_price.return_value = mock_price_response

    # Mock get_price_history response
    mock_history = pd.DataFrame({"Close": [10000 + i * 10 for i in range(30)]})
    mock_client.get_price_history.return_value = mock_history

    return mock_client


class TestSellSignalsEndpoint:
    """Test sell signals API endpoint."""

    def test_empty_positions(self, client):
        """Test with empty positions list."""
        response = client.post("/api/portfolio/sell-signals", json={"positions": []})

        assert response.status_code == 200
        data = response.json()
        assert data["signals"] == []
        assert "calculatedAt" in data

    def test_invalid_position_missing_fields(self, client):
        """Test with invalid position data."""
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1"}  # Missing required fields
                ]
            },
        )

        assert response.status_code == 422  # Validation error

    def test_invalid_avg_buy_price(self, client):
        """Test with invalid avgBuyPrice (must be > 0)."""
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {
                        "id": "pos-1",
                        "symbol": "005930",
                        "avgBuyPrice": 0,  # Invalid: must be > 0
                        "quantity": 10,
                    }
                ]
            },
        )

        assert response.status_code == 422

    def test_invalid_quantity(self, client):
        """Test with invalid quantity (must be > 0)."""
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {
                        "id": "pos-1",
                        "symbol": "005930",
                        "avgBuyPrice": 10000,
                        "quantity": 0,  # Invalid: must be > 0
                    }
                ]
            },
        )

        assert response.status_code == 422

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_stop_loss_signal(self, mock_get_client, client, mock_stock_client):
        """Test stop loss signal generation."""
        mock_get_client.return_value = mock_stock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"stopLossPct": -4.5, "takeProfitPct": 12.0, "sellOnMiddleBand": False},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["signals"]) == 1

        signal = data["signals"][0]
        assert signal["positionId"] == "pos-1"
        assert signal["type"] == "stop_loss"
        assert signal["currentPrice"] == 9500
        assert signal["pnlPercent"] == -5.0
        assert signal["triggerValue"] == -4.5

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_take_profit_signal(self, mock_get_client, client):
        """Test take profit signal generation."""
        mock_client = MagicMock()
        mock_price_response = MagicMock()
        mock_price_response.stock.current_price = 11500  # +15% from 10000
        mock_client.get_current_price.return_value = mock_price_response
        mock_get_client.return_value = mock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-2", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"stopLossPct": -4.5, "takeProfitPct": 12.0, "sellOnMiddleBand": False},
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["signals"]) == 1

        signal = data["signals"][0]
        assert signal["positionId"] == "pos-2"
        assert signal["type"] == "take_profit"
        assert signal["currentPrice"] == 11500
        assert signal["pnlPercent"] == 15.0
        assert signal["triggerValue"] == 12.0

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_no_signals_when_price_in_range(self, mock_get_client, client):
        """Test no signals when price is within thresholds."""
        mock_client = MagicMock()
        mock_price_response = MagicMock()
        mock_price_response.stock.current_price = 10500  # +5% from 10000
        mock_client.get_current_price.return_value = mock_price_response
        mock_get_client.return_value = mock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-3", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["signals"]) == 0

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_trend_break_signal(self, mock_get_client, client):
        """Test trend break signal with Bollinger Band."""
        mock_client = MagicMock()
        mock_price_response = MagicMock()
        mock_price_response.stock.current_price = 9800  # Below middle band
        mock_client.get_current_price.return_value = mock_price_response

        # Create stable price history around 10000
        mock_history = pd.DataFrame({"Close": [10000 + (i % 10) * 10 for i in range(30)]})
        mock_client.get_price_history.return_value = mock_history
        mock_get_client.return_value = mock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-4", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {
                    "stopLossPct": -4.5,
                    "takeProfitPct": 12.0,
                    "sellOnMiddleBand": True,
                    "bollingerPeriod": 12,
                    "bollingerStdDev": 1.3,
                },
            },
        )

        assert response.status_code == 200
        data = response.json()

        # Should have trend break signal
        trend_signals = [s for s in data["signals"] if s["type"] == "trend_break"]
        assert len(trend_signals) == 1
        assert "볼린저 중심선" in trend_signals[0]["reason"]

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_multiple_positions(self, mock_get_client, client):
        """Test with multiple positions."""
        mock_client = MagicMock()

        # First position: stop loss (-5%)
        # Second position: take profit (+15%)
        # Third position: no signal (+5%)
        def get_price(symbol):
            prices = {
                "005930": 9500,  # -5%
                "000660": 11500,  # +15%
                "035720": 10500,  # +5%
            }
            response = MagicMock()
            response.stock.current_price = prices.get(symbol, 10000)
            return response

        mock_client.get_current_price.side_effect = get_price
        mock_get_client.return_value = mock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10},
                    {"id": "pos-2", "symbol": "000660", "avgBuyPrice": 10000, "quantity": 5},
                    {"id": "pos-3", "symbol": "035720", "avgBuyPrice": 10000, "quantity": 20},
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["signals"]) == 2

        signal_ids = [s["positionId"] for s in data["signals"]]
        assert "pos-1" in signal_ids  # stop loss
        assert "pos-2" in signal_ids  # take profit
        assert "pos-3" not in signal_ids  # no signal

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_price_fetch_failure_continues(self, mock_get_client, client):
        """Test that price fetch failure doesn't break other positions."""
        mock_client = MagicMock()

        call_count = [0]

        def get_price(symbol):
            call_count[0] += 1
            if call_count[0] == 1:
                return None  # First position fails
            response = MagicMock()
            response.stock.current_price = 9500
            return response

        mock_client.get_current_price.side_effect = get_price
        mock_get_client.return_value = mock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "INVALID", "avgBuyPrice": 10000, "quantity": 10},
                    {"id": "pos-2", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10},
                ]
            },
        )

        assert response.status_code == 200
        data = response.json()
        # Second position should still have signal
        assert len(data["signals"]) == 1
        assert data["signals"][0]["positionId"] == "pos-2"

    def test_settings_validation_stop_loss_range(self, client):
        """Test stopLossPct validation range (-20 to 0)."""
        # Too low
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"stopLossPct": -25},  # Invalid: must be >= -20
            },
        )
        assert response.status_code == 422

        # Too high
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"stopLossPct": 5},  # Invalid: must be <= 0
            },
        )
        assert response.status_code == 422

    def test_settings_validation_take_profit_range(self, client):
        """Test takeProfitPct validation range (0 to 100)."""
        # Too low
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"takeProfitPct": -5},  # Invalid: must be >= 0
            },
        )
        assert response.status_code == 422

        # Too high
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"takeProfitPct": 150},  # Invalid: must be <= 100
            },
        )
        assert response.status_code == 422

    def test_settings_validation_bollinger_period_range(self, client):
        """Test bollingerPeriod validation range (5 to 50)."""
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"bollingerPeriod": 2},  # Invalid: must be >= 5
            },
        )
        assert response.status_code == 422

    def test_settings_validation_bollinger_std_dev_range(self, client):
        """Test bollingerStdDev validation range (0.5 to 3.0)."""
        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ],
                "settings": {"bollingerStdDev": 0.1},  # Invalid: must be >= 0.5
            },
        )
        assert response.status_code == 422

    @patch("backend.src.api.portfolio.sell_signals._get_client")
    def test_default_settings_used(self, mock_get_client, client, mock_stock_client):
        """Test that default settings are used when not provided."""
        mock_get_client.return_value = mock_stock_client

        response = client.post(
            "/api/portfolio/sell-signals",
            json={
                "positions": [
                    {"id": "pos-1", "symbol": "005930", "avgBuyPrice": 10000, "quantity": 10}
                ]
                # No settings provided - should use defaults
            },
        )

        assert response.status_code == 200
        data = response.json()
        # With -5% loss and default -4.5% threshold, should trigger stop loss
        assert len(data["signals"]) == 1
        assert data["signals"][0]["triggerValue"] == -4.5  # Default stop loss

    def test_response_format(self, client):
        """Test response format with calculatedAt timestamp."""
        before = datetime.now()

        response = client.post("/api/portfolio/sell-signals", json={"positions": []})

        after = datetime.now()

        assert response.status_code == 200
        data = response.json()

        assert "signals" in data
        assert "calculatedAt" in data

        # Verify timestamp is recent
        calculated_at = datetime.fromisoformat(
            data["calculatedAt"].replace("Z", "+00:00").replace("+00:00", "")
        )
        # Allow some tolerance for timezone differences
        assert calculated_at.year == before.year
        assert calculated_at.month == before.month
        assert calculated_at.day == before.day


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
