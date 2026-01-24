/**
 * Session management service for cross-app authentication.
 *
 * Stores session data in localStorage and passes session ID via URL parameters
 * when navigating between apps.
 */

import type { AuthMethod, AuthSession } from './authService';

const SESSION_STORAGE_KEY = 'trading_wizard_session';
const SESSION_PARAM_NAME = 'session';

export interface StoredSession {
  sessionId: string;
  userIdHash: string;
  method: AuthMethod;
  expiresAt: number;
  /** Encrypted credentials for session restoration */
  encryptedCredentials: string | undefined;
}

/**
 * Generate a random session ID.
 */
function generateSessionId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Save session to localStorage.
 */
export function saveSession(session: AuthSession, encryptedCredentials?: string): string {
  const sessionId = generateSessionId();

  const storedSession: StoredSession = {
    sessionId,
    userIdHash: session.userIdHash,
    method: session.method,
    expiresAt: session.expiresAt,
    encryptedCredentials,
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(storedSession));

  return sessionId;
}

/**
 * Load session from localStorage.
 */
export function loadSession(): StoredSession | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const session: StoredSession = JSON.parse(stored);

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Clear session from localStorage.
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Check if a valid session exists.
 * Also checks URL parameters for cross-origin session transfer.
 */
export function hasValidSession(): boolean {
  // First, try to restore session from URL parameters (cross-origin transfer)
  tryRestoreSessionFromUrl();

  const session = loadSession();
  return session !== null;
}

/**
 * Try to restore session from URL parameters.
 * This is used when navigating between apps on different origins.
 */
function tryRestoreSessionFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  const sessionData = params.get('sessionData');

  if (!sessionData) {
    return;
  }

  try {
    const decoded = decodeURIComponent(sessionData);
    const session: StoredSession = JSON.parse(decoded);

    // Validate session is not expired
    if (session.expiresAt > Date.now()) {
      // Save to localStorage
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }

    // Clean up URL
    const url = new URL(window.location.href);
    url.searchParams.delete('sessionData');
    url.searchParams.delete(SESSION_PARAM_NAME);
    window.history.replaceState({}, '', url.toString());
  } catch {
    // Invalid session data, ignore
  }
}

/**
 * Get session ID from URL parameters.
 */
export function getSessionIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(SESSION_PARAM_NAME);
}

/**
 * Build URL with session parameter for cross-app navigation.
 */
export function buildUrlWithSession(baseUrl: string, sessionId?: string): string {
  const session = sessionId ?? loadSession()?.sessionId;

  if (!session) {
    return baseUrl;
  }

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set(SESSION_PARAM_NAME, session);

  return url.toString();
}

/**
 * Navigate to another app with session.
 * Passes full session data via URL for cross-origin transfer.
 */
export function navigateToApp(appUrl: string): void {
  const session = loadSession();
  const url = new URL(appUrl);

  if (session) {
    // Pass full session data for cross-origin localStorage transfer
    const sessionData = encodeURIComponent(JSON.stringify(session));
    url.searchParams.set('sessionData', sessionData);
  }

  window.location.href = url.toString();
}

/**
 * Get environment variable value.
 * Works in both Node.js and browser (Vite) environments.
 */
function getEnvVar(key: string, defaultValue: string): string {
  // Try Vite-style environment variables
  if (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: Record<string, string> }).env) {
    const env = (import.meta as unknown as { env: Record<string, string> }).env;
    return env[key] || defaultValue;
  }
  // Fallback to default
  return defaultValue;
}

/**
 * Get the portal URL.
 */
export function getPortalUrl(): string {
  return getEnvVar('VITE_PORTAL_URL', 'http://localhost:3000');
}

/**
 * Get the Daily Focus app URL.
 */
export function getDailyFocusUrl(): string {
  return getEnvVar('VITE_DAILY_FOCUS_URL', 'http://localhost:3001');
}

/**
 * Get the My Portfolio app URL.
 */
export function getMyPortfolioUrl(): string {
  return getEnvVar('VITE_PORTFOLIO_URL', 'http://localhost:3002');
}

/**
 * Redirect to login portal if not authenticated.
 */
export function redirectToLogin(): void {
  const portalUrl = getPortalUrl();
  const returnUrl = encodeURIComponent(window.location.href);
  window.location.href = `${portalUrl}/login?returnUrl=${returnUrl}`;
}

/**
 * Get return URL from query parameters.
 */
export function getReturnUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('returnUrl');
}

/**
 * Session service class for managing authentication state.
 */
export class SessionService {
  private session: StoredSession | null = null;

  constructor() {
    this.session = loadSession();
  }

  /**
   * Initialize session (call on app load).
   */
  initialize(): boolean {
    // Try to load from URL parameter first (cross-app navigation)
    const urlSessionId = getSessionIdFromUrl();
    if (urlSessionId) {
      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete(SESSION_PARAM_NAME);
      window.history.replaceState({}, '', url.toString());
    }

    // Load from localStorage
    this.session = loadSession();

    return this.session !== null;
  }

  /**
   * Create a new session.
   */
  createSession(session: AuthSession, encryptedCredentials?: string): string {
    const sessionId = saveSession(session, encryptedCredentials);
    this.session = loadSession();
    return sessionId;
  }

  /**
   * Get current session.
   */
  getSession(): StoredSession | null {
    return this.session;
  }

  /**
   * Check if session is valid.
   */
  isValid(): boolean {
    return this.session !== null && this.session.expiresAt > Date.now();
  }

  /**
   * Get user ID hash.
   */
  getUserIdHash(): string | null {
    return this.session?.userIdHash ?? null;
  }

  /**
   * Get auth method.
   */
  getAuthMethod(): AuthMethod | null {
    return this.session?.method ?? null;
  }

  /**
   * Logout and clear session.
   */
  logout(): void {
    clearSession();
    this.session = null;
  }

  /**
   * Navigate to an app with session.
   */
  navigateTo(appUrl: string): void {
    navigateToApp(appUrl);
  }
}

/**
 * Create a new SessionService instance.
 */
export function createSessionService(): SessionService {
  return new SessionService();
}

export default SessionService;
