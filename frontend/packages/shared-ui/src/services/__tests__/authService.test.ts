import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, createAuthService, type AuthCredentials } from '../authService';

// Mock crypto functions
vi.mock('../../crypto/encryption', () => ({
  getUserIdHash: vi.fn().mockResolvedValue('mock-password-hash'),
  encrypt: vi.fn().mockResolvedValue('encrypted-data'),
  decrypt: vi.fn().mockResolvedValue('decrypted-data'),
}));

vi.mock('../../crypto/pem', () => ({
  isValidPem: vi.fn((pem: string) => pem.includes('BEGIN')),
  getUserIdHashFromPem: vi.fn().mockResolvedValue('mock-pem-hash'),
  encryptWithPem: vi.fn().mockResolvedValue('pem-encrypted-data'),
  decryptWithPem: vi.fn().mockResolvedValue('pem-decrypted-data'),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = createAuthService();
  });

  describe('authenticate', () => {
    describe('password authentication', () => {
      it('should authenticate with valid password', async () => {
        const credentials: AuthCredentials = {
          method: 'password',
          password: 'testpassword123',
        };

        const result = await authService.authenticate(credentials);

        expect(result.success).toBe(true);
        expect(result.session).toBeDefined();
        expect(result.session?.userIdHash).toBe('mock-password-hash');
        expect(result.session?.method).toBe('password');
        expect(result.session?.expiresAt).toBeGreaterThan(Date.now());
      });

      it('should fail if password is missing', async () => {
        const credentials: AuthCredentials = {
          method: 'password',
        };

        const result = await authService.authenticate(credentials);

        expect(result.success).toBe(false);
        expect(result.error).toBe('비밀번호를 입력해주세요.');
      });

      it('should fail if password is empty', async () => {
        const credentials: AuthCredentials = {
          method: 'password',
          password: '',
        };

        const result = await authService.authenticate(credentials);

        expect(result.success).toBe(false);
        expect(result.error).toBe('비밀번호를 입력해주세요.');
      });
    });

    describe('PEM authentication', () => {
      const validPem = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----';

      it('should authenticate with valid PEM file', async () => {
        const credentials: AuthCredentials = {
          method: 'pem',
          pemContent: validPem,
        };

        const result = await authService.authenticate(credentials);

        expect(result.success).toBe(true);
        expect(result.session).toBeDefined();
        expect(result.session?.userIdHash).toBe('mock-pem-hash');
        expect(result.session?.method).toBe('pem');
      });

      it('should fail if PEM content is missing', async () => {
        const credentials: AuthCredentials = {
          method: 'pem',
        };

        const result = await authService.authenticate(credentials);

        expect(result.success).toBe(false);
        expect(result.error).toBe('PEM 파일을 선택해주세요.');
      });

      it('should fail if PEM is invalid', async () => {
        const credentials: AuthCredentials = {
          method: 'pem',
          pemContent: 'invalid-pem-content',
        };

        const result = await authService.authenticate(credentials);

        expect(result.success).toBe(false);
        expect(result.error).toBe('유효하지 않은 PEM 파일입니다.');
      });
    });

    it('should fail for unsupported auth method', async () => {
      const credentials = {
        method: 'unknown' as const,
      } as AuthCredentials;

      const result = await authService.authenticate(credentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('지원하지 않는 인증 방식입니다.');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false before authentication', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true after successful authentication', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('getUserIdHash', () => {
    it('should return null before authentication', () => {
      expect(authService.getUserIdHash()).toBeNull();
    });

    it('should return hash after authentication', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      expect(authService.getUserIdHash()).toBe('mock-password-hash');
    });
  });

  describe('getAuthMethod', () => {
    it('should return null before authentication', () => {
      expect(authService.getAuthMethod()).toBeNull();
    });

    it('should return method after authentication', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      expect(authService.getAuthMethod()).toBe('password');
    });
  });

  describe('encryptData', () => {
    it('should throw if not authenticated', async () => {
      await expect(authService.encryptData('test')).rejects.toThrow('인증이 필요합니다.');
    });

    it('should encrypt data with password', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      const result = await authService.encryptData('test data');
      expect(result).toBe('encrypted-data');
    });

    it('should encrypt data with PEM', async () => {
      await authService.authenticate({
        method: 'pem',
        pemContent: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      });

      const result = await authService.encryptData('test data');
      expect(result).toBe('pem-encrypted-data');
    });
  });

  describe('decryptData', () => {
    it('should throw if not authenticated', async () => {
      await expect(authService.decryptData('encrypted')).rejects.toThrow('인증이 필요합니다.');
    });

    it('should decrypt data with password', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      const result = await authService.decryptData('encrypted');
      expect(result).toBe('decrypted-data');
    });

    it('should decrypt data with PEM', async () => {
      await authService.authenticate({
        method: 'pem',
        pemContent: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----',
      });

      const result = await authService.decryptData('encrypted');
      expect(result).toBe('pem-decrypted-data');
    });
  });

  describe('encryptJson / decryptJson', () => {
    it('should encrypt and decrypt JSON data', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      const data = { foo: 'bar', num: 123 };
      const encrypted = await authService.encryptJson(data);
      expect(encrypted).toBe('encrypted-data');
    });
  });

  describe('logout', () => {
    it('should clear authentication state', async () => {
      await authService.authenticate({
        method: 'password',
        password: 'testpassword',
      });

      expect(authService.isAuthenticated()).toBe(true);

      authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getUserIdHash()).toBeNull();
      expect(authService.getAuthMethod()).toBeNull();
    });
  });
});

describe('createAuthService', () => {
  it('should create a new AuthService instance', () => {
    const service = createAuthService();
    expect(service).toBeInstanceOf(AuthService);
  });

  it('should create independent instances', () => {
    const service1 = createAuthService();
    const service2 = createAuthService();
    expect(service1).not.toBe(service2);
  });
});
