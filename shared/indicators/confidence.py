"""Confidence Score calculator.

Implements confidence score calculation per TRADING_STRATEGY_ALGORITHM.md:

Score Composition:
- Base (Bollinger Breakout): 25 points
- Volume Ratio: 0-25 points
- RSI: 0-20 points
- MACD: 0-30 points
- Total: 0-100 points
"""

from dataclasses import dataclass


@dataclass
class ConfidenceScoreBreakdown:
    """Breakdown of confidence score components."""
    base_score: float  # 25 points for Bollinger breakout
    volume_score: float  # 0-25 points
    rsi_score: float  # 0-20 points
    macd_score: float  # 0-30 points
    total: float  # 0-100 points


def calculate_base_score() -> float:
    """Calculate base score for Bollinger breakout.

    The base score is always 25 points when a breakout is detected.

    Returns:
        Base score (25.0)
    """
    return 25.0


def calculate_volume_score(volume_ratio: float) -> float:
    """Calculate volume contribution to confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - 1.0x → 0 points
    - 1.5x → 12.5 points
    - 2.0x+ → 25 points (max)

    Args:
        volume_ratio: Volume ratio (current / 20-day average)

    Returns:
        Volume score (0-25)
    """
    if volume_ratio <= 1.0:
        return 0.0

    # Linear scaling: (ratio - 1.0) * 25, capped at 25
    return min(25.0, (volume_ratio - 1.0) * 25.0)


def calculate_rsi_score(rsi: float) -> float:
    """Calculate RSI contribution to confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - RSI 50 is optimal (20 points)
    - RSI 30 or 70 gets 0 points
    - Linear decrease from 50 towards extremes

    Args:
        rsi: RSI value (0-100)

    Returns:
        RSI score (0-20)
    """
    # Only score if RSI is in 30-70 range
    if rsi < 30 or rsi > 70:
        return 0.0

    # Calculate distance from optimal (50)
    distance = abs(rsi - 50)

    # Score decreases linearly as distance increases
    # At distance 0 (RSI=50): 20 points
    # At distance 20 (RSI=30 or 70): 0 points
    score = 20.0 * (1 - distance / 20.0)

    return max(0.0, score)


def calculate_macd_score(histogram: float, signal: float) -> float:
    """Calculate MACD contribution to confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - Only score if histogram is positive
    - Score based on histogram/signal ratio, capped at 1.0

    Args:
        histogram: MACD histogram value
        signal: MACD signal line value

    Returns:
        MACD score (0-30)
    """
    if histogram <= 0:
        return 0.0

    # Calculate ratio of histogram to signal
    # Handle near-zero signal to avoid division issues
    if abs(signal) < 0.0001:
        # If signal is near zero, use bounded histogram value
        macd_ratio = min(abs(histogram) * 100, 1.0)
    else:
        macd_ratio = min(histogram / abs(signal), 1.0)

    return 30.0 * macd_ratio


def calculate_confidence_score(
    volume_ratio: float,
    rsi: float,
    macd_histogram: float,
    macd_signal: float
) -> float:
    """Calculate total confidence score.

    Per TRADING_STRATEGY_ALGORITHM.md:
    - Base: 25 points (Bollinger breakout)
    - Volume: 0-25 points
    - RSI: 0-20 points
    - MACD: 0-30 points
    - Total: 0-100 points

    Args:
        volume_ratio: Volume ratio (current / 20-day average)
        rsi: RSI value (0-100)
        macd_histogram: MACD histogram value
        macd_signal: MACD signal line value

    Returns:
        Total confidence score (0-100)
    """
    base = calculate_base_score()
    volume = calculate_volume_score(volume_ratio)
    rsi_score = calculate_rsi_score(rsi)
    macd = calculate_macd_score(macd_histogram, macd_signal)

    return base + volume + rsi_score + macd


def calculate_confidence_score_breakdown(
    volume_ratio: float,
    rsi: float,
    macd_histogram: float,
    macd_signal: float
) -> ConfidenceScoreBreakdown:
    """Calculate confidence score with component breakdown.

    Args:
        volume_ratio: Volume ratio (current / 20-day average)
        rsi: RSI value (0-100)
        macd_histogram: MACD histogram value
        macd_signal: MACD signal line value

    Returns:
        ConfidenceScoreBreakdown with individual component scores
    """
    base = calculate_base_score()
    volume = calculate_volume_score(volume_ratio)
    rsi_score = calculate_rsi_score(rsi)
    macd = calculate_macd_score(macd_histogram, macd_signal)

    return ConfidenceScoreBreakdown(
        base_score=base,
        volume_score=volume,
        rsi_score=rsi_score,
        macd_score=macd,
        total=base + volume + rsi_score + macd
    )


def is_above_threshold(score: float, threshold: float = 55.0) -> bool:
    """Check if confidence score meets threshold.

    Args:
        score: Confidence score (0-100)
        threshold: Minimum threshold (default: 55)

    Returns:
        True if score >= threshold
    """
    return score >= threshold


def generate_signal_reason(breakdown: ConfidenceScoreBreakdown) -> str:
    """Generate human-readable signal reason from score breakdown.

    Args:
        breakdown: Confidence score breakdown

    Returns:
        String describing the signal reason
    """
    reasons = ["볼린저 상단 돌파"]

    if breakdown.volume_score > 15:
        reasons.append("높은 거래량")
    elif breakdown.volume_score > 0:
        reasons.append("거래량 증가")

    if breakdown.rsi_score > 15:
        reasons.append("RSI 중립 구간")
    elif breakdown.rsi_score > 10:
        reasons.append("RSI 적정 범위")

    if breakdown.macd_score > 20:
        reasons.append("MACD 강세 모멘텀")
    elif breakdown.macd_score > 10:
        reasons.append("MACD 양호")
    elif breakdown.macd_score > 0:
        reasons.append("MACD 약세 전환")

    return " + ".join(reasons)
