"""Unit tests for sell signal service.

Tests the sell signal generation logic including:
- Stop loss detection
- Take profit detection
- Trend break (Bollinger Band middle line) detection
- PnL calculation
- Combined signal generation
"""

from datetime import datetime

import numpy as np
import pandas as pd
import pytest

from backend.src.services.sell_signal import (
    PortfolioSettings,
    SellSignalType,
    calculate_pnl_percent,
    check_stop_loss,
    check_take_profit,
    check_trend_break,
    generate_sell_signals,
)


class TestCalculatePnlPercent:
    """Test PnL percentage calculation."""

    def test_positive_pnl(self):
        """Test positive PnL calculation."""
        # 10,000 -> 11,500 = 15% gain
        pnl = calculate_pnl_percent(current_price=11500, avg_buy_price=10000)
        assert pnl == 15.0

    def test_negative_pnl(self):
        """Test negative PnL calculation."""
        # 10,000 -> 9,500 = -5% loss
        pnl = calculate_pnl_percent(current_price=9500, avg_buy_price=10000)
        assert pnl == -5.0

    def test_zero_pnl(self):
        """Test zero PnL when price unchanged."""
        pnl = calculate_pnl_percent(current_price=10000, avg_buy_price=10000)
        assert pnl == 0.0

    def test_zero_buy_price(self):
        """Test handling of zero buy price."""
        pnl = calculate_pnl_percent(current_price=10000, avg_buy_price=0)
        assert pnl == 0.0

    def test_negative_buy_price(self):
        """Test handling of negative buy price."""
        pnl = calculate_pnl_percent(current_price=10000, avg_buy_price=-100)
        assert pnl == 0.0

    def test_large_gain(self):
        """Test large percentage gain."""
        # 10,000 -> 20,000 = 100% gain
        pnl = calculate_pnl_percent(current_price=20000, avg_buy_price=10000)
        assert pnl == 100.0

    def test_large_loss(self):
        """Test large percentage loss."""
        # 10,000 -> 5,000 = -50% loss
        pnl = calculate_pnl_percent(current_price=5000, avg_buy_price=10000)
        assert pnl == -50.0


class TestCheckStopLoss:
    """Test stop loss condition check."""

    def test_stop_loss_triggered(self):
        """Test stop loss is triggered when PnL below threshold."""
        # -5% is below -4.5% threshold
        assert check_stop_loss(pnl_percent=-5.0, stop_loss_pct=-4.5) is True

    def test_stop_loss_not_triggered(self):
        """Test stop loss is not triggered when PnL above threshold."""
        # -3% is above -4.5% threshold
        assert check_stop_loss(pnl_percent=-3.0, stop_loss_pct=-4.5) is False

    def test_stop_loss_exact_threshold(self):
        """Test stop loss at exact threshold value."""
        # -4.5% equals -4.5% threshold -> should trigger
        assert check_stop_loss(pnl_percent=-4.5, stop_loss_pct=-4.5) is True

    def test_stop_loss_positive_pnl(self):
        """Test stop loss with positive PnL."""
        # 10% gain should not trigger stop loss
        assert check_stop_loss(pnl_percent=10.0, stop_loss_pct=-4.5) is False

    def test_stop_loss_custom_threshold(self):
        """Test stop loss with custom threshold."""
        # -8% with -10% threshold -> not triggered
        assert check_stop_loss(pnl_percent=-8.0, stop_loss_pct=-10.0) is False
        # -12% with -10% threshold -> triggered
        assert check_stop_loss(pnl_percent=-12.0, stop_loss_pct=-10.0) is True


class TestCheckTakeProfit:
    """Test take profit condition check."""

    def test_take_profit_triggered(self):
        """Test take profit is triggered when PnL above threshold."""
        # 15% is above 12% threshold
        assert check_take_profit(pnl_percent=15.0, take_profit_pct=12.0) is True

    def test_take_profit_not_triggered(self):
        """Test take profit is not triggered when PnL below threshold."""
        # 8% is below 12% threshold
        assert check_take_profit(pnl_percent=8.0, take_profit_pct=12.0) is False

    def test_take_profit_exact_threshold(self):
        """Test take profit at exact threshold value."""
        # 12% equals 12% threshold -> should trigger
        assert check_take_profit(pnl_percent=12.0, take_profit_pct=12.0) is True

    def test_take_profit_negative_pnl(self):
        """Test take profit with negative PnL."""
        # -5% loss should not trigger take profit
        assert check_take_profit(pnl_percent=-5.0, take_profit_pct=12.0) is False

    def test_take_profit_custom_threshold(self):
        """Test take profit with custom threshold."""
        # 18% with 20% threshold -> not triggered
        assert check_take_profit(pnl_percent=18.0, take_profit_pct=20.0) is False
        # 25% with 20% threshold -> triggered
        assert check_take_profit(pnl_percent=25.0, take_profit_pct=20.0) is True


