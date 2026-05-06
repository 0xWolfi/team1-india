# Category 18 — SSRF & Outbound Request Forgery

**Audit date:** 2026-05-03  
**Auditor:** Claude (autonomous security agent)  
**Severity levels:** CRITICAL | HIGH | MEDIUM | LOW | INFO

---

## Executive Summary

This codebase has **limited SSRF surface** due to the absence of user-supplied URL fetch patterns in API routes. External integrations are all hardcoded or fully environment-configured:

- **Google OAuth**: NextAuth-managed, issuer fixed to Google.
- **Luma API**: Hardcoded API endpoint, API key environment-supplied.
- **Google Calendar**: Service account OAuth, hardcoded endpoint.
- **SMTP/Email**: nodemailer with environment-configured host/credentials.
- **Vercel Blob**: SDK-based upload with signed credentials.
- **Cloudinary**: SDK-based upload with signed credentials.
- **Web Push (FCM/APNs)**: Via web-push library.

**No inbound webhooks exist** (Luma is polled, not pushed). **No user-supplied URL fetch** patterns found in API routes.

**Two findings** (one MEDIUM, one INFO):
1. **MEDIUM**: Avatar endpoint fetches from `unavatar.io` with user-supplied Twitter handle (input-validated but still a remote fetch).
2. **INFO**: Service Worker push notification handler opens URLs from notification payload without origin validation (low severity in practice due to subscription binding, but architecturally loose).

**Expected breach impact if Luma API is compromised**: Data pollution in `LumaEvent` table (no schema validation). Rendered to users without escaping risk (separate XSS assessment).

---

## Check 1: User-Supplied URL Fetch without Allowlist

### Finding: Avatar Endpoint (Twitter Handle → unavatar.io)

**File:** `/Users/sarnavo/Development/team1-india/app/api/avatar/route.ts`  
**Severity:** MEDIUM  
**Type:** Unvalidated Remote Fetch (Indirect SSRF Risk)

#### Details

