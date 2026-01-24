/**
 * Unit tests for encryption utilities.
 *
 * Note: These tests require a browser environment with Web Crypto API.
 * Run with vitest in jsdom environment.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateSalt,
  generateIV,
  stringToBytes,
  bytesToString,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  arrayBufferToHex,
  deriveKey,
  encrypt,
  decrypt,
  encryptJson,
  decryptJson,
  getUserIdHash,
} from '../encryption';

// Mock Web Crypto API for Node.js environment
beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webcrypto } = require('crypto');
    globalThis.crypto = webcrypto;
  }
});

describe('Utility Functions', () => {
  describe('generateSalt', () => {
    it('should generate 16-byte salt', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(arrayBufferToHex(salt1)).not.toBe(arrayBufferToHex(salt2));
    });
  });

  describe('generateIV', () => {
    it('should generate 12-byte IV', () => {
      const iv = generateIV();
      expect(iv).toBeInstanceOf(Uint8Array);
      expect(iv.length).toBe(12);
    });
  });

  describe('stringToBytes / bytesToString', () => {
    it('should convert string to bytes and back', () => {
      const original = '안녕하세요 Hello 123!';
      const bytes = stringToBytes(original);
      const result = bytesToString(bytes);
      expect(result).toBe(original);
    });

    it('should handle empty string', () => {
      const bytes = stringToBytes('');
      expect(bytes.length).toBe(0);
      expect(bytesToString(bytes)).toBe('');
    });
  });

  describe('arrayBufferToBase64 / base64ToArrayBuffer', () => {
    it('should convert ArrayBuffer to Base64 and back', () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 100, 200, 255]);
      const base64 = arrayBufferToBase64(original.buffer);
      const result = base64ToArrayBuffer(base64);
      expect(new Uint8Array(result)).toEqual(original);
    });
  });

  describe('arrayBufferToHex', () => {
    it('should convert ArrayBuffer to hex string', () => {
      const bytes = new Uint8Array([0, 15, 16, 255]);
      const hex = arrayBufferToHex(bytes.buffer);
      expect(hex).toBe('000f10ff');
    });
  });
});

describe('Key Derivation', () => {
  describe('deriveKey', () => {
    it('should derive consistent key from same password and salt', async () => {
      const password = 'testPassword123!';
      const salt = generateSalt();

      const key1 = await deriveKey(password, salt);
      const key2 = await deriveKey(password, salt);

      // Keys should be equivalent (though not same object)
      expect(key1.algorithm.name).toBe('AES-GCM');
      expect(key2.algorithm.name).toBe('AES-GCM');
    });

    it('should derive different keys for different passwords', async () => {
      const salt = generateSalt();

      const key1 = await deriveKey('password1', salt);
      const key2 = await deriveKey('password2', salt);

      // Export keys to compare
      const raw1 = await crypto.subtle.exportKey('raw', key1);
      const raw2 = await crypto.subtle.exportKey('raw', key2);

      expect(arrayBufferToHex(raw1)).not.toBe(arrayBufferToHex(raw2));
    });

    it('should derive different keys for different salts', async () => {
      const password = 'samePassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const key1 = await deriveKey(password, salt1);
      const key2 = await deriveKey(password, salt2);

      const raw1 = await crypto.subtle.exportKey('raw', key1);
      const raw2 = await crypto.subtle.exportKey('raw', key2);

      expect(arrayBufferToHex(raw1)).not.toBe(arrayBufferToHex(raw2));
    });
  });
});

describe('Encryption / Decryption', () => {
  describe('encrypt / decrypt', () => {
    it('should encrypt and decrypt string data', async () => {
      const password = 'mySecretPassword!@#';
      const plaintext = 'Hello, World! 안녕하세요!';

      const encrypted = await encrypt(plaintext, password);
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);

      const decrypted = await decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const password = 'testPassword';
      const plaintext = 'Same message';

      const encrypted1 = await encrypt(plaintext, password);
      const encrypted2 = await encrypt(plaintext, password);

      // Due to random IV and salt, ciphertexts should differ
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail decryption with wrong password', async () => {
      const plaintext = 'Secret data';
      const encrypted = await encrypt(plaintext, 'correctPassword');

      await expect(decrypt(encrypted, 'wrongPassword')).rejects.toThrow();
    });

    it('should handle empty string', async () => {
      const password = 'password';
      const encrypted = await encrypt('', password);
      const decrypted = await decrypt(encrypted, password);
      expect(decrypted).toBe('');
    });

    it('should handle long strings', async () => {
      const password = 'password';
      const plaintext = 'x'.repeat(10000);
      const encrypted = await encrypt(plaintext, password);
      const decrypted = await decrypt(encrypted, password);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptJson / decryptJson', () => {
    it('should encrypt and decrypt JSON objects', async () => {
      const password = 'jsonPassword';
      const data = {
        name: '테스트',
        value: 123,
        nested: { a: 1, b: [1, 2, 3] },
      };

      const encrypted = await encryptJson(data, password);
      const decrypted = await decryptJson<typeof data>(encrypted, password);

      expect(decrypted).toEqual(data);
    });

    it('should handle arrays', async () => {
      const password = 'arrayPassword';
      const data = [1, 2, 3, 'four', { five: 5 }];

      const encrypted = await encryptJson(data, password);
      const decrypted = await decryptJson<typeof data>(encrypted, password);

      expect(decrypted).toEqual(data);
    });
  });
});

describe('User ID Hash', () => {
  describe('getUserIdHash', () => {
    it('should generate 64-character hex hash', async () => {
      const hash = await getUserIdHash('myPassword');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate same hash for same password', async () => {
      const password = 'consistentPassword';
      const hash1 = await getUserIdHash(password);
      const hash2 = await getUserIdHash(password);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different passwords', async () => {
      const hash1 = await getUserIdHash('password1');
      const hash2 = await getUserIdHash('password2');
      expect(hash1).not.toBe(hash2);
    });
  });
});
