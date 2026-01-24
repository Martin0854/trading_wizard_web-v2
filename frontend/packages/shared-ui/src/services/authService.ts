/**
 * Authentication service for Trading Wizard.
 *
 * Supports two authentication methods:
 * - Password-based authentication
 * - PEM file-based authentication (RSA private key)
 *
 * Both methods derive a userIdHash for server identification
 * and an encryption key for client-side data encryption.
 */

import {
  getUserIdHash,
  encrypt,
  decrypt,
} from '../crypto/encryption';
import {
  isValidPem,
  getUserIdHashFromPem,
  encryptWithPem,
  decryptWithPem,
} from '../crypto/pem';

export type AuthMethod = 'password' | 'pem';

export interface AuthCredentials {
  method: AuthMethod;
  password?: string;
  pemContent?: string;
}

export interface AuthSession {
  userIdHash: string;
  method: AuthMethod;
  expiresAt: number;
}

export interface AuthResult {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

/**
 * Authentication service class.
 */
export class AuthService {
  private credentials: AuthCredentials | null = null;
  private userIdHash: string | null = null;

  /**
   * Authenticate with password or PEM file.
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      if (credentials.method === 'password') {
        if (!credentials.password) {
          return { success: false, error: '비밀번호를 입력해주세요.' };
        }
        this.userIdHash = await getUserIdHash(credentials.password);
      } else if (credentials.method === 'pem') {
        if (!credentials.pemContent) {
          return { success: false, error: 'PEM 파일을 선택해주세요.' };
        }
        if (!isValidPem(credentials.pemContent)) {
          return { success: false, error: '유효하지 않은 PEM 파일입니다.' };
        }
        this.userIdHash = await getUserIdHashFromPem(credentials.pemContent);
      } else {
        return { success: false, error: '지원하지 않는 인증 방식입니다.' };
      }

      this.credentials = credentials;

      const session: AuthSession = {
        userIdHash: this.userIdHash,
        method: credentials.method,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      return { success: true, session };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '인증에 실패했습니다.',
      };
    }
  }

  /**
   * Check if authenticated.
   */
  isAuthenticated(): boolean {
    return this.credentials !== null && this.userIdHash !== null;
  }

  /**
   * Get current user ID hash.
   */
  getUserIdHash(): string | null {
    return this.userIdHash;
  }

  /**
   * Get authentication method.
   */
  getAuthMethod(): AuthMethod | null {
    return this.credentials?.method ?? null;
  }

  /**
   * Encrypt data using current credentials.
   */
  async encryptData(data: string): Promise<string> {
    if (!this.credentials) {
      throw new Error('인증이 필요합니다.');
    }

    if (this.credentials.method === 'password' && this.credentials.password) {
      return encrypt(data, this.credentials.password);
    } else if (this.credentials.method === 'pem' && this.credentials.pemContent) {
      return encryptWithPem(data, this.credentials.pemContent);
    }

    throw new Error('유효하지 않은 인증 정보입니다.');
  }

  /**
   * Decrypt data using current credentials.
   */
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.credentials) {
      throw new Error('인증이 필요합니다.');
    }

    if (this.credentials.method === 'password' && this.credentials.password) {
      return decrypt(encryptedData, this.credentials.password);
    } else if (this.credentials.method === 'pem' && this.credentials.pemContent) {
      return decryptWithPem(encryptedData, this.credentials.pemContent);
    }

    throw new Error('유효하지 않은 인증 정보입니다.');
  }

  /**
   * Encrypt JSON data.
   */
  async encryptJson<T>(data: T): Promise<string> {
    return this.encryptData(JSON.stringify(data));
  }

  /**
   * Decrypt JSON data.
   */
  async decryptJson<T>(encryptedData: string): Promise<T> {
    const decrypted = await this.decryptData(encryptedData);
    return JSON.parse(decrypted) as T;
  }

  /**
   * Logout and clear credentials.
   */
  logout(): void {
    this.credentials = null;
    this.userIdHash = null;
  }
}

/**
 * Create a new AuthService instance.
 */
export function createAuthService(): AuthService {
  return new AuthService();
}

export default AuthService;
