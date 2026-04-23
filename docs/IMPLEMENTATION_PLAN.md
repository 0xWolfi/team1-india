# Full Implementation Plan — v15 (EXECUTION READY)

> Added: 2FA, PWA, Performance, Edge Case Fixes (2026-04-23)
> Previous 30 decisions unchanged. 3 new phases added.

---

## New Phases Added

```
Phase 2FA:   Optional Two-Factor Auth (TOTP, Passkey, Mobile OTP)
Phase PWA:   Progressive Web App
Phase PERF:  Performance + Optimization
```

### Updated Phase Map (28 Phases)

```
INFRASTRUCTURE
  Phase 0:     PII Vault + Encryption
  Phase 0.5:   Migrate Existing PII
  Phase N:     Notification System
  Phase SEC:   Anti-Spam + Rate Limiting
  Phase 2FA:   Two-Factor Authentication              ← NEW
  Phase ANA:   Analytics (PostHog)

ECONOMY
  Phase A-D:   Wallet, Quests, Bounty, Swag

PROJECTS + CHALLENGES
  Phase 1-11:  Models → APIs → UI → Teams → etc.

UI + DASHBOARDS
  Phase UI, UI-2, CORE, MEMBER

APP + PERFORMANCE
  Phase PWA:   Progressive Web App                    ← NEW
  Phase PERF:  Performance + Optimization             ← NEW

HARDENING
  Phase 13:    Security
  Phase EDGE:  Edge Case Hardening
```

### Dependency Order
```
0 → 0.5 → N → SEC → 2FA → A → B,C → D → 1 → 2-11 → ANA → UI → UI-2 → CORE → MEMBER → PWA → PERF → 13 → EDGE
```

---

## Phase 2FA: Optional Two-Factor Authentication

### How It Works

```
Login Flow (current):
  Google OAuth → session created → done

Login Flow (with 2FA enabled):
  Google OAuth → session created → 2FA check →
    If 2FA enabled: redirect to /auth/verify-2fa →
      Choose method: TOTP App | Passkey | Mobile OTP →
      Verify → session marked as "2fa_verified" → done
    If 2FA not enabled: done (normal flow)
```

**2FA is OPTIONAL.** Users enable it from their profile settings. Once enabled, every login requires 2FA verification.

### Models

```prisma
model TwoFactorAuth {
  id              String    @id @default(uuid())
  userEmail       String    @unique
  
  // TOTP (Authenticator App)
  totpSecret      String?   // encrypted, AES-256-GCM via PII vault
  totpEnabled     Boolean   @default(false)
  totpVerifiedAt  DateTime?
  
  // Passkey (WebAuthn)
  passkeyEnabled  Boolean   @default(false)
  
  // Mobile OTP
  otpPhone        String?   // encrypted via PII vault
  otpEnabled      Boolean   @default(false)
  
  // Recovery
  recoveryCodes   String?   // encrypted, comma-separated, one-time use
  recoveryUsed    String[]  // track which codes used
  
  // Backup
  backupEmail     String?   // encrypted via PII vault
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @default(now()) @updatedAt

  passkeys        Passkey[]
  @@index([userEmail])
}

model Passkey {
  id              String    @id @default(uuid())
  twoFactorId     String
  credentialId    String    @unique
  publicKey       Bytes
  counter         BigInt
  deviceName      String?   // "iPhone 15", "Chrome on Mac"
  createdAt       DateTime  @default(now())
  lastUsedAt      DateTime?

  twoFactor       TwoFactorAuth @relation(fields: [twoFactorId], references: [id])
}
```

### Implementation

#### TOTP (Authenticator App) — `npm install otpauth qrcode`

```typescript
// lib/2fa/totp.ts
import { TOTP } from "otpauth";

export function generateTotpSecret(email: string) {
  const totp = new TOTP({ issuer: "Team1India", label: email, algorithm: "SHA1", digits: 6, period: 30 });
  return { secret: totp.secret.base32, uri: totp.toString() };
  // URI → QR code → user scans with Google Authenticator / Authy
}

export function verifyTotp(secret: string, token: string): boolean {
  const totp = new TOTP({ secret: TOTP.Secret.fromBase32(secret) });
  return totp.validate({ token, window: 1 }) !== null; // ±1 period tolerance
}
```

#### Passkeys (WebAuthn) — `npm install @simplewebauthn/server @simplewebauthn/browser`

```typescript
// lib/2fa/passkey.ts
import { generateRegistrationOptions, verifyRegistrationResponse,
         generateAuthenticationOptions, verifyAuthenticationResponse } from "@simplewebauthn/server";

const rpName = "Team1 India";
const rpID = process.env.WEBAUTHN_RP_ID || "team1india.vercel.app";
const origin = process.env.WEBAUTHN_ORIGIN || `https://${rpID}`;
```

#### Mobile OTP — use existing email provider or Twilio

```typescript
// lib/2fa/otp.ts
// Generate 6-digit OTP, store in Redis (5 min TTL), send via SMS
export async function sendOtp(phone: string): Promise<void> {
  const otp = crypto.randomInt(100000, 999999).toString();
  await redis.set(`otp:${phone}`, otp, { ex: 300 }); // 5 min expiry
  // Send via Twilio or similar
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const stored = await redis.get(`otp:${phone}`);
  if (!stored || stored !== code) return false;
  await redis.del(`otp:${phone}`);
  return true;
}
```

### APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/auth/2fa/status` | 🔒 | Check if 2FA enabled, which methods |
| POST | `/api/auth/2fa/totp/setup` | 🔒 | Generate TOTP secret + QR code URI |
| POST | `/api/auth/2fa/totp/verify` | 🔒 | Verify TOTP code (enables after first verify) |
| POST | `/api/auth/2fa/totp/disable` | 🔒 | Disable TOTP (requires current code) |
| POST | `/api/auth/2fa/passkey/register` | 🔒 | Start passkey registration |
| POST | `/api/auth/2fa/passkey/verify-register` | 🔒 | Complete passkey registration |
| POST | `/api/auth/2fa/passkey/authenticate` | 🔒 | Verify passkey during login |
| POST | `/api/auth/2fa/otp/setup` | 🔒 | Set phone number for OTP |
| POST | `/api/auth/2fa/otp/send` | 🔒 | Send OTP to phone |
| POST | `/api/auth/2fa/otp/verify` | 🔒 | Verify OTP code |
| POST | `/api/auth/2fa/recovery/generate` | 🔒 | Generate 10 recovery codes |
| POST | `/api/auth/2fa/recovery/use` | 🔒 | Use recovery code |
| POST | `/api/auth/2fa/challenge` | 🔒 | Login 2FA challenge (redirected here after OAuth) |

### Auth Flow Modification

```typescript
// In lib/auth-options.ts — jwt callback:
async jwt({ token, user }) {
  // ... existing role check ...
  
  // Check if 2FA is enabled
  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userEmail: token.email },
  });
  
  token.twoFactorEnabled = !!(twoFactor?.totpEnabled || twoFactor?.passkeyEnabled || twoFactor?.otpEnabled);
  token.twoFactorVerified = false; // Set to true after 2FA verification
  
  return token;
}
```

```typescript
// middleware.ts — add 2FA redirect:
if (token?.twoFactorEnabled && !token?.twoFactorVerified) {
  if (!request.nextUrl.pathname.startsWith("/auth/verify-2fa")) {
    return NextResponse.redirect(new URL("/auth/verify-2fa", request.url));
  }
}
```

