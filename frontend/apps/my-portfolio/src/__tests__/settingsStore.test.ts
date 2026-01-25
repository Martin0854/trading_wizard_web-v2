/**
 * Settings Store Tests for My Portfolio
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, validatePortfolioSettings } from '../store/settingsStore';
import { DEFAULT_PORTFOLIO_SETTINGS } from '@trading-wizard/shared-ui/types';

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSettingsStore.setState({
      settings: { ...DEFAULT_PORTFOLIO_SETTINGS },
      isLoading: false,
      error: null,
      isDirty: false,
    });
  });

  describe('initial state', () => {
    it('should have default settings', () => {
      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(DEFAULT_PORTFOLIO_SETTINGS);
    });

    it('should not be dirty initially', () => {
      const state = useSettingsStore.getState();
      expect(state.isDirty).toBe(false);
    });

    it('should not be loading initially', () => {
      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
    });

    it('should have no error initially', () => {
      const state = useSettingsStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('setSettings', () => {
    it('should update stop loss percentage', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ stopLossPct: -10 });

      const state = useSettingsStore.getState();
      expect(state.settings.stopLossPct).toBe(-10);
    });

    it('should update take profit percentage', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ takeProfitPct: 20 });

      const state = useSettingsStore.getState();
      expect(state.settings.takeProfitPct).toBe(20);
    });

    it('should update bollinger period', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ bollingerPeriod: 20 });

      const state = useSettingsStore.getState();
      expect(state.settings.bollingerPeriod).toBe(20);
    });

    it('should update bollinger std dev', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ bollingerStdDev: 2.0 });

      const state = useSettingsStore.getState();
      expect(state.settings.bollingerStdDev).toBe(2.0);
    });

    it('should update sellOnMiddleBand', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ sellOnMiddleBand: true });

      const state = useSettingsStore.getState();
      expect(state.settings.sellOnMiddleBand).toBe(true);
    });

    it('should mark store as dirty after update', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ stopLossPct: -5 });

      const state = useSettingsStore.getState();
      expect(state.isDirty).toBe(true);
    });

    it('should preserve other settings when updating one', () => {
      const { setSettings } = useSettingsStore.getState();
      const originalTakeProfit = useSettingsStore.getState().settings.takeProfitPct;

      setSettings({ stopLossPct: -8 });

      const state = useSettingsStore.getState();
      expect(state.settings.takeProfitPct).toBe(originalTakeProfit);
    });

    it('should update multiple settings at once', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({
        stopLossPct: -7,
        takeProfitPct: 25,
        bollingerPeriod: 15,
      });

      const state = useSettingsStore.getState();
      expect(state.settings.stopLossPct).toBe(-7);
      expect(state.settings.takeProfitPct).toBe(25);
      expect(state.settings.bollingerPeriod).toBe(15);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset settings to default values', () => {
      const { setSettings, resetToDefaults } = useSettingsStore.getState();

      // Change some settings
      setSettings({ stopLossPct: -10, takeProfitPct: 50 });

      // Reset
      resetToDefaults();

      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(DEFAULT_PORTFOLIO_SETTINGS);
    });

    it('should mark store as dirty after reset', () => {
      const { resetToDefaults, markClean } = useSettingsStore.getState();

      // Start clean
      markClean();
      expect(useSettingsStore.getState().isDirty).toBe(false);

      // Reset
      resetToDefaults();

      const state = useSettingsStore.getState();
      expect(state.isDirty).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const { setLoading } = useSettingsStore.getState();
      setLoading(true);

      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const { setLoading } = useSettingsStore.getState();
      setLoading(true);
      setLoading(false);

      const state = useSettingsStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useSettingsStore.getState();
      setError('Test error');

      const state = useSettingsStore.getState();
      expect(state.error).toBe('Test error');
    });

    it('should clear error when set to null', () => {
      const { setError } = useSettingsStore.getState();
      setError('Test error');
      setError(null);

      const state = useSettingsStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('markClean', () => {
    it('should mark store as clean', () => {
      const { setSettings, markClean } = useSettingsStore.getState();

      // Make dirty
      setSettings({ stopLossPct: -5 });
      expect(useSettingsStore.getState().isDirty).toBe(true);

      // Mark clean
      markClean();

      const state = useSettingsStore.getState();
      expect(state.isDirty).toBe(false);
    });
  });
});

describe('validatePortfolioSettings', () => {
  describe('valid settings', () => {
    it('should validate default settings as valid', () => {
      const result = validatePortfolioSettings(DEFAULT_PORTFOLIO_SETTINGS);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate minimum stopLossPct (-20)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, stopLossPct: -20 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate maximum stopLossPct (0)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, stopLossPct: 0 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate minimum takeProfitPct (0)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, takeProfitPct: 0 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate maximum takeProfitPct (100)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, takeProfitPct: 100 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate minimum bollingerPeriod (5)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerPeriod: 5 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate maximum bollingerPeriod (50)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerPeriod: 50 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate minimum bollingerStdDev (0.5)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerStdDev: 0.5 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });

    it('should validate maximum bollingerStdDev (3.0)', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerStdDev: 3.0 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid settings', () => {
    it('should reject stopLossPct below -20', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, stopLossPct: -25 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('손절매 비율은 -20% ~ 0% 사이여야 합니다.');
    });

    it('should reject stopLossPct above 0', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, stopLossPct: 5 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('손절매 비율은 -20% ~ 0% 사이여야 합니다.');
    });

    it('should reject takeProfitPct below 0', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, takeProfitPct: -5 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('익절매 비율은 0% ~ 100% 사이여야 합니다.');
    });

    it('should reject takeProfitPct above 100', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, takeProfitPct: 150 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('익절매 비율은 0% ~ 100% 사이여야 합니다.');
    });

    it('should reject bollingerPeriod below 5', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerPeriod: 3 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('볼린저 밴드 기간은 5 ~ 50 사이여야 합니다.');
    });

    it('should reject bollingerPeriod above 50', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerPeriod: 60 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('볼린저 밴드 기간은 5 ~ 50 사이여야 합니다.');
    });

    it('should reject bollingerStdDev below 0.5', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerStdDev: 0.3 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('표준편차 배수는 0.5 ~ 3.0 사이여야 합니다.');
    });

    it('should reject bollingerStdDev above 3.0', () => {
      const settings = { ...DEFAULT_PORTFOLIO_SETTINGS, bollingerStdDev: 4.0 };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('표준편차 배수는 0.5 ~ 3.0 사이여야 합니다.');
    });

    it('should collect multiple errors', () => {
      const settings = {
        ...DEFAULT_PORTFOLIO_SETTINGS,
        stopLossPct: -25,
        takeProfitPct: 150,
        bollingerPeriod: 3,
        bollingerStdDev: 4.0,
      };
      const result = validatePortfolioSettings(settings);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(4);
    });
  });
});
