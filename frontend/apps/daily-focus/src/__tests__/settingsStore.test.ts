/**
 * Settings Store Tests for Daily Focus
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '../store/settingsStore';

const DEFAULT_SETTINGS = {
  bollingerPeriod: 12,
  bollingerStdDev: 1.3,
  squeezeThresholdPct: 55,
  squeezeLookbackDays: 5,
  bbWidthMAPeriod: 10,
  confidenceThreshold: 55,
  rsiPeriod: 14,
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  volumeAvgPeriod: 20,
};

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS },
      loading: false,
      error: null,
      isAuthenticated: false,
    });
  });

  describe('initial state', () => {
    it('should have default settings', () => {
      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });

    it('should not be loading initially', () => {
      const state = useSettingsStore.getState();
      expect(state.loading).toBe(false);
    });

    it('should have no error initially', () => {
      const state = useSettingsStore.getState();
      expect(state.error).toBeNull();
    });

    it('should not be authenticated initially', () => {
      const state = useSettingsStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setSettings', () => {
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

    it('should update squeeze threshold pct', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ squeezeThresholdPct: 60 });

      const state = useSettingsStore.getState();
      expect(state.settings.squeezeThresholdPct).toBe(60);
    });

    it('should update squeeze lookback days', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ squeezeLookbackDays: 7 });

      const state = useSettingsStore.getState();
      expect(state.settings.squeezeLookbackDays).toBe(7);
    });

    it('should update bb width MA period', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ bbWidthMAPeriod: 15 });

      const state = useSettingsStore.getState();
      expect(state.settings.bbWidthMAPeriod).toBe(15);
    });

    it('should update confidence threshold', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ confidenceThreshold: 70 });

      const state = useSettingsStore.getState();
      expect(state.settings.confidenceThreshold).toBe(70);
    });

    it('should update RSI period', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ rsiPeriod: 21 });

      const state = useSettingsStore.getState();
      expect(state.settings.rsiPeriod).toBe(21);
    });

    it('should update MACD fast', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ macdFast: 8 });

      const state = useSettingsStore.getState();
      expect(state.settings.macdFast).toBe(8);
    });

    it('should update MACD slow', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ macdSlow: 30 });

      const state = useSettingsStore.getState();
      expect(state.settings.macdSlow).toBe(30);
    });

    it('should update MACD signal', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ macdSignal: 7 });

      const state = useSettingsStore.getState();
      expect(state.settings.macdSignal).toBe(7);
    });

    it('should update volume avg period', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({ volumeAvgPeriod: 30 });

      const state = useSettingsStore.getState();
      expect(state.settings.volumeAvgPeriod).toBe(30);
    });

    it('should preserve other settings when updating one', () => {
      const { setSettings } = useSettingsStore.getState();
      const originalRsiPeriod = useSettingsStore.getState().settings.rsiPeriod;

      setSettings({ bollingerPeriod: 25 });

      const state = useSettingsStore.getState();
      expect(state.settings.rsiPeriod).toBe(originalRsiPeriod);
    });

    it('should update multiple settings at once', () => {
      const { setSettings } = useSettingsStore.getState();
      setSettings({
        bollingerPeriod: 15,
        bollingerStdDev: 1.5,
        confidenceThreshold: 65,
      });

      const state = useSettingsStore.getState();
      expect(state.settings.bollingerPeriod).toBe(15);
      expect(state.settings.bollingerStdDev).toBe(1.5);
      expect(state.settings.confidenceThreshold).toBe(65);
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all settings to default values', () => {
      const { setSettings, resetToDefaults } = useSettingsStore.getState();

      // Change some settings
      setSettings({
        bollingerPeriod: 25,
        confidenceThreshold: 80,
        rsiPeriod: 21,
      });

      // Reset
      resetToDefaults();

      const state = useSettingsStore.getState();
      expect(state.settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const { setLoading } = useSettingsStore.getState();
      setLoading(true);

      const state = useSettingsStore.getState();
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const { setLoading } = useSettingsStore.getState();
      setLoading(true);
      setLoading(false);

      const state = useSettingsStore.getState();
      expect(state.loading).toBe(false);
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
});

describe('getThresholdLabel helper', () => {
  // Test the label logic from ConfidenceSettings
  const getThresholdLabel = (value: number): string => {
    if (value >= 75) return '매우 엄격';
    if (value >= 60) return '엄격';
    if (value >= 45) return '보통';
    if (value >= 30) return '관대';
    return '매우 관대';
  };

  it('should return "매우 엄격" for values >= 75', () => {
    expect(getThresholdLabel(75)).toBe('매우 엄격');
    expect(getThresholdLabel(100)).toBe('매우 엄격');
  });

  it('should return "엄격" for values >= 60 and < 75', () => {
    expect(getThresholdLabel(60)).toBe('엄격');
    expect(getThresholdLabel(74)).toBe('엄격');
  });

  it('should return "보통" for values >= 45 and < 60', () => {
    expect(getThresholdLabel(45)).toBe('보통');
    expect(getThresholdLabel(59)).toBe('보통');
  });

  it('should return "관대" for values >= 30 and < 45', () => {
    expect(getThresholdLabel(30)).toBe('관대');
    expect(getThresholdLabel(44)).toBe('관대');
  });

  it('should return "매우 관대" for values < 30', () => {
    expect(getThresholdLabel(0)).toBe('매우 관대');
    expect(getThresholdLabel(29)).toBe('매우 관대');
  });
});
