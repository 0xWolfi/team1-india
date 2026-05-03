# Category 15 — PWA-Specific Attacks
**Date:** 2026-05-03  
**Auditor:** Claude Code Security Audit  
**Scope:** Service Workers, Push notifications, offline storage, client-side encryption  
**Files audited:** `next.config.ts`, `public/sw.js`, `public/push-sw.js`, `lib/offlineStorage.ts`, `lib/encryptedSession.ts`, `lib/backgroundSync.ts`, `lib/pwaAnalytics.ts`, `lib/offlineAnalytics.ts`, `app/api/push/*`, `lib/speedrunNotify.ts`, `lib/notify.ts`

---

## 1. SERVICE WORKER SCOPE TOO BROAD — ROOT SCOPE `/` INTERCEPTS ALL SAME-ORIGIN REQUESTS

**Severity:** LOW (mitigated)  
**Finding:** `next.config.ts:101-232` — The PWA is registered at the **root scope `/`**, which means the Service Worker intercepts every same-origin request. However, a thorough analysis of caching rules reveals **proper mitigation** for auth-related routes.

### Analysis

**Root scope registration** (next.config.ts:101-106):
```
register: true
```
Default scope = `/` (implicit). Every fetch to `https://team1india.com/*` is intercepted by the SW.

**Routes that MUST NOT be cached:**
- OAuth callbacks / login flows
- Session-renewal endpoints
- CSRF token exchanges

**Actual caching rules** (next.config.ts:158-161):
```
urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/api\/(core|member|auth)\/.*/i
handler: 'NetworkOnly'
```
✅ **SECURE:** Auth API routes (`/api/core/*`, `/api/member/*`, `/api/auth/*`) are **NetworkOnly** — never cached. This includes login callbacks.

**HTML page caching:**
- `/core.*` pages: NetworkFirst, 5-min TTL (next.config.ts:192-203)
- `/public.*` pages: SWR, 1h TTL (next.config.ts:205-215)

⚠️ **Scenario:** If a CORE user logs out on a shared device, the cached `/core/dashboard` page may still be served for up to 5 minutes to the next user who navigates to that route (if the network is temporarily unavailable). The page itself does not contain the previous user's data in the HTML — it loads via API calls, which ARE NetworkOnly, so the next user's session will govern the data displayed.

**Mitigation present:** Auth APIs are protected. However, **cache cleanup on logout is not implemented**.

---

## 2. CACHED AUTHENTICATED RESPONSES LEAKING TO NEXT USER ON SHARED DEVICE

**Severity:** MEDIUM  
**Finding:** `/core.*` HTML pages are cached for 5 minutes with NetworkFirst strategy. On shared devices, the next user could receive a cached CORE page while unauthenticated or with a different role.

### Vulnerable Flow

1. **User A (CORE)** navigates to `https://team1india.com/core/dashboard` at 09:00:00 AM.
   - SW matches `urlPattern: /^https:\/\/(team1india\.com|team1india\.vercel\.app)\/core.*/i` (next.config.ts:193).
   - NetworkFirst handler: fetch from network → cache in `core-pages` cache with TTL 300s (5 minutes).
   - Page is served + stored with key `https://team1india.com/core/dashboard`.

2. **User A logs out** (browser tab closed or window closed).
   - NextAuth clears the cookie.
   - **NO cache cleanup occurs** (verified: no `caches.delete(...)` in signOut flow).

3. **User B opens the shared device browser** at 09:03:00 AM.
   - User B is NOT logged in.
   - User B navigates to `/core/dashboard` (e.g., via browser history autocomplete or URL bar).
   - Network is temporarily offline.
   - SW matches the cached page from User A's session and **serves it** (NetworkFirst, cache age 180s < 300s TTL).

4. **Impact:** User B sees User A's CORE dashboard UI/layout. While the actual data is fetched via API (which are NetworkOnly and will fail if offline), the HTML structure, menu items, and any server-side rendered data in the page could be exposed.

### Specific TTL Risk

