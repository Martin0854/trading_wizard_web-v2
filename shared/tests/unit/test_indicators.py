"""Unit tests for technical indicators.

Tests known input/output pairs to verify calculation correctness.
"""

import pandas as pd
import pytest

from shared.indicators.bollinger import (
    calculate_bands,
    calculate_width,
    calculate_bollinger_bands,
)
from shared.indicators.rsi import calculate_rsi, calculate_rsi_score
from shared.indicators.macd import calculate_macd, get_latest_macd, calculate_macd_score
from shared.indicators.volume import calculate_volume_ratio, get_latest_volume_ratio, calculate_volume_score
from shared.indicators.confidence import (
    calculate_confidence_score,
    calculate_base_score,
)


class TestBollingerBands:
    """Test Bollinger Bands calculations."""

    def test_calculate_bands_basic(self):
        """Test basic Bollinger Bands calculation."""
        prices = pd.Series([100, 102, 101, 103, 105, 104, 106, 107, 105, 108, 110, 109])
        upper, middle, lower = calculate_bands(prices, period=5, std_dev=2.0)

        # Middle should be 5-day SMA
        assert not pd.isna(middle.iloc[-1])
        # Upper should be above middle
        assert upper.iloc[-1] > middle.iloc[-1]
        # Lower should be below middle
        assert lower.iloc[-1] < middle.iloc[-1]

    def test_calculate_width(self):
        """Test Bollinger Band width calculation."""
        upper = pd.Series([110, 112, 115])
        middle = pd.Series([100, 100, 100])
        lower = pd.Series([90, 88, 85])

        width = calculate_width(upper, middle, lower)

        # Width = (upper - lower) / middle * 100
        assert abs(width.iloc[0] - 20.0) < 0.01  # (110 - 90) / 100 * 100 = 20%
        assert abs(width.iloc[1] - 24.0) < 0.01  # (112 - 88) / 100 * 100 = 24%
        assert abs(width.iloc[2] - 30.0) < 0.01  # (115 - 85) / 100 * 100 = 30%

    def test_calculate_bollinger_bands_complete(self):
        """Test complete Bollinger Bands calculation."""
        prices = pd.Series([100 + i for i in range(30)])  # Trending up
        result = calculate_bollinger_bands(prices, period=12, std_dev=1.3)

        assert result is not None
        assert result.upper > result.middle > result.lower
        assert result.width > 0

    def test_calculate_bollinger_bands_insufficient_data(self):
        """Test with insufficient data."""
        prices = pd.Series([100, 101, 102])  # Only 3 data points
        result = calculate_bollinger_bands(prices, period=12)

        assert result is None


class TestRSI:
    """Test RSI calculations."""

    def test_calculate_rsi_trending_up(self):
        """Test RSI in uptrend."""
        # Strongly rising prices should give high RSI
        prices = pd.Series([100 + i * 2 for i in range(20)])
        rsi = calculate_rsi(prices, period=14)

        assert rsi.iloc[-1] > 50  # Should be above neutral

    def test_calculate_rsi_trending_down(self):
        """Test RSI in downtrend."""
        # Strongly falling prices should give low RSI
        prices = pd.Series([200 - i * 2 for i in range(20)])
        rsi = calculate_rsi(prices, period=14)

        assert rsi.iloc[-1] < 50  # Should be below neutral

    def test_rsi_bounds(self):
        """Test RSI is bounded between 0 and 100."""
        prices = pd.Series([100 + i for i in range(30)])
        rsi = calculate_rsi(prices, period=14)

        assert all(0 <= r <= 100 for r in rsi.dropna())

    def test_calculate_rsi_score_optimal(self):
        """Test RSI score at optimal value."""
        score = calculate_rsi_score(50)  # Optimal
        assert score == 20  # Maximum score

    def test_calculate_rsi_score_extreme(self):
        """Test RSI score at extreme values."""
        score_30 = calculate_rsi_score(30)
        score_70 = calculate_rsi_score(70)
        score_20 = calculate_rsi_score(20)

        assert score_30 == 0  # At boundary
        assert score_70 == 0  # At boundary
        assert score_20 == 0  # Below boundary


class TestMACD:
    """Test MACD calculations."""

    def test_calculate_macd_basic(self):
        """Test basic MACD calculation."""
        prices = pd.Series([100 + i for i in range(40)])
        macd_line, signal_line, histogram = calculate_macd(prices)

        assert len(macd_line) == len(prices)
        assert len(signal_line) == len(prices)
        assert len(histogram) == len(prices)

    def test_get_latest_macd(self):
        """Test getting latest MACD values."""
        prices = pd.Series([100 + i for i in range(40)])
        result = get_latest_macd(prices)

        assert result is not None
        assert result.histogram == result.macd - result.signal

    def test_calculate_macd_score_positive(self):
        """Test MACD score with positive histogram."""
        score = calculate_macd_score(histogram=0.5, signal=1.0)
        assert score == 15.0  # 30 * (0.5 / 1.0)

    def test_calculate_macd_score_negative(self):
        """Test MACD score with negative histogram."""
        score = calculate_macd_score(histogram=-0.5, signal=1.0)
        assert score == 0  # Negative histogram = 0 score


class TestVolumeRatio:
    """Test Volume Ratio calculations."""

    def test_calculate_volume_ratio(self):
        """Test volume ratio calculation."""
        volumes = pd.Series([1000000] * 20 + [2000000])  # Double volume on last day
        ratio = calculate_volume_ratio(volumes, avg_period=20)

        # Last day should have ratio of ~2.0
        assert abs(ratio.iloc[-1] - 2.0) < 0.01

    def test_get_latest_volume_ratio(self):
        """Test getting latest volume ratio."""
        volumes = pd.Series([1000000] * 25)
        ratio = get_latest_volume_ratio(volumes, avg_period=20)

        assert ratio is not None
        assert abs(ratio - 1.0) < 0.01  # Should be ~1.0 (average)

    def test_calculate_volume_score_max(self):
        """Test volume score at maximum."""
        score = calculate_volume_score(2.0)  # 2x average
        assert score == 25  # Maximum score

    def test_calculate_volume_score_low(self):
        """Test volume score below average."""
        score = calculate_volume_score(0.5)  # Half average
        assert score == 0.5 * 25 * 0.5  # Reduced score


class TestConfidenceScore:
    """Test confidence score calculations."""

    def test_base_score(self):
        """Test base score is always 25."""
        assert calculate_base_score() == 25.0

    def test_confidence_score_maximum(self):
        """Test maximum possible confidence score."""
        score = calculate_confidence_score(
            volume_ratio=2.0,  # 25 points
            rsi=50,           # 20 points
            macd_histogram=1.0,
            macd_signal=1.0   # 30 points
        )
        # Base (25) + Volume (25) + RSI (20) + MACD (30) = 100
        assert score == 100.0

    def test_confidence_score_minimum(self):
        """Test minimum confidence score."""
        score = calculate_confidence_score(
            volume_ratio=0.5,  # 0 points
            rsi=20,           # 0 points (outside 30-70)
            macd_histogram=-1.0,
            macd_signal=1.0   # 0 points (negative)
        )
        # Only base score
        assert score == 25.0

    def test_confidence_score_typical(self):
        """Test typical confidence score."""
        score = calculate_confidence_score(
            volume_ratio=1.5,  # 12.5 points
            rsi=45,           # ~15 points
            macd_histogram=0.3,
            macd_signal=0.5   # ~18 points
        )
        # Should be between 55 and 80
        assert 55 <= score <= 80


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
