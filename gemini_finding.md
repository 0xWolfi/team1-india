# Full Codebase Vulnerability Audit Report
**Target**: Team1-India Platform
**Version**: 3.0 (Autonomous Discovery Edition)

## Phase 0: Codebase Reconnaissance

### 1. Repository Structure Inventory
*   **Package Manager**: `npm` (via `package-lock.json`), but also uses `bun` for linting (`bun.lock` is present).
*   **Build System**: Next.js App Router (`next.config.ts`).
*   **Runtime**: Node.js (`@types/node` ^20), React 19, Next.js 16.1.1.
*   **Monorepo**: Single package repository (no Lerna/Turborepo/Nx).
*   **Config Files**: `package.json`, `tsconfig.json`, `next.config.ts`, `vercel.json`, `middleware.ts`, `eslint.config.mjs`, `.npmrc`.
*   **Database Schema**: `prisma/schema.prisma` (PostgreSQL via Prisma).
*   **Directory Purpose**:
    *   `/app`: Next.js App Router containing pages and API routes.
    *   `/app/api`: All serverless API endpoints.
    *   `/lib`: Shared logic, auth options, Prisma client, point economy, rate-limits.
    *   `/components`: React UI components.
    *   `/prisma`: Database schemas and migrations.
    *   `/scripts`: Utilities.
    *   `/public`: Static assets.

### 2. Dependency & Supply-Chain Inventory
*   **Direct Dependencies**: `next`, `react`, `react-dom`, `@prisma/client`, `next-auth` (v4.24.13), `google-auth-library`, `nodemailer`, `web-push`, `zod`, `framer-motion`, `lucide-react`, `idb`.
*   **Lockfiles**: `package-lock.json` and `bun.lock` are committed.
*   **Risks**: Uses floating version constraints (`^`) on sensitive dependencies like `zod` and `next-auth`. 

### 3. Function & Endpoint Inventory
*   **API Routes**: 
    *   `POST /api/admin/send-email`: Sends emails via SMTP. Requires `CORE` role.
    *   `GET /api/admin/public-users`: Lists public users. Requires `CORE` or `FULL_ACCESS`.
    *   `POST /api/wallet/adjust`: Admin manual points adjustment. Requires `CORE` role.
    *   `GET /api/community-members/[id]`: Views member details. Requires `CORE`.
    *   `PATCH /api/community-members/[id]`: Changes tags. Requires `FULL_ACCESS` (SuperAdmin).
    *   *Numerous other routes mapped in `app/api/*`.*
*   **Rate Limits**: Custom `lib/rate-limit.ts` using Prisma atomic updates. Requires explicit route integration.

### 4. Authentication & Identity Map
*   **Mechanism**: `next-auth` using `GoogleProvider`.
*   **Token Verification**: JWT strategy.
*   **Session State**: Session is stateless JWT. Roles are injected into the JWT upon sign in (`lib/auth-options.ts`).
*   **2FA Enforcement**: Handled in `middleware.ts`, which redirects non-verified `CORE` users to `/auth/setup-2fa` or `/auth/verify-2fa`.
*   **JWT Scope**: NextAuth default signed JWT cookie (`next-auth.session-token`).

### 5. RBAC Discovery — Roles, Permissions, Hierarchy
*   **Roles**: `CORE` (Highest), `MEMBER` (Middle), `PUBLIC` (Lowest).
*   **Storage**: Segmented across three tables (`Member`, `CommunityMember`, `PublicUser`).
*   **Enforcement Code**: `lib/permissions.ts` exporting `checkCoreAccess` and `hasPermission`.
*   **Hierarchy**: Hardcoded checks in API routes (e.g. `if (role !== 'CORE')`).

### 6. Admin Panel & UI Surface Discovery
*   **Surfaces**: `app/core/` (Admin UI), `app/admin/` (legacy admin surfaces), `app/member/` (Member UI).
*   **Isolation**: Both admin and member apps share the same Next.js server, same origin, and same `next-auth` JWT signing secret.

### 7. Data Model & Visibility Matrix
*   **Sensitive Fields**: `PublicUser.email`, `PublicUser.signupIp`, `PersonalVault.encryptedValue` (AES-256-GCM), `TwoFactorAuth.totpSecret`.
*   **Matrix**:
    *   `PublicUser` data is returned completely on `GET /api/admin/public-users` to any `CORE` user.
    *   PII Vault exists for encryption at rest (`PersonalVault`), but raw emails exist directly on tables like `Member.email` and `PublicUser.email`.