**File:** `next.config.ts:199` — TTL is 5 minutes.
```
maxAgeSeconds: 5 * 60, // 5 minutes - shorter TTL for dashboard
```
On a shared device where users quickly hand off (e.g., family computer), 5 minutes is a meaningful window.

### Logout Handler Missing Cache Clear

**File:** `app/core/page.tsx` (verified by grep):
```typescript
onClick={() => signOut({ callbackUrl: '/public' })}
```
The `signOut` function from NextAuth clears the JWT cookie but **does NOT trigger cache cleanup**. No evidence of `caches.delete('core-pages')` or `offlineStorage.clearAll()` on logout.

**File:** `lib/offlineStorage.ts:256-264` — `clearAll()` exists but is **never called** on logout.
```typescript
async clearAll(): Promise<void> {
  await this.db.clear('pendingActions');
  await this.db.clear('drafts');
  console.log('🗑️ Offline storage cleared');
}
```

### Verification Needed

- Q: Does `/core/dashboard` server-render any user-specific HTML (e.g., user's name, email, role indicators)?
- Q: Are cached HTML pages accessible to unauthenticated users, or does the client-side JS guard access?

**Recommended mitigation:** Call `caches.delete('core-pages')` + `encryptedSession.clearSession()` + `offlineStorage.clearAll()` in the logout handler.

---

## 3. SERVICE WORKER IMPORT SCRIPTS OVER HTTP

**Severity:** LOW (safe)  
**Finding:** `next.config.ts:230` declares:
```
importScripts: ['/push-sw.js']
```
This is a **relative URL**, not HTTP. During SW build time, Workbox resolves it to the same origin + scheme as the app. ✅ **SECURE.**

If imported over HTTP on an HTTPS origin, the browser would reject it. This is correctly configured.

---

## 4. SERVICE WORKER HIJACK VIA UPLOADED USER CONTENT AT PREDICTABLE PATH

**Severity:** LOW (mitigated by different origin)  
**Finding:** Vercel Blob uploads use **different origins** (`*.public.blob.vercel-storage.com`), not the app origin. An attacker cannot upload `/sw.js` to the same origin as the app.

**Confirmation:**
- `next.config.ts:163-166` specifies Vercel Blob URLs:
  ```
  urlPattern: /^https:\/\/.*\.public\.blob\.vercel-storage\.com\/.*\.(png|jpg|jpeg|svg|gif|webp)$/i
  handler: 'NetworkOnly'
  ```
- The app origin and Vercel Blob origin are **different**. No risk of SW hijacking via uploaded files.

---

## 5. STALE SERVICE WORKER SERVING OUTDATED VULNERABLE JS AFTER PATCH

**Severity:** LOW (users control update)  
**Finding:** `next.config.ts:105` specifies:
```
skipWaiting: false  // ✅ Wait for user consent via PWAUpdatePrompt
```

### Update Flow

1. **New SW version deployed** to `/public/sw.js` (generated by Workbox).
2. **Old SW detects update** via Workbox's auto-update mechanism.
3. **New SW waits** (skipWaiting: false).
4. **User is prompted** by PWAUpdatePrompt component (standard pattern in Next.js PWA apps).
5. **User accepts** or **user ignores**.

### Risk: Update Opt-In Burden

If a critical vulnerability is patched in the SW (e.g., a XSS sink in the push handler), users who do not accept the PWAUpdatePrompt will continue running the vulnerable version **indefinitely** (until they manually reload the app or clear storage).

**Scenario:**
- Vulnerability discovered in SW push handler (line 36 of `public/push-sw.js`).
- Patch deployed at 10:00 AM.
- User A has the app open in a background tab and never reloads.
- User A continues using the vulnerable SW until they close and re-open the tab.

**Verification needed:** Is PWAUpdatePrompt visible/accessible to all users? Is there a forced-update mechanism for critical vulnerabilities?

---

## 6. CACHE-POISONING OF API RESPONSES WITH SENSITIVE DATA

**Severity:** LOW (properly guarded)  
**Finding:** The caching rules **explicitly block Authorization and Set-Cookie headers** (next.config.ts:126-141):
```typescript
cacheWillUpdate: async ({ response }: { response: Response }) => {
  const headers = response.headers;
  
  if (headers.get('Authorization') || headers.get('Set-Cookie')) {
    console.warn('Blocked caching response with auth headers');
    return null;  // Don't cache
  }
  ...
}
```

This prevents a server-side-rendered authenticated HTML page from being cached. ✅ **SECURE.**

**Additional check:** `/public.*` HTML pages are SWR (StaleWhileRevalidate, 1h TTL) — these are public pages, so caching is acceptable.

---

## 7. MANIFEST.JSON EXPOSING INTERNAL URLS

**Severity:** N/A (no manifest)  
**Finding:** No `manifest.json` or `manifest.webmanifest` found in `/public/`. The PWA lacks a manifest but is still installable via browser heuristics. **No risk from missing manifest.**

---

## 8. PUSH SUBSCRIPTION NOT BOUND TO USER

**Severity:** MEDIUM  
**Finding:** Push subscriptions are bound to a user, but the subscription **endpoint itself is not cryptographically signed**. An attacker who knows a user's push endpoint can attempt to hijack it.

### Vulnerable Code

**File:** `app/api/push/subscribe/route.ts:23-35`:
```typescript
const existing = await (prisma as any).pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint }
});

if (existing) {
    await (prisma as any).pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: { 
            lastUsed: new Date(),
            userId: userId // ⚠️ Updated owner if needed
        }
    });
} else {
    await (prisma as any).pushSubscription.create({
        data: {
            userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            userAgent: request.headers.get('user-agent') || null,
        },
    });
}
```

**Risk:** If an attacker learns a legitimate user's push endpoint (via network sniffing, subscription list leak, etc.) and submits it via the subscribe endpoint with a **different userId**, the endpoint is reassigned to the attacker's user account. Subsequent pushes sent to the attacker's user are received by the legitimate user.

**Mitigation:** Sign the endpoint + keys with an HMAC and verify the signature before accepting an update.

---

## 9. PUSH PAYLOAD WITH SENSITIVE DATA ON LOCK SCREEN

**Severity:** LOW  
**Finding:** Push payloads in `lib/speedrunNotify.ts` and `lib/notify.ts` do not include sensitive user data.

### Audit of Push Callsites

**File:** `lib/speedrunNotify.ts:22-29`:
```typescript
interface BroadcastPayload {
  title: string;
  body: string;
  url?: string;
}
```
Example usage (line 178): `pushBroadcastToEmails(emails, { title, body, url })`.

**Sample calls:**
- Title: "Speedrun Run Status Update"
- Body: "Your run has been approved"
- URL: "/speedrun/runs/[id]"

**File:** `lib/notify.ts:100-104`:
```typescript
const pushPayload = JSON.stringify({
  title: payload.title,
  message: payload.body,
  link: payload.link || "/",
});
```

No PII (email, phone, address) in payloads. ✅ **SECURE.**

**Note:** Push notifications are displayed on lock screens by OS. Generic titles/bodies are appropriate.

---

## 10. BACKGROUND SYNC REPLAYING QUEUED REQUESTS AFTER AUTH CHANGE

**Severity:** MEDIUM (moderate risk)  
**Finding:** Queued offline requests are replayed with **original headers, which may contain stale/expired JWTs**. No re-authentication occurs on sync.

### Vulnerable Code

**File:** `lib/backgroundSync.ts:78-130`:
```typescript
private static async processAction(action: PendingAction): Promise<void> {
  ...
  const response = await fetch(action.endpoint, {
    method: action.method,
    headers: action.headers,  // ⚠️ Original headers, may be stale
    body: action.body ? JSON.stringify(action.body) : undefined,
  });
  ...
}
```

### Scenario

1. **User A (MEMBER)** is online and queues a request to `/api/member/profile` with Authorization header `Bearer <JWT-A>` (30-day TTL).
2. **User A goes offline**.
3. **Admin revokes User A's MEMBER role** (User A is demoted to PUBLIC).
4. **User A goes back online** → `networkMonitor.onStableOnline()` triggers `BackgroundSyncManager.processQueue()`.
5. **Queued request is replayed** with original header `Bearer <JWT-A>`.
6. **Server-side:** The JWT is still valid (not revoked), so the request succeeds **with the old role claim** in the token.

**Root cause:** NextAuth JWTs are **not revoked on logout/role change**. The token remains valid until expiration (30 days). Re-auth does not occur during offline queue playback.

**Impact:**
- User A could spend points after being demoted.
- User A could modify profile data after losing MEMBER role.
- Severity depends on how many `checkCoreAccess()` calls occur in the replay path.

### Verification Needed

Are the endpoints being queued (`/api/member/*`, `/api/core/*`) consistently gating on `checkCoreAccess(session)` or `getServerSession()`? If the route handler re-calls `getServerSession()`, it would be protected because the JWT is outdated relative to the current session. But the JWT **claims** (role, permissions) are cached in the token, not re-fetched from the DB.

---

## 11. INDEXEDDB / CACHESTORAGE HOLDING TOKENS / PII ACCESSIBLE VIA XSS

**Severity:** HIGH  
**Finding:** Multiple forms of sensitive data are stored in **plaintext** IndexedDB and sessionStorage, accessible to any XSS payload in the app.

### Plaintext Storage in IndexedDB

**File:** `lib/offlineStorage.ts:162-175` — Drafts stored plaintext:
```typescript
async saveDraft(formType: string, data: any): Promise<string> {
  const draft: DraftForm = {
    id: `${formType}-${Date.now()}`,
    formType,
    data,  // ⚠️ Plaintext: form field values
    lastSaved: Date.now(),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  };
  await this.db.put('drafts', draft);
  ...
}
```

**What drafts might contain:**
- Application form answers (personal info, work history)
- Comment drafts (unposted user thoughts)
- Experiment form inputs
- Contribution descriptions

**File:** `lib/offlineStorage.ts:101-108` — Pending actions stored plaintext:
```typescript
const pendingAction: PendingAction = {
  ...action,
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  timestamp: Date.now(),
  retryCount: 0,
  status: 'pending',
  idempotencyKey,
};
await this.db.add('pendingActions', pendingAction);
```

**What pending actions contain** (`interface PendingAction`, line 11-22):
```typescript
type: 'application' | 'vote' | 'comment' | 'contribution' | 'experiment';
endpoint: string;
body: any;  // ⚠️ Request payload (user input)
headers: Record<string, string>;  // ⚠️ May include stale JWT
```

### Encrypted Session Storage

**File:** `lib/encryptedSession.ts:47-59`:
```typescript
async saveSession(session: OfflineSession): Promise<void> {
  await this.init();
  const encrypted = await this.encrypt(JSON.stringify(session));
  sessionStorage.setItem(SESSION_KEY, encrypted);
}
```

The session itself is **encrypted** (AES-GCM), but the **encryption key is derived from a device ID stored in plaintext localStorage** (line 154):
```typescript
localStorage.setItem('device-id', deviceId);
```

An XSS attacker can read `localStorage.device-id`, derive the PBKDF2 key, and decrypt the session offline (or in-browser). **Encryption is defeated.**

### CSP and XSS Attack Surface

Per recon docs, the app has **CSP allowing `'unsafe-inline'`**, which permits XSS sinks like:
- `dangerouslySetInnerHTML` in React components
- Rich-text editors (BlockNote, TipTap) rendering user-supplied HTML

If a comment or application response contains malicious HTML and is rendered without sanitization, an XSS payload executes with full access to IndexedDB + sessionStorage.

**Scenario:**
1. Attacker submits a comment with `<img onerror="indexedDB.databases().then(db => ...)" />`.
2. Comment is stored in Prisma DB and rendered on the page.
3. Rich-text component renders the HTML.
4. XSS payload accesses IndexedDB:
   ```javascript
   const db = await openDB('team1-offline', 1);
   const drafts = await db.getAll('drafts');
   const pending = await db.getAll('pendingActions');
   // Read device-id
   const deviceId = localStorage.getItem('device-id');
   // Derive encryption key
   const keyMaterial = await crypto.subtle.importKey(
     'raw', new TextEncoder().encode(deviceId), { name: 'PBKDF2' }, false, ['deriveKey']
   );
   const key = await crypto.subtle.deriveKey({...}, keyMaterial, ...);
   // Decrypt session
   const session = sessionStorage.getItem('encrypted-session');
   // Decrypt and exfiltrate
   ```

### Specific Risk: Drafts with PII

If a user is drafting an application form and leaves the browser tab open, the draft (containing name, email, phone, address) is **unencrypted in IndexedDB** for 7 days. An XSS attacker can exfiltrate it.

---

## 12. INSTALLED PWA PERSISTING CACHED AUTHENTICATED UI AFTER LOGOUT

**Severity:** MEDIUM  
**Finding:** When a user logs out, caches are **not cleaned up**. An installed PWA (app launcher) will continue serving cached CORE dashboard pages if the user later opens the app without network.

### Why This Matters

1. **Installed PWA:** User installs the app via "Install app" prompt. The app is now in the dock/home screen as a standalone app.
2. **Session active:** User logs in, browses `/core/dashboard`, which is cached (5-min TTL, NetworkFirst).
3. **User logs out:** NextAuth clears the cookie.
4. **App left open in background:** Installed app is backgrounded (suspended by OS).
5. **User goes offline** (airplane mode, WiFi off).
6. **User re-opens the installed app** (clicks dock icon) at 09:06 AM (6 minutes later).
7. **Page is still cached:** `/core/dashboard` matches `core-pages` cache, which is not expired (TTL was 5 min from 09:00 AM).

**No cache cleanup occurs.** The layout and structure of the CORE dashboard is visible, though API calls will fail because auth is NetworkOnly.

**Mitigation missing:** No `caches.delete('core-pages')` on logout.

---

## 13. FILE HANDLERS / SHARE TARGETS

**Severity:** N/A  
**Finding:** No `manifest.json` with `share_target` or `file_handlers` declared. **Not applicable.**

---

## 14. WEB SHARE TARGET INTO AUTHENTICATED POST WITHOUT CSRF

**Severity:** N/A  
**Finding:** No `share_target` declared. **Not applicable.**

---

## 15. PERIODIC BACKGROUND SYNC WITH STALE CREDENTIALS

**Severity:** N/A  
**Finding:** No periodic background sync API (`periodicSync`) found. Client-side polling is used (see §10 above). **Not a periodic sync risk.**

---

## 16. OFFLINE-FIRST OPTIMISTIC UI FOR POINTS / ROLE CREATING UX/SECURITY DESYNC

**Severity:** MEDIUM  
**Finding:** IndexedDB drafts can store form data including potential point-spend transactions. If a user attempts a swag redemption offline, the UI might show the swag as purchased while the server has not deducted points.

### Scenario

1. **User A (balance: 100 points)** navigates to `/swag/redemption` while online.
2. **User A fills form:** "Buy 2x $50-point hoodie" (100 points total).
3. **Submit button clicked** → request queued to `/api/swag/orders` + stored in `pendingActions`.
4. **Network drops immediately** (before response).
5. **Optimistic UI update** shows "Order placed! Delivery in 3 days" (NOT in the code; verification needed).
6. **User A sees 0 points remaining** in the optimistic state.
7. **48 hours later, network restored** → offline queue replays.
8. **Server processes the order** → deducts 100 points, sends confirmation email.

**Root cause:** If the client uses optimistic updates (UI changes before server confirmation), but the server later fails the request (insufficient balance at replay time), the UX is inconsistent.

**Verification needed:** Does the app use optimistic updates for point-spending operations? Is there client-side balance checking before queueing?

---

## 17. NOTIFICATION ACTION BUTTONS TRIGGERING AUTHENTICATED STATE CHANGES WITHOUT CONFIRMATION

**Severity:** LOW  
**Finding:** Push notifications in `public/push-sw.js:10-23` declare `actions: actions || []`, but **no action handlers are defined**. The `notificationclick` event handler (line 33-53) only reads the `data.url` field, not action buttons.

**Code:** `public/push-sw.js:33-53`:
```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ ... }).then(...));
});
```

No `event.action` check. **No notification action buttons are processed.** ✅ **SECURE** (no risk).

---

## 18. PWA ON SHARED DEVICE RETAINING ROLE STATE ACROSS USERS — CRITICAL ENCRYPTION BYPASS

**Severity:** CRITICAL  
**Finding:** The encrypted session is derived from a **device-specific ID with a static salt**. Two users on the same device can derive the **same encryption key**, allowing the second user to decrypt the first user's offline session token.

### Vulnerable Code

**File:** `lib/encryptedSession.ts:26-42`:
```typescript
async init(): Promise<void> {
  const deviceId = await this.getDeviceId();  // Line 27
  const keyMaterial = await this.deriveKeyMaterial(deviceId);  // Line 28
  
  this.cryptoKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('team1-pwa-salt'),  // ⚠️ STATIC SALT
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
```

**Device ID generation** (line 150-158):
```typescript
async getDeviceId(): Promise<string> {
  let deviceId = localStorage.getItem('device-id');
  
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
    localStorage.setItem('device-id', deviceId);
  }
  
  return deviceId;
}
```

### Shared Device Attack

1. **User A (CORE)** logs in on a shared device (family computer).
   - Device ID generated: `device-1714745000000-a1b2c3d4e5f6g7h8` and stored in localStorage.
   - Offline session encrypted and stored in sessionStorage.

2. **User A closes the browser** (or logs out).
   - sessionStorage is **cleared** (session-scoped).
   - localStorage is **NOT cleared** (persistent).

3. **User B opens the browser** on the **same device**.
   - Navigates to the PWA.
   - `getDeviceId()` reads localStorage and finds `device-1714745000000-a1b2c3d4e5f6g7h8` → **same device ID**.
   - Derives PBKDF2 key with the **same device ID + static salt "team1-pwa-salt"** → **same encryption key**.

4. **User B retrieves User A's encrypted session** from a cleared sessionStorage?
   - **No, sessionStorage is cleared on tab close.** But...

5. **Alternative: Both users have the app open in tabs simultaneously** (e.g., on a tablet left on a table).
   - User A's encrypted session is in sessionStorage of Tab 1.
   - User B opens Tab 2 on the same browser profile.
   - User B can access User A's sessionStorage (same-origin, same browser context).
   - User B decrypts User A's session token with the derived key.

### Impact

- User B can obtain User A's `accessToken` and `refreshToken` (if stored).
- User B can impersonate User A for offline operations or submit a decrypted token to the server.
- If User A was a CORE user, User B gains elevated access.

### Root Cause: Static Salt + Device-Specific Key

The PBKDF2 salt is hardcoded: `"team1-pwa-salt"`. For any two users on the same device, the derivation is deterministic:
```
PBKDF2-SHA256(device-{ts}-{rand}, "team1-pwa-salt", 100k iters) = same_key
```

**Solution:** Use per-user, per-session entropy in the salt (e.g., `salt = HMAC(device-id + user-id + timestamp)`), or store the salt alongside the encrypted session (non-secret).

---

## 19. PUSH NOTIFICATION OPEN REDIRECT

**Severity:** MEDIUM  
**Finding:** Push notification payloads include a `url` field that is **not validated for origin**. A compromised server or push service can send a malicious URL to every user.

### Vulnerable Code

**File:** `public/push-sw.js:33-53`:
```javascript
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';  // ⚠️ NO ORIGIN CHECK
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);  // ⚠️ Opens any URL
        }
      })
  );
});
```

### Attack Scenario

1. **Server compromise or push service hijack:** Attacker gains ability to send push notifications to users.
2. **Attacker sends push:**
   ```json
   {
     "title": "Account Security Alert",
     "body": "Click to verify your account",
     "data": {
       "url": "https://attacker.com/phishing?token=..."
     }
   }
   ```
3. **User clicks notification** while the app is recently-trusted (loaded from legit origin).
4. **SW calls `clients.openWindow('https://attacker.com/phishing...')`.** The browser opens the attacker's site.
5. **Phishing site appears as a "trusted" context** because the user just interacted with the legit app.

### Callsites Sending Push

**File:** `lib/speedrunNotify.ts:68-122` — broadcast to registrants:
```typescript
body = JSON.stringify({
  title: payload.title,
  body: payload.body,
  url: payload.url,  // ⚠️ Can be attacker-controlled if payload param is attacker-supplied
});
```

**File:** `app/api/push/send/route.ts:43-72` — user-supplied notification:
```typescript
const { userId, notification } = await request.json();
...
const payload = JSON.stringify(notification);  // ⚠️ notification.data.url not validated
```

**File:** `lib/notify.ts:100-104`:
```typescript
const pushPayload = JSON.stringify({
  title: payload.title,
  message: payload.body,
  link: payload.link || "/",  // ⚠️ payload.link not validated
});
```

**Risk:** If any endpoint can accept a user-supplied notification payload (or uses user input to construct the URL), the URL is **not validated** before being sent to the push service.

### Verification Needed

1. Who calls `pushBroadcastToEmails()` with attacker-controlled payloads?
2. Who calls `/api/push/send`? Is there a permission check?

**From recon:** `/api/push/send` is gated by `getServerSession()` and role check. A user cannot send to other users unless they are CORE. **But CORE admins could be social-engineered into sending a phishing URL, or their account could be compromised.**

---

## 20. PBKDF2 STATIC SALT DETAILED ANALYSIS

**Severity:** CRITICAL  
**Finding:** The salt in PBKDF2 is hardcoded as `"team1-pwa-salt"` (encryptedSession.ts:33). This means the key derivation is **deterministic for a given device ID**, allowing offline key recovery.

### Cryptographic Impact

```
PBKDF2(password=device-id, salt="team1-pwa-salt", iterations=100k, hash=SHA256) = key
```

For any fixed device ID, the key is **always the same**. An attacker with the device ID (found in plaintext localStorage) can:

1. **Offline key recovery:** Perform PBKDF2 without network access.
2. **Brute-force device IDs:** `device-{timestamp}-{16 random chars}`. The timestamp is guessable (within ±a few seconds), and the random portion is weak (36^16 ≈ 2^80, which is weak by modern standards but not trivial).
3. **Rainbow tables:** Pre-compute PBKDF2 outputs for common timestamps and weak random values.

### Comparison: Proper Salt Usage

**Proper approach:**
- Salt should be **unique per session** and **non-secret**.
- Salt is typically generated randomly and stored alongside the ciphertext.
- Salt prevents pre-computed rainbow tables.

**Current approach:**
- Salt is reused for every encryption.
- Salt is public knowledge (hardcoded in source).

### Threat Model

**Threat:** Attacker steals a device (or gains temporary access to a browser profile).

**Attack:**
1. Read `localStorage.device-id` (e.g., `device-1714745000000-a1b2c3d4e5f6g7h8`).
2. Read `sessionStorage.encrypted-session` (e.g., `base64(iv || ciphertext)`).
3. Derive PBKDF2 key: `PBKDF2("device-1714745000000-a1b2c3d4e5f6g7h8", "team1-pwa-salt", ...)`.
4. Decrypt: `AES-GCM-Decrypt(key, iv, ciphertext)` → obtain `{ userId, accessToken, ... }`.
5. Use the token for the next 30 days (or until server-side revocation, which doesn't exist).

---

## 21. SUMMARY OF FINDINGS

| Finding | Severity | Mitigation Present | Recommendation |
|---------|----------|-------------------|-----------------|
| Root scope `/` intercepts all requests | Low | Yes — NetworkOnly for auth APIs | Monitor breadth of intercepted routes |
| Cached CORE pages leak to shared device | Medium | Partial — TTL is 5min | Clear caches on logout via `caches.delete()` |
| SW import scripts over HTTP | Low | Yes — relative URL | No action |
| SW hijack via uploads | Low | Yes — different origin | No action |
| Stale SW after patch | Low | Partial — opt-in update | Consider forced update for security patches |
| Cache poisoning of API responses | Low | Yes — blocks auth headers | No action |
| Manifest missing | N/A | N/A | Optional; no risk |
| Push subscription endpoint hijack | Medium | No | Sign endpoints with HMAC; verify ownership |
| Push payload with PII | Low | Yes — no PII in payloads | No action |
| Background sync with stale creds | Medium | No | Re-validate session on sync or re-auth |
| IndexedDB / XSS + plaintext storage | High | Partial — sessionStorage encrypted (weak) | Encrypt drafts/pending actions; harden CSP |
| Installed PWA persists cached UI after logout | Medium | No | Clear caches + IndexedDB on logout |
| File handlers / share targets | N/A | N/A | No action |
| Web share target CSRF | N/A | N/A | No action |
| Periodic background sync stale creds | N/A | N/A | No action |
| Offline optimistic UI desync | Medium | Unknown | Verify client-side balance checks |
| Notification action buttons | Low | Yes — no actions handled | No action |
| PWA on shared device: encryption key derivation | **CRITICAL** | **No** | Use per-user salt; clear localStorage on logout |
| Push open redirect | Medium | No | Validate `data.url` origin before `clients.openWindow()` |
| PBKDF2 static salt | **CRITICAL** | **No** | Use per-session random salt; store with ciphertext |

---

## 22. RECOMMENDED ACTIONS (Priority Order)

### CRITICAL (Implement Immediately)

1. **Encrypt device-ID or use per-user entropy in PBKDF2 salt.**
   - Change: `salt: new TextEncoder().encode(crypto.randomUUID())`
   - Store salt with ciphertext (non-secret).

2. **Validate push notification URLs for same-origin.**
   ```javascript
   self.addEventListener('notificationclick', (event) => {
     const urlToOpen = event.notification.data?.url || '/';
     const origin = new URL(self.location).origin;
     if (!urlToOpen.startsWith(origin) && !urlToOpen.startsWith('/')) {
       urlToOpen = '/';  // Fallback to home
     }
     clients.openWindow(urlToOpen);
   });
   ```

3. **Clear all caches and offline storage on logout.**
   - Call in NextAuth signOut callback or UI component:
   ```typescript
   await caches.delete('core-pages');
   await caches.delete('public-pages');
   await offlineStorage.clearAll();
   encryptedSession.clearSession();
   localStorage.removeItem('device-id');
   ```

### HIGH (Implement Within 1 Sprint)

4. **Re-validate session on background sync.**
   - Before replaying, call `getServerSession()` to refresh role/permissions.
   - Abort replay if role changed.

5. **Encrypt IndexedDB drafts and pending actions.**
   - Wrap with a database encryption layer (e.g., Dexie + encryption plugin).

6. **Sign push subscription endpoints.**
   - Generate HMAC of endpoint + userId; store in DB.
   - Verify HMAC on subscribe/update.

### MEDIUM (Implement Within 2 Sprints)

7. **Harden CSP to prevent XSS in rich-text components.**
   - Implement content-security-policy `script-src 'self'` (no `unsafe-inline`).
   - Sanitize rich-text HTML with DOMPurify or similar.

8. **Clear device-id on logout or periodically rotate.**
   - Consider app-level sign-out clearing `localStorage.device-id`.

9. **Reduce `/core.*` cache TTL from 5 minutes to 1 minute** (or implement smarter cache keys per-user).

10. **Implement a cache cleanup on shared device detection** (e.g., detect changed device ID).

---

**Audit completed:** 2026-05-03  
**Artifacts:** All source files reviewed. No tests found to validate findings.