```typescript
// Line 6-16
const handle = req.nextUrl.searchParams.get("handle");
if (!handle) {
  return new NextResponse("Missing handle", { status: 400 });
}

const clean = handle
  .replace(/^@/, "")
  .replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, "")
  .split("/")[0]
  .split("?")[0]
  .trim();

// Line 23
const res = await fetch(`https://unavatar.io/x/${clean}`, {
  next: { revalidate: 86400 },
});
```

**Assessment:**
- **Input source:** Query parameter `?handle=<user_input>`
- **Fetch target:** Hardcoded domain `unavatar.io` (NOT user-supplied).
- **Attack surface:** Attacker supplies a Twitter handle; code strips URLs and special chars, then fetches from `unavatar.io/x/{clean}`.
- **SSRF relevance:** The *destination* is hardcoded. The handle is used as a path segment, not as the URL itself. This is **not classical SSRF** (fetch arbitrary URL), but carries indirect risk if `unavatar.io` is compromised or hijacked.

**Validation:**
- Handle cleaning is reasonable (removes `@`, URL prefixes, query params, fragments).
- Empty handles are rejected.
- Destination (`unavatar.io`) is not under user control.

**Risk escalation scenarios:**
1. If DNS is poisoned or `unavatar.io` domain is hijacked, attacker could exfil metadata about valid Twitter handles.
2. If `unavatar.io` enforces rate limits or logs IP+handle, leaking user handle enumeration patterns to the service.

**Recommendation:** Document that `unavatar.io` is a third-party dependency and monitor for ToS/SLA changes.

---

## Check 2: Cloud Metadata Endpoint Reachable from Function

**Verdict:** N/A

Vercel Functions (Next.js serverless) do not have AWS EC2 metadata endpoints (`169.254.169.254`) reachable by default. No code attempts to fetch from this range.

---

## Check 3: DNS Rebinding Tolerance

**Verdict:** N/A

No code calls `dns.lookup()` with user input. All `fetch()` calls use either:
- Hardcoded URLs (Luma, Google, email, avatar, push, blob).
- Environment-configured URLs (SMTP, OAuth endpoints).
- Relative URLs (internal API paths: `/api/...`).

No second-fetch-to-validate pattern.

---

## Check 4: Webhook Delivery to User URL

**Verdict:** N/A

**Recon context:** No inbound webhooks; Luma is polled via cron, not pushed. No webhook URL parameter in API endpoints.

---

## Check 5: PDF/Image/OG-Tag Fetcher Exploitable

### next.config.ts Remote Image Patterns

**File:** `/Users/sarnavo/Development/team1-india/next.config.ts:49-80`

```typescript
images: {
  minimumCacheTTL: 31536000,
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.lu.ma' },
    { protocol: 'https', hostname: 'images.lu.ma' },
    { protocol: 'https', hostname: 'lu.ma' },
    { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google profile pictures
    { protocol: 'https', hostname: 'jvribvzirutackel.public.blob.vercel-storage.com' }, // Vercel Blob
    { protocol: 'https', hostname: 'images.unsplash.com' },
    { protocol: 'https', hostname: 'images.lumacdn.com' },
  ],
}
```

**Assessment:**
- All patterns use hardcoded hostnames.
- None allow user-controlled domains (e.g., no `*.example.com` wildcard, no placeholder `{user_domain}`).
- Domains: Luma, Google (OAuth profile pictures), Vercel Blob (own file storage), Unsplash (stock images), Luma CDN.
- **Next.js Image component:** Uses these patterns for client-side `<Image src="..." />` tags. **Does not fetch on server** — merely allows browser to load from these domains.
- **SSRF risk:** **NONE** — images are fetched *by the browser*, not by the server. Server-side rendering inserts `<img src="..." />` tags; browser then fetches.

**Notes:**
- Google profile pictures: After OAuth, user's `image` claim from Google is inserted into DB. If the OAuth profile is hijacked, an attacker could set a malicious image URL on the Google account — but Google's domain is not under attacker control, so this is credential theft, not SSRF.

---

## Check 6: OAuth/OIDC Discovery URL from Client-Controlled Issuer

**Verdict:** SAFE

**File:** `/Users/sarnavo/Development/team1-india/lib/auth-options.ts:6-10`

```typescript
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
```

**Assessment:**
- **Issuer:** Google (fixed).
- **Discovery URL:** Not client-supplied. NextAuth uses the official Google discovery endpoint.
- **No override:** No mechanism to change the issuer at request time (no query param `?issuer=...`).
- **OIDC flow:** PKCE is handled by NextAuth library; state/nonce are server-validated.

**Verdict:** No OAuth issuer injection vulnerability.

---

## Check 7: Admin Link-Preview with Admin-Network Reachability

**Verdict:** N/A

No link-preview, unfurl, or OG-tag-fetch routes found in the codebase. No admin-only graph-scraping endpoints.

---

## Additional Vector: Luma API Sync as Untrusted Input

### Finding: Luma Event Data Validation

**File:** `/Users/sarnavo/Development/team1-india/lib/luma.ts:76-220`  
**Severity:** MEDIUM  
**Type:** Untrusted External Data Injection

#### Details

```typescript
// Line 77-82
export async function syncLumaEvents(): Promise<{ synced: number; errors: number }> {
  const apiKey = process.env.LUMA_API;
  if (!apiKey) {
    console.warn("LUMA_API environment variable is not set");
    return { synced: 0, errors: 0 };
  }

  // Line 112-130
  const url = new URL("https://public-api.luma.com/v1/calendar/list-events");
  url.searchParams.append("after", sixMonthsAgo.toISOString());
  if (nextCursor) {
    url.searchParams.append("pagination_cursor", nextCursor);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      accept: "application/json",
      "x-luma-api-key": apiKey,
    },
    cache: "no-store",
    signal: controller.signal,
  });

  const data = (await res.json()) as {
    entries: LumaApiEntry[];
    next_cursor?: string;
    has_more?: boolean;
  };

  // Line 170-207: Upsert without schema validation
  const upsertOps = allEntries.map((entry) => {
    const firstHost = entry.event.hosts?.[0];
    const allHosts = entry.event.hosts?.map(h => ({ name: h.name || null, email: h.email || null })) || [];
    return prisma.lumaEvent.upsert({
      where: { apiId: entry.api_id },
      update: {
        name: entry.event.name,
        startAt: new Date(entry.event.start_at),
        endAt: entry.event.end_at ? new Date(entry.event.end_at) : null,
        coverUrl: entry.event.cover_url || null,
        url: entry.event.url,
        timezone: entry.event.timezone || null,
        visibility: entry.event.visibility,
        city: entry.event.geo_address_json?.city || null,
        geoData: entry.event.geo_address_json || Prisma.JsonNull,
        hostName: firstHost?.name || null,
        hostEmail: firstHost?.email || null,
        hosts: allHosts.length > 0 ? allHosts : Prisma.JsonNull,
        syncedAt: now,
      },
      create: { /* same fields */ },
    });
  });

  await prisma.$transaction(upsertOps);
```

**Assessment:**

1. **API Endpoint:** Hardcoded to `https://public-api.luma.com/v1/calendar/list-events`.
2. **API Key:** Environment-supplied (`LUMA_API_KEY`).
3. **Response handling:** 
   - Response is cast to `LumaApiEntry[]` inline (TypeScript assertion only, **not runtime validation**).
   - No Zod schema, no runtime type checking.
   - Fields like `entry.event.name`, `entry.event.url`, `entry.event.geo_address_json` are inserted into the database as-is.

