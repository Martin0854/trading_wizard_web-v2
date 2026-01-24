import { create } from 'zustand';
import type { BuyRecommendation } from '@trading-wizard/shared-ui/types';

interface DailyFocusState {
  recommendations: BuyRecommendation[];
  totalScanned: number;
  loading: boolean;
  error: string | null;
  dataFreshness: Date | undefined;
  selectedSymbol: string | null;

  setRecommendations: (
    recommendations: BuyRecommendation[],
    totalScanned: number,
    generatedAt: string
  ) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  clearError: () => void;
}

export const useDailyFocusStore = create<DailyFocusState>((set) => ({
  recommendations: [],
  totalScanned: 0,
  loading: false,
  error: null,
  dataFreshness: undefined,
  selectedSymbol: null,

  setRecommendations: (recommendations, totalScanned, generatedAt) =>
    set({
      recommendations,
      totalScanned,
      dataFreshness: new Date(generatedAt),
      error: null,
    }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  clearError: () => set({ error: null }),
}));