### 8. Points-Economy Map
*   **Economy Engine**: `lib/wallet.ts`.
*   **Core Entities**: `UserWallet`, `PointsBatch`, `WalletTransaction`.
*   **Balance Increments**: `earnReward` and `adminAdjust` increment points.
*   **Balance Decrements**: `spendPoints` and `expirePoints`.
*   **Atomicity**: Achieved via `prisma.$transaction` and Serializable isolation level.

### 9. PWA Surface Discovery
*   **Service Worker**: Configured via `@ducanh2912/next-pwa`.
*   **Push Notifications**: Handled in `app/api/push/*` and `web-push`. Uses VAPID keys.

### 10. Trust Boundaries & Data Flow Map
*   **Boundary 1**: Client → Next.js API Routes (JSON body parsing).
*   **Boundary 2**: JWT Token → `getServerSession` (Trusts the internal JWT signature).
*   **Boundary 3**: User Input → Prisma ORM (Protected from SQLi by Prisma).
*   **Boundary 4**: Server → SMTP Server (`nodemailer`).

### 11. Secrets, Env Vars & Configuration
*   **Sourced via**: Environment variables (e.g., `GOOGLE_CLIENT_ID`, `SMTP_PASSWORD`, `DATABASE_URL`).
*   **Usage**: Accessed directly via `process.env`.

### 12. Third-Party Integration Inventory
*   **Email**: SMTP server (Nodemailer).
*   **Auth**: Google OAuth.
*   **Analytics**: Vercel Analytics (`@vercel/analytics`).

### 13. Logging, Monitoring & Audit Trail Discovery
*   **Audit Trail**: `AuditLog` table.
*   **Economy Trail**: `WalletTransaction` table.
*   **Error Logging**: Simple `console.log` and `console.error` in APIs. No Sentry/Datadog found explicitly configured.

### 14. Test Coverage of Security Paths
*   **Coverage**: Missing. No comprehensive `__tests__` or `.test.ts` for RBAC paths found during recon.

*Reconnaissance Complete.*

---

## Phase 1: Threat Model

*   **Trust Boundaries**: Client → Next.js API Routes → Postgres DB.
*   **Threat Actors**: 
    1. Anonymous Attacker (unauthenticated).
    2. Malicious Public User (low privilege).
    3. Malicious CORE Admin (insider threat).
*   **Crown Jewels**: PII data (Emails, Names), Points Economy Ledger (`UserWallet`), SuperAdmin permissions.
*   **Attack Surface Ranking**:
    1.  `/api/wallet/*` (Financial/Points operations).
    2.  `/api/admin/*` and `/api/community-members/*` (Data exfiltration vectors).
    3.  `middleware.ts` (Authentication gateway).

---

## Phase 2: Vulnerability Scan

### Category 1: Privilege Escalation Paths
*   **Finding: MFA Bypass on Admin API Routes**
    *   **Status**: Confirmed
    *   **File**: `middleware.ts:27-39` and `lib/permissions.ts:42-50`.
    *   **Description**: The application enforces 2FA for `CORE` users via `middleware.ts`. However, the middleware explicitly skips all `/api/*` routes (`const skip2FAPaths = ["/api/", ...]`). `checkCoreAccess` in `lib/permissions.ts` only validates `session.user.role === 'CORE'` but ignores `session.twoFactorVerified`.
    *   **Impact**: An attacker who steals a CORE user's password/token can directly invoke any privileged `/api/*` route without needing the user's 2FA device.

### Category 2: Points System — Economic / Logic Attacks
*   **Finding: Uncapped Admin Point Minting**
    *   **Status**: Confirmed
    *   **File**: `app/api/wallet/adjust/route.ts:14-41`
    *   **Description**: Any user with the `CORE` role can hit the `/api/wallet/adjust` endpoint and grant arbitrary amounts of points and XP to *any* user, including themselves. There is no dual-control (4-eyes approval), no maximum threshold cap, and no check preventing self-dealing.
    *   **Impact**: Insider threat or compromised CORE account can mint infinite points, draining the economy or enabling massive swag shop purchases.

*   **Finding: Potential Math Bypass in spendPoints with Negative Input**
    *   **Status**: Suspected (Requires tracing `spendPoints` caller endpoints)
    *   **File**: `lib/wallet.ts:86-151`
    *   **Description**: `spendPoints` takes `amount: number`. If an API passes a negative amount directly to `spendPoints`, the loop `if (remaining <= 0) break;` triggers instantly. The subsequent logic runs `pointsBalance: { decrement: amount }`, effectively *adding* points if amount is negative. What would confirm: Checking if `/api/swag/[id]/redeem/route.ts` strictly validates that amount > 0.

