/**
 * PEM file parsing and key derivation utilities.
 *
 * Supports RSA private key files for authentication.
 */

import { arrayBufferToHex, stringToBytes } from './encryption';

/**
 * Parse PEM file content and extract the key data.
 *
 * @param pemContent - PEM file content as string
 * @returns Base64 decoded key data
 */
export function parsePemFile(pemContent: string): Uint8Array {
  // Remove PEM header/footer and whitespace
  const lines = pemContent
    .split('\n')
    .filter((line) => !line.startsWith('-----') && line.trim() !== '');

  const base64 = lines.join('');

  // Decode base64
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

/**
 * Validate PEM file format.
 *
 * @param pemContent - PEM file content
 * @returns True if valid PEM format
 */
export function isValidPem(pemContent: string): boolean {
  const trimmed = pemContent.trim();

  // Check for common PEM headers
  const validHeaders = [
    '-----BEGIN RSA PRIVATE KEY-----',
    '-----BEGIN PRIVATE KEY-----',
    '-----BEGIN ENCRYPTED PRIVATE KEY-----',
  ];

  const validFooters = [
    '-----END RSA PRIVATE KEY-----',
    '-----END PRIVATE KEY-----',
    '-----END ENCRYPTED PRIVATE KEY-----',
  ];

  const hasValidHeader = validHeaders.some((h) => trimmed.startsWith(h));
  const hasValidFooter = validFooters.some((f) => trimmed.endsWith(f));

  return hasValidHeader && hasValidFooter;
}

/**
 * Generate user ID hash from PEM file content.
 *
 * Uses SHA-256 hash of the raw key data.
 *
 * @param pemContent - PEM file content
 * @returns SHA-256 hash as hex string (64 characters)
 */
export async function getUserIdHashFromPem(pemContent: string): Promise<string> {
  if (!isValidPem(pemContent)) {
    throw new Error('Invalid PEM file format');
  }

  const keyData = parsePemFile(pemContent);
  const hash = await crypto.subtle.digest('SHA-256', keyData.buffer as ArrayBuffer);
  return arrayBufferToHex(hash);
}

/**
 * Derive encryption key from PEM file.
 *
 * Uses the PEM content as key material for PBKDF2.
 *
 * @param pemContent - PEM file content
 * @param salt - Salt for key derivation
 * @returns AES-GCM CryptoKey
 */
export async function deriveKeyFromPem(
  pemContent: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  if (!isValidPem(pemContent)) {
    throw new Error('Invalid PEM file format');
  }

  const keyData = parsePemFile(pemContent);

  // Import key data as raw material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    keyData.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using PEM file as key source.
 *
 * @param plaintext - Data to encrypt
 * @param pemContent - PEM file content
 * @returns Base64 encoded encrypted data
 */
export async function encryptWithPem(
  plaintext: string,
  pemContent: string
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPem(pemContent, salt);

  const plaintextBytes = stringToBytes(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    plaintextBytes.buffer as ArrayBuffer
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  // Convert to base64
  let binary = '';
  for (let i = 0; i < combined.byteLength; i++) {
    binary += String.fromCharCode(combined[i] as number);
  }
  return btoa(binary);
}

/**
 * Decrypt data using PEM file as key source.
 *
 * @param encryptedData - Base64 encoded encrypted data
 * @param pemContent - PEM file content
 * @returns Decrypted plaintext
 */
export async function decryptWithPem(
  encryptedData: string,
  pemContent: string
): Promise<string> {
  const binary = atob(encryptedData);
  const combined = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    combined[i] = binary.charCodeAt(i);
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveKeyFromPem(pemContent, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    ciphertext.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(plaintext);
}
