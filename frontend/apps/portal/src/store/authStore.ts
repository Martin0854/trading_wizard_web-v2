import { create } from 'zustand';
import {
  createAuthService,
  createSessionService,
  type AuthMethod,
  type AuthCredentials,
  type AuthService,
  type SessionService,
} from '@trading-wizard/shared-ui/services';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  userIdHash: string | null;
  authMethod: AuthMethod | null;

  // Actions
  login: (credentials: AuthCredentials) => Promise<boolean>;
  logout: () => void;
  checkSession: () => boolean;
  clearError: () => void;
}

// Services (singleton instances)
let authService: AuthService | null = null;
let sessionService: SessionService | null = null;

function getAuthService(): AuthService {
  if (!authService) {
    authService = createAuthService();
  }
  return authService;
}

function getSessionService(): SessionService {
  if (!sessionService) {
    sessionService = createSessionService();
  }
  return sessionService;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  userIdHash: null,
  authMethod: null,

  login: async (credentials: AuthCredentials) => {
    set({ isLoading: true, error: null });

    try {
      const auth = getAuthService();
      const result = await auth.authenticate(credentials);

      if (!result.success || !result.session) {
        set({
          isLoading: false,
          error: result.error || '인증에 실패했습니다.',
        });
        return false;
      }

      // Create session with credentials for client-side encryption
      // For password auth, store the password directly for encryption
      // For PEM auth, store the PEM content
      const encryptedCredentials = credentials.method === 'password'
        ? credentials.password
        : credentials.pemContent;

      const session = getSessionService();
      session.createSession(result.session, encryptedCredentials);

      set({
        isAuthenticated: true,
        isLoading: false,
        userIdHash: result.session.userIdHash,
        authMethod: result.session.method,
        error: null,
      });

      return true;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '인증에 실패했습니다.',
      });
      return false;
    }
  },

  logout: () => {
    const auth = getAuthService();
    const session = getSessionService();

    auth.logout();
    session.logout();

    set({
      isAuthenticated: false,
      userIdHash: null,
      authMethod: null,
      error: null,
    });
  },

  checkSession: () => {
    const session = getSessionService();
    session.initialize();

    if (session.isValid()) {
      set({
        isAuthenticated: true,
        userIdHash: session.getUserIdHash(),
        authMethod: session.getAuthMethod(),
      });
      return true;
    }

    return false;
  },

  clearError: () => {
    set({ error: null });
  },
}));
