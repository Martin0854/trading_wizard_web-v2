/**
 * Settings Zustand Store for My Portfolio
 *
 * Manages portfolio settings with encryption support via shared-ui settingsService
 */

import { create } from 'zustand';
import type { PortfolioSettings } from '@trading-wizard/shared-ui/types';
import { DEFAULT_PORTFOLIO_SETTINGS } from '@trading-wizard/shared-ui/types';

interface SettingsState {
  settings: PortfolioSettings;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  // Actions
  setSettings: (settings: Partial<PortfolioSettings>) => void;
  resetToDefaults: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  markClean: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: { ...DEFAULT_PORTFOLIO_SETTINGS },
  isLoading: false,
  error: null,
  isDirty: false,

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
      isDirty: true,
    })),

  resetToDefaults: () =>
    set({
      settings: { ...DEFAULT_PORTFOLIO_SETTINGS },
      isDirty: true,
    }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  markClean: () => set({ isDirty: false }),
}));

/**
 * Validate portfolio settings
 */
export function validatePortfolioSettings(settings: PortfolioSettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // stopLossPct: -20 to 0
  if (settings.stopLossPct < -20 || settings.stopLossPct > 0) {
    errors.push('손절매 비율은 -20% ~ 0% 사이여야 합니다.');
  }

  // takeProfitPct: 0 to 100
  if (settings.takeProfitPct < 0 || settings.takeProfitPct > 100) {
    errors.push('익절매 비율은 0% ~ 100% 사이여야 합니다.');
  }

  // bollingerPeriod: 5 to 50
  if (settings.bollingerPeriod < 5 || settings.bollingerPeriod > 50) {
    errors.push('볼린저 밴드 기간은 5 ~ 50 사이여야 합니다.');
  }

  // bollingerStdDev: 0.5 to 3.0
  if (settings.bollingerStdDev < 0.5 || settings.bollingerStdDev > 3.0) {
    errors.push('표준편차 배수는 0.5 ~ 3.0 사이여야 합니다.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
