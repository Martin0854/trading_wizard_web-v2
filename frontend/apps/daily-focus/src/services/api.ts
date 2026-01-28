import axios from 'axios';
import type {
  BuyRecommendation,
  Stock,
  TechnicalIndicators,
  DailyFocusSettings,
} from '@trading-wizard/shared-ui/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RecommendationsResponse {
  recommendations: BuyRecommendation[];
  totalScanned: number;
  generatedAt: string;
  parameters: {
    bollingerPeriod: number;
    bollingerStdDev: number;
    confidenceThreshold: number;
  };
}

export interface StockDetailResponse {
  stock: Stock;
  indicators: TechnicalIndicators;
  recommendation: BuyRecommendation | null;
  priceHistory: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export async function fetchRecommendations(
  settings?: Partial<DailyFocusSettings>
): Promise<RecommendationsResponse> {
  const params: Record<string, number> = {};

  if (settings?.confidenceThreshold !== undefined) {
    params.confidence_threshold = settings.confidenceThreshold;
  }
  if (settings?.bollingerPeriod !== undefined) {
    params.bollinger_period = settings.bollingerPeriod;
  }
  if (settings?.bollingerStdDev !== undefined) {
    params.bollinger_std_dev = settings.bollingerStdDev;
  }
  if (settings?.trendLookbackDays !== undefined) {
    params.trend_lookback_days = settings.trendLookbackDays;
  }
  if (settings?.trendBelowMaThreshold !== undefined) {
    params.trend_below_ma_threshold = settings.trendBelowMaThreshold;
  }
  if (settings?.trendMaSlopeLookback !== undefined) {
    params.trend_ma_slope_lookback = settings.trendMaSlopeLookback;
  }

  const response = await apiClient.get<RecommendationsResponse>(
    '/api/daily-focus/recommendations',
    { params }
  );
  return response.data;
}

export async function fetchStockDetail(symbol: string): Promise<StockDetailResponse> {
  const response = await apiClient.get<StockDetailResponse>(
    `/api/daily-focus/stock/${encodeURIComponent(symbol)}`
  );
  return response.data;
}

export default apiClient;
