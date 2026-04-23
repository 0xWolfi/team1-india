import crypto from "crypto";

/**
 * TOTP (Time-based One-Time Password) implementation.
 * Compatible with Google Authenticator, Authy, etc.
 * Uses HMAC-SHA1, 6 digits, 30-second periods (RFC 6238).
 *
 * No external dependencies — pure Node.js crypto.
 */

const DIGITS = 6;
const PERIOD = 30;
const ALGORITHM = "sha1";

/**
 * Generate a random TOTP secret (base32 encoded).
 */
export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate TOTP URI for QR code scanning.
 * Format: otpauth://totp/Team1India:user@email.com?secret=XXX&issuer=Team1India
 */
export function generateTotpUri(email: string, secret: string): string {
  const issuer = "Team1India";
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`;
}

/**
 * Verify a TOTP code against a secret.
 * Allows ±1 period window to account for clock drift.
 */
export function verifyTotp(secret: string, token: string): boolean {
  const now = Math.floor(Date.now() / 1000);

  // Check current period and ±1 window
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor((now + offset * PERIOD) / PERIOD);
    const expected = generateCode(secret, counter);
    if (expected === token) return true;
  }
  return false;
}

/**
 * Generate recovery codes (10 codes, format XXXX-XXXX).
 */
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

// --- Internal helpers ---

function generateCode(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac(ALGORITHM, key);
  hmac.update(buffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (code % Math.pow(10, DIGITS)).toString().padStart(DIGITS, "0");
}

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Buffer): string {
  let result = "";
  let bits = 0;
  let value = 0;
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }
  return result;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;
  for (const char of cleaned) {
    const idx = BASE32_CHARS.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}
