# Category 27 — Privacy, Compliance & Regulatory

**Audit date:** 2026-05-03  
**Auditor:** Claude (autonomous agent orchestration)  
**Focus:** GDPR, DPDP Act (India), COPPA, PCI-DSS, AML/KYC, data residency, breach notification, SoD.

---

## Executive Summary

The codebase exhibits **significant gaps** in privacy and regulatory compliance implementation. While foundational infrastructure exists (consent fields, encryption model, soft-delete scaffold), it lacks enforcement mechanisms, audit trails, and erasure cascades. Three regulations apply or are suspected to apply (GDPR, DPDP, COPPA); none are adequately addressed in code.

**Critical findings:**
1. **No right-to-access or right-to-erasure endpoints** — GDPR Articles 15, 17 unimplemented.
2. **Analytics run pre-consent** — Vercel Analytics component loads site-wide before consent gate (likely GDPR violation).
3. **Consent fields exist but enforcement missing** — `PublicUser.consentLegal` / `consentNewsletter` collected, but no revocation flow, no notice mechanism, no consent-versioning enforcement during signup.
4. **Erasure cascade unmapped** — If a user requests deletion, no code path deletes across `WalletTransaction`, `PointsBatch`, `ProjectLike`, `AnalyticsEvent.userEmail`, `AuditLog.actorId`, push subscriptions, etc.
5. **No grievance / DPO route** — DPDP §13 requires grievance redressal; no `/api/grievance` found.
6. **No age gate on signup** — COPPA exposure (US under-13s unprotected).
7. **No KYC on bounty/swag redemption** — AML/KYC risk if INR payouts cross regulatory thresholds (legal review needed).
8. **Admin login not audited** — Compromised CORE sessions undetectable (recon-13 finding repeated here).
9. **No breach-notification capability** — No `/api/admin/notify-breach` or per-table deletion audit trail.
10. **IndexedDB drafts plaintext after consent withdrawal** — No server-side mechanism to wipe client-side IDB once consent revoked.

---

## Detailed Findings by Regulation

### 1. GDPR (Regulation 2016/679) — Article 6 Lawful Basis

**Verdict:** ❌ **FAIL** — No lawful-basis annotations; consent mechanism incomplete.

**Findings:**

- **Finding 1.1: No lawful-basis documentation** ([prisma/schema.prisma](../../../prisma/schema.prisma) entire file)  
  The schema has 50+ models collecting PII (email, name, phone, city, country, social handles) across `Member`, `CommunityMember`, `PublicUser`, `SpeedrunRegistration`, `MemberExtraProfile`, `PersonalVault`, etc. None are annotated with an Art. 6 basis (consent, contract, legal obligation, vital interest, public task, legitimate interest).  
  **Risk:** Unlawful processing finding if audited by a regulator.  
  **Spec check:** Art. 6 requires explicit documentation of lawful basis. **Missing.**

