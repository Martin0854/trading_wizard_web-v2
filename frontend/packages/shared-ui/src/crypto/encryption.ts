/**
 * Client-side encryption utilities using Web Crypto API.
 *
 * Implements:
 * - PBKDF2 key derivation (100k iterations)
 * - AES-GCM 256-bit encryption/decryption
 * - SHA-256 user ID hash generation
 */

// Constants
const PBKDF2_ITERATIONS = 100000;
const AES_KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Generate a random salt for PBKDF2.
 */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Generate a random IV for AES-GCM.
 */
export function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

/**
 * Convert string to Uint8Array.
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string.
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert ArrayBuffer to Base64 string.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to hex string.
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Derive an AES key from a password using PBKDF2.
 *
 * @param password - User password
 * @param salt - Salt for key derivation
 * @returns AES-GCM CryptoKey
 */
export async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  // Import password as raw key material
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    stringToBytes(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM.
 *
 * @param plaintext - Data to encrypt
 * @param password - User password
 * @returns Base64 encoded encrypted data (salt + iv + ciphertext)
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = generateSalt();
  const iv = generateIV();
  const key = await deriveKey(password, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    stringToBytes(plaintext)
  );

  // Combine salt + iv + ciphertext
  const combined = new Uint8Array(
    salt.length + iv.length + ciphertext.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt data using AES-GCM.
 *
 * @param encryptedData - Base64 encoded encrypted data
 * @param password - User password
 * @returns Decrypted plaintext
 */
export async function decrypt(encryptedData: string, password: string): Promise<string> {
  const combined = new Uint8Array(base64ToArrayBuffer(encryptedData));

  // Extract salt, iv, and ciphertext
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return bytesToString(new Uint8Array(plaintext));
}

/**
 * Generate user ID hash from password using SHA-256.
 *
 * This hash is used to identify the user on the server without
 * revealing the password.
 *
 * @param password - User password
 * @returns SHA-256 hash as hex string (64 characters)
 */
export async function getUserIdHash(password: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', stringToBytes(password));
  return arrayBufferToHex(hash);
}

/**
 * Encrypt JSON data.
 *
 * @param data - Object to encrypt
 * @param password - User password
 * @returns Base64 encoded encrypted data
 */
export async function encryptJson<T>(data: T, password: string): Promise<string> {
  const plaintext = JSON.stringify(data);
  return encrypt(plaintext, password);
}

/**
 * Decrypt JSON data.
 *
 * @param encryptedData - Base64 encoded encrypted data
 * @param password - User password
 * @returns Decrypted object
 */
export async function decryptJson<T>(
  encryptedData: string,
  password: string
): Promise<T> {
  const plaintext = await decrypt(encryptedData, password);
  return JSON.parse(plaintext) as T;
}
