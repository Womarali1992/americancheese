import crypto from 'crypto';

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 128 bits
const AUTH_TAG_LENGTH = 16;  // 128 bits
const KEY_LENGTH = 32;  // 256 bits

/**
 * Get the master encryption key from environment variables.
 * In production, this should be a securely managed secret.
 */
function getMasterKey(): Buffer {
  const keyHex = process.env.MASTER_ENCRYPTION_KEY;

  if (!keyHex) {
    // Generate a default key for development (NOT for production!)
    console.warn('WARNING: MASTER_ENCRYPTION_KEY not set. Using a generated key. Set this in production!');
    // Use a deterministic key for development to avoid losing data between restarts
    return crypto.pbkdf2Sync('development-default-key', 'american-cheese-salt', 100000, KEY_LENGTH, 'sha256');
  }

  // Key can be provided as hex string (64 chars for 256 bits) or base64
  if (keyHex.length === 64) {
    return Buffer.from(keyHex, 'hex');
  } else {
    return Buffer.from(keyHex, 'base64').slice(0, KEY_LENGTH);
  }
}

/**
 * Derive a user-specific encryption key from the master key and user ID.
 * This provides additional isolation between users' data.
 */
function deriveUserKey(userId: number): Buffer {
  const masterKey = getMasterKey();
  const salt = `user-${userId}-credentials`;

  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt a credential value using AES-256-GCM.
 * Returns the encrypted value, IV, and authentication tag.
 */
export function encryptCredential(
  plaintext: string,
  userId: number
): { encryptedValue: string; iv: string; authTag: string } {
  const key = deriveUserKey(userId);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  return {
    encryptedValue: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

/**
 * Decrypt a credential value using AES-256-GCM.
 * Returns the plaintext value.
 */
export function decryptCredential(
  encryptedValue: string,
  iv: string,
  authTag: string,
  userId: number
): string {
  const key = deriveUserKey(userId);
  const ivBuffer = Buffer.from(iv, 'base64');
  const authTagBuffer = Buffer.from(authTag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer, {
    authTagLength: AUTH_TAG_LENGTH
  });

  decipher.setAuthTag(authTagBuffer);

  let decrypted = decipher.update(encryptedValue, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a new random encryption key (for initial setup).
 * Returns the key as a hex string.
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