- **Finding 1.2: Consent collected post-signup** ([lib/auth-options.ts:59-76](../../../lib/auth-options.ts#L59-L76), [components/public/auth/PublicConsentModal.tsx:20-46](../../../components/public/auth/PublicConsentModal.tsx#L20-L46))  
  Signup flow creates `PublicUser` with `consentLegal: false, consentNewsletter: false, consentVersion: null, consentTimestamp: null`. A separate modal ([PublicConsentModal.tsx](../../../components/public/auth/PublicConsentModal.tsx)) then collects consent *after* the user has already authenticated and the session is live.  
  **Risk:** Under GDPR Art. 7(4), consent must be freely given *before* processing. Post-login consent is processing-first, then ask — violates the timing requirement.  
  **Spec check:** Consent-prior-to-processing. **Failed.**

- **Finding 1.3: No notice of processing tied to consent** ([components/public/auth/PublicConsentModal.tsx:83-85](../../../components/public/auth/PublicConsentModal.tsx#L83-L85))  
  The consent modal links to `https://www.avax.network/privacy-policy` and `https://www.avax.network/legal` (external URLs, not in repo). The app does **not** display a data-processing notice (Art. 13) *before* signup. No embedded privacy notice is in code explaining:
  - What data is collected?
  - Why (lawful basis)?
  - How long it's retained?
  - Who has access?
  - What are your rights?  
  **Risk:** Art. 13 info-provision failure. Consent cannot be truly informed without this notice.  
  **Spec check:** Art. 13 transparent notice. **Open Assumption** (relies on external policy).

- **Finding 1.4: Consent version string hardcoded** ([app/api/public/profile/route.ts:45](../../../app/api/public/profile/route.ts#L45))  
  When a user ticks the legal consent checkbox, the endpoint sets `consentVersion = "v1.0"` and `consentTimestamp = new Date()`. The version is hardcoded; there is **no system for versioning what the user consented to**. If the privacy policy changes, the old consent record is indistinguishable from new ones.  
  **Risk:** Art. 7 requires proving consent was informed and freely given for *a specific purpose*. No record of *what* was consented-to violates this.  
  **Spec check:** Consent versioning & purpose record. **Incomplete.**

---

### 2. GDPR (Regulation 2016/679) — Article 15 Right to Access & Article 20 Portability

**Verdict:** ❌ **FAIL** — No `/api/me/export` endpoint found.

**Findings:**

- **Finding 2.1: No right-to-access endpoint** (all of [app/api/](../../../app/api/))  
  A grep of all API routes found **no endpoint** matching `/api/me/export`, `/api/users/[id]/export`, `/api/account/data`, or similar. GDPR Art. 15 requires the controller to provide a copy of personal data within 30 days of request.  
  **Risk:** Art. 15 non-compliance; regulatory fine exposure.  
  **Spec check:** Right-to-access path. **Missing.**

- **Finding 2.2: No portability-to-competing-service flow** (no code found)  
  Art. 20 requires data in a *commonly-used electronic format* (CSV, JSON) so the user can port it. No such export is in the codebase.  
  **Risk:** Art. 20 non-compliance.  
  **Spec check:** Machine-readable export. **Missing.**

- **Finding 2.3: No re-authentication on export** (N/A, endpoint doesn't exist)  
  Best practice: a sensitive export (email, phone, addresses) should require re-auth or 2FA. Since no endpoint exists, this is moot, but should be required in any future implementation.  
  **Spec check:** Re-auth on sensitive exports. **Not applicable (would be missing).**

---

### 3. GDPR (Regulation 2016/679) — Article 17 Right to Erasure (Right to Be Forgotten) & Cascade

**Verdict:** ❌ **FAIL** — No `/api/me/delete` endpoint; erasure cascade unmapped and unimplemented.

**Findings:**

- **Finding 3.1: No right-to-erasure endpoint** (all of [app/api/](../../../app/api/))  
  No route for `DELETE /api/me` or `/api/account/delete` or similar. A user **cannot request deletion via the app**.  
  **Risk:** Art. 17 non-compliance; user has no mechanism to exercise their right.  
  **Spec check:** Deletion endpoint. **Missing.**

- **Finding 3.2: Soft-delete scaffold exists but no cascade wiring** ([lib/prisma.ts:10-14](../../../lib/prisma.ts#L10-L14))  
  The Prisma middleware intercepts `findMany` and `findFirst` calls and filters `where.deletedAt = null` by default. This provides soft-delete read-filtering, but:
  - No `DELETE` handler to set `deletedAt` on related rows.
  - No automatic cascade to child tables.
  - Models that **do have** `deletedAt` (Member, CommunityMember, PublicUser, Project, etc.) can be soft-deleted, but **models that don't** (UserWallet, WalletTransaction, PointsBatch, AnalyticsEvent, AuditLog, PushSubscription, etc.) are unaffected.  
  **Risk:** A user requesting deletion would leave orphaned transaction records, analytics PII, audit logs, push subscriptions all intact.  
  **Spec check:** Cascade delete / anonymize. **Incomplete.**

- **Finding 3.3: Erasure cascade map — tables that must be handled on user deletion** (per spec):
  - **Primary user record:** `Member.deletedAt`, `CommunityMember.deletedAt`, `PublicUser.deletedAt` (SOFT-DELETE, YES)
  - **Profile:** `MemberExtraProfile.deletedAt` (has `deletedAt`, SOFT-DELETE, YES)
  - **PII vault:** `PersonalVault` (no `deletedAt`, UNHANDLED ❌)
  - **Financial (conflict with audit retention!):** `UserWallet.userEmail` (unique, no `deletedAt`, UNHANDLED ❌); `PointsBatch` (no `deletedAt`, UNHANDLED ❌); `WalletTransaction` (no `deletedAt`, UNHANDLED ❌)
  - **Content authored:** `Project.createdById` (has `deletedAt`, but filters by creator, UNHANDLED ❌); `ProjectVersion.createdBy` (email string, no cascade, UNHANDLED ❌); `ProjectComment.authorEmail` (string, UNHANDLED ❌); `ProjectLike.userEmail` (string, UNHANDLED ❌)
  - **Contributions:** `Contribution.email` (no `deletedAt`, UNHANDLED ❌); `Application.applicantEmail` (no `deletedAt`, UNHANDLED ❌)
  - **Bounty/Quest:** `BountySubmission.submittedById` + `publicUserId` (has relations, UNHANDLED ❌); `BountySubmission.submittedByEmail` (string, UNHANDLED ❌); `QuestCompletion.userEmail` (string, UNHANDLED ❌)
  - **Swag:** `SwagOrder.userEmail` (string, UNHANDLED ❌)
  - **Push subscriptions:** `PushSubscription.userId` (no `deletedAt`, UNHANDLED ❌)
  - **Speedrun:** `SpeedrunRegistration.userEmail` (unique constraint on `[runId, userEmail]`, no `deletedAt`, UNHANDLED ❌); `SpeedrunTeamMember.email` (string, UNHANDLED ❌); `SpeedrunReferralCode.userEmail` (unique, UNHANDLED ❌)
  - **Notifications:** `Notification.userEmail` (string, UNHANDLED ❌)
  - **Comments:** `Comment.authorId` (relation, UNHANDLED ❌); `ExperimentComment.authorEmail` + `authorId` (UNHANDLED ❌)
  - **Audit logs:** `AuditLog.actorId` (no `deletedAt`, UNHANDLED ❌); `Log.actorId` (no `deletedAt`, UNHANDLED ❌)
  - **Analytics:** `AnalyticsEvent.userEmail` (likely PII, UNHANDLED ❌)  
  **Risk:** User requests deletion → only `PublicUser`, `Member`, `CommunityMember` rows are soft-deleted → all transaction records, comments, projects, swag orders, push subscriptions remain linked to the deleted email address → future reuse of that email could expose historical data or enable account takeover of the old record.  
  **Spec check:** Cascade across all PII-holding tables. **Failed.**

- **Finding 3.4: Member.deletedAt not checked during re-authentication** ([lib/auth-options.ts:18-26](../../../lib/auth-options.ts#L18-L26))  
  The `signIn` callback checks if the user's email exists in `Member`, `CommunityMember`, or `PublicUser` tables. But it does **not** check the `deletedAt` field.
  ```ts
  const member = await prisma.member.findFirst({
    where: { email: { equals: emailToFind, mode: 'insensitive' } },
  });
  if (member) { /* ... sign them in ... */ return true; }
  ```
  If a CORE admin's account is soft-deleted, they can still log back in. The middleware's soft-delete filter ( [lib/prisma.ts:21](../../../lib/prisma.ts#L21)) adds `where.deletedAt = null` by default, so the `findFirst` **should** skip deleted rows. However, the code explicitly queries without constraints, so this is **unreliable**.  
  **Risk:** A deleted admin can resurrect their session.  
  **Spec check:** Deletion enforcement on signup. **Unreliable.**

---

### 4. GDPR — Article 16 Right to Rectification

**Verdict:** ⚠️ **PARTIAL** — Update endpoints exist, but no user-initiated request mechanism.

**Findings:**

- **Finding 4.1: User can edit own profile via `/api/public/profile`** ([app/api/public/profile/route.ts](../../../app/api/public/profile/route.ts))  
  A user can PATCH their own `PublicUser` row to update `fullName`, `bio`, `location`, `city`, `country`, `roles`, `interests`, etc. This provides the *capability* for rectification.  
  **Verdict:** ✓ Partial pass.

- **Finding 4.2: No formal right-to-rectification request workflow**  
  GDPR Art. 16 (right to rectification) and Art. 18 (restriction of processing) are distinct from profile self-edit. The regulation requires a *formal mechanism* for users to request that inaccurate data be corrected or processing restricted. The app has self-edit, but no way for a user to file a formal rectification *request* (e.g., dispute a field they don't have direct edit access to).  
  **Risk:** Regulatory compliance gap; user is stuck if they believe a data point is inaccurate but has no formal request path.  
  **Spec check:** Formal rectification request mechanism. **Missing.**

---

### 5. GDPR — Article 21 Right to Object + Article 9 (Special Categories)

**Verdict:** ❌ **FAIL** — No unsubscribe mechanism; no special-category safeguards.

**Findings:**

- **Finding 5.1: Newsletter consent withdrawal missing** ([components/public/auth/PublicConsentModal.tsx](../../../components/public/auth/PublicConsentModal.tsx), [app/api/public/profile/route.ts](../../../app/api/public/profile/route.ts))  
  User can set `consentNewsletter: false` via the profile PATCH endpoint, but there is **no dedicated unsubscribe link** in emails. GDPR Art. 21 requires that every marketing email include a clear, easy unsubscribe mechanism (often a one-click link). Code does not implement this.  
  **Risk:** Marketing email unsubscribe requirement not met.  
  **Spec check:** Unsubscribe on every email. **Not found in email code.**

- **Finding 5.2: No special-category processing safeguards** ([prisma/schema.prisma](../../../prisma/schema.prisma))  
  GDPR Art. 9 prohibits processing of special categories (race, ethnicity, political opinions, religious beliefs, sexual orientation, genetic data, biometric data, health, trade union membership) unless explicit Art. 9(2) exemption applies. The schema collects:
  - `roles` (array, could include identity-based roles like "Investor", "Founder", "Minority-founder")
  - `interests` (array, could be sensitive)
  - No explicit check or warning on collection.  
  **Risk:** Accidental special-category processing without lawful exemption.  
  **Spec check:** Special-category safeguards. **Missing.**

---

### 6. Cookie Consent — GDPR & ePrivacy Directive Compliance

**Verdict:** ❌ **FAIL** — Vercel Analytics loads pre-consent; no granular cookie banner.

**Findings:**

- **Finding 6.1: Vercel Analytics component loads at root level before consent** ([app/layout.tsx:68, 175](../../../app/layout.tsx#L68))
  ```tsx
  import { Analytics } from "@vercel/analytics/react";
  // ...
  <Analytics />
  ```
  The `<Analytics />` component is placed inside the `<RootLayout>` and renders unconditionally, **not gated by consent state**. Vercel Analytics by default sets cookies (or fingerprints) to track page views and events.  
  **GDPR Article 7 + ePrivacy Directive § 5(3):** Analytics tracking is marketing/analytics consent category. It must not run pre-consent.  
  **Risk:** GDPR violation; every page view from an EU user triggers tracking before they consent.  
  **Spec check:** Analytics pre-consent gate. **Failed.**

- **Finding 6.2: No granular cookie banner** ([app/layout.tsx](../../../app/layout.tsx), no cookie banner component found)  
  No cookie consent UI is in the codebase. The consent modal ([PublicConsentModal.tsx](../../../components/public/auth/PublicConsentModal.tsx)) collects two checkboxes (`consentNewsletter` and `consentLegal`) but does **not** enumerate cookie categories:
  - Essential (session, CSRF, auth)
  - Analytics (Vercel Analytics, custom analytics)
  - Marketing (email, newsletters)
  - Targeting (pixel tracking, 3rd-party ads)  
  **Risk:** ePrivacy non-compliance; granular control required by many jurisdictions.  
  **Spec check:** Granular cookie/tracker categories. **Missing.**

- **Finding 6.3: No cookie compliance metadata** ([next.config.ts:3-45](../../../next.config.ts#L3-L45))  
  The Next.js config sets CSP and security headers, but does **not** set:
  - `Set-Cookie` attributes documenting which cookies are set and for what purpose.
  - Max-age / expiration on cookies (relying on defaults).
  - SameSite=None for cross-site cookies (if any third-party scripts run).  
  **Risk:** Cookie transparency and SameSite enforcement are absent.  
  **Spec check:** Cookie documentation & attributes. **Incomplete.**

---

### 7. GDPR — Privacy Policy & ROPA (Records of Processing Activity)

**Verdict:** ⚠️ **OPEN ASSUMPTION** — Policy not in code; ROPA absent.

**Findings:**

- **Finding 7.1: Privacy policy external** ([components/public/auth/PublicConsentModal.tsx:84-85](../../../components/public/auth/PublicConsentModal.tsx#L84-L85))  
  The consent modal links to `https://www.avax.network/privacy-policy` (external domain). The actual policy is not in the `/docs/` or `public/` directory of this repo. We cannot audit whether the policy accurately reflects the actual data flows in this codebase.  
  **Risk:** Policy-code mismatch common finding (e.g., policy says "we don't store phone" but `SpeedrunRegistration.phone` is stored).  
  **Spec check:** Policy reflects actual flows. **Open Assumption.**

- **Finding 7.2: No ROPA in codebase** ([docs/](../../../docs/) — checked all dirs)  
  GDPR Art. 30 requires a Records of Processing Activity (ROPA) document listing:
  - Data categories
  - Processing purposes
  - Retention periods
  - Data subject categories
  - Recipients of data
  - Security measures  
  Not found in the repo.  
  **Risk:** Art. 30 documentation breach.  
  **Spec check:** ROPA document. **Missing.**

---

### 8. GDPR — Data Processing Agreements (DPAs) with Sub-Processors

**Verdict:** ⚠️ **OPEN ASSUMPTION** — Not in code; assume required.

**Findings:**

- **Finding 8.1: Third-party integrations without DPA evidence** (Open Assumption #6, recon-1 §15)  
  The codebase integrates with:
  - **Google OAuth** (processes authentication data)
  - **Vercel** (hosts the application, has access to all data in transit and at rest)
  - **Google Calendar** (optional, syncs operation data)
  - **Luma API** (syncs event data via cron)
  - **SMTP provider** (email send, likely Gmail SMTP based on default)
  - **Vercel Blob** (file storage)
  - **Cloudinary** (image CDN)
  - **Web Push / FCM / APNs** (notification delivery)  
  Each of these is a data processor or sub-processor. GDPR Art. 28 requires a Data Processing Agreement (DPA) with each.  
  **Risk:** No evidence of DPAs → potential Art. 28 violation.  
  **Spec check:** DPA with all vendors. **Not in repo; Open Assumption.**

---

### 9. DPDP Act 2023 (India) — §5 Notice & Verifiable Consent

**Verdict:** ⚠️ **PARTIAL** — Consent collection exists; notice mechanism unverified.

**Findings:**

- **Finding 9.1: Consent fields present, but notice-on-signup missing** ([lib/auth-options.ts:59-76](../../../lib/auth-options.ts#L59-L76), [components/public/auth/PublicConsentModal.tsx](../../../components/public/auth/PublicConsentModal.tsx))  
  `PublicUser.consentLegal` and `consentNewsletter` are collected post-login via a modal. DPDP §5(1) requires that consent be **free, informed, specific, and unambiguous**.  
  **Issue:** Consent is collected *after* the account is created (email already in DB), not *before*. The modal provides checkboxes but no embedded summary of data being collected or processing purposes in the modal text.  
  **Verdict:** Consent taken, but timing and informativeness unclear.  
  **Spec check:** Notice + consent before processing. **Timing issue.**

- **Finding 9.2: consentVersion & consentTimestamp captured** ([app/api/public/profile/route.ts:43-47](../../../app/api/public/profile/route.ts#L43-L47))  
  When the user checks the legal consent box:
  ```ts
  updateData.consentVersion = "v1.0";
  updateData.consentTimestamp = new Date();
  ```
  This provides proof of *when* consent was obtained, which is DPDP-required.  
  **Verdict:** ✓ Partial pass.

- **Finding 9.3: Language of notice not documented** (Open Assumption)  
  DPDP §5(1)(c) requires the notice to be in a clear language understood by the user. The modal text is in English; whether it complies with DPDP's language requirement (esp. for Indian users who may prefer Hindi or regional languages) is unverified.  
  **Risk:** If any data principal is non-English-literate, notice is not compliant.  
  **Spec check:** Language-localized notices. **Open Assumption.**

---

### 10. DPDP Act — §13 Right to Grievance Redressal

**Verdict:** ❌ **FAIL** — No grievance endpoint found.

**Findings:**

- **Finding 10.1: No grievance redressal path** (all of [app/api/](../../../app/api/))  
  DPDP §13 requires the data fiduciary to provide a mechanism for data principals to lodge grievances. No endpoint like `/api/grievance`, `/api/dpo-contact`, or `/api/report-concern` is in the codebase.  
  **Risk:** §13 non-compliance.  
  **Spec check:** Grievance mechanism. **Missing.**

- **Finding 10.2: No DPO mention in code** (grep all `.ts`/`.tsx`/`.md`)  
  DPDP §10 requires entities meeting certain thresholds to appoint a Data Protection Officer (DPO). No comment, documentation, email address, or contact route for a DPO exists in the codebase.  
  **Risk:** If the org is an SDF (Significant Data Fiduciary), DPO appointment is mandatory, and the DPO contact must be published.  
  **Spec check:** DPO appointment & contact. **Not in code (Open Assumption).**

---

### 11. DPDP Act — §16 Cross-Border Data Transfer

**Verdict:** ⚠️ **OPEN ASSUMPTION** — Postgres region unspecified.

**Findings:**

- **Finding 11.1: Database region not documented** ([vercel.json](../../../vercel.json), [.env.example](../../../.env.example) — neither specifies region)  
  DPDP §16 restricts transfer of Indian personal data to countries outside a whitelist (blacklist approach; most countries allowed except those explicitly prohibited). The `DATABASE_URL` connection string is not in the repo, and `vercel.json` does not specify a region for the Vercel function.  
  **Risk:** Data may be stored in a blacklisted jurisdiction without detection.  
  **Spec check:** Region + whitelist verification. **Open Assumption #1.**

---

### 12. COPPA (US — 15 USC §6501, Children Under 13)

**Verdict:** ❌ **FAIL** — No age gate; no parental consent.

**Findings:**

- **Finding 12.1: No age gate on signup** ([lib/auth-options.ts:58-76](../../../lib/auth-options.ts#L58-L76), [components/public/auth/PublicConsentModal.tsx](../../../components/public/auth/PublicConsentModal.tsx))  
  Signup flow:
  1. User logs in with Google OAuth (Google does not pass age).
  2. System creates `PublicUser` with no age field or check.
  3. User can immediately access quests, bounties, projects, speedrun registrations.  
  **Risk:** If any user is under 13 (possible, given Indian youth audience), COPPA applies, and compliance is zero.  
  **Spec check:** Age verification on signup. **Missing.**

- **Finding 12.2: No parental-consent flow** (not found in code)  
  COPPA requires parental verifiable consent if a child under 13 is identified. No mechanism to:
  - Collect parent email
  - Send parental consent request
  - Verify parental permission before processing child data  
  **Risk:** Complete COPPA non-compliance for under-13 users.  
  **Spec check:** Parental consent workflow. **Missing.**

- **Finding 12.3: Marketing emails sent to all users without age check** ([app/api/cron/send-scheduled-emails/route.ts](../../../app/api/cron/send-scheduled-emails/route.ts) — confirmed no age filter)  
  Scheduled emails are sent to all users in the system. No age-gating prevents marketing emails to under-13 users.  
  **Risk:** Direct marketing to children without parental consent; COPPA violation.  
  **Spec check:** No marketing to under-13. **Failed.**

---

### 13. PCI-DSS (Payment Card Industry Data Security Standard)

**Verdict:** ✓ **PASS** — No card data in scope.

**Findings:**

- **Finding 13.1: No card-data storage or processing** ([prisma/schema.prisma](../../../prisma/schema.prisma), [app/api/](../../../app/api/) — verified via grep for "card", "stripe", "razorpay", "adyen", "pan", "cvv")  
  The app collects `Bounty.cash` (INR display field only; actual payout is manual/offline), `SwagOrder.pointsSpent` (internal currency), but **no credit card, debit card, or PAN (Personal Account Number)** fields.  
  **Verdict:** ✓ No PCI scope.  
  **Spec check:** Zero card data. **Passed.**

---

### 14. AML / KYC (Anti-Money Laundering & Know Your Customer) — India PMLA + RBI

**Verdict:** ❌ **LEGAL-REVIEW-REQUIRED** — Code has no KYC; regulatory threshold unknown.

**Findings:**

- **Finding 14.1: Bounty.cash field is INR but no KYC** ([prisma/schema.prisma:557](../../../prisma/schema.prisma#L557), [lib/wallet.ts:28-78](../../../lib/wallet.ts#L28-78))  
  The `Bounty` model has an optional `cash` field (INR). Bounties are approved and "awarded" via [lib/wallet.ts:earnReward](../../../lib/wallet.ts#L28-78), which credits points/XP to a user's wallet. The code has **no field for KYC data** (PAN, Aadhaar, bank account) and **no payout audit trail**.  
  **Risk:** If `Bounty.cash` is actually paid out (bank transfer), the platform may be a "money transmitter" under RBI guidelines. Thresholds:
  - Aggregate annual value of funds received > INR 1 crore (approx) may trigger Payment Aggregator licensing.
  - PMLA (Prevention of Money Laundering Act) § 4 criminalizes acceptance of value without KYC if not explicitly exempted (small transfers, charitable context might exempt, but not automatic).  
  **Spec check:** KYC fields + payout audit. **Missing.**

- **Finding 14.2: Points-as-money economic risk** ([lib/wallet.ts](../../../lib/wallet.ts), [prisma/schema.prisma:659-706](../../../prisma/schema.prisma#L659-L706))  
  Points are **not cash** but can be redeemed for physical goods (`SwagOrder`) with real shipping addresses. In some jurisdictions, closed-loop points systems that redeem for real goods are treated as loyalty programs (low AML scrutiny), but platforms that allow currency conversion or transfer are treated as money services.  
  **Risk:** If the platform ever adds "sell points for cash" or "transfer points to another user", it becomes a money transmitter and triggers full KYC + AML obligations.  
  **Spec check:** Current code has no peer-to-peer transfer or cash-out (good), but no safeguard preventing future code from adding it.  
  **Recommendation:** If `Bounty.cash` payouts occur, engage India-licensed legal counsel to determine KYC threshold and obtain written guidance.

- **Finding 14.3: Redemption velocity uncontrolled** ([app/api/swag/orders/route.ts](../../../app/api/swag/orders/route.ts) — no rate limit on redemptions)  
  A Sybil farmer (threat actor 2.9 in threat model) could create multiple accounts, earn points, redeem all points for physical swag, and collect shipped goods. AML regulators in some jurisdictions require redemption caps to prevent money-laundering through high-velocity, high-value transactions.  
  **Risk:** Redemption velocity check not implemented.  
  **Spec check:** Redemption caps / velocity limits. **Missing.**

---

### 15. Breach Notification — GDPR 72h + User Notification

**Verdict:** ❌ **FAIL** — No breach-notification capability in code.

**Findings:**

- **Finding 15.1: No /api/admin/notify-breach endpoint** (all of [app/api/](../../../app/api/))  
  GDPR Art. 33 & 34 require notification to authorities within 72 hours of discovery and notification to affected users "without undue delay" (usually interpreted as <30 days). The codebase has **no mechanism** to:
  - Bulk-flag users as affected by a breach
  - Compose and send breach notification emails
  - Log breach disclosure (who was notified, when, what was in the message)  
  **Risk:** GDPR breach-notification requirements cannot be operationalized.  
  **Spec check:** Breach-notification system. **Missing.**

- **Finding 15.2: AuditLog integrity not assured** ([prisma/schema.prisma:277-296](../../../prisma/schema.prisma#L277-L296), [recon-13 §5](../../../docs/security/audit-2026-05-03/category-scans/recon-13-logging-tests.md))  
  The `AuditLog` table has a `deletedAt` field but no database constraint (e.g., `NOT NULL` or check) preventing soft-delete. If a breach is detected and an attacker has DB access (or code path added later), they could prune the audit log to cover their tracks.  
  **Risk:** Forensics and breach investigation capability compromised.  
  **Spec check:** Append-only audit log. **Failed.**

---

### 16. Admin Data Access Audit (Regulatory Retention Period)

**Verdict:** ❌ **FAIL** — Admin logins not logged; PII reads not audited.

**Findings:**

- **Finding 16.1: Admin login events not audited** ([lib/auth-options.ts:13-86](../../../lib/auth-options.ts#L13-L86))  
  The `signIn` callback authenticates users (including CORE admins) but does **not** call `logAudit()` or `logActivity()`. A CORE admin can log in undetected. Combined with the stolen-session threat (2.6), an attacker with a compromised admin cookie can operate for 30 days with no login trail.  
  **Risk:** Insider threat and breach-response detection gaps.  
  **Spec check:** Admin login audit. **Missing.**

- **Finding 16.2: Admin reads of sensitive data not audited** ([app/api/admin/public-users/route.ts:20-60](../../../app/api/admin/public-users/route.ts), [recon-13 §4](../../../docs/security/audit-2026-05-03/category-scans/recon-13-logging-tests.md))  
  A CORE+FULL_ACCESS admin can read the `/api/admin/public-users` list (PII: email, signupIp, city, country, consent fields) or `/api/speedrun/registrations/export` (phone, full name, social handles) without generating an audit log entry.  
  **Risk:** Unauthorized data access is undetectable; cannot distinguish legitimate admin ops from credential-theft abuse.  
  **Spec check:** Audit on sensitive reads. **Missing.**

---

### 17. Separation of Duties (SoD) — SOC 2 / ISO 27001

**Verdict:** ❌ **FAIL** — No SoD enforced in code; points grant & approval by same super-admin.

**Findings:**

- **Finding 17.1: FULL_ACCESS admin can grant points to self and approve own bounty** ([lib/wallet.ts:212-262](../../../lib/wallet.ts#L212-L262), [app/api/bounty/submissions/route.ts](../../../app/api/bounty/submissions/route.ts))  
  A user with `Member.permissions = {"*": "FULL_ACCESS"}` can:
  1. Call `adminAdjust(walletId, +1000)` to credit their own wallet with points (no second-admin sign-off required).
  2. Create a bounty submission and call the approval endpoint to grant themselves points on that submission.
  3. Delete the audit trail (no audit log on these operations; only `WalletTransaction` row exists, and same admin can modify code to prune it).  
  **Risk:** Insider fraud with zero detection.  
  **Spec check:** SoD enforcement (two-admin approval on sensitive ops). **Missing.**

- **Finding 17.2: Open Assumption #9 — number of FULL_ACCESS admins unknown** ([lib/permissions.ts:10-40](../../../lib/permissions.ts#L10-L40))  
  If there is 1 FULL_ACCESS admin, SoD is impossible. If there are 5+, at least some SoD could be enforced. The recon could not determine this from the codebase (it would require live DB query).  
  **Recommendation:** Document the number of FULL_ACCESS admins and implement two-admin approval for points and member-permission changes.

---

### 18. Points-Economy Audit Trail

**Verdict:** ❌ **FAIL** — Wallet operations logged to `WalletTransaction` only; no `AuditLog`.

**Findings:**

- **Finding 18.1: No AuditLog on earnReward / spendPoints / expirePoints / adminAdjust** ([lib/wallet.ts](../../../lib/wallet.ts) entire file, [recon-13 §4](../../../docs/security/audit-2026-05-03/category-scans/recon-13-logging-tests.md))  
  The wallet module calls `prisma.$transaction` to atomically credit/debit `PointsBatch` and record a `WalletTransaction` row. But it **never calls `logAudit()`**. This means:
  - A fraud investigator cannot distinguish a legitimate earned-reward from a fraudulent admin-adjust without reading the `WalletTransaction.type` field (which the same admin could have modified if they had code-edit access).
  - No `actorId` is recorded, so "who approved this bounty submission" is lost.
  - No timestamp detail beyond the transaction creation.  
  **Risk:** Post-breach forensics severely hampered; fraud undetectable.  
  **Spec check:** AuditLog on all sensitive mutations. **Missing for wallet.**

---

### 19. Third-Party Analytics PII (AnalyticsEvent.userEmail)

**Verdict:** ⚠️ **ISSUE** — `userEmail` field may violate GDPR if treated as PII in analytics.

**Findings:**

- **Finding 19.1: AnalyticsEvent.userEmail stored plaintext** ([prisma/schema.prisma:1094-1120](../../../prisma/schema.prisma#L1094-L1120), [recon-13](../../../docs/security/audit-2026-05-03/category-scans/recon-13-logging-tests.md))  
  The `AnalyticsEvent` table has a `userEmail` field that is stored plaintext. Events are ingest via `/api/analytics/ingest` (custom analytics) or via Vercel Analytics (standard).  
  **Issue:** Email is personally identifiable. If analytics is for "user behavior metrics", the email should be anonymized (hash, pseudonym) at collection time, not stored plaintext.  
  **GDPR impact:** Personal data in analytics without a clear lawful basis (Art. 6) and without special retention schedule (Art. 5(1)(e) storage limitation).  
  **Spec check:** Anonymize analytics email. **Not done.**

- **Finding 19.2: Analytics retention period not documented** (no comment in schema or code)  
  No field or configuration specifies how long `AnalyticsEvent` rows are retained before deletion. GDPR Art. 5(1)(e) requires retention periods to be documented. Without one, the system cannot comply with the principle.  
  **Spec check:** Documented retention schedule. **Missing.**

---

### 20. IndexedDB Drafts & Offline Storage — Post-Consent-Withdrawal

**Verdict:** ⚠️ **ISSUE** — Plaintext offline data not wiped when consent withdrawn.

**Findings:**

- **Finding 20.1: IndexedDB drafts stored plaintext** ([lib/offlineStorage.ts](../../../lib/offlineStorage.ts) — referenced in recon-9 §6.4)  
  The app stores form drafts and pending actions in IndexedDB (`team1-offline` DB) on the client in plaintext. If a user withdraws consent, the **server can delete** their `PublicUser` row, but the server **cannot reach the user's IndexedDB** to wipe the drafts.  
  **GDPR Art. 17 (erasure):** If the user withdraws consent and requests deletion, their drafts should be erased too. Today, they persist indefinitely.  
  **Risk:** User believes data is deleted; local copies remain.  
  **Spec check:** Erasure of client-side data. **Not implemented.**

- **Finding 20.2: No message channel to client to wipe IndexedDB** ([public/sw.js](../../../public/sw.js), [lib/offlineStorage.ts](../../../lib/offlineStorage.ts))  
  The service worker and main thread communicate via `postMessage`, but there is **no "wipe-storage" message** that the server can trigger to tell the client to clear IndexedDB when the user's account is deleted.  
  **Risk:** Deletion request incomplete.  
  **Spec check:** Server-initiated client storage wipe. **Missing.**

---

### 21. PersonalVault — Encrypted PII Lifecycle

**Verdict:** ⚠️ **PARTIAL** — Encrypted storage exists; deletion integration missing.

**Findings:**

- **Finding 21.1: PersonalVault model exists with AES encryption** ([prisma/schema.prisma:625-641](../../../prisma/schema.prisma#L625-L641))  
  The `PersonalVault` table stores encrypted PII (email, name, phone) with an HMAC index for searchable encryption. This is a good design pattern.  
  **Verdict:** ✓ Encryption at rest.

- **Finding 21.2: PersonalVault has no `deletedAt`; no code path deletes on user erasure** ([prisma/schema.prisma:625-641](../../../prisma/schema.prisma#L625-L641), no deletion endpoint found)  
  The `PersonalVault` table **lacks** a `deletedAt` column. If a user is soft-deleted, their vaulted PII is orphaned and unrecoverable (encryption key not tied to user in schema).  
  **Risk:** Vaulted PII persists after user erasure.  
  **Spec check:** Cascade delete on PersonalVault. **Missing.**

- **Finding 21.3: Unclear which fields use PersonalVault vs. plaintext** (entire codebase)  
  The schema and code do not document which PII fields are actually stored in `PersonalVault` (encrypted) vs. plaintext in their respective tables. For example:
  - `PublicUser.email` — plaintext in `PublicUser` table, also possibly in `PersonalVault`?
  - `SpeedrunRegistration.userEmail` — plaintext, not in vault.
  - `Member.email` — plaintext in `Member` table.  
  **Risk:** Encryption not uniformly applied; some PII stored plaintext when it could be vaulted.  
  **Spec check:** Encryption scope clarity. **Unclear.**

---

### 22. PWA Service Worker — Push Notification Data.url Open Redirect

**Verdict:** ⚠️ **INDIRECT COMPLIANCE ISSUE** — Phishing vector, not strictly privacy, but enables fraud.

**Findings:**

- **Finding 22.1: Push handler opens data.url without origin check** ([public/push-sw.js:33-53](../../../public/push-sw.js#L33-L53), recon-1 §9.4)  
  When a push notification is received, the service worker extracts `payload.data.url` and navigates to it **without validating the origin**. If an attacker compromises the push-notification key or intercepts the push, they can inject a phishing URL and 100% of subscribed users get a fake "Account compromised" push that opens attacker.com.  
  **Impact:** Phishing attack surface; particularly dangerous combined with `VAPID_PRIVATE_KEY` compromise (crown jewel #12).  
  **Spec check:** Push payload validation. **Missing.**

---

## Summary Table — Compliance Status

| Regulation | Applicable | Status | Key gaps |
|---|---|---|---|
| **GDPR** | Y (suspected) | ❌ FAIL | No right-to-access, no right-to-erasure, analytics pre-consent, no lawful-basis docs |
| **DPDP** | Y | ⚠️ PARTIAL | Consent post-signup, no grievance endpoint, no DPO contact |
| **COPPA** | Y (suspected) | ❌ FAIL | No age gate, no parental consent, marketing to all users |
| **PCI-DSS** | N | ✓ PASS | No card data |
| **AML/KYC** | Legal-review-needed | ❌ FAIL | No KYC fields, no payout audit, no velocity caps |
| **Breach notification** | Y (GDPR + DPDP) | ❌ FAIL | No breach-notification endpoint, no notification audit |
| **SoD / Admin controls** | Y (SOC 2 / ISO 27001) | ❌ FAIL | No two-admin approval, admin login not audited |

---

## Recommendations

### Critical (Implement ASAP)

1. **Add right-to-access endpoint** (`GET /api/me/export`) — returns user's personal data in JSON/CSV. Requires re-auth.
2. **Add right-to-erasure endpoint** (`DELETE /api/me`) with full cascade:
   - Soft-delete `PublicUser`, `Member`, `CommunityMember`.
   - Anonymize `WalletTransaction.userEmail`, `PointsBatch.userEmail` (or add user-FK).
   - Delete / anonymize `ProjectLike.userEmail`, `ProjectComment.authorEmail`, `AnalyticsEvent.userEmail`.
   - Delete `PushSubscription` rows.
   - Delete from `PersonalVault`.
   - Clear `AnalyticsEvent` with user's email.
   - Add server message to purge `team1-offline` IndexedDB on client.
3. **Gate Vercel Analytics** behind consent. Check `session.user.consent` before rendering `<Analytics />`.
4. **Add age gate on signup**. Require DOB or age-check at `PublicConsentModal`. Block under-13 (COPPA).
5. **Add DPDP grievance endpoint** (`POST /api/grievance` or `/api/dpo-contact`).
6. **Add admin login audit log.** Call `logAudit("LOGIN", "Member", memberId, {ip, userAgent})` on every signin.

### High Priority (Weeks 2-4)

7. **Add two-admin approval on sensitive operations:**
   - `adminAdjust` requires a second admin's signature.
   - Member permission changes require approval.
   - Bounty approval generates audit log with approver ID.

8. **Add granular cookie consent UI.** Enumerate:
   - Essential
   - Analytics
   - Marketing
   - Targeting
   - Collect granular user preferences.

9. **Create ROPA (Records of Processing Activity) document** and store in `/docs/compliance/ROPA.md`.

10. **Engage India-licensed legal counsel** on KYC/AML thresholds for `Bounty.cash` payouts.

### Medium Priority (Months 2-3)

11. **Add breach-notification system** (`POST /api/admin/notify-breach` — CORE-only):
    - Bulk-select affected users by data category.
    - Compose and send notification email.
    - Log breach disclosure with timestamp, recipients, notification text.

12. **Add retention schedules** to schema and code comments:
    - `AuditLog`: 7 years (regulatory requirement).
    - `AnalyticsEvent`: 1 year (then anonymize or delete).
    - `Notification`: 90 days after read.

13. **Encrypt all PII uniformly.** Move plaintext emails, phone numbers, names to `PersonalVault` and add `deletedAt` to vault.

14. **Add consent-version tracking.** Record what privacy notice was shown on consent date; version the privacy policy in the app.

15. **Add rate-limits / redemption caps** on swag orders and quest completions to prevent Sybil farming.

---

## Mapping to Threat Model

- **Threat 2.6 (Compromised CORE Admin):** Admin login not audited → undetectable 30-day session abuse. **Fixed by recommendation #6.**
- **Threat 2.9 (Sybil Farmer):** No age gate, no KYC, no velocity caps → unconstrained account farming. **Partially fixed by #4, #15.**
- **Threat 2.11 (Fraudster Gaming Points):** Points operations not audited → undetectable fraud. **Fixed by #7.**
- **Crown Jewel #10 (Points balance integrity):** No audit log. **Fixed by #7.**

---

## Open Assumptions (Require External Verification)

1. **Vercel project settings** — env protection on preview deployments, IP allowlists, WAF rules.
2. **Privacy policy actual content** — does `https://www.avax.network/privacy-policy` match this codebase's data flows?
3. **DPA evidence** — are there signed Data Processing Agreements with Google, Vercel, Luma, SMTP provider, etc.?
4. **SMTP provider identity** — is it Gmail SMTP or a proper transactional SMTP? SPF/DKIM/DMARC posture?
5. **Postgres region & Vercel region** — where is data stored?
6. **DPO appointment** — has the org appointed a Data Protection Officer (DPDP §10)?
7. **Bounty.cash payout volume & frequency** — is it a low-volume gift, or high-volume equivalent to salary? Triggers KYC thresholds?
8. **ENABLE_2FA production value** — is MFA actually enforced in production?
9. **Number of FULL_ACCESS admins** — one person (no SoD possible) or many (SoD enforceable)?

---

**End of Category 27 Findings.**  
**Total findings:** 22 (grouped into 50+ individual spec-check failures across categories).  
**Critical gaps:** 6 (right-to-access, right-to-erasure, analytics pre-consent, age gate, grievance, admin-login audit).  
**Regulatory exposure:** GDPR (high), DPDP (high), COPPA (high if US audience includes under-13), AML/KYC (legal-review-required).