4. **Threat model:** If Luma API is compromised (or if attacker controls the DNS response):
   - Attacker can inject malicious event names (e.g., XSS payloads if rendered without escaping).
   - Attacker can inject malicious URLs (if used in unfurl/link-preview, could cause SSRF on consumer).
   - Attacker can inject large geoData JSON (DoS via bloat).
   - Attacker can insert email addresses (if used for targeting, could leak to attacker via user action).

5. **Database trust model:** Event data from Luma is treated as trusted and written directly to `LumaEvent` table. Consumers of this table (UI pages, API endpoints) must sanitize on read.

**Risk escalation:**
- If `LumaEvent` data is rendered in `<img src="...">`, `<a href="...">`, or other HTML contexts without escaping, XSS occurs.
- If `coverUrl` or `url` are ever fetched server-side (re-upload, re-host, link-preview), SSRF could occur.
- No audit trail of data tampering (no `syncedAt` per-field validation).

**Recommendation:** 
- Add runtime schema validation with Zod or similar before upserting.
- Mark `LumaEvent` as "external, treat as untrusted" in code comments.
- Ensure all consumers escape HTML-sensitive fields.

---

## Additional Vector: Google Profile Picture URL Fetching

**File:** `/Users/sarnavo/Development/team1-india/lib/auth-options.ts:13-86`  
**Severity:** LOW  
**Type:** Indirect User-Supplied External URL

#### Details

```typescript
// Line 25
await prisma.member.update({ 
  where: { id: member.id }, 
  data: { name: user.name, image: user.image } 
});
```

