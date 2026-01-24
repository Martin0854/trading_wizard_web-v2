/**
 * Services module exports.
 */

export { SettingsService, createSettingsService } from './settingsService';
export type { SettingsServiceConfig } from './settingsService';

export { AuthService, createAuthService } from './authService';
export type {
  AuthMethod,
  AuthCredentials,
  AuthSession,
  AuthResult,
} from './authService';

export {
  SessionService,
  createSessionService,
  saveSession,
  loadSession,
  clearSession,
  hasValidSession,
  getSessionIdFromUrl,
  buildUrlWithSession,
  navigateToApp,
  getPortalUrl,
  getDailyFocusUrl,
  getMyPortfolioUrl,
  redirectToLogin,
  getReturnUrl,
} from './sessionService';
export type { StoredSession } from './sessionService';
