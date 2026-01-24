import type { BuyRecommendation } from '@trading-wizard/shared-ui/types';
import RecommendationCard from './RecommendationCard';
import EmptyState from './EmptyState';
import './RecommendationList.css';

interface RecommendationListProps {
  recommendations: BuyRecommendation[];
  totalScanned: number;
  onSelectStock: (symbol: string) => void;
}

function RecommendationList({
  recommendations,
  totalScanned,
  onSelectStock,
}: RecommendationListProps) {
  if (recommendations.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="recommendation-list">
      <div className="list-header">
        <h2>매수 추천 종목</h2>
        <span className="scan-info">
          {totalScanned}개 종목 중 {recommendations.length}개 신호 발생
        </span>
      </div>
      <div className="list-grid">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.symbol}
            recommendation={recommendation}
            onSelect={onSelectStock}
          />
        ))}
      </div>
    </div>
  );
}

export default RecommendationList;