### Pages

| Route | What |
|---|---|
| `/auth/verify-2fa` | 2FA verification page (TOTP input / Passkey prompt / OTP) |
| Profile settings (existing) | Enable/disable 2FA methods, manage passkeys, recovery codes |

### Recovery Codes
When enabling 2FA, generate 10 one-time recovery codes:
```
XXXX-XXXX-XXXX
YYYY-YYYY-YYYY
... (10 total)
```
User downloads/saves them. Each code works once. If all used → contact admin.

### Files

| Action | File |
|---|---|
| NEW | `lib/2fa/totp.ts` |
| NEW | `lib/2fa/passkey.ts` |
| NEW | `lib/2fa/otp.ts` |
| NEW | `app/auth/verify-2fa/page.tsx` |
| NEW | `app/api/auth/2fa/` (13 route files) |
| NEW | `components/auth/TwoFactorSetup.tsx` |
| MODIFY | `lib/auth-options.ts` |
| MODIFY | `middleware.ts` |
| INSTALL | `otpauth`, `qrcode`, `@simplewebauthn/server`, `@simplewebauthn/browser` |

### Env Vars
```env
WEBAUTHN_RP_ID=team1india.vercel.app
WEBAUTHN_ORIGIN=https://team1india.vercel.app
TWILIO_ACCOUNT_SID=     # for SMS OTP
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

---

## Phase PWA: Progressive Web App

### What It Adds

| Feature | Description |
|---|---|
| Install prompt | "Add to Home Screen" banner on mobile |
| Offline support | Core pages cached, offline fallback page |
| Push notifications | Native push for quest reminders, approvals, team invites |
| App-like experience | Standalone display, splash screen, status bar theming |
| Background sync | Queue actions offline → sync when back online |

### Implementation

#### [NEW] `public/manifest.json`
```json
{
  "name": "Team1 India",
  "short_name": "Team1",
  "description": "Community hub for Team1 India",
  "start_url": "/public",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/home.png", "sizes": "1080x1920", "type": "image/png", "form_factor": "narrow" }
  ]
}
```

#### [NEW] `public/sw.js` (Service Worker)

```typescript
// Caching strategy:
// - Static assets (JS/CSS/fonts): Cache First (stale-while-revalidate)
// - API responses: Network First (fallback to cache)
// - Images: Cache First (1 week max)
// - HTML pages: Network First (offline fallback)

const CACHE_NAME = "team1-v1";
const OFFLINE_URL = "/offline";

// Pre-cache critical assets on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(["/offline", "/public", "/icons/icon-192.png"])
    )
  );
});

