# Category 20: Cryptography & Secrets – Deep Audit

**Audit Date:** 2026-05-03  
**Scope:** team1-india repository  
**Files Analyzed:** lib/encryption.ts, lib/encryptedSession.ts, lib/pii.ts, scripts/migrate-pii.ts, lib/auth-options.ts, lib/2fa/totp.ts, app/api/cron/*/route.ts, app/api/auth/2fa/*/route.ts

---

## Findings Summary

| Finding | Severity | Category | Status |
|---------|----------|----------|--------|
| **F-20.1** | Critical | PBKDF2 Static Salt in encryptedSession | Confirmed |
| **F-20.2** | High | AES-GCM IV Storage & Authentication Tag | Confirmed (Good) |
| **F-20.3** | Medium | HMAC Search Index — Same Key as Encryption | Confirmed |
| **F-20.4** | High | TOTP Secret & Recovery Codes — Encrypted at Rest | Confirmed (Good) |
| **F-20.5** | Low | Recovery Code Entropy — Adequate | Confirmed |
| **F-20.6** | Low | Cron Webhook Signature — Timing-Safe Comparison | Confirmed (Good) |
| **F-20.7** | Medium | Referral Code Entropy — Weak (Math.random) | Confirmed |
| **F-20.8** | Open Assumption | JWT Secret Rotation Absent | Assumed |
| **F-20.9** | Open Assumption | Vercel Env Secrets Not KMS-Backed | Assumed |
| **F-20.10** | Info | NEXTAUTH_SECRET Shared Across Envs | Assumed (Preview/Prod) |

---

## F-20.1: PBKDF2 Static Salt in encryptedSession (CRITICAL)

**File:** lib/encryptedSession.ts:33  
**Lines:** 33 (salt derivation)

**Vulnerability:**

The encrypted session manager uses a hardcoded, static salt for PBKDF2 key derivation:

