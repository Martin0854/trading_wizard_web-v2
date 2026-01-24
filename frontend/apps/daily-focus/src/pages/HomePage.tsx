import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRecommendations } from '../services/api';
import { useDailyFocusStore } from '../store/dailyFocusStore';
import { useSettingsStore } from '../store/settingsStore';
import RecommendationList from '../components/RecommendationList';
import StockDetailModal from '../components/StockDetailModal';
import { LoadingSpinner, ErrorMessage } from '@trading-wizard/shared-ui';
import './HomePage.css';

function HomePage() {
  const { settings } = useSettingsStore();
  const {
    recommendations,
    totalScanned,
    selectedSymbol,
    setRecommendations,
    setSelectedSymbol,
  } = useDailyFocusStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendations', settings],
    queryFn: () => fetchRecommendations(settings),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (data) {
      setRecommendations(
        data.recommendations,
        data.totalScanned,
        data.generatedAt
      );
    }
  }, [data, setRecommendations]);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  const handleCloseModal = () => {
    setSelectedSymbol(null);
  };

  if (isLoading) {
    return (
      <div className="home-page loading">
        <LoadingSpinner />
        <p>매수 추천 종목을 분석 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-page error">
        <ErrorMessage
          message="데이터를 불러올 수 없습니다. 네트워크 상태를 확인해주세요."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="home-page">
      <RecommendationList
        recommendations={recommendations}
        totalScanned={totalScanned}
        onSelectStock={handleSelectStock}
      />

      {selectedSymbol && (
        <StockDetailModal symbol={selectedSymbol} onClose={handleCloseModal} />
      )}
    </div>
  );
}

export default HomePage;
