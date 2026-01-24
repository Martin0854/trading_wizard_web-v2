/**
 * Encryption module exports.
 *
 * Provides unified API for client-side encryption using:
 * - Password-based encryption (PBKDF2 + AES-GCM)
 * - PEM file-based encryption
 */

import {
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  getUserIdHash,
  deriveKey,
  generateSalt,
  generateIV,
  stringToBytes,
  bytesToString,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
} from './encryption';

import {
  parsePemFile,
  isValidPem,
  getUserIdHashFromPem,
  deriveKeyFromPem,
  encryptWithPem,
  decryptWithPem,
} from './pem';

// Re-export encryption functions
export {
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  getUserIdHash,
  deriveKey,
  generateSalt,
  generateIV,
  stringToBytes,
  bytesToString,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
};

// Re-export PEM functions
export {
  parsePemFile,
  isValidPem,
  getUserIdHashFromPem,
  deriveKeyFromPem,
  encryptWithPem,
  decryptWithPem,
};

/**
 * Authentication method type.
 */
export type AuthMethod = 'password' | 'pem';

/**
 * Unified encryption interface.
 */
export interface CryptoService {
  /**
   * Encrypt user data.
   */
  encrypt: (data: unknown) => Promise<string>;

  /**
   * Decrypt user data.
   */
  decrypt: <T>(encryptedData: string) => Promise<T>;

  /**
   * Get user ID hash for server identification.
   */
  getUserIdHash: () => Promise<string>;
}

/**
 * Create a crypto service from password.
 */
export function createPasswordCryptoService(password: string): CryptoService {
  return {
    encrypt: async (data: unknown) => encryptJson(data, password),
    decrypt: async <T>(encryptedData: string) => decryptJson<T>(encryptedData, password),
    getUserIdHash: async () => getUserIdHash(password),
  };
}

/**
 * Create a crypto service from PEM file.
 */
export function createPemCryptoService(pemContent: string): CryptoService {
  return {
    encrypt: async (data: unknown) => encryptWithPem(JSON.stringify(data), pemContent),
    decrypt: async <T>(encryptedData: string) => {
      const plaintext = await decryptWithPem(encryptedData, pemContent);
      return JSON.parse(plaintext) as T;
    },
    getUserIdHash: async () => getUserIdHashFromPem(pemContent),
  };
}