class TestCheckTrendBreak:
    """Test trend break (Bollinger Band middle line) condition check."""

    @pytest.fixture
    def uptrend_prices(self):
        """Generate uptrending price series."""
        return pd.Series([100 + i * 2 for i in range(30)])

    @pytest.fixture
    def stable_prices(self):
        """Generate stable price series around 10000."""

        np.random.seed(42)
        base = 10000
        noise = np.random.normal(0, 50, 30)
        return pd.Series([base + n for n in noise])

    def test_trend_break_triggered(self, stable_prices):
        """Test trend break when price below middle band."""
        # Get middle band value and test with price below it
        is_break, middle_band = check_trend_break(
            current_price=9800,  # Below middle band
            prices=stable_prices,
            bollinger_period=12,
            bollinger_std_dev=1.3,
        )
        # Middle band should be around 10000
        assert middle_band is not None
        assert 9900 < middle_band < 10100
        assert is_break is True

    def test_trend_break_not_triggered(self, stable_prices):
        """Test no trend break when price above middle band."""
        is_break, middle_band = check_trend_break(
            current_price=10200,  # Above middle band
            prices=stable_prices,
            bollinger_period=12,
            bollinger_std_dev=1.3,
        )
        assert middle_band is not None
        assert is_break is False

    def test_trend_break_insufficient_data(self):
        """Test with insufficient price data."""
        short_prices = pd.Series([100, 101, 102])  # Only 3 data points
        is_break, middle_band = check_trend_break(
            current_price=100, prices=short_prices, bollinger_period=12
        )
        assert is_break is False
        assert middle_band is None

    def test_trend_break_empty_prices(self):
        """Test with empty price series."""
        empty_prices = pd.Series([], dtype=float)
        is_break, middle_band = check_trend_break(
            current_price=100, prices=empty_prices, bollinger_period=12
        )
        assert is_break is False
        assert middle_band is None

    def test_trend_break_custom_parameters(self, uptrend_prices):
        """Test with custom Bollinger Band parameters."""
        is_break, middle_band = check_trend_break(
            current_price=150, prices=uptrend_prices, bollinger_period=20, bollinger_std_dev=2.0
        )
        assert middle_band is not None


class TestGenerateSellSignals:
    """Test combined sell signal generation."""

    @pytest.fixture
    def default_settings(self):
        """Default portfolio settings."""
        return PortfolioSettings(
            stop_loss_pct=-4.5,
            take_profit_pct=12.0,
            sell_on_middle_band=False,
            bollinger_period=12,
            bollinger_std_dev=1.3,
        )

    @pytest.fixture
    def trend_break_settings(self):
        """Settings with trend break enabled."""
        return PortfolioSettings(
            stop_loss_pct=-4.5,
            take_profit_pct=12.0,
            sell_on_middle_band=True,
            bollinger_period=12,
            bollinger_std_dev=1.3,
        )

    @pytest.fixture
    def stable_prices(self):
        """Generate stable price series around 10000."""
        import numpy as np

        np.random.seed(42)
        base = 10000
        noise = np.random.normal(0, 50, 30)
        return pd.Series([base + n for n in noise])

    def test_stop_loss_signal_generated(self, default_settings):
        """Test stop loss signal is generated."""
        signals = generate_sell_signals(
            position_id="pos-1",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9500,  # -5% loss
            prices=None,
            settings=default_settings,
        )

        assert len(signals) == 1
        assert signals[0].signal_type == SellSignalType.STOP_LOSS
        assert signals[0].position_id == "pos-1"
        assert signals[0].pnl_percent == -5.0
        assert signals[0].current_price == 9500
        assert signals[0].trigger_value == -4.5
        assert "손실률" in signals[0].reason
        assert "-5.0%" in signals[0].reason

    def test_take_profit_signal_generated(self, default_settings):
        """Test take profit signal is generated."""
        signals = generate_sell_signals(
            position_id="pos-2",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=11500,  # +15% gain
            prices=None,
            settings=default_settings,
        )

        assert len(signals) == 1
        assert signals[0].signal_type == SellSignalType.TAKE_PROFIT
        assert signals[0].position_id == "pos-2"
        assert signals[0].pnl_percent == 15.0
        assert signals[0].trigger_value == 12.0
        assert "수익률" in signals[0].reason
        assert "15.0%" in signals[0].reason

    def test_trend_break_signal_generated(self, trend_break_settings, stable_prices):
        """Test trend break signal is generated when enabled."""
        signals = generate_sell_signals(
            position_id="pos-3",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9800,  # Below middle band
            prices=stable_prices,
            settings=trend_break_settings,
        )

        # Should have trend break signal (and possibly stop loss if PnL is -2%)
        trend_signals = [s for s in signals if s.signal_type == SellSignalType.TREND_BREAK]
        assert len(trend_signals) == 1
        assert "볼린저 중심선" in trend_signals[0].reason
        assert "하향 돌파" in trend_signals[0].reason

    def test_trend_break_not_generated_when_disabled(self, default_settings, stable_prices):
        """Test trend break signal is NOT generated when disabled."""
        signals = generate_sell_signals(
            position_id="pos-4",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9800,  # Would trigger if enabled
            prices=stable_prices,
            settings=default_settings,  # sell_on_middle_band=False
        )

        trend_signals = [s for s in signals if s.signal_type == SellSignalType.TREND_BREAK]
        assert len(trend_signals) == 0

    def test_no_signals_when_conditions_not_met(self, default_settings):
        """Test no signals when no conditions are met."""
        signals = generate_sell_signals(
            position_id="pos-5",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=10500,  # +5% gain (between thresholds)
            prices=None,
            settings=default_settings,
        )

        assert len(signals) == 0

    def test_multiple_signals_generated(self, trend_break_settings, stable_prices):
        """Test multiple signals can be generated simultaneously."""
        # Create settings where both stop loss and trend break can trigger
        settings = PortfolioSettings(
            stop_loss_pct=-2.0,  # Lower threshold
            take_profit_pct=12.0,
            sell_on_middle_band=True,
            bollinger_period=12,
            bollinger_std_dev=1.3,
        )

        signals = generate_sell_signals(
            position_id="pos-6",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9700,  # -3% loss, below middle band
            prices=stable_prices,
            settings=settings,
        )

        signal_types = [s.signal_type for s in signals]
        assert SellSignalType.STOP_LOSS in signal_types
        assert SellSignalType.TREND_BREAK in signal_types
        assert len(signals) == 2

    def test_signal_timestamp(self, default_settings):
        """Test that signals have valid timestamps."""
        before = datetime.now()
        signals = generate_sell_signals(
            position_id="pos-7",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9000,  # -10% loss
            prices=None,
            settings=default_settings,
        )
        after = datetime.now()

        assert len(signals) == 1
        assert before <= signals[0].generated_at <= after


