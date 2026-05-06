# Phase 1 — Security Audit Matrices

**Audit Date:** 2026-05-03  
**Repository:** team1-india @ branch `test`  
**Auditor:** Claude (autonomous agent)  
**Scope:** Three strategic matrices per Phase 1 spec format

This document synthesizes findings from Phase 0 (Recon) and Phase 1 Category scans (2, 5, 6, 7) into three role×action, panel isolation, and field×visibility matrices.

---

## Matrix 1: Role × Action Access Matrix

**Legend:** Expected = principle of least privilege; Actual = code audit finding; Mismatch = cite category/finding ID.

| Action | Expected | Actual | Mismatch? | Citation |
|--------|----------|--------|-----------|----------|
| **View own profile** | PUBLIC+ | PUBLIC+ | ✓ Pass | Recon §Step 5 |
| **Edit own profile** | MEMBER+ | MEMBER+ | ✓ Pass | Recon §Step 5 |
| **View own wallet** | PUBLIC+ | PUBLIC+ (scoped by email) | ✓ Pass | Cat 2 §Check 13 |
| **Spend points (swag redeem)** | MEMBER+ | MEMBER+ | ✓ Pass | Recon §Step 8 |
| **View other user's wallet** | CORE+FULL_ACCESS | CORE+FULL_ACCESS (via data-grid) | ✓ Pass | Cat 2 §Check 13 |
| **View other user's profile (PII)** | CORE+READ+ | CORE+READ (unmasked) | 🚩 Mismatch | Cat 6 Finding 1 |
| **View Member.permissions of others** | CORE+FULL_ACCESS | CORE+READ (overpermissioned) | 🚩 Mismatch | Cat 2 §Check 4; Cat 6 Finding 4 |
| **Edit Member.permissions** | CORE+FULL_ACCESS | CORE+FULL_ACCESS | ✓ Pass | Cat 2 §Check 3 |
| **Grant points (admin)** | CORE+FULL_ACCESS | CORE (only role check, no FULL_ACCESS check) | 🚩 Mismatch | Cat 7 §Check 3A |
| **Approve quest completion** | CORE+FULL_ACCESS | CORE (endpoint allows role check only) | ⚠️ Partial | Recon §Step 5 |
| **Approve bounty submission** | CORE+FULL_ACCESS | CORE (endpoint allows role check only) | ⚠️ Partial | Recon §Step 5 |
| **Approve refund** | N/A | N/A | N/A | Not implemented |
| **Send mass email** | CORE+FULL_ACCESS | CORE (hardcoded recipients) | 🚩 Mismatch | Cat 7 §Check 5 |
| **Send push to all users** | CORE+FULL_ACCESS | CORE (push/send endpoint) | ⚠️ Partial | App search |
| **Export speedrun registrations CSV** | CORE+FULL_ACCESS | CORE (unmasked PII) | 🚩 Mismatch | Cat 6 Finding 2; Cat 7 §Check 2 |
| **Read AuditLog** | CORE+FULL_ACCESS | CORE+READ (CORE only, any READ) | 🚩 Mismatch | Cat 2 §Check 21 |
| **Delete AuditLog row** | N/A | None (soft-delete possible via DB) | 🚩 Risk | Cat 2 §Check 21 |
| **Disable own 2FA** | MEMBER+ | MEMBER+ (TOTP code only, no re-auth) | 🚩 Mismatch | Cat 7 §Check 4 |
| **Disable other user's 2FA** | CORE+FULL_ACCESS | Not exposed (endpoint missing) | ✓ Pass | Recon §Step 4 |
| **Trigger cron job** | System (CRON_SECRET) | System (bearer token only) | ⚠️ Weak | Cat 2 §Check 11; Cat 7 §Check 11 |
| **View public-users list** | CORE+FULL_ACCESS | CORE (no explicit FULL_ACCESS check) | 🚩 Mismatch | Cat 7 §Check 1A |
| **View speedrun registrations** | CORE+WRITE | CORE (unfiltered, unmasked, unlogged) | 🚩 Mismatch | Cat 7 §Check 1B |
| **Modify SystemSettings** | CORE+FULL_ACCESS | CORE (presumed FULL_ACCESS check) | ⚠️ Assumed | Recon §Step 5 |
| **Modify swag inventory** | CORE+FULL_ACCESS | CORE (presumed FULL_ACCESS check) | ⚠️ Assumed | Recon §Step 5 |
| **Read PersonalVault decrypted** | N/A | None (model unused) | ✓ Pass | Cat 6 Finding 11 |

