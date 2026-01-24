"""Strategy settings models for Trading Wizard.

Default values are defined per data-model.md and spec.md.
"""

from dataclasses import dataclass


@dataclass
class DailyFocusSettings:
    """Daily Focus Wizard strategy settings.

    These parameters control the buy signal detection algorithm.
    """
    # Bollinger Band parameters
    bollinger_period: int = 12  # Bollinger band period (days), range: 5-50
    bollinger_std_dev: float = 1.3  # Standard deviation multiplier, range: 0.5-3.0

    # Squeeze Detection
    squeeze_threshold_pct: float = 55  # Squeeze detection threshold (%), range: 30-80
    squeeze_lookback_days: int = 5  # Days to confirm squeeze, range: 3-20
    bb_width_ma_period: int = 10  # BB Width moving average period, range: 5-30

    # Signal Filtering
    confidence_threshold: float = 55  # Minimum confidence score, range: 0-100

    # RSI parameters
    rsi_period: int = 14  # RSI calculation period, range: 7-28

    # MACD parameters
    macd_fast: int = 12  # Fast EMA period, range: 5-20
    macd_slow: int = 26  # Slow EMA period, range: 15-40
    macd_signal: int = 9  # Signal line EMA period, range: 5-15

    # Volume parameters
    volume_avg_period: int = 20  # Volume average period, range: 10-60


@dataclass
class PortfolioSettings:
    """My Portfolio Wizard strategy settings.

    These parameters control the sell signal detection algorithm.
    """
    # Sell thresholds
    stop_loss_pct: float = -4.5  # Stop loss threshold (%), range: -20 to 0
    take_profit_pct: float = 12.0  # Take profit threshold (%), range: 0-100

    # Trend break detection
    sell_on_middle_band: bool = False  # Sell when price crosses below middle band

    # Bollinger Band parameters (for trend break detection)
    bollinger_period: int = 12  # Bollinger band period (days), range: 5-50
    bollinger_std_dev: float = 1.3  # Standard deviation multiplier, range: 0.5-3.0


# Default instances for easy access
DEFAULT_DAILY_FOCUS_SETTINGS = DailyFocusSettings()
DEFAULT_PORTFOLIO_SETTINGS = PortfolioSettings()
