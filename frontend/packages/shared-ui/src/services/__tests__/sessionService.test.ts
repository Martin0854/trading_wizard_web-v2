import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SessionService,
  createSessionService,
  saveSession,
  loadSession,
  clearSession,
  hasValidSession,
  buildUrlWithSession,
  getPortalUrl,
  getDailyFocusUrl,
  getMyPortfolioUrl,
  getReturnUrl,
} from '../sessionService';
import type { AuthSession } from '../authService';

describe('Session Storage Functions', () => {
  const mockSession: AuthSession = {
    userIdHash: 'test-hash-123',
    method: 'password',
    expiresAt: Date.now() + 3600000, // 1 hour from now
  };

  beforeEach(() => {
    localStorage.clear();
    // Reset URL
    window.history.replaceState({}, '', '/');
  });

  describe('saveSession', () => {
    it('should save session to localStorage', () => {
      const sessionId = saveSession(mockSession);

      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBe(32); // 16 bytes = 32 hex chars
      expect(localStorage.getItem('trading_wizard_session')).not.toBeNull();
    });

    it('should save session with encrypted credentials', () => {
      saveSession(mockSession, 'encrypted-creds');

      const stored = JSON.parse(localStorage.getItem('trading_wizard_session') || '{}');
      expect(stored.encryptedCredentials).toBe('encrypted-creds');
    });
  });

  describe('loadSession', () => {
    it('should return null when no session exists', () => {
      const session = loadSession();
      expect(session).toBeNull();
    });

    it('should load valid session from localStorage', () => {
      saveSession(mockSession);
      const session = loadSession();

      expect(session).not.toBeNull();
      expect(session?.userIdHash).toBe('test-hash-123');
      expect(session?.method).toBe('password');
    });

    it('should return null for expired session', () => {
      const expiredSession: AuthSession = {
        ...mockSession,
        expiresAt: Date.now() - 1000, // expired 1 second ago
      };

      saveSession(expiredSession);
      const session = loadSession();

      expect(session).toBeNull();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('trading_wizard_session', 'invalid-json');
      const session = loadSession();
      expect(session).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('should remove session from localStorage', () => {
      saveSession(mockSession);
      expect(localStorage.getItem('trading_wizard_session')).not.toBeNull();

      clearSession();

      expect(localStorage.getItem('trading_wizard_session')).toBeNull();
    });
  });

  describe('hasValidSession', () => {
    it('should return false when no session exists', () => {
      expect(hasValidSession()).toBe(false);
    });

    it('should return true when valid session exists', () => {
      saveSession(mockSession);
      expect(hasValidSession()).toBe(true);
    });
  });
});

describe('URL Functions', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  describe('buildUrlWithSession', () => {
    it('should return base URL when no session exists', () => {
      const url = buildUrlWithSession('http://localhost:3001');
      // URL constructor normalizes the path
      expect(url).toBe('http://localhost:3001');
    });

    it('should append session parameter when session exists', () => {
      const session: AuthSession = {
        userIdHash: 'test-hash',
        method: 'password',
        expiresAt: Date.now() + 3600000,
      };
      saveSession(session);

      const url = buildUrlWithSession('http://localhost:3001/daily-focus');
      expect(url).toContain('session=');
    });

    it('should use provided session ID', () => {
      const url = buildUrlWithSession('http://localhost:3001', 'custom-session-id');
      expect(url).toBe('http://localhost:3001/?session=custom-session-id');
    });
  });

  describe('getReturnUrl', () => {
    it('should return null when no returnUrl in query', () => {
      window.history.replaceState({}, '', '/');
      expect(getReturnUrl()).toBeNull();
    });

    it('should return returnUrl from query parameters', () => {
      window.history.replaceState({}, '', '/?returnUrl=http%3A%2F%2Flocalhost%3A3001%2Fdaily-focus');
      expect(getReturnUrl()).toBe('http://localhost:3001/daily-focus');
    });
  });

  describe('URL getters', () => {
    it('should return default portal URL', () => {
      expect(getPortalUrl()).toBe('http://localhost:3000');
    });

    it('should return default daily focus URL', () => {
      expect(getDailyFocusUrl()).toBe('http://localhost:3001');
    });

    it('should return default portfolio URL', () => {
      expect(getMyPortfolioUrl()).toBe('http://localhost:3002');
    });
  });
});

describe('SessionService', () => {
  let sessionService: SessionService;

  const mockSession: AuthSession = {
    userIdHash: 'test-hash',
    method: 'password',
    expiresAt: Date.now() + 3600000,
  };

  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    sessionService = createSessionService();
  });

  describe('initialize', () => {
    it('should return false when no session exists', () => {
      expect(sessionService.initialize()).toBe(false);
    });

    it('should return true when session exists', () => {
      saveSession(mockSession);
      sessionService = createSessionService();
      expect(sessionService.initialize()).toBe(true);
    });
  });

  describe('createSession', () => {
    it('should create and store session', () => {
      const sessionId = sessionService.createSession(mockSession);

      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBe(32);
      expect(sessionService.isValid()).toBe(true);
    });

    it('should store encrypted credentials', () => {
      sessionService.createSession(mockSession, 'encrypted-data');

      const stored = sessionService.getSession();
      expect(stored?.encryptedCredentials).toBe('encrypted-data');
    });
  });

  describe('getSession', () => {
    it('should return null when no session exists', () => {
      expect(sessionService.getSession()).toBeNull();
    });

    it('should return session after creation', () => {
      sessionService.createSession(mockSession);

      const session = sessionService.getSession();
      expect(session).not.toBeNull();
      expect(session?.userIdHash).toBe('test-hash');
    });
  });

  describe('isValid', () => {
    it('should return false when no session', () => {
      expect(sessionService.isValid()).toBe(false);
    });

    it('should return true for valid session', () => {
      sessionService.createSession(mockSession);
      expect(sessionService.isValid()).toBe(true);
    });

    it('should return false for expired session', () => {
      const expiredSession: AuthSession = {
        ...mockSession,
        expiresAt: Date.now() - 1000,
      };
      sessionService.createSession(expiredSession);
      expect(sessionService.isValid()).toBe(false);
    });
  });

  describe('getUserIdHash', () => {
    it('should return null when no session', () => {
      expect(sessionService.getUserIdHash()).toBeNull();
    });

    it('should return hash from session', () => {
      sessionService.createSession(mockSession);
      expect(sessionService.getUserIdHash()).toBe('test-hash');
    });
  });

  describe('getAuthMethod', () => {
    it('should return null when no session', () => {
      expect(sessionService.getAuthMethod()).toBeNull();
    });

    it('should return method from session', () => {
      sessionService.createSession(mockSession);
      expect(sessionService.getAuthMethod()).toBe('password');
    });
  });

  describe('logout', () => {
    it('should clear session', () => {
      sessionService.createSession(mockSession);
      expect(sessionService.isValid()).toBe(true);

      sessionService.logout();

      expect(sessionService.isValid()).toBe(false);
      expect(sessionService.getSession()).toBeNull();
    });
  });
});

describe('createSessionService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create a new SessionService instance', () => {
    const service = createSessionService();
    expect(service).toBeInstanceOf(SessionService);
  });

  it('should create independent instances', () => {
    const service1 = createSessionService();
    const service2 = createSessionService();
    expect(service1).not.toBe(service2);
  });
});
