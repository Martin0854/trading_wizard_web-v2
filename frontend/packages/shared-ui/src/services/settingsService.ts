/**
 * Settings service for encrypted settings management.
 *
 * Handles:
 * - Loading settings from server
 * - Decrypting settings client-side
 * - Encrypting and saving settings
 */

import { encrypt, decrypt, getUserIdHash } from '../crypto/encryption';
import type {
  DailyFocusSettings,
  PortfolioSettings,
  DecryptedUserData,
  UserDataResponse,
} from '../types/models';
import {
  DEFAULT_DAILY_FOCUS_SETTINGS,
  DEFAULT_PORTFOLIO_SETTINGS,
  INITIAL_USER_DATA,
} from '../types/models';

export interface SettingsServiceConfig {
  /** API base URL */
  apiBaseUrl: string;
}

/**
 * Settings service for managing encrypted user data.
 */
export class SettingsService {
  private apiBaseUrl: string;
  private password: string | null = null;
  private userIdHash: string | null = null;
  private cachedData: DecryptedUserData | null = null;

  constructor(config: SettingsServiceConfig) {
    this.apiBaseUrl = config.apiBaseUrl;
  }

  /**
   * Initialize service with user password.
   */
  async initialize(password: string): Promise<void> {
    this.password = password;
    this.userIdHash = await getUserIdHash(password);
  }

  /**
   * Check if service is initialized.
   */
  isInitialized(): boolean {
    return this.password !== null && this.userIdHash !== null;
  }

  /**
   * Get user ID hash for server identification.
   */
  getUserIdHash(): string | null {
    return this.userIdHash;
  }

  /**
   * Load user data from server and decrypt.
   */
  async loadSettings(): Promise<DecryptedUserData> {
    if (!this.isInitialized()) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/api/user-data/${this.userIdHash}`
      );

      if (response.status === 404) {
        // New user - return initial data
        this.cachedData = { ...INITIAL_USER_DATA };
        return this.cachedData;
      }

      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.statusText}`);
      }

      const data: UserDataResponse = await response.json();

      // Decrypt the blob
      const decrypted = await decrypt(data.encryptedBlob, this.password!);
      this.cachedData = JSON.parse(decrypted) as DecryptedUserData;

      return this.cachedData;
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Return initial data on error
      this.cachedData = { ...INITIAL_USER_DATA };
      return this.cachedData;
    }
  }

  /**
   * Save user data to server (encrypted).
   */
  async saveSettings(data: DecryptedUserData): Promise<void> {
    if (!this.isInitialized()) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    // Encrypt the data
    const encrypted = await encrypt(JSON.stringify(data), this.password!);

    const response = await fetch(
      `${this.apiBaseUrl}/api/user-data/${this.userIdHash}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedBlob: encrypted }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to save settings: ${response.statusText}`);
    }

    this.cachedData = data;
  }

  /**
   * Get Daily Focus settings.
   */
  getDailyFocusSettings(): DailyFocusSettings {
    return this.cachedData?.dailyFocusSettings ?? DEFAULT_DAILY_FOCUS_SETTINGS;
  }

  /**
   * Update Daily Focus settings.
   */
  async updateDailyFocusSettings(
    settings: Partial<DailyFocusSettings>
  ): Promise<void> {
    if (!this.cachedData) {
      await this.loadSettings();
    }

    const updatedData: DecryptedUserData = {
      ...this.cachedData!,
      dailyFocusSettings: {
        ...this.cachedData!.dailyFocusSettings,
        ...settings,
      },
    };

    await this.saveSettings(updatedData);
  }

  /**
   * Get Portfolio settings.
   */
  getPortfolioSettings(): PortfolioSettings {
    return this.cachedData?.portfolioSettings ?? DEFAULT_PORTFOLIO_SETTINGS;
  }

  /**
   * Update Portfolio settings.
   */
  async updatePortfolioSettings(
    settings: Partial<PortfolioSettings>
  ): Promise<void> {
    if (!this.cachedData) {
      await this.loadSettings();
    }

    const updatedData: DecryptedUserData = {
      ...this.cachedData!,
      portfolioSettings: {
        ...this.cachedData!.portfolioSettings,
        ...settings,
      },
    };

    await this.saveSettings(updatedData);
  }

  /**
   * Reset Daily Focus settings to defaults.
   */
  async resetDailyFocusSettings(): Promise<void> {
    await this.updateDailyFocusSettings(DEFAULT_DAILY_FOCUS_SETTINGS);
  }

  /**
   * Reset Portfolio settings to defaults.
   */
  async resetPortfolioSettings(): Promise<void> {
    await this.updatePortfolioSettings(DEFAULT_PORTFOLIO_SETTINGS);
  }

  /**
   * Clear cached data and password.
   */
  logout(): void {
    this.password = null;
    this.userIdHash = null;
    this.cachedData = null;
  }
}

/**
 * Create settings service instance.
 */
export function createSettingsService(
  config: SettingsServiceConfig
): SettingsService {
  return new SettingsService(config);
}

export default SettingsService;