### Category 3: Separate Admin Panels & Isolation
*   **Finding: Zero Isolation Between Tiers**
    *   **Status**: Confirmed
    *   **File**: `lib/auth-options.ts` and `app/core/` vs `app/member/`
    *   **Description**: Admin APIs (`/api/admin`), Member APIs, and Public APIs share the same Next.js router, the same cookie domain, and the same NextAuth session signing key.
    *   **Impact**: Cross-Site Scripting (XSS) in the public or member app completely compromises a logged-in `CORE` admin session because the session cookie scope is shared.

### Category 4: Data Visibility Tiers & Field-Level Masking
*   **Finding: PII Over-Fetch in Public Users Admin Route**
    *   **Status**: Confirmed
    *   **File**: `app/api/admin/public-users/route.ts:42-50`
    *   **Description**: The GET endpoint uses `prisma.publicUser.findMany` without a `select` statement. This returns the entire row, including `signupIp`, `providerId`, and full consent metadata to any `CORE` admin.
    *   **Impact**: Over-exposure of PII.

---

## Phase 3: Meta-Analysis

*   **Vulnerability Chaining**: 
    `Stolen CORE session cookie` + `Middleware API bypass` + `Uncapped Admin Point Minting` = **Mass theft of economy points without triggering 2FA challenge**.
*   **Negative-Space Review**:
    *   **NO** CSP (Content Security Policy) configured in `next.config.ts` or `middleware.ts`.
    *   **NO** IP restriction for the admin API.
    *   **NO** separation of duties for economy minting.
    *   **NO** automated alerting for large point grants.
*   **RBAC Stress Test**: A compromised standard `CORE` user has full read access to all user lists and full write access to the point ledger. The blast radius is effectively a full system takeover minus SuperAdmin role mutations.

---

## Phase 4: Reporting

### Triage Table
| # | Title | Severity | CWE | File:Line | Attacker Start Role | Target/Data | Points Impact? | Data Impact? |
|---|---|---|---|---|---|---|---|---|
| 1 | MFA Bypass on Admin API | Critical | CWE-287 | `middleware.ts:27` | Anonymous (w/ stolen creds) | Admin APIs | Yes | Yes |
| 2 | Uncapped Admin Point Minting | High | CWE-284 | `app/api/wallet/adjust/route.ts:14` | CORE Admin | Ledger | Yes | No |
| 3 | Zero Origin Isolation between Tiers | Medium | CWE-269 | `lib/auth-options.ts` | Member (via XSS) | CORE Admin | Yes | Yes |
| 4 | Negative Integer points vulnerability | Suspected | CWE-681 | `lib/wallet.ts:86` | Member | Ledger | Yes | No |
| 5 | PII Over-fetch on Public Users API | Low | CWE-200 | `app/api/admin/public-users/route.ts:42` | CORE Admin | PII | No | Yes |

### Executive Summary
The Team1-India application relies heavily on Next.js monolithic architecture. While the basic RBAC via `next-auth` and `prisma` is functional, the security posture suffers from **insufficient perimeter enforcement** and **lack of separation of duties**. The most urgent issue is that the 2FA enforcement middleware ignores `/api/` paths, rendering the MFA requirement useless against an API-level attack. Furthermore, the points economy lacks safety caps, allowing any compromised admin to infinitely mint points. 

**Top 3 Remediation Priorities:**
1.  **Enforce 2FA in `lib/permissions.ts`**: Update `checkCoreAccess` to explicitly verify `session.twoFactorVerified === true` to close the API bypass loop hole.
2.  **Cap the Points API**: Implement a maximum limit on `/api/wallet/adjust` (e.g., 5000 points max) and add a secondary approval workflow for larger amounts.
3.  **Strict Input Validation on Economy**: Add `zod` schemas to all `/api/wallet/*` endpoints to strictly enforce `amount > 0` to prevent math logic exploits.

### Gaps in Reconnaissance
*Could not determine from code:*
*   **WAF Rules**: Whether Cloudflare/Vercel WAF is blocking malicious IPs or rate-limiting.
*   **Deployment Environment Secrets**: The contents of actual production `.env` files (e.g. `ENABLE_2FA` state in prod).
*   **SIEM**: Whether AWS CloudWatch or Datadog alerts are configured for the logs generated by the `WalletTransaction` creation.
