import { create } from 'zustand';
import type { DailyFocusSettings, DecryptedUserData } from '@trading-wizard/shared-ui/types';
import { createSettingsService, loadSession, type SettingsService } from '@trading-wizard/shared-ui/services';

const DEFAULT_SETTINGS: DailyFocusSettings = {
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create a singleton settings service
let settingsServiceInstance: SettingsService | null = null;

function getSettingsService(): SettingsService {
  if (!settingsServiceInstance) {
    settingsServiceInstance = createSettingsService({ apiBaseUrl: API_URL });
  }
  return settingsServiceInstance;
}

/**
 * Get password/credentials from session's encryptedCredentials field
 */
function getSessionCredentials(): string | null {
  const session = loadSession();
  return session?.encryptedCredentials ?? null;
}

interface SettingsState {
  settings: DailyFocusSettings;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  setSettings: (settings: Partial<DailyFocusSettings>) => void;
  resetToDefaults: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initializeFromSession: () => Promise<void>;
  authenticate: (password: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  isAuthenticated: false,
  isInitialized: false,

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  initializeFromSession: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    const credentials = getSessionCredentials();
    if (!credentials) {
      set({ isInitialized: true });
      return;
    }

    set({ loading: true, error: null });
    try {
      const service = getSettingsService();
      await service.initialize(credentials);
      set({ isAuthenticated: true, loading: false, isInitialized: true });
      // Auto-load settings after authentication
      await get().loadSettings();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '자동 인증 실패',
        loading: false,
        isInitialized: true,
      });
    }
  },

  authenticate: async (password: string) => {
    set({ loading: true, error: null });
    try {
      const service = getSettingsService();
      await service.initialize(password);
      set({ isAuthenticated: true, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '인증 실패',
        loading: false,
      });
      throw error;
    }
  },

  loadSettings: async () => {
    const { isAuthenticated } = get();
    if (!isAuthenticated) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const service = getSettingsService();
      const data: DecryptedUserData = await service.loadSettings();
      if (data?.dailyFocusSettings) {
        set({ settings: { ...DEFAULT_SETTINGS, ...data.dailyFocusSettings } });
      }
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '설정 로드 실패',
        loading: false,
      });
    }
  },

  saveSettings: async () => {
    const { isAuthenticated, settings } = get();
    if (!isAuthenticated) {
      set({ error: '먼저 비밀번호를 입력해주세요.' });
      return;
    }

    set({ loading: true, error: null });
    try {
      const service = getSettingsService();
      await service.updateDailyFocusSettings(settings);
      set({ loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '설정 저장 실패',
        loading: false,
      });
      throw error;
    }
  },
}));
