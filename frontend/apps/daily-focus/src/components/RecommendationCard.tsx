import type { BuyRecommendation } from '@trading-wizard/shared-ui/types';
import './RecommendationCard.css';

interface RecommendationCardProps {
  recommendation: BuyRecommendation;
  onSelect: (symbol: string) => void;
}

function RecommendationCard({ recommendation, onSelect }: RecommendationCardProps) {
  const { stock, confidenceScore, signalReason, indicators } = recommendation;

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className="recommendation-card" onClick={() => onSelect(stock.symbol)}>
      <div className="card-header">
        <div className="stock-info">
          <span className="stock-name">{stock.name}</span>
          <span className="stock-symbol">{stock.symbol}</span>
        </div>
        <div className={`confidence-score ${getScoreColor(confidenceScore)}`}>
          {confidenceScore.toFixed(0)}점
        </div>
      </div>

      <div className="card-body">
        <div className="price-section">
          <div className="current-price">
            ₩{stock.currentPrice.toLocaleString()}
          </div>
          <div className={`change-percent ${(stock.changePercent ?? 0) >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(stock.changePercent ?? 0)}
          </div>
        </div>

        <div className="signal-reason">{signalReason}</div>

        <div className="indicators-summary">
          <div className="indicator">
            <span className="indicator-label">RSI</span>
            <span className="indicator-value">{indicators.rsi.toFixed(1)}</span>
          </div>
          <div className="indicator">
            <span className="indicator-label">MACD</span>
            <span className={`indicator-value ${indicators.macd.histogram > 0 ? 'positive' : 'negative'}`}>
              {indicators.macd.histogram > 0 ? '▲' : '▼'}
            </span>
          </div>
          <div className="indicator">
            <span className="indicator-label">거래량</span>
            <span className="indicator-value">{indicators.volumeRatio.toFixed(1)}x</span>
          </div>
          <div className="indicator">
            <span className="indicator-label">BB</span>
            <span className={`indicator-value ${indicators.bollinger.isExpanding ? 'expanding' : ''}`}>
              {indicators.bollinger.isExpanding ? '확장' : '수축'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