// Network-first for pages, cache-first for assets
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      data: { url: data.link },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
```

#### [MODIFY] `app/layout.tsx`

```tsx
// Register service worker + add manifest link
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#000000" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
</head>
```

#### [NEW] `components/pwa/InstallPrompt.tsx`

Shows install banner for eligible browsers (non-installed, mobile):
```
┌──────────────────────────────────────┐
│ 📱 Install Team1 India              │
│ Get the full app experience          │
│ [Install]              [Not now]    │
└──────────────────────────────────────┘
```

#### [NEW] `app/offline/page.tsx`

Offline fallback page:
```
You're offline
Check your connection and try again.
[Retry]
```

### Push Notifications (extends existing `/api/push/*`)

The codebase already has push subscription APIs. Extend to fire from `lib/notify.ts`:
```typescript
// In sendNotification():
// 1. Create DB notification
// 2. Send email
// 3. Send web push (if subscribed)
```

### Files

| Action | File |
|---|---|
| NEW | `public/manifest.json` |
| NEW | `public/sw.js` |
| NEW | `app/offline/page.tsx` |
| NEW | `components/pwa/InstallPrompt.tsx` |
| NEW | `components/pwa/ServiceWorkerRegistration.tsx` |
| MODIFY | `app/layout.tsx` (manifest, meta tags, SW registration) |
| MODIFY | `lib/notify.ts` (add web push) |

---

## Phase PERF: Performance + Optimization

### 1. Database — Connection Pooling + Query Optimization

#### [MODIFY] `lib/prisma.ts`

```typescript
// Use connection pooling (Prisma Accelerate or PgBouncer)
const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
}).$extends({
  query: {
    $allOperations({ operation, model, args, query }) {
      const start = performance.now();
      return query(args).finally(() => {
        const duration = performance.now() - start;
        if (duration > 100) console.warn(`Slow query: ${model}.${operation} (${duration.toFixed(0)}ms)`);
      });
    },
  },
});
```

#### Missing Indexes (add to schema.prisma)

```prisma
// Wallet queries
@@index([totalXp]) on UserWallet     // leaderboard sort
@@index([expiresAt, remaining]) on PointsBatch  // expiry cron

// Project queries  
@@index([challengeId]) on Project
@@index([teamEmails]) on Project     // GIN index for array

// Notification queries
@@index([userEmail, isRead, createdAt]) on Notification  // compound
```

### 2. Next.js — ISR + React Server Components

```typescript
// All listing pages: use ISR with short revalidation
export const revalidate = 60;  // 1 minute for quest/bounty lists

// Detail pages: longer cache
export const revalidate = 300; // 5 minutes for project/challenge details

// Admin pages: no cache (always fresh)
export const dynamic = "force-dynamic";
```

### 3. Image Optimization

```typescript
// Cloudinary: serve optimized formats
function cloudinaryUrl(publicId: string, width = 400) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,w_${width}/${publicId}`;
}

// Next.js Image: use Cloudinary loader
// next.config.ts:
images: {
  remotePatterns: [{ hostname: "res.cloudinary.com" }],
  formats: ["image/avif", "image/webp"],
}
```

### 4. Bundle Optimization

```typescript
// Dynamic imports for heavy components
const QRCode = dynamic(() => import("qrcode"), { ssr: false });
const MarkdownEditor = dynamic(() => import("@/components/MarkdownEditor"), { ssr: false });
const PostHogProvider = dynamic(() => import("@/components/providers/PostHogProvider"), { ssr: false });
```

### 5. API Response Optimization

```typescript
// Pagination for all list endpoints
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Select only needed fields (avoid SELECT *)
prisma.project.findMany({
  select: { id: true, title: true, coverImage: true, likeCount: true },
  // NOT include: { comments: true, versions: true }  ← lazy load these
});

// Cursor-based pagination for large datasets
prisma.notification.findMany({
  take: 20,
  cursor: lastId ? { id: lastId } : undefined,
  orderBy: { createdAt: "desc" },
});
```

### 6. Caching Strategy

```typescript
// lib/cache.ts — Redis cache for hot data
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit) as T;
  const data = await fn();
  await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
  return data;
}

// Usage:
const leaderboard = await cached("leaderboard:top50", 60, () =>
  prisma.userWallet.findMany({ orderBy: { totalXp: "desc" }, take: 50 })
);
```

---

## Edge Case Fixes (Concrete Code)

### Fix 1: Wallet Race Condition
```typescript
// lib/wallet.ts — ALL operations use serializable transaction
export async function spendPoints(email: string, amount: number, type: string, sourceId: string) {
  return prisma.$transaction(async (tx) => {
    const wallet = await tx.userWallet.findUnique({
      where: { userEmail: email },
      select: { id: true, pointsBalance: true },
    });
    if (!wallet || wallet.pointsBalance < amount) throw new Error("INSUFFICIENT_BALANCE");
    
    // FIFO: deduct from oldest batches
    const batches = await tx.pointsBatch.findMany({
      where: { walletId: wallet.id, remaining: { gt: 0 }, expiresAt: { gt: new Date() } },
      orderBy: { earnedAt: "asc" },
    });
    
    let remaining = amount;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const deduct = Math.min(remaining, batch.remaining);
      await tx.pointsBatch.update({ where: { id: batch.id }, data: { remaining: { decrement: deduct } } });
      remaining -= deduct;
    }
    if (remaining > 0) throw new Error("INSUFFICIENT_BALANCE"); // double-check
    
    await tx.userWallet.update({
      where: { id: wallet.id },
      data: { pointsBalance: { decrement: amount }, totalSpent: { increment: amount } },
    });
    
    await tx.walletTransaction.create({ data: { walletId: wallet.id, pointsAmount: -amount, xpAmount: 0, type, /* ... */ } });
  }, { isolationLevel: "Serializable", timeout: 10000 });
}
```

### Fix 2: Swag Stock — Atomic Decrement
```typescript
// In swag redeem handler:
const updated = await prisma.$executeRaw`
  UPDATE "SwagItem" SET "remainingStock" = "remainingStock" - 1
  WHERE id = ${itemId} AND "remainingStock" > 0
`;
if (updated === 0) throw new Error("OUT_OF_STOCK");
```

### Fix 3: Registration Dedup — DB Constraint
```prisma
model ChallengeRegistration {
  // ... fields ...
  @@unique([challengeId, captainEmail])  // prevents duplicate registration
}
```

### Fix 4: Optimistic Locking for Projects
```prisma
model Project {
  // ... fields ...
  version  Int  @default(1)  // incremented on every edit
}
```
```typescript
// On save:
const result = await prisma.project.updateMany({
  where: { id: projectId, version: currentVersion },
  data: { ...updates, version: { increment: 1 } },
});
if (result.count === 0) throw new Error("CONFLICT_EDIT");
```

### Fix 5: Bounty Audience Bug
```typescript
// Replace line 100-103 in bounty/submissions/route.ts:
if (bounty.audience === "member" && role !== "MEMBER" && role !== "CORE") {
  return NextResponse.json({ error: "Member-only bounty" }, { status: 403 });
}
// audience: "public" or "all" → anyone logged in can submit
```

---

## Resolved (Q1-Q5)

| # | Answer |
|---|---|
| Q1 | ✅ 2FA **mandatory for CORE** (PII access). Optional for MEMBER/PUBLIC. Recovery code backup + verification required. |
| Q2 | ✅ **Skip SMS**. TOTP (auth app) + Passkey (WebAuthn) only. |
| Q3 | ✅ **Cache browsable content** with stale-while-revalidate to prevent conflicts. |
| Q4 | ✅ **Push replaces email** for low-priority events (see channel table below). |
| Q5 | ✅ **Umami** (self-hosted, open-source, same PostgreSQL DB, deploy alongside on Vercel). |

---

## 2FA Updates (v16)

### CORE Mandatory Enforcement
```typescript
// middleware.ts:
if (token?.role === "CORE" && !token?.twoFactorEnabled) {
  // Force redirect to 2FA setup page
  if (!request.nextUrl.pathname.startsWith("/auth/setup-2fa")) {
    return NextResponse.redirect(new URL("/auth/setup-2fa", request.url));
  }
}
```

### Recovery Code Backup + Verification
On 2FA enable:
1. Generate 10 recovery codes → display once → user downloads/copies
2. **Verification step**: user must type back 2 random codes to prove they saved them
3. Only then is 2FA fully activated
4. Recovery codes stored encrypted (PII vault pattern)

```typescript
// POST /api/auth/2fa/recovery/verify-backup
// Body: { code1: "XXXX-XXXX", code2: "YYYY-YYYY" }
// → Verifies both match generated codes → sets twoFactorActive = true
```

### Skip SMS — Remove OTP
Remove from Phase 2FA:
- ~~`lib/2fa/otp.ts`~~
- ~~`/api/auth/2fa/otp/*`~~ (3 routes removed)
- ~~Twilio env vars~~

**Methods available**: TOTP App + Passkey + Recovery Codes

---

## Notification Channel Rules (v16)

| Event | In-App | Push | Email | Why |
|---|---|---|---|---|
| Teammate edits project | ✅ | ✅ | ❌ | Frequent, low urgency |
| Quest approved | ✅ | ✅ | ❌ | Quick acknowledgment |
| Bounty approved | ✅ | ✅ | ✅ | Money involved |
| Team invite received | ✅ | ✅ | ✅ | Time-sensitive |
| Team invite accepted/declined | ✅ | ✅ | ❌ | Informational |
| Winner announcement | ✅ | ✅ | ✅ | High importance |
| Points expiring (7 days) | ✅ | ✅ | ✅ | Urgent, money on the table |
| Swag order shipped | ✅ | ✅ | ✅ | Delivery tracking |
| Project reported (admin) | ✅ (Review Queue) | ❌ | ✅ | Admin action required |
| Challenge reminder | ✅ | ✅ | ❌ | Engagement nudge |

**Rule**: Email only for high-importance + time-sensitive. Push for everything real-time. In-app always.

---

## Analytics: Custom In-App + Umami (Dual System)

> Custom analytics auto-deploys with your codebase (API tracking, funnels, feature usage).
> Umami deployed separately for rich page-level analytics (heatmaps, referrers, geo).
> Both write to the same PostgreSQL DB.

### Why Custom
- **Single deploy** → lives in your codebase, auto-deploys with your app
- **Same PostgreSQL** → one DB, no external service
- **Zero dependencies** → no third-party scripts, no cookies
- **Full control** → track exactly what you need, own your data
- **Privacy-first** → no consent banner needed, no data leaves your server

### Prisma Models

```prisma
model AnalyticsEvent {
  id          String    @id @default(uuid())
  type        String    // page_view|click|api_call|custom
  name        String    // "quest_completed", "event_card_click", etc.
  path        String?   // URL path: "/public/bounty"
  referrer    String?   // where user came from
  userEmail   String?   // null for anonymous
  sessionId   String    // fingerprint-free session (cookie-less UUID per visit)
  data        Json?     // { questId, challengeId, status, durationMs, etc. }
  
  // Device info (from user-agent, no fingerprinting)
  device      String?   // mobile|desktop|tablet
  browser     String?   // chrome|safari|firefox
  os          String?   // ios|android|macos|windows
  country     String?   // from Vercel geo headers
  
  // UTM
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  
  createdAt   DateTime  @default(now())
  
  @@index([type, createdAt])
  @@index([name, createdAt])
  @@index([path, createdAt])
  @@index([userEmail])
  @@index([sessionId])
}

model AnalyticsDailyStat {
  id          String    @id @default(uuid())
  date        DateTime  @db.Date  // day bucket
  metric      String    // "page_views"|"unique_visitors"|"quest_completions"|etc.
  value       Int
  breakdown   Json?     // { "/public": 450, "/public/bounty": 120 }
  
  @@unique([date, metric])
  @@index([date])
}
```

**Why two models?**
- `AnalyticsEvent`: raw events (high volume, queried for recent data)
- `AnalyticsDailyStat`: pre-aggregated daily stats (fast dashboard queries)
- Cron job aggregates raw → daily every night

### `lib/analytics.ts` — Client-Side Tracker

```typescript
"use client";

let sessionId: string | null = null;

function getSessionId() {
  if (!sessionId) {
    sessionId = sessionStorage.getItem("_sid") || crypto.randomUUID();
    sessionStorage.setItem("_sid", sessionId);
  }
  return sessionId;
}

export function trackPageView(path: string) {
  sendEvent({ type: "page_view", name: "page_view", path });
}

export function trackClick(name: string, data?: Record<string, any>) {
  sendEvent({ type: "click", name, data });
}

export function trackEvent(name: string, data?: Record<string, any>) {
  sendEvent({ type: "custom", name, data });
}

function sendEvent(event: { type: string; name: string; path?: string; data?: any }) {
  // Fire-and-forget, non-blocking
  navigator.sendBeacon("/api/analytics/collect", JSON.stringify({
    ...event,
    sessionId: getSessionId(),
    referrer: document.referrer || null,
    path: event.path || window.location.pathname,
    utmSource: new URLSearchParams(window.location.search).get("utm_source"),
    utmMedium: new URLSearchParams(window.location.search).get("utm_medium"),
    utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign"),
  }));
}
```

### `lib/api-tracker.ts` — Server-Side (API Performance)

```typescript
import { prisma } from "@/lib/prisma";

export async function trackApiCall(
  endpoint: string, method: string, status: number, 
  durationMs: number, userEmail?: string
) {
  // Non-blocking: don't await in the request path
  prisma.analyticsEvent.create({
    data: {
      type: "api_call",
      name: `${method} ${endpoint}`,
      path: endpoint,
      userEmail,
      sessionId: "server",
      data: { method, status, durationMs, success: status < 400 },
    },
  }).catch(() => {}); // silently fail — analytics should never break the app
}
```

### `components/providers/AnalyticsProvider.tsx`

```typescript
"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPageView } from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);
  
  return <>{children}</>;
}
// Wrap in app/layout.tsx — auto-tracks every page navigation
```

### APIs

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/analytics/collect` | 🔓 pub-write | Receive events (rate limited: 60/min per IP) |
| GET | `/api/analytics/stats` | 🛡️ | Dashboard stats (pageviews, visitors, top pages, etc.) |
| GET | `/api/analytics/events` | 🛡️ | Raw events (paginated, filterable by type/name/date) |
| GET | `/api/analytics/funnel` | 🛡️ | Funnel analysis (e.g., view → register → submit) |

### Cron: Daily Aggregation

```typescript
// /api/cron/aggregate-analytics (runs daily at 2 AM)
// 1. Count yesterday's page_views → insert AnalyticsDailyStat
// 2. Count unique sessionIds → unique_visitors
// 3. Count custom events by name → quest_completions, etc.
// 4. Optionally: delete raw events older than 90 days (retention policy)
```

### What Gets Tracked

| Category | How | Example |
|---|---|---|
| Page views | Auto (AnalyticsProvider) | Every route change |
| Unique visitors | sessionId count | Per day/week/month |
| Referrer sources | `document.referrer` | google.com, twitter.com |
| UTM parameters | URL params | utm_source=twitter |
| Device/browser/OS | User-Agent parse in API | mobile/chrome/ios |
| Country | Vercel `x-vercel-ip-country` header | IN, US, UK |
| Event card clicks | `trackClick("event_card_click")` | Which events get clicked |
| Quest/bounty actions | `trackEvent("quest_completed")` | With questId, type |
| API performance | `trackApiCall()` server-side | Endpoint, duration, status |
| Funnel analysis | Query event chains by sessionId | view→register→submit |

### Admin Dashboard: `/core/analytics`

Reads from `AnalyticsDailyStat` (fast) + recent `AnalyticsEvent` (live):

```
┌────────────┬────────────┬────────────┬────────────┐
│ Page Views │ Visitors   │ Avg Time   │ Bounce     │
│ 12,450     │ 2,100      │ 3m 24s     │ 34%        │
│ ↑12% vs    │ ↑8% vs     │            │            │
│ last week  │ last week  │            │            │
├────────────┴────────────┴────────────┴────────────┤
│ 📈 Page Views (30-day chart)                      │
│ ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂                │
├───────────────────────┬──────────────────────────┤
│ 📄 Top Pages          │ 🔗 Top Referrers         │
│ 1. /public (4,500)    │ 1. Direct (60%)          │
│ 2. /challenges (2.1k) │ 2. Twitter (22%)         │
│ 3. /shop (1,800)      │ 3. Google (12%)          │
│ 4. /projects (1,200)  │ 4. LinkedIn (6%)         │
├───────────────────────┼──────────────────────────┤
│ 🎯 Feature Usage      │ 📱 Devices               │
│ Quests: 450 completed │ Mobile: 62%              │
│ Bounties: 120 subs    │ Desktop: 35%             │
│ Shop: 45 redeemed     │ Tablet: 3%               │
│ Challenges: 3 active  │                          │
├───────────────────────┴──────────────────────────┤
│ 🌍 Countries          │ 🔄 Live (last 30 min)    │
│ 🇮🇳 India: 78%        │ 23 active visitors       │
│ 🇺🇸 US: 12%           │ /public (8)              │
│ 🇬🇧 UK: 4%            │ /challenges/abc (5)      │
│ Other: 6%             │ /shop (4)                │
└───────────────────────┴──────────────────────────┘
```

### Files

| Action | File |
|---|---|
| NEW | `lib/analytics.ts` (client-side tracker) |
| NEW | `lib/api-tracker.ts` (server-side API tracker) |
| NEW | `components/providers/AnalyticsProvider.tsx` |
| NEW | `app/api/analytics/collect/route.ts` |
| NEW | `app/api/analytics/stats/route.ts` |
| NEW | `app/api/analytics/events/route.ts` |
| NEW | `app/api/analytics/funnel/route.ts` |
| NEW | `app/api/cron/aggregate-analytics/route.ts` |
| NEW | `app/core/analytics/page.tsx` |
| MODIFY | `app/layout.tsx` (wrap with AnalyticsProvider) |

### API Monitoring (In-App)

Tracks health, errors, and performance of all API routes.

#### [NEW] Prisma Model
```prisma
model ApiHealthLog {
  id          String    @id @default(uuid())
  endpoint    String    // "/api/quests"
  method      String    // "GET"
  statusCode  Int
  durationMs  Int
  error       String?   // error message if 4xx/5xx
  userEmail   String?
  ip          String?
  createdAt   DateTime  @default(now())

  @@index([endpoint, createdAt])
  @@index([statusCode, createdAt])
}
```

#### [NEW] `lib/api-monitor.ts`
```typescript
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notify";

// Wrap any API handler:
export function withMonitoring(handler: Function) {
  return async (request: Request, context?: any) => {
    const start = Date.now();
    const url = new URL(request.url);
    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;
      
      // Log to DB (non-blocking)
      logApiCall(url.pathname, request.method, response.status, duration);
      
      // Alert if slow (>3s)
      if (duration > 3000) {
        alertSlowApi(url.pathname, duration);
      }
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      logApiCall(url.pathname, request.method, 500, duration, String(error));
      alertApiError(url.pathname, String(error));
      throw error;
    }
  };
}

async function logApiCall(endpoint: string, method: string, status: number, durationMs: number, error?: string) {
  prisma.apiHealthLog.create({
    data: { endpoint, method, statusCode: status, durationMs, error },
  }).catch(() => {});
}

async function alertSlowApi(endpoint: string, durationMs: number) {
  // Notify all CORE admins
  sendNotification("admin", "api_slow", `Slow API: ${endpoint}`, `${durationMs}ms response time`, "/core/monitoring");
}

async function alertApiError(endpoint: string, error: string) {
  sendNotification("admin", "api_error", `API Error: ${endpoint}`, error, "/core/monitoring");
}
```

#### Usage in API routes
```typescript
// Wrap any handler:
export const GET = withMonitoring(async (request: Request) => {
  // ... your handler
});
```

#### Admin Monitoring Dashboard: `/core/monitoring`

```
┌──────────────────────────────────────────────────┐
│ 🔍 API Monitoring                 Last 24 hours  │
├────────────┬────────────┬────────────┬───────────┤
│ Total Calls│ Avg Time   │ Error Rate │ Uptime    │
│ 12,450     │ 145ms      │ 0.3%       │ 99.97%    │
├────────────┴────────────┴────────────┴───────────┤
│ 📈 Response Times (24h chart)                    │
│ ▁▁▂▁▁▁▃▂▁▁▁▁▁▂▁▁▁▅▂▁▁▁▁▁▁▁▁▁▁▂                │
├──────────────────────────────────────────────────┤
│ 🐌 Slowest Endpoints          │ 🔴 Recent Errors│
│ POST /api/projects (890ms)    │ 500 /api/swag   │
│ GET /api/challenges (650ms)   │ 429 /api/quests │
│ POST /api/upload (1.2s)       │ 400 /api/wallet │
├──────────────────────────────────────────────────┤
│ 🔔 Alerts                                        │
│ ⚠️ /api/projects avg >500ms (last 1h)           │
│ ✅ All cron jobs ran on time                      │
└──────────────────────────────────────────────────┘
```

#### APIs
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/monitoring/health` | 🛡️ | API health summary (error rates, avg response, uptime) |
| GET | `/api/monitoring/slow` | 🛡️ | Slowest endpoints (last 24h) |
| GET | `/api/monitoring/errors` | 🛡️ | Recent errors with stack traces |

#### Cron: Health Aggregation
```typescript
// /api/cron/aggregate-health (runs every hour)
// 1. Calculate avg response time per endpoint
// 2. Calculate error rate
// 3. Alert if error rate > 5% or avg time > 1s
// 4. Delete raw logs older than 30 days
```

### No External Dependencies
Zero npm packages needed. Uses `navigator.sendBeacon` (built-in), Prisma (existing), and Vercel headers (free).

---

## PWA Caching: Browsable Content (v16)

### Cache Strategy — Stale While Revalidate

```javascript
// public/sw.js — updated caching strategy

// Pages to pre-cache (browsable offline)
const PRECACHE_URLS = [
  "/public",
  "/public/programs",
  "/public/playbooks",
  "/public/bounty",
  "/public/leaderboard",
  "/offline",
];

// API routes to cache (read-only data)
const CACHEABLE_API = [
  "/api/public/home",
  "/api/public/bounty",
  "/api/public/leaderboard",
  "/api/public/playbooks",
  "/api/quests",          // active quests list
  "/api/challenges",      // active challenges list
  "/api/swag",            // swag items
];

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // API: Network first, cache fallback (stale max 5 min)
  if (CACHEABLE_API.some(path => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open("api-cache").then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pages: Network first, cached fallback, offline page last resort
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open("page-cache").then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request) || caches.match("/offline"))
    );
    return;
  }

  // Static assets: Cache first
  if (url.pathname.match(/\.(js|css|png|jpg|svg|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          caches.open("static-cache").then(cache => cache.put(event.request, response.clone()));
          return response;
        })
      )
    );
  }
});

// Cache versioning — clear old caches on update
self.addEventListener("activate", (event) => {
  const CURRENT_CACHES = ["api-cache", "page-cache", "static-cache"];
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => !CURRENT_CACHES.includes(n)).map(n => caches.delete(n)))
    )
  );
});
```

### Conflict Prevention
- API cache TTL: 5 minutes max → after that, always fetch fresh
- On login/logout: clear all API caches (`caches.delete("api-cache")`)
- Write operations NEVER cached — only GET requests
- Service worker `skipWaiting()` on new deployment → immediate update

---

## No Remaining Questions

All 35 decisions finalized. Plan is execution-ready.

## Updated Final Counts (v16)

| Metric | Count |
|---|---|
| Phases | 28 |
| New Prisma models | 28 (added AnalyticsEvent, AnalyticsDailyStat) |
| Modified models | 3 |
| API endpoints | 131 (+4 analytics routes) |
| New pages | ~43 (+analytics dashboard) |
| New components | ~35 (+AnalyticsProvider) |
| New libs | 7 |
| Cron jobs | 6 (+aggregate-analytics) |
| Env vars | 9 (removed Umami + Twilio vars) |
| NPM packages | 5 (removed Umami; analytics needs zero packages) |
| Edge cases | 14 fixed |
| Decisions | 36 total |

**Say "go" to start Phase 0 (PII Vault + Encryption).**


# Master Task Checklist

> Updated as each step is implemented and verified.
> `[ ]` = not started · `[/]` = in progress · `[x]` = completed

---

## Phase 0: PII Vault + Encryption
- [ ] Create `lib/encryption.ts` (AES-256-GCM encrypt/decrypt)
- [ ] Create `lib/pii.ts` (store/retrieve/search PII helpers)
- [ ] Add `PersonalVault` model to `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev`
- [ ] Write unit tests for encrypt/decrypt roundtrip
- [ ] Write unit tests for PII store/retrieve
- [ ] Add `PII_ENCRYPTION_KEY` and `PII_HMAC_KEY` to `.env.example`
- [ ] **Verify**: tests pass, no build errors

## Phase 0.5: Migrate Existing PII
- [ ] Create migration script (`scripts/migrate-pii.ts`)
- [ ] Migrate `Member` PII (name, email) to vault
- [ ] Migrate `CommunityMember` PII to vault
- [ ] Migrate `PublicUser` PII to vault
- [ ] Test migration on copy of production data
- [ ] **Verify**: all PII encrypted, original fields still work via helpers

## Phase N: Notification System
- [ ] Add `Notification` model to schema
- [ ] Run migration
- [ ] Create `lib/notify.ts` (sendNotification helper)
- [ ] Create `GET /api/notifications` (own notifications)
- [ ] Create `PATCH /api/notifications/read` (bulk mark read)
- [ ] Create `DELETE /api/notifications/[id]` (dismiss)
- [ ] Add notification bell UI to FloatingNav
- [ ] Add notification bell to Core header
- [ ] Add notification bell to Member header
- [ ] Integrate web push (extend existing `/api/push/*`)
- [ ] **Verify**: create notification → shows in bell → mark read → push works

## Phase SEC: Anti-Spam + Rate Limiting
- [ ] Install `@upstash/ratelimit` + `@upstash/redis`
- [ ] Create `lib/rate-limit.ts` (tiered limiters)
- [ ] Create `middleware.ts` (security headers, request ID)
- [ ] Create `lib/sanitize.ts` (DOMPurify HTML + text sanitization)
- [ ] Install `isomorphic-dompurify`
- [ ] Add rate limiting to all public POST routes
- [ ] Add rate limiting to all auth write routes
- [ ] Add honeypot field to contact + registration forms
- [ ] Add comment spam prevention (cooldown, link limit)
- [ ] Add referral abuse prevention (IP dedup, self-referral block)
- [ ] Add `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` to `.env.example`
- [ ] **Verify**: rate limit returns 429, honeypot rejects bots, sanitization strips XSS

## Phase 2FA: Two-Factor Authentication
- [ ] Add `TwoFactorAuth` + `Passkey` models to schema
- [ ] Run migration
- [ ] Install `otpauth`, `qrcode`, `@simplewebauthn/server`, `@simplewebauthn/browser`
- [ ] Create `lib/2fa/totp.ts` (generate secret, verify code)
- [ ] Create `lib/2fa/passkey.ts` (WebAuthn registration + authentication)
- [ ] Create `POST /api/auth/2fa/totp/setup` (generate QR)
- [ ] Create `POST /api/auth/2fa/totp/verify` (verify + enable)
- [ ] Create `POST /api/auth/2fa/totp/disable`
- [ ] Create `POST /api/auth/2fa/passkey/register`
- [ ] Create `POST /api/auth/2fa/passkey/verify-register`
- [ ] Create `POST /api/auth/2fa/passkey/authenticate`
- [ ] Create `POST /api/auth/2fa/recovery/generate` (10 codes)
- [ ] Create `POST /api/auth/2fa/recovery/verify-backup` (user types back 2)
- [ ] Create `POST /api/auth/2fa/recovery/use`
- [ ] Create `GET /api/auth/2fa/status`
- [ ] Create `POST /api/auth/2fa/challenge` (login verification)
- [ ] Create `/auth/verify-2fa` page
- [ ] Create `/auth/setup-2fa` page
- [ ] Create `TwoFactorSetup` component (profile settings)
- [ ] Modify `lib/auth-options.ts` (add 2FA token flags)
- [ ] Modify `middleware.ts` (2FA redirect for CORE mandatory)
- [ ] Add `WEBAUTHN_RP_ID` + `WEBAUTHN_ORIGIN` to `.env.example`
- [ ] **Verify**: enable TOTP → logout → login → 2FA prompt → verify → session works
- [ ] **Verify**: passkey register → authenticate → works
- [ ] **Verify**: recovery code flow → works
- [ ] **Verify**: CORE without 2FA → forced to setup page

## Phase A: Dual Currency (Wallet)
- [ ] Add `UserWallet`, `PointsBatch`, `WalletTransaction` models
- [ ] Run migration
- [ ] Create `lib/wallet.ts` (earnReward, spendPoints with $transaction)
- [ ] Create `GET /api/wallet` (own wallet)
- [ ] Create `GET /api/wallet/history` (transaction history)
- [ ] Create `GET /api/wallet/expiring` (expiring soon)
- [ ] Create `GET /api/wallet/[userId]` (admin view)
- [ ] Create `POST /api/wallet/adjust` (admin manual adjust)
- [ ] Modify `GET /api/leaderboard` (rank by totalXp)
- [ ] Create `/api/cron/expire-points` (daily FIFO expiry)
- [ ] **Verify**: earn → balance increases, spend → FIFO deduction, expiry cron works

## Phase B: Quest System
- [ ] Add `Quest`, `QuestCompletion` models
- [ ] Run migration
- [ ] Create `GET /api/quests` (public: active quests)
- [ ] Create `POST /api/quests` (CORE: create)
- [ ] Create `GET /api/quests/[id]`
- [ ] Create `PATCH /api/quests/[id]` (update, pause)
- [ ] Create `DELETE /api/quests/[id]` (soft delete)
- [ ] Create `POST /api/quests/[id]/complete` (submit with proof)
- [ ] Create `GET /api/quests/[id]/completions` (admin review)
- [ ] Create `PATCH /api/quests/completions/[id]` (approve/reject → earnReward)
- [ ] Create `POST /api/quests/completions/bulk-review` (bulk approve/reject)
- [ ] Create `GET /api/quests/my` (user's quest history)
- [ ] Create `GET /api/quests/stats` (completed/available for dashboard)
- [ ] **Verify**: create quest → complete → admin approve → XP+Points credited

## Phase C: Enhanced Bounty
- [ ] Modify `Bounty` model (add cash, brief, resources, rules, maxSubmissions)
- [ ] Modify `BountySubmission` model (add submissionNumber)
- [ ] Run migration
- [ ] Modify `GET /api/bounty` (make public, fix audience bug)
- [ ] Modify `POST /api/bounty` (new fields)
- [ ] Modify `POST /api/bounty/submissions` (multi-submission, earnReward)
- [ ] Modify `PATCH /api/bounty/submissions/[id]` (approve → earnReward)
- [ ] Create `POST /api/bounty/submissions/bulk-review`
- [ ] Fix bounty audience bug (audience: "all" works for everyone)
- [ ] **Verify**: create bounty → submit → approve → XP+Points credited

## Phase D: Swag Shop
- [ ] Add `SwagItem`, `SwagVariant`, `SwagOrder` models
- [ ] Run migration
- [ ] Create `GET /api/swag` (list items, filter by audience)
- [ ] Create `POST /api/swag` (CORE: create item)
- [ ] Create `GET /api/swag/[id]` (item detail)
- [ ] Create `PATCH /api/swag/[id]` (update stock, status)
- [ ] Create `DELETE /api/swag/[id]` (soft delete)
- [ ] Create `POST /api/swag/[id]/redeem` (spend points, atomic stock decrement, PII vault for address)
- [ ] Create `GET /api/swag/orders` (admin: all orders)
- [ ] Create `GET /api/swag/orders/my` (user's orders)
- [ ] Create `PATCH /api/swag/orders/[id]` (update status + tracking)
- [ ] **Verify**: create item → redeem → points deducted → stock decremented → order created

## Phase 1: DB Models (Projects + Challenges)
- [ ] Add all project models (Project, ProjectVersion, ProjectComment, ProjectLike, ShowcaseSection)
- [ ] Add all challenge models (Challenge, ChallengeTrack, ChallengeRegistration, ChallengeTeamMember, ChallengeSubmission, ChallengeWinner, ReferralCode, PartnerReviewLink, ScheduledEmail)
- [ ] Add version field for optimistic locking on Project
- [ ] Add unique constraints (registration dedup, etc.)
- [ ] Run migration
- [ ] **Verify**: migration succeeds, no schema conflicts

## Phase 2: Project APIs
- [ ] Create `GET /api/projects` (public list with filters)
- [ ] Create `POST /api/projects` (create, multi-owner teamEmails)
- [ ] Create `GET /api/projects/[id]` (detail, increment viewCount)
- [ ] Create `PATCH /api/projects/[id]` (update with version check + auto-version + notify teammates)
- [ ] Create `DELETE /api/projects/[id]` (owner soft-delete, admin hide)
- [ ] Create `GET /api/projects/[id]/versions` (version timeline)
- [ ] Create `POST /api/projects/[id]/like` (toggle like)
- [ ] Create `GET /api/projects/[id]/comments` (list with hidden toggle)
- [ ] Create `POST /api/projects/[id]/comments` (add comment)
- [ ] Create `PATCH /api/projects/[id]/comments/[cid]` (owner hide)
- [ ] Create `DELETE /api/projects/[id]/comments/[cid]` (admin delete)
- [ ] Create `PATCH /api/projects/[id]/privacy` (privacy settings)
- [ ] Create `PATCH /api/projects/[id]/team` (creator adds/removes members)
- [ ] Create `POST /api/projects/[id]/team/leave` (member leaves)
- [ ] Create `PATCH /api/projects/[id]/team/[email]/privacy` (teammate hides self)
- [ ] Create `POST /api/projects/[id]/report` (flag for moderation)
- [ ] Create `GET /api/projects/my` (own projects)
- [ ] Create `GET /api/projects/search` (full-text search)
- [ ] Create `POST /api/upload/cloudinary` (signed upload)
- [ ] Create `GET /api/public/profile/[userId]/projects` (other user's projects)
- [ ] **Verify**: create → edit (version created) → like → comment → teammate edits → notification sent

## Phase 3: Project Showcase Pages
- [ ] Create `GET /api/projects/showcase` (curated sections)
- [ ] Create `POST /api/projects/showcase` (CORE: create section)
- [ ] Create `PATCH /api/projects/showcase/[id]` (reorder, update)
- [ ] Create `DELETE /api/projects/showcase/[id]`
- [ ] Create `/public/projects/page.tsx` (Discover page)
- [ ] Create `/public/projects/[slug]/page.tsx` (project detail)
- [ ] Create `/public/projects/[slug]/history/page.tsx` (version timeline)
- [ ] **Verify**: showcase renders, project detail shows challenge badge + winner badge

## Phase 4: Challenge CRUD
- [ ] Create `GET /api/challenges` (list with counts)
- [ ] Create `POST /api/challenges` (CORE create)
- [ ] Create `GET /api/challenges/[id]` (detail with tracks)
- [ ] Create `PATCH /api/challenges/[id]` (update)
- [ ] Create `DELETE /api/challenges/[id]` (soft delete)
- [ ] Create `GET /api/challenges/[id]/tracks` (list tracks)
- [ ] Create `POST /api/challenges/[id]/tracks` (add track)
- [ ] Create `PATCH /api/challenges/[id]/tracks/[tid]`
- [ ] Create `DELETE /api/challenges/[id]/tracks/[tid]`
- [ ] Create `PATCH /api/challenges/[id]/status` (phase transitions)
- [ ] **Verify**: create challenge → add tracks → change status → list shows counts

## Phase 5: Referral/UTM System
- [ ] Create `POST /api/challenges/[id]/referrals` (generate code)
- [ ] Create `GET /api/challenges/[id]/referrals` (admin analytics)
- [ ] Create `GET /api/r/[code]` (click track + redirect)
- [ ] Add IP dedup for clicks
- [ ] Block self-referral
- [ ] **Verify**: generate code → click → tracks → register with code → conversion counted

## Phase 6: Team System
- [ ] Create `POST /api/challenges/[id]/teams/invite`
- [ ] Create `POST /api/challenges/[id]/teams/respond`
- [ ] Create `POST /api/challenges/[id]/teams/leave`
- [ ] Create `POST /api/challenges/[id]/teams/remove`
- [ ] Validate team size limit + deadline
- [ ] Send invite email + notification
- [ ] **Verify**: invite → accept → leave → remove → all with deadline enforcement

## Phase 7: Registration Flow
- [ ] Create `POST /api/challenges/[id]/register`
- [ ] Create `GET /api/challenges/[id]/registrations` (admin)
- [ ] Create `GET /api/challenges/[id]/registrations/my` (own)
- [ ] Store UTM/referral data
- [ ] Send confirmation email
- [ ] Unique constraint prevents double registration
- [ ] **Verify**: register → confirmation → admin sees → duplicate blocked

## Phase 8: Submission Flow
- [ ] Create `POST /api/challenges/[id]/submissions` (auto-link to Project)
- [ ] Create `GET /api/challenges/[id]/submissions` (admin)
- [ ] Create `GET /api/challenges/[id]/submissions/my` (own)
- [ ] Create `PATCH /api/challenges/[id]/submissions/[sid]` (review status)
- [ ] Auto-add team members to project teamEmails
- [ ] **Verify**: submit → project created with team → admin reviews → status updates

## Phase 9: Partner Review
- [ ] Create `POST /api/challenges/[id]/partner-links` (generate token link)
- [ ] Create `GET /api/challenges/[id]/partner-links` (list active)
- [ ] Create `DELETE /api/challenges/[id]/partner-links/[lid]` (revoke)
- [ ] Create `GET /api/partner-review/[token]` (token-based view)
- [ ] Validate token expiry
- [ ] **Verify**: generate link → partner views submissions → expired link rejected

## Phase 10: Winner System
- [ ] Create `POST /api/challenges/[id]/winners` (select winner)
- [ ] Create `GET /api/challenges/[id]/winners` (public: published only)
- [ ] Create `PATCH /api/challenges/[id]/winners/[wid]` (update)
- [ ] Create `DELETE /api/challenges/[id]/winners/[wid]` (remove)
- [ ] Create `POST /api/challenges/[id]/winners/publish` (batch publish + award XP+Points)
- [ ] Set project `isWinner=true` + badges
- [ ] Send winner notification (in-app + push + email)
- [ ] **Verify**: select → publish → XP+Points awarded → notifications sent → badges show

## Phase 11: Email Scheduling
- [ ] Create `GET /api/challenges/[id]/emails` (list scheduled)
- [ ] Create `POST /api/challenges/[id]/emails` (schedule)
- [ ] Create `PATCH /api/challenges/[id]/emails/[eid]` (edit before send)
- [ ] Create `DELETE /api/challenges/[id]/emails/[eid]` (cancel)
- [ ] Create `POST /api/challenges/[id]/emails/[eid]/send-now` (manual trigger)
- [ ] Create `/api/cron/send-scheduled-emails` (every 15 min)
- [ ] **Verify**: schedule → cron picks up → sends → manual trigger works

## Phase ANA: Analytics
- [ ] Add `AnalyticsEvent` + `AnalyticsDailyStat` models
- [ ] Run migration
- [ ] Create `lib/analytics.ts` (client-side tracker with sendBeacon)
- [ ] Create `lib/api-tracker.ts` (server-side API tracking)
- [ ] Create `components/providers/AnalyticsProvider.tsx`
- [ ] Create `POST /api/analytics/collect` (receive events, rate limited)
- [ ] Create `GET /api/analytics/stats` (CORE: dashboard stats)
- [ ] Create `GET /api/analytics/events` (CORE: raw events)
- [ ] Create `GET /api/analytics/funnel` (CORE: funnel analysis)
- [ ] Create `/api/cron/aggregate-analytics` (daily aggregation)
- [ ] Wrap `app/layout.tsx` with AnalyticsProvider
- [ ] Add `trackEvent` calls to key user actions
- [ ] Deploy Umami separately (same PostgreSQL)
- [ ] Add Umami script tag to `app/layout.tsx`
- [ ] Create `/core/analytics/page.tsx` (admin dashboard)
- [ ] Add `ApiHealthLog` model to schema
- [ ] Run migration
- [ ] Create `lib/api-monitor.ts` (withMonitoring wrapper)
- [ ] Create `GET /api/monitoring/health` (CORE: health summary)
- [ ] Create `GET /api/monitoring/slow` (CORE: slowest endpoints)
- [ ] Create `GET /api/monitoring/errors` (CORE: recent errors)
- [ ] Create `/api/cron/aggregate-health` (hourly)
- [ ] Modify `/core/monitoring/page.tsx` (monitoring dashboard)
- [ ] Wrap critical API routes with `withMonitoring()`
- [ ] **Verify**: page views tracked → events tracked → dashboard shows data → Umami works → slow API alert fires → error logging works

## Phase UI: Navigation + Page Consistency
- [ ] Update `FloatingNav.tsx` (6-item nav: Home, Programs, Earn▾, Challenges▾, Shop, Contact)
- [ ] Update `/public/bounty` page (match programs/playbooks layout)
- [ ] Update `/public/leaderboard` page (match programs/playbooks layout)
- [ ] Create `/public/contact/page.tsx`
- [ ] Create `POST /api/public/contact` (rate limited, honeypot)
- [ ] **Verify**: nav works on mobile + desktop, pages consistent, contact form sends

## Phase UI-2: Public Dashboard Changes
- [ ] Modify `PublicHero.tsx` (new stat boxes: Playbooks, Bounties, Quests, Ranking)
- [ ] Add dashboard modal for CORE/MEMBER (sessionStorage one-time)
- [ ] Modify `PublicPageClient.tsx` (merge event badges — first card only)
- [ ] Remove Playbooks section from dashboard
- [ ] Modify `app/public/page.tsx` (add quest stats + rank queries)
- [ ] Create `GET /api/public/dashboard-stats` (aggregated public stats)
- [ ] Create `GET /api/public/dashboard-stats/user` (user-specific stats)
- [ ] Add wallet + projects sections to `/public/profile`
- [ ] Create `/public/profile/wallet` page
- [ ] Create `/public/profile/projects` page
- [ ] **Verify**: stat boxes show correct data, events merged correctly, profile shows wallet + projects

## Phase CORE: Core Admin Dashboard
- [ ] Add 6 new resource cards (Challenges, Quests, Swag, Showcase, PII, Analytics)
- [ ] Add 2 new quick actions (Review Queue, Scheduled Emails)
- [ ] Remove old `Quest Submissions` card
- [ ] Merge `Projects` card with showcase
- [ ] Create `/core/challenges/page.tsx` + new + [id]
- [ ] Create `/core/quests/page.tsx` + new
- [ ] Create `/core/shop/page.tsx` + new + orders
- [ ] Create `/core/projects/showcase/page.tsx`
- [ ] Create `/core/pii/page.tsx` (SuperAdmin only)
- [ ] Create `/core/review-queue/page.tsx`
- [ ] Create `GET /api/admin/pii/[vaultId]`
- [ ] Create `DELETE /api/admin/pii/[vaultId]`
- [ ] Create `POST /api/admin/pii/search`
- [ ] Add `challenges`, `quests`, `shop`, `pii`, `analytics` permission keys
- [ ] **Verify**: all cards render, permissions work, PII only for SuperAdmin

## Phase MEMBER: Member Dashboard
- [ ] Create `WalletWidget.tsx` (XP + Points + Rank + Expiry)
- [ ] Create `ActiveQuests.tsx` (quest preview with progress)
- [ ] Create `MyProjects.tsx` (user's projects preview)
- [ ] Create `ShopPreview.tsx` (featured swag items)
- [ ] Modify `MemberDashboard.tsx` (add new sections, remove Content + Playbooks)
- [ ] Modify `app/member/page.tsx` (add wallet, quest, project, shop data fetching)
- [ ] Create `/member/quests/page.tsx`
- [ ] Create `/member/projects/page.tsx`
- [ ] Create `/member/shop/page.tsx` + orders
- [ ] Create `/member/wallet/page.tsx`
- [ ] **Verify**: wallet shows, quests show member-only, projects show, shop shows member-only items

## Phase PWA: Progressive Web App
- [ ] Create `public/manifest.json`
- [ ] Create `public/sw.js` (service worker with caching strategy)
- [ ] Create app icons (192, 512, maskable)
- [ ] Create `/app/offline/page.tsx`
- [ ] Create `components/pwa/InstallPrompt.tsx`
- [ ] Create `components/pwa/ServiceWorkerRegistration.tsx`
- [ ] Add manifest + meta tags to `app/layout.tsx`
- [ ] Implement browsable content caching (stale-while-revalidate)
- [ ] Cache clear on login/logout
- [ ] **Verify**: install prompt shows on mobile, offline fallback works, cached pages load offline

## Phase PERF: Performance + Optimization
- [ ] Add Prisma connection pooling + slow query logging
- [ ] Add missing DB indexes (wallet, project, notification)
- [ ] Add ISR (`revalidate`) to listing pages
- [ ] Add Cloudinary image optimization (f_auto, q_auto)
- [ ] Add dynamic imports for heavy components
- [ ] Add cursor-based pagination for large datasets
- [ ] Create `lib/cache.ts` (Redis cache helper)
- [ ] Cache hot data (leaderboard, stats)
- [ ] **Verify**: Lighthouse score > 90, no slow queries in logs, pages load < 2s

## Phase 13: Security Hardening
- [ ] Audit all API routes for proper auth checks
- [ ] Ensure all POST routes have rate limiting
- [ ] Ensure all user inputs pass through sanitization
- [ ] Add CSRF verification on public POST routes
- [ ] Verify cron endpoints use CRON_SECRET
- [ ] Add payload size limits to all POST routes
- [ ] Remove old quest submission files
- [ ] Remove old Contribution quest logic
- [ ] Remove `CommunityMember.totalXp` references
- [ ] **Verify**: full security audit passes, no unprotected routes

## Phase EDGE: Edge Case Hardening
- [ ] Fix wallet race condition ($transaction + Serializable)
- [ ] Fix swag stock race condition (atomic decrement)
- [ ] Fix registration dedup (@@unique constraint)
- [ ] Add optimistic locking for project edits (version field)
- [ ] Fix team deadline timezone handling (UTC + display)
- [ ] Fix points expiry during spend (lock wallet row)
- [ ] Add email delivery retry on failure
- [ ] Add Cloudinary upload confirmation workflow
- [ ] Add payload size limits (50KB max)
- [ ] Add soft-delete cascade filters (reusable activeProjectFilter)
- [ ] Add PII vault key rotation support (PII_KEY_VERSION)
- [ ] Fix partner link token brute force (32-byte tokens + rate limit)
- [ ] Fix referral self-click inflation (IP + code + day dedup)
- [ ] Fix bounty audience bug (audience: "all" works for everyone)
- [ ] **Verify**: all 14 edge cases tested, race conditions cannot occur

## Phase CSV: Export + Data
- [ ] Create `GET /api/challenges/[id]/export/registrations` (CSV)
- [ ] Create `GET /api/challenges/[id]/export/submissions` (CSV)
- [ ] **Verify**: CSV downloads with correct data

---

## Summary

| Status | Count |
|---|---|
| Total tasks | ~260 |
| Completed | 0 |
| In Progress | 0 |
| Not Started | ~260 |
