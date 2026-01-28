import type { TechnicalIndicators } from '@trading-wizard/shared-ui/types';
import './ScoreBreakdown.css';

interface ScoreBreakdownProps {
    indicators: TechnicalIndicators;
}

/**
 * Calculate base score (5~25 points)
 * - Base: 5 points for breakout
 * - +20 points if both squeeze AND correction trend
 */
function calculateBaseScore(indicators: TechnicalIndicators): number {
    let score = 5.0;
    if (indicators.bollinger.isInSqueeze && indicators.isCorrectionTrend) {
        score += 20.0;
    }
    return score;
}

/**
 * Calculate volume score (0~25 points)
 * - 1.0x → 0 points
 * - 2.0x+ → 25 points (max)
 */
function calculateVolumeScore(volumeRatio: number): number {
    if (volumeRatio <= 1.0) return 0.0;
    return Math.min(25.0, (volumeRatio - 1.0) * 25.0);
}

/**
 * Calculate RSI score (0~20 points)
 * - RSI 50 → 20 points (optimal)
 * - RSI 30 or 70 → 0 points
 */
function calculateRsiScore(rsi: number): number {
    if (rsi < 30 || rsi > 70) return 0.0;
    const distance = Math.abs(rsi - 50);
    return Math.max(0, 20.0 * (1 - distance / 20.0));
}

/**
 * Calculate MACD score (0~30 points)
 * - Only scores if histogram > 0
 * - Based on histogram/signal ratio
 */
function calculateMacdScore(histogram: number, signal: number): number {
    if (histogram <= 0) return 0.0;
    let macdRatio: number;
    if (Math.abs(signal) < 0.0001) {
        macdRatio = Math.min(Math.abs(histogram) * 100, 1.0);
    } else {
        macdRatio = Math.min(histogram / Math.abs(signal), 1.0);
    }
    return 30.0 * macdRatio;
}

interface ScoreItemProps {
    label: string;
    score: number;
    maxScore: number;
    description: string;
}

function ScoreItem({ label, score, maxScore, description }: ScoreItemProps) {
    const percentage = (score / maxScore) * 100;

    return (
        <div className="score-item">
            <div className="score-header">
                <span className="score-label">{label}</span>
                <span className="score-value">{score.toFixed(1)} / {maxScore}점</span>
            </div>
            <div className="score-bar">
                <div
                    className="score-bar-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="score-description">{description}</div>
        </div>
    );
}

function ScoreBreakdown({ indicators }: ScoreBreakdownProps) {
    const baseScore = calculateBaseScore(indicators);
    const volumeScore = calculateVolumeScore(indicators.volumeRatio);
    const rsiScore = calculateRsiScore(indicators.rsi);
    const macdScore = calculateMacdScore(
        indicators.macd.histogram,
        indicators.macd.signal
    );
    const totalScore = baseScore + volumeScore + rsiScore + macdScore;

    const getBaseDescription = () => {
        if (indicators.bollinger.isInSqueeze && indicators.isCorrectionTrend) {
            return '볼린저 돌파 + 스퀴즈 상태 + 조정 추세 (최대 보너스)';
        }
        return '볼린저 상단 돌파 (기본 점수)';
    };

    const getVolumeDescription = () => {
        const ratio = indicators.volumeRatio;
        if (ratio <= 1.0) return '평균 이하 거래량';
        if (ratio >= 2.0) return `평균 대비 ${ratio.toFixed(1)}배 (최대 점수)`;
        return `평균 대비 ${ratio.toFixed(1)}배`;
    };

    const getRsiDescription = () => {
        const rsi = indicators.rsi;
        if (rsi < 30) return '과매도 구간 (0점)';
        if (rsi > 70) return '과매수 구간 (0점)';
        if (rsi >= 45 && rsi <= 55) return `RSI ${rsi.toFixed(0)} - 최적 중립 구간`;
        return `RSI ${rsi.toFixed(0)} - 중립 구간`;
    };

    const getMacdDescription = () => {
        const hist = indicators.macd.histogram;
        if (hist <= 0) return 'MACD 히스토그램 음수 (0점)';
        return `히스토그램 ${hist.toFixed(2)} (양수 모멘텀)`;
    };

    return (
        <div className="score-breakdown">
            <h3 className="score-breakdown-title">
                점수 상세
                <span className="total-score">{totalScore.toFixed(0)}점</span>
            </h3>

            <div className="score-items">
                <ScoreItem
                    label="기본 (돌파)"
                    score={baseScore}
                    maxScore={25}
                    description={getBaseDescription()}
                />
                <ScoreItem
                    label="거래량"
                    score={volumeScore}
                    maxScore={25}
                    description={getVolumeDescription()}
                />
                <ScoreItem
                    label="RSI"
                    score={rsiScore}
                    maxScore={20}
                    description={getRsiDescription()}
                />
                <ScoreItem
                    label="MACD"
                    score={macdScore}
                    maxScore={30}
                    description={getMacdDescription()}
                />
            </div>
        </div>
    );
}

export default ScoreBreakdown;