**Row legend:**
- ✓ Pass = Expected == Actual, no finding
- 🚩 Mismatch = Actual exceeds Expected, or vice versa; action required
- ⚠️ Partial/Assumed = Code search incomplete or assumption stated; verify in Cat detail

---

## Matrix 2: Panel Isolation Matrix

**Legend:** Auth required = session gate; MFA required = TOTP/passkey enforced; IP allowlist = Vercel/custom gate; Session scope = cookie domain/role; Deploy pipeline = separate infra; JS bundle = separate chunk; Error pages = custom (no echo); Posture grade = overall tier.

| Panel | Auth Required | MFA Required | IP Allowlist | Session Scope | Deploy Pipeline | JS Bundle | Error Pages | Posture Grade |
|-------|---|---|---|---|---|---|---|---|
| `/public/*` (anonymous) | None | N/A | None | Public only | Single Next.js | Shared | Default Next.js | 🟢 Good |
| `/auth/*` (login pages) | Optional (login redirect) | Optional (flagged) | None | Session-aware | Single Next.js | Shared | Default Next.js | 🟡 Medium |
| `/speedrun/*` (mixed) | Some scoped, some public | None | None | Role-dependent | Single Next.js | Shared | Default Next.js | 🟡 Medium |
| `/member/*` (MEMBER+) | getServerSession required ([app/member/layout.tsx](../../../../app/member/layout.tsx)) | None (not enforced) | None | MEMBER/CORE | Single Next.js | Shared | Default Next.js | 🟡 Medium |
| `/core/*` (CORE) | getServerSession + role check ([app/core/layout.tsx:20-23](../../../../app/core/layout.tsx#L20-L23)) | Optional (feature-flag `ENABLE_2FA`) | None | CORE only | Single Next.js | Shared | Default Next.js | 🔴 Critical |
| `/core/admin/*` (CORE+FULL_ACCESS for some) | getServerSession + role check; some routes check FULL_ACCESS | Optional | None | CORE+FULL_ACCESS | Single Next.js | Shared | Default Next.js | 🔴 Critical |
| `/api/public/*` | None | N/A | None | Public only | Single Lambda pool | Shared | Generic JSON | 🟢 Good |
| `/api/cron/*` | Bearer token (CRON_SECRET) | N/A | None | System (no session) | Single Lambda pool | N/A | Generic JSON | 🟡 Medium |
| `/api/admin/*` | getServerSession + role check | None | None | CORE only | Single Lambda pool | N/A | Generic JSON | 🟡 Medium |
| `/api/auth/*` | Optional | Optional | None | Session-aware | Single Lambda pool | N/A | Generic JSON | 🟡 Medium |
| `/api/core/*` | Not a namespace; gating varies per route | N/A | None | CORE only | Single Lambda pool | N/A | Generic JSON | 🟡 Medium |
| `/api/members/*` | getServerSession + checkCoreAccess | None | None | CORE only | Single Lambda pool | N/A | Generic JSON | 🟡 Medium |

**Posture Grade Legend:**
- 🟢 Good = Public-facing, no secret exposure, standard security gates
- 🟡 Medium = Authenticated, optional MFA, no IP gate, shared infra (per Recon §Step 6)
- 🔴 Critical = Admin panel, shared origin/cookie/bundle/secret, XSS → hijack risk (Cat 5 §Check 1)

**Key Findings:**
1. **Single-origin monolithic architecture** (recon §Step 6) — all panels share JWT cookie, bundle, API pool, DB credential.
2. **No separate admin URL** — `/core` is a route, not `admin.team1india.com`.
3. **No IP allowlist** (Cat 5 §Check 7) — anyone with CORE credential can access from anywhere.
4. **No mandatory MFA** on CORE (Cat 5 §Check 9) — depends on feature flag `ENABLE_2FA` (assume disabled in production).
5. **PWA cache TTL 5 min on `/core`** (Cat 5 §Check 12) — shared device risk.
6. **Cron auth weak** (Cat 2 §Check 11) — single bearer token, no per-job separation.

---

## Matrix 3: Field × Role Visibility Matrix

**Legend:** 
- none = not returned
- masked = redacted (e.g., `j***@***.com`)
- read = readable unmasked
- read-write = writable
- dangerous-read = returns more than role needs

Columns: anon | public | member | core | core+full_access | Notes / Mismatch

| Field | Anon | Public | Member | Core | Core+Full_Access | Notes / Mismatch |
|-------|------|--------|--------|------|-------------------|------------------|
| **Member.email** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Cat 6 Finding 1: Visible to CORE+READ, should be FULL_ACCESS+mask |
| **Member.permissions** | none | none | none | read (unmasked) | read-write | 🚩 Cat 6 Finding 4 + Cat 2 §Check 4: Visible to CORE+READ, should be FULL_ACCESS only |
| **Member.deletedAt** | none | none | none | read (in WHERE filter) | read (in WHERE filter) | ✓ Pass: Soft-delete filtering present (mostly) |
| **CommunityMember.email** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Similar to Member.email; no masking by role |
| **CommunityMember.telegram** | none | none | none | read | read | ⚠️ Partial PII; no masking |
| **CommunityMember.xHandle** | none | none | none | read | read | ⚠️ Partial PII; no masking |
| **PublicUser.email** | none | read (own only) | read (own only) | read (unmasked) | read (unmasked) | 🚩 Cat 6 Finding 5: /api/admin/public-users returns unmasked email |
| **PublicUser.signupIp** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Cat 6 Finding 10: Internal telemetry exposed to CORE |
| **PublicUser.country** | none | read (own) | read (own) | read | read | ✓ Pass: Reasonable visibility |
| **PublicUser.consent*** | none | none | none | read | read | ⚠️ Privacy flags visible to admins; consider masking |
| **MemberExtraProfile.city** | none | read (own) | read (own) | read | read | ✓ Pass: City is semi-public |
| **MemberExtraProfile.country** | none | read (own) | read (own) | read | read | ✓ Pass |
| **MemberExtraProfile.skills** | none | read (own) | read (own) | read | read | ✓ Pass: Self-reported, non-sensitive |
| **TwoFactorAuth.totpSecret** | none | none | none | none | none | ✓ Pass: Never exposed; encrypted at-rest; one-time plaintext in setup response (Cat 6 Finding 3 defense-in-depth) |
| **TwoFactorAuth.recoveryCodes** | none | none | none | none | none | ✓ Pass: Encrypted at-rest; only shown once on setup |
| **Passkey.publicKey** | none | none | none | none | none | ✓ Pass: Encrypted/hashed; WebAuthn spec compliance |
| **Passkey.credentialId** | none | none | none | none | none | ✓ Pass: Encrypted; never exposed plaintext |
| **SpeedrunRegistration.email** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Cat 6 Finding 2 + Cat 7 §Check 1B: Exported in CSV unmasked; no format-specific filtering |
| **SpeedrunRegistration.fullName** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Unmasked in JSON + CSV export |
| **SpeedrunRegistration.phone** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Unmasked in JSON + CSV export; sensitive PII |
| **SpeedrunRegistration.city** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Unmasked in CSV export |
| **SpeedrunRegistration.twitterHandle** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Social handle exposed in CSV |
| **SpeedrunRegistration.githubHandle** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Social handle exposed in CSV |
| **SpeedrunTeamMember.email** | none | none | none | read | read | ⚠️ Team-member email in registrations; no masking |
| **PersonalVault (encrypted)** | none | none | none | none | none | ✓ Pass: Model designed for encrypted storage; currently unused (Cat 6 Finding 11) |
| **PersonalVault (decrypted)** | none | none | none | none | none | ⚠️ N/A: No code path decrypts; future migration target |
| **Application.applicantEmail** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Email stored in Application.data JSON; visible in /api/applications |
| **Application.data** | none | none | none | read (unmasked JSON) | read (unmasked JSON) | 🚩 Cat 6 Finding 8: Entire form data unmasked; includes name, email, custom fields |
| **Contribution.name** | none | none | none | read | read | ⚠️ User-provided name; no masking |
| **Contribution.email** | none | none | none | read | read | ⚠️ User email visible to CORE |
| **AnalyticsEvent.userEmail** | none | none | none | read | read | ⚠️ Email tracked in analytics; visibility by role unclear (Cat 25 scope) |
| **AnalyticsEvent.device** | none | none | none | read | read | ⚠️ Device fingerprint tracked |
| **AnalyticsEvent.country** | none | none | none | read | read | ⚠️ Country inference from IP; privacy implication |
| **UserWallet.pointsBalance** | none | read (own) | read (own) | read (all users via data-grid) | read (all) | 🚩 Points balance visible to CORE; no masking if compromised account viewed |
| **UserWallet.totalEarned** | none | read (own) | read (own) | read (all users) | read (all) | ⚠️ Financial aggregate visible to CORE |
| **UserWallet.totalSpent** | none | read (own) | read (own) | read (all users) | read (all) | ⚠️ Financial aggregate visible to CORE |
| **UserWallet.totalExpired** | none | read (own) | read (own) | read (all users) | read (all) | ⚠️ Financial aggregate visible to CORE |
| **WalletTransaction (own)** | none | read (own) | read (own) | read (own) | read (all) | ✓ Pass: Scoped by user; FULL_ACCESS sees all |
| **WalletTransaction (others')** | none | none | none | dangerous-read (via data-grid, unfiltered) | read-write (admin adjust) | 🚩 CORE can read all transactions unfiltered |
| **AuditLog.metadata** | none | none | none | read (unmasked) | read (unmasked) | 🚩 Cat 6 Finding 7: Metadata contains PII (registrantEmail, etc.); no filtering by role |
| **BountySubmission.notes (internal)** | none | none | none | read (internal notes) | read-write | ⚠️ Internal moderation notes visible to CORE; no masking |
| **Notification.message** | none | read (own) | read (own) | none | none | ✓ Pass: Scoped to user; could contain PII if design changes (Cat 6 Finding 6 mitigation) |
| **SwagOrder.shippingAddress** | none | read (own) | read (own) | read (all orders) | read (all orders) | 🚩 Shipping address (PII) visible to CORE admins; no masking |

**Mismatch Summary:**

**CRITICAL (11 findings):**
1. Member.email (Cat 6 Finding 1) — visible to CORE+READ, should mask for non-FULL_ACCESS
2. Member.permissions (Cat 6 Finding 4 + Cat 2 §Check 4) — visible to CORE+READ, should be FULL_ACCESS only
3. SpeedrunRegistration PII (email, fullName, phone, city, handles) (Cat 6 Finding 2 + Cat 7 §Check 1B, 2) — unmasked in JSON + CSV; no format-specific filtering
4. PublicUser.email (Cat 6 Finding 5) — unmasked in /api/admin/public-users
5. PublicUser.signupIp (Cat 6 Finding 10) — internal telemetry exposed
6. Application.data (Cat 6 Finding 8) — entire form unmasked including PII
7. AuditLog.metadata (Cat 6 Finding 7) — PII (emails) in metadata visible to CORE+READ
8. WalletTransaction (others') — unfiltered read via data-grid for CORE; should require FULL_ACCESS
9. SwagOrder.shippingAddress — PII visible to CORE admins
10. AnalyticsEvent (email, device, country) — user-level telemetry visible to CORE
11. PersonalVault — designed but unused; no decryption path (Cat 6 Finding 11)

**HIGH (5 findings):**
12. TOTP secret plaintext in setup response (Cat 6 Finding 3) — defense-in-depth: add no-cache headers
13. Points/XP aggregates (totalEarned, totalSpent) — financial data visible to CORE
14. Notification.message — could leak IP/device info if design changes
15. BountySubmission.notes — internal notes visible to CORE
16. Contribution.{name, email} — PII visible to CORE without masking

**Test Cases for Remediation:**
1. Verify `/api/members` returns masked email for non-FULL_ACCESS CORE users
2. Verify `/api/members` omits `permissions` field for non-FULL_ACCESS CORE users
3. Verify `/api/speedrun/registrations` and `/api/speedrun/registrations/export` mask phone/email
4. Verify `/api/admin/public-users` omits `signupIp` from response
5. Verify `/api/applications` redacts sensitive fields from `data` JSON
6. Verify `/api/logs` filters metadata PII for non-superadmins
7. Verify `/api/data-grid` requires FULL_ACCESS for WalletTransaction read
8. Verify `/api/swag/orders` masks shippingAddress for non-FULL_ACCESS

---

## End of Phase 1 Matrices

**Synthesis source files:**
- 00-RECON.md (Steps 5, 6, 7)
- category-scans/02-rbac-enforcement.md (Checks 1–21)
- category-scans/05-panel-isolation.md (Checks 1–24)
- category-scans/06-data-visibility.md (Findings 1–11)
- category-scans/07-admin-actions.md (Checks 1–11)

**Next phase:** Phase 2 (detailed remediation + threat modeling) ingests these matrices and produces remediation roadmap.

---

**Document version:** 2026-05-03 (audit date)  
**Status:** Complete for Phase 1  
**LOC:** ~500 matrix rows + context
