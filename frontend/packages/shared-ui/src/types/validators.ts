/**
 * Validation helpers for Trading Wizard.
 *
 * These validators ensure data integrity for symbols and settings.
 */

import type { DailyFocusSettings, PortfolioSettings } from './models';

// Symbol pattern: 6 digits followed by .KS (KOSPI) or .KQ (KOSDAQ)
const SYMBOL_PATTERN = /^[0-9]{6}\.(KS|KQ)$/;

// User ID hash pattern: 64 hex characters (SHA-256)
const USER_ID_HASH_PATTERN = /^[a-f0-9]{64}$/;

/**
 * Validate stock symbol format.
 */
export function isValidSymbol(symbol: string): boolean {
  return SYMBOL_PATTERN.test(symbol);
}

/**
 * Validate user ID hash format.
 */
export function isValidUserIdHash(hash: string): boolean {
  return USER_ID_HASH_PATTERN.test(hash);
}

/**
 * Validate Daily Focus settings.
 * Returns list of error messages (empty if valid).
 */
export function validateDailyFocusSettings(
  settings: Partial<DailyFocusSettings>
): string[] {
  const errors: string[] = [];

  if (settings.bollingerPeriod !== undefined) {
    if (settings.bollingerPeriod < 5 || settings.bollingerPeriod > 50) {
      errors.push('볼린저 기간은 5-50 범위여야 합니다.');
    }
  }

  if (settings.bollingerStdDev !== undefined) {
    if (settings.bollingerStdDev < 0.5 || settings.bollingerStdDev > 3.0) {
      errors.push('표준편차 배수는 0.5-3.0 범위여야 합니다.');
    }
  }

  if (settings.confidenceThreshold !== undefined) {
    if (settings.confidenceThreshold < 0 || settings.confidenceThreshold > 100) {
      errors.push('신뢰도 임계값은 0-100 범위여야 합니다.');
    }
  }

  if (settings.squeezeThresholdPct !== undefined) {
    if (settings.squeezeThresholdPct < 30 || settings.squeezeThresholdPct > 80) {
      errors.push('스퀴즈 임계값은 30-80 범위여야 합니다.');
    }
  }

  if (settings.rsiPeriod !== undefined) {
    if (settings.rsiPeriod < 7 || settings.rsiPeriod > 28) {
      errors.push('RSI 기간은 7-28 범위여야 합니다.');
    }
  }

  return errors;
}

/**
 * Validate Portfolio settings.
 * Returns list of error messages (empty if valid).
 */
export function validatePortfolioSettings(
  settings: Partial<PortfolioSettings>
): string[] {
  const errors: string[] = [];

  if (settings.stopLossPct !== undefined) {
    if (settings.stopLossPct < -20 || settings.stopLossPct > 0) {
      errors.push('손절매 기준은 -20% ~ 0% 범위여야 합니다.');
    }
  }

  if (settings.takeProfitPct !== undefined) {
    if (settings.takeProfitPct < 0 || settings.takeProfitPct > 100) {
      errors.push('익절매 기준은 0% ~ 100% 범위여야 합니다.');
    }
  }

  if (settings.bollingerPeriod !== undefined) {
    if (settings.bollingerPeriod < 5 || settings.bollingerPeriod > 50) {
      errors.push('볼린저 기간은 5-50 범위여야 합니다.');
    }
  }

  if (settings.bollingerStdDev !== undefined) {
    if (settings.bollingerStdDev < 0.5 || settings.bollingerStdDev > 3.0) {
      errors.push('표준편차 배수는 0.5-3.0 범위여야 합니다.');
    }
  }

  return errors;
}