class TestPortfolioSettings:
    """Test PortfolioSettings dataclass."""

    def test_default_values(self):
        """Test default settings values."""
        settings = PortfolioSettings()
        assert settings.stop_loss_pct == -4.5
        assert settings.take_profit_pct == 12.0
        assert settings.sell_on_middle_band is False
        assert settings.bollinger_period == 12
        assert settings.bollinger_std_dev == 1.3

    def test_custom_values(self):
        """Test custom settings values."""
        settings = PortfolioSettings(
            stop_loss_pct=-10.0,
            take_profit_pct=20.0,
            sell_on_middle_band=True,
            bollinger_period=20,
            bollinger_std_dev=2.0,
        )
        assert settings.stop_loss_pct == -10.0
        assert settings.take_profit_pct == 20.0
        assert settings.sell_on_middle_band is True
        assert settings.bollinger_period == 20
        assert settings.bollinger_std_dev == 2.0


class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_very_small_price_change(self):
        """Test with very small price changes."""
        pnl = calculate_pnl_percent(current_price=10001, avg_buy_price=10000)
        assert abs(pnl - 0.01) < 0.001

    def test_exact_boundary_stop_loss(self):
        """Test exact boundary for stop loss."""
        # At exactly -4.5%, should trigger
        settings = PortfolioSettings(stop_loss_pct=-4.5)
        signals = generate_sell_signals(
            position_id="edge-1",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9550,  # Exactly -4.5%
            prices=None,
            settings=settings,
        )
        assert len(signals) == 1
        assert signals[0].signal_type == SellSignalType.STOP_LOSS

    def test_exact_boundary_take_profit(self):
        """Test exact boundary for take profit."""
        # At exactly 12%, should trigger
        settings = PortfolioSettings(take_profit_pct=12.0)
        signals = generate_sell_signals(
            position_id="edge-2",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=11200,  # Exactly +12%
            prices=None,
            settings=settings,
        )
        assert len(signals) == 1
        assert signals[0].signal_type == SellSignalType.TAKE_PROFIT

    def test_prices_none_with_trend_break_enabled(self):
        """Test trend break with None prices."""
        settings = PortfolioSettings(sell_on_middle_band=True)
        signals = generate_sell_signals(
            position_id="edge-3",
            _symbol="005930",
            avg_buy_price=10000,
            current_price=9500,
            prices=None,  # No price data
            settings=settings,
        )
        # Should only have stop loss, no trend break due to no prices
        assert len(signals) == 1
        assert signals[0].signal_type == SellSignalType.STOP_LOSS


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