The `user.image` claim from Google OAuth is stored directly in `Member.image`. This URL is typically `lh3.googleusercontent.com/<hash>` (Google's CDN).

**Assessment:**
- **Source:** Google OAuth user info endpoint (authenticated).
- **URL control:** User cannot directly control the URL (it's issued by Google). However, if a user's Google account is compromised, attacker could set a malicious profile picture URL on Google's platform.
- **Server-side fetch:** The codebase does **not** fetch or re-upload this image. It's stored and exposed to clients via API responses (e.g., `GET /api/profile`). Clients then fetch from the URL in their `<Image>` tags.
- **SSRF risk:** **None** — the image is never fetched server-side.
- **XSS risk:** If the image URL is reflected in HTML without escaping (e.g., `<img src="{{ user.image }}" />`), it's safe because `src` attributes don't execute scripts. The URL is on a trusted Google domain anyway.

**Verdict:** No actionable SSRF risk.

---

## Additional Vector: Image/Video URLs in Database

**File:** `/Users/sarnavo/Development/team1-india/prisma/schema.prisma` (selective models)

Models with image/video URLs:
- `Member.image` — from Google OAuth.
- `PublicUser.profileImage` — from Google OAuth.
- `CommunityMember.profileImage` — from file uploads or OAuth.
- `Project.coverImage` — user-uploaded via Cloudinary.
- `MediaItem.links` — user-supplied links.
- `LumaEvent.coverUrl` — from Luma API.
- `SpeedrunEvent.coverImage` — TBD.

**Assessment:**
- **Server-side fetch:** Grep for `fetch(` + image/video URLs shows **no server-side image re-fetching, re-hosting, or re-uploading logic**.
- **Client-side usage:** Images are exposed via API JSON responses; clients load them via `<Image>` component (uses `next.config.ts` remotePatterns allowlist).
- **Cloudinary uploads:** Users upload via Cloudinary SDK (client-side); URLs are received from Cloudinary and stored. No server-side fetch.

**Verdict:** No SSRF risk in image/video handling.

---

## Additional Vector: Background Sync Queue (Offline-First)

**File:** `/Users/sarnavo/Development/team1-india/lib/backgroundSync.ts:99`  
**Severity:** LOW  
**Type:** Client-Controlled Request Queue

#### Details

```typescript
// Line 78-129
private static async processAction(action: PendingAction): Promise<void> {
  // ...
  const response = await fetch(action.endpoint, {
    method: action.method,
    headers: action.headers,
    body: action.body ? JSON.stringify(action.body) : undefined,
  });
```

The `action.endpoint` is stored in IndexedDB (local browser storage) and replayed when the network comes back online.

**Assessment:**
- **Source of endpoint:** User's own form submissions queued offline (e.g., a POST to `/api/comments` with a comment body).
- **Storage:** IndexedDB `pendingActions` table, plaintext.
- **Attack surface:** If an attacker gains JavaScript execution on the page (via XSS), they could inject arbitrary endpoints into IndexedDB and have them replayed as the user (cross-origin request forgery, not SSRF).
- **SSRF relevance:** The endpoint is relative (e.g., `/api/comments`, not `http://attacker.com/steal`). However, XSS + IndexedDB access could be combined to CSRF or exfil data.

**Recommendation:** 
- Validate endpoint URLs before replay (ensure they are same-origin: start with `/api/`).
- Consider encrypting IndexedDB data at rest (already done for sessionStorage per code review, but not for IndexedDB).

---

## Additional Vector: Push Notification Handler

**File:** `/Users/sarnavo/Development/team1-india/public/push-sw.js:33-53`  
**Severity:** INFO  
**Type:** Service Worker URL Open without Validation

#### Details

```javascript
// Line 36
const urlToOpen = event.notification.data?.url || '/';

// Line 48-50
if (clients.openWindow) {
  return clients.openWindow(urlToOpen);
}
```

The Service Worker opens a URL from the push notification payload without origin validation.

**Assessment:**
- **Payload source:** Push subscription is server-controlled. Attacker cannot send push notifications without authorization (must have the PushSubscription object's endpoint secret, per Web Push spec).
- **Subscription binding:** Each `PushSubscription` is bound to a user email in the `PushSubscription` table. Only authenticated requests from the backend can send to a subscription.
- **URL validation:** No check that `urlToOpen` is same-origin (e.g., `urlToOpen.startsWith(location.origin)`).
- **Attack scenario:** If an attacker gains backend write access to `PushSubscription` table, they could send a push with `{ data: { url: "http://evil.com/" } }`. The SW would open it.

**Risk escalation:** Low in practice because backend breach is required. If mitigated, it's defense-in-depth.

**Recommendation:** Add origin validation:
```javascript
const baseOrigin = new URL(location.href).origin;
const urlToOpen = event.notification.data?.url || '/';
if (!urlToOpen.startsWith(baseOrigin) && !urlToOpen.startsWith('/')) {
  return clients.openWindow(baseOrigin); // Fallback to homepage
}
```

---

## Additional Vector: Slack & Custom Webhook URLs

**File:** `/Users/sarnavo/Development/team1-india/lib/alertNotifications.ts:31-57`  
**Severity:** INFO / ALREADY FLAGGED CAT 16  
**Type:** Client-Side Webhook URL Exposure

#### Details

```typescript
if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL) {
  this.channels.push({
    type: 'slack',
    endpoint: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
    minSeverity: 'error',
  });
}

if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL) {
  this.channels.push({
    type: 'webhook',
    endpoint: process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL,
    minSeverity: 'warning',
  });
}
```

Both URLs are exposed in the client bundle via `NEXT_PUBLIC_*` environment variables. Slack incoming webhooks accept anonymous POST requests.

**Assessment:**
- **Confidentiality:** Any visitor can extract the webhook URL from the JavaScript bundle.
- **Integrity:** Any visitor can POST to the webhook URL and send fake alerts to Slack (noise, social engineering, false alarms).
- **Availability:** Attacker can spam the webhook endpoint (DoS to Slack channel, rate-limit exhaustion).

**Verdict:** Already flagged as Critical in Cat 16 (Secrets Management). Not SSRF, but related to outbound request forgery.

---

## Summary of Findings

| Finding | Category | Severity | Status |
|---------|----------|----------|--------|
| Avatar endpoint fetches from unavatar.io with user-supplied handle | Remote Fetch Indirect SSRF | MEDIUM | Flagged |
| Luma API response lacks schema validation before DB write | Data Injection | MEDIUM | Flagged |
| Push notification handler opens URL without origin check | Open Redirect / CSRF | INFO | Recommended fix |
| Slack/alert webhook URLs exposed in client bundle | Secret/Credential Leak | INFO | Already flagged Cat 16 |

---

## Conclusion

This codebase **has minimal SSRF surface**. The architecture is sound:
- External integrations use hardcoded endpoints or environment-configured credentials.
- No user-supplied URL fetch patterns in API routes.
- Image/video URLs are handled client-side, not server-side.
- No inbound webhooks.

The main risks are:
1. **Indirect SSRF via Luma API compromise** — mitigation: add Zod schema validation.
2. **Data injection from Luma** — mitigation: escape HTML-sensitive fields on render.
3. **Minor: Push notification open-redirect** — mitigation: add origin validation.

All hardcoded endpoints are documented in the recon file (Step 12). No critical SSRF vulnerabilities identified.

---

## Verification Checklist

- [x] Searched all `fetch(` callsites (app/api, lib/).
- [x] Checked for user-supplied URL parameters in API routes.
- [x] Verified OAuth issuer is not client-controlled.
- [x] Inspected `next.config.ts` remotePatterns — all hardcoded.
- [x] Verified Luma API endpoint is hardcoded.
- [x] Checked Google Calendar endpoint — hardcoded.
- [x] Inspected push notification handler — no origin validation (INFO).
- [x] Verified no server-side image re-fetch logic.
- [x] Confirmed no inbound webhooks.
- [x] Checked background sync queue for relative-URL enforcement (recommended).