```typescript
// lib/encryptedSession.ts:30-36
this.cryptoKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: new TextEncoder().encode('team1-pwa-salt'),  // ← STATIC SALT
    iterations: 100000,
    hash: 'SHA-256',
  },
  keyMaterial,
  { name: ENCRYPTION_ALGORITHM, length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

**Risk Analysis:**

1. **Same key derived for all devices:** The salt `'team1-pwa-salt'` is identical across all browsers, all devices, all users. Combined with the device ID (which is client-stored in localStorage, see line 154), two users with the same device-ID pattern will derive the **same encryption key**.

2. **Device ID is weak entropy:** The device ID is generated as:
   ```typescript
   // lib/encryptedSession.ts:153-155
   deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
   ```
   - **Collision risk:** `Date.now()` has millisecond resolution (~1000 values per second). The `Math.random()` portion is 16 base-36 characters ≈ 84 bits. Two devices created within the same millisecond could collide.
   - **Predictability:** If an attacker knows the timestamp (e.g., from network logs), the entropy shrinks to ~84 bits + millisecond jitter.

3. **Salt should be unique per key:** PBKDF2 is designed such that a unique salt prevents rainbow-table attacks. A static salt means all derived keys are pre-computable once the device ID is known.

4. **SessionStorage encryption weak link:** The session blob is stored in `sessionStorage` (plaintext container), encrypted with a weak key. If the device ID is stolen or guessed, the session is compromised.

**Impact:**

- **High:** An attacker who learns or guesses a device ID can derive the encryption key and decrypt any encrypted session blob stored in `sessionStorage`.
- **Cross-device attack:** If two users somehow share a device ID (e.g., same timestamp + short random suffix), they could decrypt each other's sessions.

**Recommendation:**

1. Generate a cryptographically random salt per device and store it securely (not in localStorage; consider IndexedDB with a longer-term TTL).
2. Or, avoid client-side PBKDF2 derivation altogether and use the server's `NEXTAUTH_SECRET` to wrap session blobs server-side (more common pattern).

---

## F-20.2: AES-GCM IV Storage & Authentication Tag (GOOD)

**File:** lib/encryption.ts:28–68

**Assessment:**

The server-side encryption implementation is robust:

```typescript
// lib/encryption.ts:28-42 (encrypt)
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);  // 12 bytes, unique per encryption ✅
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();  // 16-byte authentication tag ✅

  // Pack: iv (12) + tag (16) + ciphertext
  const packed = Buffer.concat([iv, tag, encrypted]);
  return packed.toString(ENCODING);
}
```

**Strengths:**

1. ✅ **AES-256-GCM:** Strong AEAD cipher, authenticated encryption.
2. ✅ **IV Length:** 12 bytes (96 bits), recommended for GCM.
3. ✅ **IV Uniqueness:** Generated with `crypto.randomBytes(12)` for each encryption — no reuse.
4. ✅ **Auth Tag:** Retrieved via `cipher.getAuthTag()` and stored in the ciphertext.
5. ✅ **IV/Tag Included:** Packed in the output (IV + Tag + Ciphertext), so decryption can verify integrity.
6. ✅ **Decryption Verification:** Lines 60–61 set the auth tag before decryption, ensuring tampering detection.

**Verification Logic:**

```typescript
// lib/encryption.ts:60-61 (decrypt)
decipher.setAuthTag(tag);
const decrypted = Buffer.concat([
  decipher.update(ciphertext),
  decipher.final(),  // ← Throws if auth tag doesn't match
]);
```

If the ciphertext or IV is modified, `decipher.final()` will throw an error.

**Key Size:** 32 bytes (256 bits) enforced:
```typescript
// lib/encryption.ts:11-12
if (buf.length !== 32) throw new Error("PII_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
```

**No AAD (Additional Authenticated Data):** The design doesn't use AAD, which is acceptable (AAD is optional). No plaintext is authenticated without being encrypted.

**Conclusion:** ✅ **No cryptographic issue detected.** This is production-quality AEAD encryption.

---

## F-20.3: HMAC Search Index — Same Key as Encryption (MEDIUM)

**File:** lib/encryption.ts:74–77; lib/pii.ts:89–106

**Vulnerability:**

The HMAC key for searchable fields is stored separately from the encryption key, but the design allows a subtle attack:

```typescript
// lib/encryption.ts:74-77
export function hmacHash(value: string): string {
  const key = getHmacKey();
  return crypto.createHmac("sha256", key).update(value.toLowerCase().trim()).digest("hex");
}
```

```typescript
// lib/pii.ts:89-106 (findByPii — HMAC lookup)
export async function findByPii(
  entityType: EntityType,
  fieldName: string,
  plainValue: string
): Promise<string | null> {
  const hash = hmacHash(plainValue);

  const record = await prisma.personalVault.findFirst({
    where: {
      entityType,
      fieldName,
      hmacIndex: hash,
    },
    select: { entityId: true },
  });

  return record?.entityId ?? null;
}
```

**Risk Analysis:**

1. **Separate keys:** The HMAC key (`PII_HMAC_KEY`) is distinct from the encryption key (`PII_ENCRYPTION_KEY`). Good in principle.

2. **HMAC is deterministic:** The same email always produces the same HMAC hash, enabling efficient searches without decrypting.

3. **Plaintext comparison vulnerability:** `hmacHash()` does **not** compare with timing-safe equal. However, the HMAC is used only for Prisma DB lookups (equality predicates), not direct application-level comparisons, so timing attacks are not applicable here.

4. **Search index leakage:** An attacker with DB read-only access can:
   - Enumerate all `hmacIndex` values
   - Compute HMAC(email) for a list of candidate emails (rainbow table attack)
   - Match HMAC values to recover users' emails without decryption
   - This is a known trade-off of searchable encryption; not a cryptographic bug, but a design choice.

5. **Email normalization:** The HMAC is computed over `.toLowerCase().trim()`, so:
   - `"User@Example.COM"` → `"user@example.com"` → single HMAC
   - Prevents duplicate email entries with different cases
   - Potential issue: if the application treats `User@Example.COM` and `user@example.com` as different accounts, the HMAC normalization breaks that assumption. (Not verified in this audit; assumed consistent normalization.)

**Impact:**

- **Medium:** If the database is compromised (or someone with read-only DB access turns malicious), they can rainbow-table the HMAC index to recover all emails.
- **No impact if encryption key is safe:** As long as `PII_HMAC_KEY` is not exposed, users' emails are still protected from queries (attackers still need to decrypt the vault to get other PII like phone, address).

**Recommendation:**

1. Document that `PII_HMAC_KEY` should be rotated if the DB is ever suspected of being compromised.
2. If absolute secrecy is required, avoid HMAC indexing and query via full decryption (slower).
3. Consider **range-searchable encryption** (OPE — Order-Preserving Encryption) if needed for queries like "emails starting with 'admin@'" — but this is overkill for most applications.

---

## F-20.4: TOTP Secret & Recovery Codes — Encrypted at Rest (GOOD)

**File:** app/api/auth/2fa/totp/setup/route.ts; app/api/auth/2fa/recovery/generate/route.ts

**Assessment:**

Both TOTP secrets and recovery codes are encrypted using `lib/encryption.ts` (AES-256-GCM) before storage:

```typescript
// app/api/auth/2fa/totp/setup/route.ts:19
update: { totpSecret: encrypt(secret) },

// app/api/auth/2fa/recovery/generate/route.ts:17
update: { recoveryCodes: encrypt(codes.join(",")), recoveryUsed: [] },
```

**Strengths:**

1. ✅ **Encryption:** Both secrets are encrypted with AES-256-GCM before DB storage.
2. ✅ **No plaintext in DB:** The `TwoFactorAuth.totpSecret` and `TwoFactorAuth.recoveryCodes` columns store ciphertext.
3. ✅ **Decryption on use:** Routes that verify/disable codes decrypt on demand:
   ```typescript
   // app/api/auth/2fa/challenge/route.ts
   const secret = decrypt(twoFactor.totpSecret);
   ```

**Recovery Code Storage (codes.join(",")):**

Codes are concatenated as a comma-separated string, encrypted as a single blob:
```typescript
// Generated: "ABCD-EFGH,1234-5678,..." (10 codes)
// Stored encrypted: ciphertext(codes_string)
// On use: decrypt → split(",") → check membership
```

**Potential Issue:** If one recovery code is used, the `recoveryUsed` array tracks it (line 17 in recovery/generate), and the check prevents reuse. However, the decrypted codes are held in memory during verification; no issue in practice (standard pattern).

**Conclusion:** ✅ **TOTP and recovery codes are properly encrypted.** No cryptographic weakness.

---

## F-20.5: Recovery Code Entropy — Adequate (GOOD)

**File:** lib/2fa/totp.ts:51–59

**Assessment:**

```typescript
export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}
```

**Entropy:**

- **Part 1:** 2 bytes (16 bits) → `crypto.randomBytes(2)` → 2^16 = 65,536 possibilities
- **Part 2:** 2 bytes (16 bits) → 2^16 possibilities
- **Total:** 16 + 16 = 32 bits per code
- **10 codes:** 32 bits × 10 = 320 bits total entropy (theoretical)

**Assessment:**

- 32 bits per code is **adequate** for recovery codes (not trivial to brute-force; 2^32 ≈ 4 billion combinations).
- Format `XXXX-XXXX` (hex, 4 digits + dash + 4 digits) is human-friendly.
- **No issue:** `crypto.randomBytes()` uses OS-level entropy (good).

**Comparison to TOTP:**

- TOTP secret: 20 bytes (160 bits) via `crypto.randomBytes(20)`, base32-encoded — stronger.
- Recovery codes: 32 bits per code — weaker but acceptable for backup authentication (not the primary factor).

**Conclusion:** ✅ **Recovery code entropy is sufficient.** No weakness.

---

## F-20.6: Cron Webhook Signature — Timing-Safe Comparison (GOOD)

**File:** app/api/cron/cleanup/route.ts:13–18; (same in sync-events, speedrun-status)

**Assessment:**

```typescript
// app/api/cron/cleanup/route.ts:9-19
const authHeader = request.headers.get('authorization') ?? '';
const secret = process.env.CRON_SECRET;
const expected = `Bearer ${secret}`;
if (
    !secret ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
) {
    return new NextResponse('Unauthorized', { status: 401 });
}
```

**Strengths:**

1. ✅ **timingSafeEqual:** Uses `crypto.timingSafeEqual()` instead of `===` comparison.
2. ✅ **Length check first:** `authHeader.length !== expected.length` fast-rejects wrong-length inputs (prevents timing info leak from length comparison).
3. ✅ **Fail-closed:** If `CRON_SECRET` is missing, returns 401 (no fallback to empty string).

**Protection against timing attack:**

- If the code used `authHeader === expected`, an attacker could measure response time to infer correct characters of the secret.
- Example: `Bearer wrong` (first char mismatch) → fast 401. `Bearer C****` (first char right) → slightly slower 401. Repeat to brute-force.
- `timingSafeEqual()` takes constant time (same duration for match/mismatch), defeating this attack.

**Conclusion:** ✅ **Timing-safe comparison correctly implemented.** No weakness.

---

## F-20.7: Referral Code Entropy — Weak (Math.random) (MEDIUM)

**File:** lib/speedrun.ts:127–137 (lines as approximate, full file ~159 lines)

**Vulnerability:**

```typescript
// lib/speedrun.ts (referral code generation)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";  // 32 chars

