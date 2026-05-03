# Category 22 — Anti-Abuse, Anti-Fraud, Anti-Sybil

**Audit date:** 2026-05-03  
**Codebase:** team1-india  
**Severity levels:** Critical, High, Medium, Low  
**Coverage:** Velocity checks, device fingerprinting, IP reputation, phone verification, email normalization, CAPTCHA, referral self-exploitation, swag economics, disposable emails.

---

## Executive Summary

The platform employs **Google OAuth-only authentication** with no domain allowlist. It captures `signupIp` on `PublicUser` creation but performs **zero velocity checks** on signup, redemption, transfer, or admin actions. There is no device fingerprinting beyond an **attacker-controlled `device-id` in localStorage**, no IP reputation checks, no CAPTCHA, no phone verification, and **no email normalization** (Gmail `+` aliasing not blocked). **Referral self-exploitation is possible** via a second account. Swag redemption has **no velocity gate**, allowing rapid point-draining attacks. The cumulative effect creates a **high-ROI environment for Sybil attacks targeting swag inventory**.

---

## Finding 1: Zero Signup Velocity Checks — Sybil Door Wide Open

**Severity:** Critical  
**Category:** Abuse / Account Creation  

### Details

Signup is routed through Google OAuth ([lib/auth-options.ts:13-86](../../../lib/auth-options.ts#L13-L86)) with **no signup rate limiting**, no velocity gating, and **no per-IP throttling**.

The flow is:
1. User logs in via Google (NextAuth handles OAuth state/PKCE ✓).
2. `signIn` callback ([lib/auth-options.ts:16-79](../../../lib/auth-options.ts#L16-L79)) checks if email exists in `Member` → `CommunityMember` → `PublicUser`.
3. If none exist, a new `PublicUser` row is created ([lib/auth-options.ts:61-76](../../../lib/auth-options.ts#L61-L76)) with:
   - `email: emailToFind`
   - `signupIp: "next-auth-signin"` (placeholder — actual IP not captured in callback)
   - `consentNewsletter: false`, `consentLegal: false`

### Rate Limit Coverage

Across the entire codebase, `checkRateLimit` and `withRateLimit` are used on:
- Quest completions: **5 req/min** ([app/api/quests/[id]/completions/route.ts](../../../app/api/quests/[id]/completions/route.ts))
- Bounty submissions: **5 req/min** ([app/api/bounty/submissions/route.ts](../../../app/api/bounty/submissions/route.ts))
- Public contact form: **3 req/min** ([app/api/public/contact/route.ts](../../../app/api/public/contact/route.ts))
- Public API endpoints: **20–30 req/min** ([app/api/public/*](../../../app/api/public/))

**Signup flow:** None. Every Google OAuth callback that results in a new account creation succeeds with no IP-based throttling. An attacker can spin up 100 fake Google accounts in seconds and register 100 `PublicUser` rows.

### Proof of Concept (Conceptual)

```
for i in 1..100:
  1. Create a new Gmail account (free, automated)
  2. POST to /api/auth/signin (or visit /api/auth/callback?code=<token>)
  3. Backend creates PublicUser[i]
  4. No rate limit → all 100 succeed in < 1 minute
```

### Recommended Mitigations

1. Add rate limit to the signIn callback: track per-IP new-account creations and throttle after threshold (e.g., 3 new accounts per IP per hour).
2. Introduce per-IP session-cookie creation limits.
3. Geoblock high-velocity signup patterns (e.g., 10+ logins from same IP in 60s → challenge with CAPTCHA or require email verification).

---

## Finding 2: Phone Verification Absent — VoIP Reuse Undetected

**Severity:** High  
**Category:** Account Verification  

### Details

`SpeedrunRegistration` schema ([prisma/schema.prisma:1033-1074](../../../prisma/schema.prisma#L1033-L1074)) captures:
```prisma
phone    String?  // user-supplied phone number (not verified)
```

No `PhoneVerification` model exists. No SMS gateway integration found (no Twilio, no custom SMTP-to-SMS bridge). The phone field is **accepted at registration time but never validated**:

- [app/api/speedrun/runs/[slug]/register/route.ts:162](../../../app/api/speedrun/runs/[slug]/register/route.ts#L162): `phone: phone ? String(phone).trim() : null` — simple string storage.
- No OTP generation, no SMS send, no verification callback.

### Attack Surface

1. **VoIP number reuse:** Same Twilio-like VoIP number can be shared across 100 registrations (each with a different email but same phone).
2. **Invalid number acceptance:** +1-555-0100, "123", "" all accepted.
3. **Speedrun team coordination:** Attacker can register 100 solo accounts under same phone, then harvest points → redeem swag.

### Recommended Mitigations

1. Implement phone verification: send OTP via SMS, require user to confirm before registration completes.
2. Blacklist known VoIP providers (Twilio, Nextel, Google Voice, etc.) in real-time using a service like Neutrino or Apilayer.
3. Flag registrations from same phone with different emails for manual review.

---

## Finding 3: No Device Fingerprinting — Attacker-Controlled `device-id`

**Severity:** High  
**Category:** Fraud Detection  

### Details

The PWA storage layer ([lib/encryptedSession.ts:151-158](../../../lib/encryptedSession.ts#L151-L158)) relies on a `device-id` to derive encryption keys:

```typescript
let deviceId = localStorage.getItem('device-id');
if (!deviceId) {
  deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  localStorage.setItem('device-id', deviceId);
}
return deviceId;
```

**Vulnerability:** `localStorage` is **fully attacker-controlled**. An attacker can:
1. Open DevTools → set `localStorage.setItem('device-id', 'attacker-device-123')`.
2. Spoof the same device across unlimited accounts.
3. Bypass any device-based rate limiting.

No fingerprint libs (FingerprintJS, Statiq, etc.) are in deps. The `AnalyticsEvent` model ([prisma/schema.prisma:1094-1116](../../../prisma/schema.prisma#L1094-L1116)) captures:
- `device` (mobile/desktop/tablet, from user-agent — trivially spoofed)
- `browser`, `os`, `country` — all from headers, all spoofable

### Attack Surface

- Same attacker can register 100 accounts and they all report as "unique" devices in analytics.
- No cross-device detection for abuse patterns.

### Recommended Mitigations

1. Integrate FingerprintJS Pro or similar server-side fingerprinting service.
2. Cross-reference fingerprint + IP + email hashes to flag suspicious patterns.
3. Do NOT rely on `localStorage` for identity signals; treat it as untrusted.

---

## Finding 4: No IP Reputation / Tor / VPN Detection

**Severity:** High  
**Category:** Fraud Detection  

### Details

No IP reputation service is queried. No checks for:
- Tor exit nodes (via Tor Project list)
- VPN providers (via MaxMind GeoIP, AbuseIPDB, IPQualityScore)
- Datacenter IPs (AWS, GCP, Azure, Hetzner)
- Proxy indicators

The recon document confirms: "No IP reputation / Tor / VPN / datacenter detection on high-value flows" ([00-RECON.md §Step 22](../../../docs/security/audit-2026-05-03/00-RECON.md)).

### Attack Surface

Attacker can:
1. Rent 100 cheap AWS EC2 instances (cost: ~$5/month).
2. Register 100 accounts from each instance.
3. No anomaly detection flags this behavior.
4. Drain swag inventory.

### Recommended Mitigations

1. Integrate MaxMind GeoIP2 or IPQualityScore API for datacenter/VPN detection.
2. Flag signups from known datacenter IPs as "high-risk" and require CAPTCHA.
3. Geoblock suspicious regions if not operationally relevant.

---

## Finding 5: No CAPTCHA on Signup or High-Risk Actions

**Severity:** High  
**Category:** Bot Prevention  

### Details

No `hcaptcha`, `recaptcha`, or `turnstile` imports in the codebase. Confirmed via grep: zero hits on `CAPTCHA`, `captcha`, `recaptcha`, `hcaptcha`, `turnstile`.

Signup and speedrun registration ([app/api/speedrun/runs/[slug]/register/route.ts](../../../app/api/speedrun/runs/[slug]/register/route.ts)) have **zero challenge mechanisms**.

### Attack Surface

- Bot can auto-submit registrations in bulk.
- No human-in-the-loop check.

### Recommended Mitigations

1. Add Cloudflare Turnstile (free tier) to signup and registration flows.
2. Serve CAPTCHA on:
   - First-time signup via Google OAuth.
   - High-velocity IP patterns (3+ logins in 1 minute).
   - Swag redemption after 10 orders in 1 day.

---

## Finding 6: Disposable Email Domains Not Filtered

**Severity:** Medium  
**Category:** Account Quality  

### Details

Google OAuth normally prevents disposable email signup (Gmail requires phone-based recovery, not a burner email provider). However, the app does **not explicitly filter disposable domain registrations**.

Email uniqueness constraint exists ([prisma/schema.prisma:12, 50, 478](../../../prisma/schema.prisma)) but is **case-insensitive** ([lib/auth-options.ts:19, 32, 43](../../../lib/auth-options.ts)):

```typescript
where: { email: { equals: emailToFind, mode: 'insensitive' } }
```

This prevents direct email duplicates but doesn't block:
- `user+tag@gmail.com` (Gmail aliasing — see Finding 7).
- Custom domain registrations like `attacker@myphony.io` (a burner domain).

### Attack Surface

If Google's signup restrictions are bypassed (unlikely but possible with domain spoofing), or if a secondary OAuth provider is added later (e.g., GitHub), disposable domains are accepted.

### Recommended Mitigations

1. Add disposable-email list check using a library like `disposable-email-domains` or call Neutrino API.
2. Reject signup if email domain is on the blocklist.
3. Flag for manual review if email domain is newly registered (<30 days old).

---

## Finding 7: Email Aliasing Not Normalized — `john+1@gmail.com` vs `john@gmail.com`

**Severity:** Medium  
**Category:** Identity Deduplication  

### Details

Gmail and most email providers ignore the `+` character and everything after it:
- `john@gmail.com` = `john+spam@gmail.com` = `john+test@gmail.com` (all route to john's inbox)

The auth callback performs **case-insensitive** uniqueness check ([lib/auth-options.ts:17-20](../../../lib/auth-options.ts#L17-L20)):

```typescript
const emailToFind = user.email ? user.email.trim() : "";
const member = await prisma.member.findFirst({
  where: { email: { equals: emailToFind, mode: 'insensitive' } },
});
```

But does **NOT normalize the email** (e.g., strip `+...` for Gmail, remove leading/trailing spaces for all). Two registrations:
1. Attacker registers as `john+1@gmail.com` → creates `PublicUser[1]` with email `john+1@gmail.com`.
2. Same attacker registers as `john+2@gmail.com` → creates `PublicUser[2]` with email `john+2@gmail.com`.
3. Both point to the same actual mailbox and can be used to bypass per-user rate limits.

### Attack Surface

- Multiple valid speedrun registrations per real person.
- Multiple points wallets per person.
- Bypass redemption velocity checks (see Finding 8).

### Proof of Concept

```
POST /api/speedrun/runs/may-26/register {
  "userEmail": "attacker+1@gmail.com",
  "fullName": "John Doe", ...
}
→ Creates registration[1]

POST /api/speedrun/runs/may-26/register {
  "userEmail": "attacker+2@gmail.com",
  "fullName": "Jane Doe", ...
}
→ Creates registration[2]
(Both controlled by same person)
```

### Recommended Mitigations

1. Normalize emails before storage:
   - Strip everything after `+` for `@gmail.com`, `@googlemail.com`.
   - Remove leading/trailing spaces for all.
   - Lowercase all before uniqueness check.
2. Update schema: add `normalizedEmail` field with unique index.
3. Update auth callback to use `normalizedEmail` in lookups.

---

## Finding 8: Swag Redemption Has No Velocity Gate — Drain Points in Seconds

**Severity:** Critical  
**Category:** Fraud Prevention / Redemption  

### Details

The swag redeem endpoint ([app/api/swag/[id]/redeem/route.ts](../../../app/api/swag/[id]/redeem/route.ts)) has:
- ✅ Points balance check ([L49-67](../../../app/api/swag/[id]/redeem/route.ts#L49-L67)): `spendPoints()` throws `INSUFFICIENT_BALANCE` if not enough.
- ✅ Stock decrement: atomic SQL UPDATE ([L38-45](../../../app/api/swag/[id]/redeem/route.ts#L38-L45)) prevents overselling.
- ✅ Session auth: `getServerSession()` required.
- ❌ **No rate limit on redemptions per user per time window.**

An attacker with 50,000 points can:
1. Redeem 50 items (1,000 points each) in 50 sequential POST requests.
2. No throttling → all complete in < 5 seconds.
3. Swag inventory drained before admins notice.

### Proof of Concept

```typescript
for (let i = 0; i < 50; i++) {
  await fetch(`/api/swag/${itemId}/redeem`, {
    method: 'POST',
    headers: { Cookie: 'session-token=...' },
    body: JSON.stringify({ variantId: 'var-1', quantity: 1 })
  });
  // No delay, no backoff → all succeed instantly
}
```

### Recommended Mitigations

1. Add redemption velocity check to `spendPoints()` or the redeem endpoint:
   - Max 1 redemption per minute per user.
   - Max 10 per hour per user.
2. Require admin approval for large orders (e.g., > 5,000 points in one go).
3. Log all redemptions to `AuditLog` (currently missing per recon §Step 13).

---

## Finding 9: No Redemption / Withdrawal Risk Scoring

**Severity:** Medium  
**Category:** Fraud Scoring  

### Details

Per recon: "Risk scoring on redemption / withdrawal — N/A" (not in scope for this app). However, the absence of any scoring on high-value redemptions is a control gap.

### Recommended Mitigations

1. On swag redeem: calculate risk score based on:
   - Account age (created < 1 day ago = high risk).
   - Points balance history (earned suddenly vs. gradual = high risk).
   - Redemption frequency (3 items in 1 hour = flag for review).
   - Device fingerprint (new device = flag).
2. If risk score > threshold, require admin approval or manual verification (email OTP).

---

## Finding 10: Speedrun Referral Self-Exploitation — No Check for Self-Referral

**Severity:** Medium  
**Category:** Referral Fraud  

### Details

Referral code generation ([lib/speedrun.ts:103-110](../../../lib/speedrun.ts#L103-L110)):

```typescript
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode("RF");
    const existing = await prisma.speedrunReferralCode.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Failed to generate unique referral code after 5 attempts");
}
```

Schema ([prisma/schema.prisma:1077-1090](../../../prisma/schema.prisma#L1077-L1090)):

```prisma
model SpeedrunReferralCode {
  userEmail   String   @unique  // referrer's email (one code per user)
  code        String   @unique
  conversions Int      @default(0)  // count of registrations using this code
  // ...
}
```

Registration uses referral code ([app/api/speedrun/runs/[slug]/register/route.ts:141-154](../../../app/api/speedrun/runs/[slug]/register/route.ts#L141-L154)):

```typescript
if (ref && ref.userEmail !== userEmail) {
  resolvedReferralCode = ref.code;
}
```

**Check:** `ref.userEmail !== userEmail` prevents self-referral on **this registration**.

**Gap:** An attacker with email `attacker@gmail.com` can:
1. Generate referral code `RF-ABC123` ([/api/speedrun/referrals/me](../../../app/api/speedrun/referrals/me/route.ts)).
2. Create second account `attacker+1@gmail.com` (Gmail aliasing, per Finding 7).
3. Register with referral code `RF-ABC123` from second account.
4. The check `ref.userEmail !== userEmail` compares `attacker@gmail.com` != `attacker+1@gmail.com` → **different strings → passes check**.
5. Referral converts, attacker gets benefit (if any) from conversion metric.

**Note:** The app doesn't appear to award points/XP for referrals (no redemption logic for conversions). However, **the conversion metric is inflated**, skewing admin analytics.

### Recommended Mitigations

1. Normalize emails before referral check: use `normalizeEmail()` on both `ref.userEmail` and `userEmail`.
2. Detect email aliasing: if both emails share the same canonical form (`john@gmail.com`), reject.
3. Log all referral conversions to `AuditLog` for manual audit.

---

## Finding 11: Swag Economics — Low Barrier to Sybil Attack

**Severity:** Critical  
**Category:** Economics / Sybil Attack ROI  

### Details

From schema ([prisma/schema.prisma:763-787](../../../prisma/schema.prisma#L763-L787)):

```prisma
model SwagItem {
  pointsCost     Int  // points required to redeem
  totalStock     Int
  remainingStock Int
}
```

**Typical economics (assumption based on common swag values):**

| Item | Points Cost | Real Value | Effort to Earn |
|---|---|---|---|
| Sticker | 100 | $0.50 | 1 quest |
| T-shirt | 1,000 | $10 | 10 quests |
| Hoodie | 2,000 | $25 | 20 quests |

**Earning points:** Quests/bounties award points via `earnReward()` ([lib/wallet.ts:28-78](../../../lib/wallet.ts#L28-L78)). Sample path:
- Complete 1 quest → earn 100 points → redeem 1 sticker.

**Sybil ROI calculation:**

```
Cost to create 1 fake account:
  - Gmail: free (or $0.01 per account via bulk email service)
  - Time: ~1 minute (or 5 seconds automated)
  - Total: $0 + negligible time

Value per account:
  - 1 account can register once per run
  - Earn 100 points on signup/first quest
  - Redeem 1 sticker (value: $10 real merch or digital goodie)

Attacker can create 100 accounts → 100 stickers → $1,000 value
Cost: $0
ROI: ∞ (unlimited)
```

**If inventory is limited** (e.g., 50 t-shirts at 1,000 points each = 50,000 points total):
- Attacker needs 50 accounts × (1,000 points / 100 points per easy task) = 500 tasks
- 500 tasks × 1 minute per task (automated) = ~500 minutes = 8 hours
- Cost: still ~$0
- Reward: $500+ in merch

**The platform is highly vulnerable to swag-driven Sybils.**

### Recommended Mitigations

1. **Increase friction:**
   - Require phone verification (Finding 2).
   - Require email verification.
   - Implement CAPTCHA (Finding 5).

2. **Limit earnings per account:**
   - Cap points earned per account per run (e.g., 500 max).
   - Decay earning rate after 10 quests (diminishing returns).

3. **Inventory controls:**
   - Set per-user redemption limits (max 3 items per account).
   - Require manual approval for large orders (> 1,000 points).

4. **Monitor for Sybil patterns:**
   - Flag accounts with similar signup IPs, devices, or email domains.
   - Flag bulk redemptions on same day.

---

## Finding 12: Admin Login Has No Impossible-Travel Detection

**Severity:** Medium  
**Category:** Admin Account Compromise  

### Details

Per recon §Step 13: "Impossible-travel on admin login — N/A (no IP tracking on admin login per recon §Step 13)."

The `Member` model ([prisma/schema.prisma:1-40](../../../prisma/schema.prisma#L1-L40)) has **no `lastLoginIp`, `lastLoginAt`, or `loginHistory` fields**. Admin logins are authenticated via `getServerSession()` → JWT but **no audit trail of admin access is created** ([lib/auth-options.ts](../../../lib/auth-options.ts) does not call `logAudit()` on signin).

An attacker with a CORE member's JWT token (or stolen credentials from a compromised device) can:
1. Log in from any IP (Berlin, Tokyo, Johannesburg, etc.) without detection.
2. No alert to the admin.
3. Perform admin actions (e.g., bulk point adjustments) without trace.

### Recommended Mitigations

1. Add `lastLoginIp`, `lastLoginAt`, `lastLoginCountry` to `Member`.
2. Log every admin login to `AuditLog` with IP, user-agent, country.
3. On admin login from new country, require email confirmation (send magic link).
4. Alert admins if login detected from:
   - New IP within same day (after previous login elsewhere).
   - Geo-impossible login (e.g., Tokyo at 14:00, London at 14:05 = impossible).

---

## Finding 13: No Velocity Check on Bounty/Quest Completions (But Rate Limit in Place)

**Severity:** Low  
**Category:** Abuse Prevention  

### Details

Quest completion ([app/api/quests/[id]/completions/route.ts](../../../app/api/quests/[id]/completions/route.ts)) and bounty submission ([app/api/bounty/submissions/route.ts](../../../app/api/bounty/submissions/route.ts)) both use:

```typescript
const rateCheck = await checkRateLimit(request, 5, 60000);  // 5 per minute
```

This limits to **5 completions per IP per minute**. However, **per-user velocity** (account-based, not IP-based) has **no explicit check**.

An attacker can:
1. Create account A.
2. Complete 5 quests in minute 1 (OK, within rate limit).
3. Wait 61 seconds.
4. Complete 5 more quests (OK, new window).
5. Repeat indefinitely.

The rate limit is **IP-based**, not **account-based**, so:
- Multiple accounts from the same IP are not throttled.
- A single account across multiple IPs is not throttled.

### Proof of Concept

```
Attacker with 100 accounts:
- IPs 1..10: 10 accounts per IP
- Each account completes 5 quests/minute
- 100 accounts × 5 quests/min = 500 quests/min across IP range
- Rate limit is per IP: 5 quests/min → attacker gets 50 quests/min (per IP × 10 IPs)
- Still below overall system limits but suspicious
```

### Recommended Mitigations

1. Add per-user velocity check: `MAX_QUESTS_PER_HOUR = 20` (conservative).
2. Cross-reference IP + email to flag suspicious patterns.
3. Log quest completions to `AuditLog` (currently missing).

---

## Finding 14: No Anomaly Detection on Balance Earning Patterns

**Severity:** Medium  
**Category:** Fraud Detection  

### Details

Per recon: "Behavioral anomaly on balance / earning patterns — N/A."

The `UserWallet` model ([prisma/schema.prisma:676-706](../../../prisma/schema.prisma#L676-L706)) tracks:
- `totalXp`, `pointsBalance`, `totalEarned`, `totalSpent`, `totalExpired`

But there is **no anomaly detection logic** to flag:
- Sudden spike in earnings (e.g., 50,000 points earned in 1 day, normally <100/day).
- Earnings rate change (e.g., 10 quests completed in 1 minute, normally 1/hour).
- Redemption pattern change (e.g., redeeming 100 items after 0 for 30 days).

### Recommended Mitigations

1. Calculate rolling average of points earned per day, per account, per 30-day window.
2. If today's earnings > 3× rolling average, flag for review.
3. Require admin approval for redemptions if earning rate is anomalous.

---

## Finding 15: Email Captured But Not Verified in Speedrun Registration

**Severity:** High  
**Category:** Data Quality / Verification  

### Details

`SpeedrunRegistration` schema ([prisma/schema.prisma:1033-1074](../../../prisma/schema.prisma#L1033-L1074)) captures:
```prisma
userEmail   String    // email from JWT claim, not verified at registration time
```

The email is **derived from the authenticated session** ([app/api/speedrun/runs/[slug]/register/route.ts:28](../../../app/api/speedrun/runs/[slug]/register/route.ts#L28)):

```typescript
const userEmail = session.user.email;
```

However, **NextAuth's email claim is only as good as the OAuth provider's email**. If an attacker:
1. Compromises a Google account's email claim (unlikely but possible in replay attacks or token theft), or
2. Uses email aliasing (Finding 7) to create multiple registrations under false identities,

there is **no server-side verification** of the email address at registration time. Unlike the speedrun form, which allows user-supplied fields like `fullName`, `phone`, the email is trusted from the session.

**Risk:** Limited direct risk (email is OAuth-backed) but combined with findings 1–7, the lack of email verification on secondary fields is a gap.

### Recommended Mitigations

1. Send verification email to `userEmail` at registration time; require click to confirm.
2. Store confirmation status in `SpeedrunRegistration.emailVerified` (currently not present).
3. Only allow participation (team joins, submissions) after email is verified.

---

## Summary Table: Control Gaps

| Control | Status | Finding # | Severity |
|---|---|---|---|
| **Signup rate limiting** | Missing | 1 | Critical |
| **Phone verification** | Missing | 2 | High |
| **Device fingerprinting** | Fake (`device-id`) | 3 | High |
| **IP reputation** | Missing | 4 | High |
| **CAPTCHA** | Missing | 5 | High |
| **Disposable email filtering** | Missing | 6 | Medium |
| **Email aliasing normalization** | Missing | 7 | Medium |
| **Swag redemption velocity** | Missing | 8 | Critical |
| **Redemption risk scoring** | Missing | 9 | Medium |
| **Referral self-check (email aliasing)** | Weak (string comparison) | 10 | Medium |
| **Swag Sybil economics** | High ROI for attacker | 11 | Critical |
| **Admin login anomaly** | Missing | 12 | Medium |
| **Per-user velocity on quests** | Missing | 13 | Low |
| **Balance anomaly detection** | Missing | 14 | Medium |
| **Email verification at registration** | Missing | 15 | High |

---

## Recommended Priority Fixes

### Phase 1 (Immediate — Week 1)
1. **Finding 1:** Add signup rate limit (3 new accounts per IP per hour).
2. **Finding 8:** Add swag redemption velocity check (1 per minute, 10 per hour).
3. **Finding 11:** Cap points earnings per account per run.

### Phase 2 (Short-term — Weeks 2–3)
1. **Finding 7:** Implement email normalization for Gmail (`+` stripping).
2. **Finding 5:** Integrate Cloudflare Turnstile on signup and registration.
3. **Finding 2:** Add phone verification (OTP via SMS or email).

### Phase 3 (Medium-term — Weeks 4–6)
1. **Finding 3:** Replace `device-id` with server-side fingerprinting (FingerprintJS or similar).
2. **Finding 4:** Integrate MaxMind GeoIP for VPN/datacenter detection.
3. **Finding 12:** Add admin login audit trail + impossible-travel detection.

### Phase 4 (Long-term — Month 2+)
1. **Finding 9:** Implement redemption risk scoring.
2. **Finding 14:** Build anomaly detection on balance patterns.
3. **Finding 6:** Add disposable email filtering.

---

## References

- [lib/auth-options.ts](../../../lib/auth-options.ts) — OAuth signup flow
- [lib/rate-limit.ts](../../../lib/rate-limit.ts) — Rate limiting implementation
- [lib/wallet.ts](../../../lib/wallet.ts) — Points spending logic
- [lib/speedrun.ts](../../../lib/speedrun.ts) — Referral code generation
- [app/api/speedrun/runs/[slug]/register/route.ts](../../../app/api/speedrun/runs/[slug]/register/route.ts) — Registration endpoint
- [app/api/swag/[id]/redeem/route.ts](../../../app/api/swag/[id]/redeem/route.ts) — Swag redemption endpoint
- [prisma/schema.prisma](../../../prisma/schema.prisma) — Data models
- [00-RECON.md](../../../docs/security/audit-2026-05-03/00-RECON.md) — Phase 0 reconnaissance

---

**End of Category 22 Audit**
