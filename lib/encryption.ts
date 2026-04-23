import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const TAG_LENGTH = 16; // 128-bit auth tag
const ENCODING = "base64" as const;

function getEncryptionKey(): Buffer {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) throw new Error("PII_ENCRYPTION_KEY environment variable is not set");
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) throw new Error("PII_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  return buf;
}

function getHmacKey(): Buffer {
  const key = process.env.PII_HMAC_KEY;
  if (!key) throw new Error("PII_HMAC_KEY environment variable is not set");
  const buf = Buffer.from(key, "base64");
  if (buf.length < 32) throw new Error("PII_HMAC_KEY must be at least 32 bytes (base64-encoded)");
  return buf;
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns a base64 string: iv + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: iv (12) + tag (16) + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString(ENCODING);
}

/**
 * Decrypt a value produced by encrypt().
 * Returns the original plaintext.
 */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const packed = Buffer.from(encoded, ENCODING);

  if (packed.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error("Invalid encrypted data: too short");
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const tag = packed.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Create a deterministic HMAC-SHA256 hash for searching encrypted fields.
 * Same input always produces the same hash, enabling lookups without decryption.
 */
export function hmacHash(value: string): string {
  const key = getHmacKey();
  return crypto.createHmac("sha256", key).update(value.toLowerCase().trim()).digest("hex");
}

/**
 * Generate a cryptographically secure random key (for initial setup).
 * Run: node -e "const c=require('crypto');console.log(c.randomBytes(32).toString('base64'))"
 */
export function generateKey(): string {
  return crypto.randomBytes(32).toString("base64");
}