function randomCode(prefix: string) {
  let s = `${prefix}-`;
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode("RF");
    const existing = await prisma.speedrunReferralCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique referral code after 5 attempts");
}
```

**Risk Analysis:**

1. **Math.random() is not cryptographically secure:**
   - JavaScript's `Math.random()` uses a **pseudo-random number generator** (e.g., xorshift128+), not OS-level entropy.
   - Entropy: ~32 bits (depends on JS engine; varies).
   - Predictability: Previous outputs can inform future outputs.
   - State: If an attacker learns the RNG state (e.g., from other Math.random() calls), they can predict future codes.

2. **Code space:**
   - 6 characters from 32-char alphabet = 32^6 = 1,073,741,824 combinations (~2^30).
   - With weak Math.random(), effective entropy is ~32 bits, so ~4 billion codes (still large, but predictable).

3. **No uniqueness check in randomCode():**
   - `generateUniqueReferralCode()` retries up to 5 times if a code already exists.
   - If Math.random() is predictable, an attacker could forge referral codes that don't exist yet, causing the retry loop to fail.

4. **Attack scenario:**
   - Attacker observes a referral code `RF-ABCDEF` generated at timestamp T.
   - Attacker knows approximate Math.random() state (or leaks it via other timing channels).
   - Attacker predicts next codes: `RF-GHIJKL`, `RF-MNOPQR`, etc.
   - Attacker registers with predicted codes before they're created, or crafts fake referral URLs.

**Impact:**

- **Medium:** Referral codes are not high-security (no financial value directly), but could be exploited to:
  - Spam referral links (predict codes to flood the referral system).
  - Impersonate referrers (if codes are used for attribution without validation).
  - Skew analytics (manipulate referral counts).

**Recommendation:**

Replace `Math.random()` with `crypto.randomBytes()`:

```typescript
import crypto from "crypto";

