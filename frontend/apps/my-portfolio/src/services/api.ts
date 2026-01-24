/**
 * API client for My Portfolio Wizard
 */

import axios from 'axios';
import type {
  SellSignalRequest,
  SellSignalListResponse,
  PnLCalculationRequest,
  PnLCalculationResponse,
  StockSearchResponse,
  StockPriceResponse,
} from '@trading-wizard/shared-ui/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch sell signals for portfolio positions
 */
export async function fetchSellSignals(
  request: SellSignalRequest
): Promise<SellSignalListResponse> {
  const response = await apiClient.post<SellSignalListResponse>(
    '/api/portfolio/sell-signals',
    request
  );
  return response.data;
}

/**
 * Calculate PnL for portfolio positions
 */
export async function calculatePnL(
  request: PnLCalculationRequest
): Promise<PnLCalculationResponse> {
  const response = await apiClient.post<PnLCalculationResponse>(
    '/api/portfolio/calculate-pnl',
    request
  );
  return response.data;
}

/**
 * Search stocks by name or symbol
 */
export async function searchStocks(
  query: string,
  limit: number = 10
): Promise<StockSearchResponse> {
  const response = await apiClient.get<StockSearchResponse>(
    '/api/stocks/search',
    {
      params: { q: query, limit },
    }
  );
  return response.data;
}

/**
 * Get current stock price
 */
export async function getStockPrice(
  symbol: string
): Promise<StockPriceResponse> {
  const response = await apiClient.get<StockPriceResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/price`
  );
  return response.data;
}

/**
 * Error handler
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.status === 404) {
      return '데이터를 찾을 수 없습니다.';
    }
    if (error.response?.status === 503) {
      return '서비스를 일시적으로 사용할 수 없습니다.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
}