function randomCode(prefix: string) {
  let s = `${prefix}-`;
  const bytes = crypto.randomBytes(6);  // 6 bytes = 48 bits entropy
  for (let i = 0; i < 6; i++) {
    s += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return s;
}
```

---

## F-20.8: JWT Secret Rotation Absent (OPEN ASSUMPTION)

**File:** lib/auth-options.ts; (NextAuth config, no rotation tooling found)

**Assessment:**

NextAuth uses `NEXTAUTH_SECRET` to sign/verify JWT tokens. No secret rotation mechanism is implemented in the codebase.

```typescript
// lib/auth-options.ts:197-198
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60,  // 30 days
},
```

**Implications:**

1. **Single secret:** All JWTs are signed with a single key (environment variable `NEXTAUTH_SECRET`).
2. **No rotation tooling:** The code does not implement:
   - Key versioning (e.g., multiple keys with version IDs).
   - Automatic rotation schedules.
   - Grace period for old keys.
3. **Revocation challenge:** If the secret is compromised:
   - All issued JWTs (up to 30 days old) remain valid.
   - No server-side revocation list (mentioned in Phase 0 Recon, Step 4).
   - Logout only clears the cookie; the JWT itself is still valid if replayed.

4. **Long maxAge:** 30 days is permissive. If a device is stolen, the JWT is valid for 30 days.

**Risk:**

- **High if secret is leaked:** Attacker can forge JWTs for any user, indefinitely.
- **Medium if secret is rotated regularly:** Compromise window is limited.

**Assumptions:**

- **Open Assumption #1:** We assume `NEXTAUTH_SECRET` is rotated manually (not in code). The frequency is unknown.
- **Open Assumption #2:** Preview deployments may share the same `NEXTAUTH_SECRET` with production (environment isolation unknown).

**Recommendation:**

1. Implement secret versioning in NextAuth config (if supported in v4.24.13).
2. Rotate `NEXTAUTH_SECRET` monthly/quarterly via Vercel dashboard with a grace period.
3. Consider `maxAge: 7 * 24 * 60 * 60` (7 days) to reduce compromise window.
4. Implement server-side session revocation (separate from JWT validity) for logout.

---

## F-20.9: Vercel Env Secrets Not KMS-Backed (OPEN ASSUMPTION)

**File:** Not in codebase (infrastructure)

**Assessment:**

All secrets (`NEXTAUTH_SECRET`, `PII_ENCRYPTION_KEY`, `PII_HMAC_KEY`, `CRON_SECRET`, `ENCRYPTION_KEY`, API keys, etc.) are stored in **Vercel Environment Variables** (web dashboard), not AWS Parameter Store or KMS.

**Implications:**

1. **No KMS:** Vercel env vars are managed by Vercel's infrastructure, not customer-controlled KMS (AWS KMS, Azure Key Vault, etc.).
2. **Shared across functions:** All functions (API routes, crons) can read all env vars.
3. **No per-function IAM:** Unlike AWS Lambda with IAM roles, Vercel functions access all env vars in their environment.
4. **Decryption:** Any code that runs in a Vercel function can decrypt PII (if it's in the same environment).

**Risk:**

- **Medium:** Supply-chain attack or compromised dependency can exfiltrate all secrets.
- **Mitigation by Vercel:** Vercel manages access controls; users cannot see env var values in the dashboard (redacted after creation).

**Assumptions:**

- **Open Assumption #3:** We assume Vercel's env var access controls are adequate (no leaks via logs, monitoring, or dashboards). This is a trust assumption.
- **Open Assumption #4:** We assume no malicious Vercel employee has access to production env vars (role-based access control at Vercel).

**Recommendation:**

1. Review Vercel project settings → Environment Variables → ensure only necessary functions/branches have access.
2. Consider AWS Secrets Manager or similar for high-security secrets, if budget allows.
3. Rotate all secrets quarterly and after any infrastructure changes.

---

## F-20.10: NEXTAUTH_SECRET Shared Across Envs (OPEN ASSUMPTION)

**File:** Vercel project settings (not in codebase)

**Assessment:**

The codebase does not define separate `NEXTAUTH_SECRET` values for production and preview deployments. If Vercel's environment protection is not configured, preview deployments may share the same secret as production.

**Implications:**

1. **Shared JWT key:** Preview deployments would sign JWTs with the same key as production.
2. **Token reuse:** A JWT obtained from a preview deployment would be valid on production (same signature).
3. **Attacker position:** Someone with access to a preview deployment (lower security bar) could forge JWTs for production.

**Risk:**

- **High if preview envs are less secure:** Preview branches may have weaker access controls than production.
- **Mitigated if Vercel has env protection:** Vercel allows per-environment secrets; if configured correctly, preview and production have separate `NEXTAUTH_SECRET`.

**Assumptions:**

- **Open Assumption #5:** We assume Vercel's "Environment Protection" feature is **not configured** in the project settings. This requires manual setup and is not the default.
- **Verification needed:** Check Vercel project dashboard → Settings → Environment Variables → "Protected Environments" toggle.

**Recommendation:**

1. Enable Vercel's "Protected Environments" for production.
2. Define separate `NEXTAUTH_SECRET` for staging and production:
   - Production: `NEXTAUTH_SECRET=xyz123...` (generated, strong entropy)
   - Preview: `NEXTAUTH_SECRET_PREVIEW=abc789...` (generated separately)
3. Rotate both quarterly.

---

## Cross-Category Observations

### Secrets in Logs (Check 1)

**Grep Results:**

No instances of `console.log(process.env)` or `console.log(Object.keys(process.env))` found. Logging is minimal:

```bash
/Users/sarnavo/Development/team1-india/lib/google-calendar.ts:65
  console.error('Token refresh error details:', errorDetails);

/Users/sarnavo/Development/team1-india/app/api/upload/token/route.ts:7
  console.error("Upload token error:", error);
```

✅ **No env var dumps detected.** Logging is error-specific, not comprehensive.

---

### Key Derivation from Device ID (Check: encryptedSession)

**Finding:** The device ID is stored in localStorage and used as the PBKDF2 input. This is the weak link in encryptedSession (see F-20.1).

---

### Passkey & WebAuthn Secret Storage

**File:** prisma/schema.prisma:1164–1177

```prisma
model Passkey {
  id           String    @id @default(uuid())
  twoFactorId  String
  credentialId String    @unique  // Not encrypted
  publicKey    Bytes     // Not encrypted
  counter      BigInt
  deviceName   String?
  createdAt    DateTime  @default(now())
  lastUsedAt   DateTime?
  
  twoFactor TwoFactorAuth @relation(fields: [twoFactorId], references: [id])
}
```

✅ **Correct:** `credentialId` and `publicKey` are stored plaintext. WebAuthn spec requires this (public key is public, credential ID is non-secret). No encryption needed.

---

## Summary of Recommendations

| Finding | Action | Priority |
|---------|--------|----------|
| F-20.1 | Fix PBKDF2 salt (use unique random salt or server-side wrapping) | High |
| F-20.3 | Document HMAC key protection; consider rotation plan | Medium |
| F-20.7 | Replace Math.random() with crypto.randomBytes() for referral codes | Medium |
| F-20.8 | Implement secret rotation for NEXTAUTH_SECRET (quarterly) | High |
| F-20.9 | Review Vercel env var access controls | Medium |
| F-20.10 | Configure Vercel environment protection for production | High |

---

## Conclusion

**Crypto Posture:** Mixed — strong server-side encryption (AES-256-GCM), but weak client-side derivation (PBKDF2 static salt) and weak code generation (Math.random()).

**Risk Level:** Medium (High if encryptedSession static salt is exploited; Medium if referral codes are attacked; Medium if NEXTAUTH_SECRET is not rotated).

**Status:** Confirmed issues (F-20.1, F-20.7) + Open Assumptions (F-20.8, F-20.9, F-20.10). No zero-days detected in implemented cryptography, but design weaknesses present.

---

**Report Generated:** 2026-05-03  
**Auditor:** Claude (autonomous security scan)  
**Scope:** Category 20 — Cryptography & Secrets
