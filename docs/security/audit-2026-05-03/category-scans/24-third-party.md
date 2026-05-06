# Category 24 — Third-Party Integrations & Webhooks

**Audit Date:** 2026-05-03  
**Category:** Third-Party Integrations, Webhooks, Data Egress  
**Risk Level:** CRITICAL (one finding) / HIGH (three findings) / MEDIUM (six findings)

---

## Scope & Methodology

This category audits all external service integrations, webhook patterns, API credential handling, and data egress to third parties. Per the reconnaissance (RECON.md §Step 12), the application integrates with:

- **Google OAuth** — Authentication via `next-auth`
- **Google Calendar** — Event scheduling with OAuth2 refresh tokens
- **Luma** — Event data polling via API key
- **Vercel Blob** — File storage with `BLOB_READ_WRITE_TOKEN`
- **Cloudinary** — Image hosting with signed uploads
- **SMTP (nodemailer)** — Email sending via credentials
- **Web Push** — Notifications with VAPID keys
- **Slack** — Outbound webhook for alerts
- **Vercel Analytics** — Client-side metrics

**Key constraint:** No inbound webhooks found (Luma is polled, not pushed). All webhook checks (#1–4) are N/A.

---

## Finding 1: Slack Webhook URL Exposed in Client Bundle (CRITICAL)

**Severity:** CRITICAL  
**CWE-200 (Exposure of Sensitive Information), CWE-347 (Improper Verification of Cryptographic Signature)**

### Details

The Slack incoming webhook URL is stored in `NEXT_PUBLIC_SLACK_WEBHOOK_URL` environment variable and thus is **baked into the client JavaScript bundle** at build time. Per recon (RECON.md §Step 11, line 326):

> "🚩 `NEXT_PUBLIC_SLACK_WEBHOOK_URL` — Slack incoming webhooks accept anonymous POST; exposing the URL in the client bundle lets any visitor post to your Slack channel forever (until rotated)."

**Location:**
- [lib/alertNotifications.ts:32](../../../lib/alertNotifications.ts#L32) — reads env var on class init
- [app/layout.tsx](../../../app/layout.tsx) — entire bundle is served to any user

### Code Analysis

```typescript
// lib/alertNotifications.ts L32-37
if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL) {
  this.channels.push({
    type: 'slack',
    endpoint: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,  // ← EXPOSED
    minSeverity: 'error',
  });
}

// Use case: lib/alertNotifications.ts L102-128
private async sendSlack(webhook: string, alert: ErrorReport): Promise<void> {
  await fetch(webhook, {  // ← Unauthenticated POST to public URL
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      attachments: [{
        color, title, text, fields, footer, ts
      }],
    }),
  });
}
```

### Attack Scenario

1. Attacker visits the application (unauthenticated).
2. Attacker fetches the JavaScript bundle and extracts the Slack webhook URL.
3. Attacker crafts arbitrary Slack messages and POSTs to the webhook URL.
4. Messages appear in the Slack channel with no authentication or rate limiting.
5. Attacker can spam, impersonate alerts, or send sensitive information to the channel.

### Impact

- **Slack channel integrity:** Attacker can post false alerts, warnings, or sensitive data.
- **Social engineering:** Attacker can impersonate system alerts to trick users.
- **Availability:** Spam flooding can disrupt legitimate alerts.
- **Reputation:** Malicious messages posted to the channel can damage trust.

The webhook remains vulnerable **until the token is rotated**. Rotation is manual.

### Recommendation

**Immediately:**
1. Rotate the Slack webhook URL in Vercel environment settings.
2. Create a new webhook with a different URL in Slack (Settings → Apps & Integrations → Incoming Webhooks).

**Short-term:**
1. Move the webhook URL to a **server-side-only secret** (remove `NEXT_PUBLIC_` prefix).
2. Create a server API endpoint (e.g., `/api/alert-to-slack`) that validates the request and proxies to Slack.
3. Gate the endpoint with authentication (session required) or a server-side secret header.

**Code example (mitigation):**
```typescript
// ✅ Server-side only:
const slackWebhook = process.env.SLACK_WEBHOOK_URL; // no NEXT_PUBLIC_

// ✅ Add endpoint:
// app/api/internal/alert-to-slack/route.ts
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-internal-token');
  if (token !== process.env.INTERNAL_ALERT_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { alert } = await req.json();
  // Proxy to Slack webhook server-side only
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  return Response.json({ success: true });
}
```

---

## Finding 2: Similar Exposure: NEXT_PUBLIC_ALERT_WEBHOOK_URL (CRITICAL)

**Severity:** CRITICAL  
**Same vector as Finding 1**

### Details

A second custom webhook URL is exposed in `NEXT_PUBLIC_ALERT_WEBHOOK_URL`:

**Location:**
- [lib/alertNotifications.ts:50-53](../../../lib/alertNotifications.ts#L50-L53)

```typescript
if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL) {
  this.channels.push({
    type: 'webhook',
    endpoint: process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL,  // ← EXPOSED
    minSeverity: 'warning',
  });
}
```

This exposes the webhook to any URL the application forwards alerts to. If that URL is a third-party service or internal endpoint, it is now discoverable by any attacker.

### Recommendation

Same as Finding 1: move to server-side secret and gate API access.

---

## Finding 3: Google OAuth State Validation (MEDIUM)

**Severity:** MEDIUM  
**CWE-352 (Cross-Site Request Forgery — CSRF)**

### Details

NextAuth handles OAuth state validation, but it is important to verify that custom overrides do not weaken it. Review [lib/auth-options.ts:13-86](../../../lib/auth-options.ts#L13-L86):

- `signIn` callback accepts the OAuth user and does not override state handling.
- NextAuth maintains state internally via a secure, httpOnly CSRF cookie.
- [lib/auth-options.ts:223-233](../../../lib/auth-options.ts#L223-L233) shows CSRF token is set correctly.

**Verified:** NextAuth state validation is in place. No custom override found.

**Risk:** If a developer adds a custom OAuth provider or overrides the Google provider callback without understanding state validation, the application becomes vulnerable to CSRF.

### Recommendation

1. Document the requirement: "Do not override OAuth provider callbacks without state re-validation."
2. Add a code comment in [lib/auth-options.ts](../../../lib/auth-options.ts) to prevent future misuse.
3. Periodic audit of auth-related changes before deployment.

---

## Finding 4: Google Calendar Refresh Token Storage (MEDIUM)

**Severity:** MEDIUM  
**CWE-798 (Use of Hard-Coded Credentials), CWE-798 (Hardcoded Secrets)**

### Details

Google OAuth refresh token is stored in the environment variable `GOOGLE_REFRESH_TOKEN`:

**Location:**
- [lib/google-calendar.ts:22](../../../lib/google-calendar.ts#L22)

```typescript
const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
```

The token is used to authenticate with Google Calendar API to create events:

- [lib/google-calendar.ts:48-50](../../../lib/google-calendar.ts#L48-L50) — sets the refresh token
- [lib/google-calendar.ts:55](../../../lib/google-calendar.ts#L55) — refreshes access token on each call

### Questions Raised

1. **Where is the refresh token stored?** Per assumption (RECON.md §Step 15, assumption #1), the token is in Vercel environment settings. Is it rotated? Is it backed up?
2. **What scope?** Google OAuth permissions are requested at consent time. If the token has `calendar.events` scope only, it is narrow. If it has broader scopes (e.g., `calendar`, `drive`), there is scope creep risk.
3. **Expiry?** Refresh tokens do not expire by default, but Google can revoke them. Expired or revoked tokens cause the `unauthorized_client` error (handled at [lib/google-calendar.ts:67](../../../lib/google-calendar.ts#L67)).

### Impact

- If the refresh token leaks (e.g., via logs, backups, or accidental commits), an attacker can create calendar events on behalf of the organization indefinitely.
- No refresh-token rotation policy observed.

### Recommendation

1. **Scope Review:** Verify that the Google Cloud Console project grants **only** `https://www.googleapis.com/auth/calendar.events` scope (not broader `calendar` scope).
2. **Token Rotation:** Implement a quarterly refresh-token rotation process:
   - Re-authorize via Google OAuth to get a new refresh token.
   - Update `GOOGLE_REFRESH_TOKEN` in Vercel.
   - Test before and after.
3. **Logging:** Review [lib/google-calendar.ts:65](../../../lib/google-calendar.ts#L65) — the error logging logs `clientIdPrefix`, `redirectUri`, and `environment`. Ensure logs do not leak the actual token.
4. **Revocation Handling:** If the token is compromised, a process to revoke it and re-authenticate should be documented and executed immediately.

---

## Finding 5: Luma API Key Trusted on Poll (MEDIUM)

**Severity:** MEDIUM  
**CWE-345 (Insufficient Verification of Data Authenticity)**

### Details

The Luma API key is stored in `LUMA_API_KEY` and used to poll the Luma public API for event data:

**Location:**
- [lib/luma.ts:78](../../../lib/luma.ts#L78) — reads env var
- [lib/luma.ts:126](../../../lib/luma.ts#L126) — sends as `x-luma-api-key` header

```typescript
const apiKey = process.env.LUMA_API;  // Note: env var name mismatch (L78)
// ... later ...
headers: {
  accept: "application/json",
  "x-luma-api-key": apiKey,
}
```

### Issues

1. **Typo in env var name:** [lib/luma.ts:78](../../../lib/luma.ts#L78) reads `LUMA_API`, but the recon (RECON.md §Step 12) lists it as `LUMA_API_KEY`. Verify the actual env var name in production.
2. **No signature verification:** The response from Luma is trusted as-is. If Luma is compromised or returns data intended for another customer, the application will ingest it. This is a data integrity issue flagged in Category 18 (Third-Party Data Trust).
3. **Unauthenticated redirect risk (SSRF-adjacent):** The Luma API URL is hardcoded as `https://public-api.luma.com/v1/calendar/list-events`, so it cannot be redirected by an attacker. No SSRF risk here.
4. **No rate limiting:** The cron job is gated by `CRON_SECRET` (per RECON.md §Step 3), so the frequency is controlled. But once the cron job runs, it issues multiple paginated requests to Luma without rate limiting. If Luma is slow or down, the cron timeout (4s per request, L119) will be hit.

### Impact

- **Data integrity:** If Luma API is compromised or returns stale data, the application will display incorrect event information.
- **Supply chain trust:** The Luma API key is a trust boundary. If it leaks, an attacker can authenticate and exfiltrate data or modify responses.

### Recommendation

1. **Verify env var name:** Confirm that `LUMA_API_KEY` is the correct variable name in production (or fix the typo in the code).
2. **Add response validation:** Validate the schema of the Luma response. Use a schema validator (e.g., zod) to ensure all events have required fields (api_id, name, start_at, etc.).
3. **Signature verification (if Luma supports it):** If Luma provides signed responses or webhook signatures, implement verification.
4. **Audit trail:** Log all Luma API calls and responses (without sensitive data) for audit purposes.

---

## Finding 6: Cloudinary Signed Upload Signature (MEDIUM)

**Severity:** MEDIUM  
**CWE-347 (Improper Verification of Cryptographic Signature)**

### Details

Cloudinary uploads are signed using SHA1 HMAC. The signature is generated server-side and sent to the client:

**Location:**
- [app/api/upload/cloudinary/route.ts:19-22](../../../app/api/upload/cloudinary/route.ts#L19-L22)

```typescript
const { folder } = await request.json();
const timestamp = Math.round(Date.now() / 1000);
const paramsToSign = `folder=${folder || "uploads"}&timestamp=${timestamp}`;
const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");
```

### Strengths

- Signature includes `timestamp` to prevent replay (though no expiry window is enforced on the client).
- `apiSecret` is server-side only (not exposed to client).
- Cloudinary validates the signature before accepting the upload.

### Weaknesses

1. **No replay window:** The timestamp is included but no TTL (e.g., 15 minutes) is enforced. An attacker can capture the signature and use it indefinitely as long as the timestamp is in the future (or Cloudinary doesn't validate against the current time).
2. **Folder parameter user-supplied:** The `folder` is sent from the client in the request body and included in the signature. An attacker can change the folder to `../../sensitive` (if Cloudinary allows path traversal). The signature will be regenerated server-side, but the attacker could theoretically bypass this by replaying an older signature with a different folder. **Mitigation:** The server-side signature validation at [app/api/upload/cloudinary/route.ts:21](../../../app/api/upload/cloudinary/route.ts#L21) does not include the folder in the signed parameters — only `folder`, `timestamp`, and `signature` are sent. Cloudinary will validate, but if Cloudinary's validation is weak, the risk exists.
3. **SHA1 is deprecated:** SHA1 is considered cryptographically broken. However, for HMAC signatures (not collision-based attacks), SHA1 is still acceptable in short-term use. Cloudinary may still require it for API compatibility.

### Impact

- **Unauthorized uploads:** An attacker with a captured signature could upload to the same folder (with the same timestamp assumption) indefinitely.
- **Path traversal (if Cloudinary is misconfigured):** An attacker could upload to sensitive folders.

### Recommendation

1. **Add expiry window:** Return the signature only if the timestamp is within the last 15 minutes. Reject old signatures on the client-side before upload.
2. **Verify Cloudinary config:** In Vercel, check the Cloudinary API settings. Ensure:
   - Unsigned uploads are **disabled** (prevent direct uploads without signature).
   - Upload presets are **restricted** (only allow specific transformations, formats).
   - Folder/tag restrictions are in place.
3. **Consider upgrading to SHA256:** If Cloudinary API supports it, upgrade the signature algorithm.
4. **Audit Cloudinary uploads:** Log all uploads (via Cloudinary audit trail) and review for suspicious activity.

---

## Finding 7: Vercel Blob Token Exposure via Client (MEDIUM)

**Severity:** MEDIUM  
**CWE-798 (Use of Hard-Coded Credentials)**

### Details

Vercel Blob uploads use a `BLOB_READ_WRITE_TOKEN` that is passed from the server to the client to perform direct uploads. Per Category 19 findings, the token is sent to authenticated users (CORE/MEMBER) only:

**Location:**
- [app/api/upload/token/route.ts:15-29](../../../app/api/upload/token/route.ts#L15-L29)

```typescript
const response = await handleUpload({
  request,
  body,
  token: process.env.BLOB_READ_WRITE_TOKEN,  // ← Passed to Vercel SDK
  onBeforeGenerateToken: async (pathname) => {
    return {
      allowedContentTypes: [
        "image/jpeg", "image/png", "image/webp", "image/gif",
      ],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,
    };
  },
});
```

### Context

The `handleUpload` function from `@vercel/blob/client` generates a **scoped, short-lived upload token** from the read-write token. The token is **not exposed** to the client; instead, the SDK returns a signed upload token with limited permissions.

However, if the upload token is intercepted in transit (HTTPS must be used) or stored improperly on the client, it could be replayed.

### Risk Assessment

- **Per-request token generation:** The Vercel Blob SDK generates a unique token per request (via `onBeforeGenerateToken`). This limits the blast radius.
- **Authentication gate:** The endpoint requires CORE or MEMBER role, preventing unauthorized token generation.
- **Content-type restriction:** Only images are allowed (JPEG, PNG, WebP, GIF). Executable uploads are blocked.
- **Size limit:** 10 MB cap prevents large file abuse.

### Recommendation

1. **Verify HTTPS-only:** Ensure the `/api/upload/token` endpoint is served over HTTPS only (no HTTP fallback).
2. **Token TTL:** Verify that the per-request token expires quickly (e.g., 5–15 minutes). Check Vercel documentation for defaults.
3. **Audit blob uploads:** Review Vercel Blob audit logs for suspicious uploads or spike in volume.
4. **Rate limiting:** Add rate limiting to `/api/upload/token` to prevent token generation spam.

---

## Finding 8: SMTP Credentials in Environment (MEDIUM)

**Severity:** MEDIUM  
**CWE-798 (Use of Hard-Coded Credentials), CWE-522 (Insufficiently Protected Credentials)**

### Details

SMTP credentials are stored as environment variables and used to send email:

**Location:**
- [lib/email.ts:4-12](../../../lib/email.ts#L4-L12)

```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

**Usage:** The transporter is used to send application emails (welcome, approvals, rejections, meeting invitations, etc.) throughout the codebase.

### Questions Raised

1. **Email provider:** Based on defaults, is this Gmail SMTP? Gmail limits SMTP to app-specific passwords (with 2FA), and the limit is typically 500–1000 emails per day.
2. **SPF/DKIM/DMARC:** What is the posture of the SMTP provider? If using Gmail, SPF/DKIM are automatically configured. If using a custom SMTP server, they may not be.
3. **Email rate limiting:** The cron job sends scheduled emails (per RECON.md §Step 3, `/api/cron/send-scheduled-emails`), but no per-user or per-hour rate limit is visible in the code.

### Impact

- **Credential leak:** If the SMTP credentials leak (e.g., in logs), an attacker can send email as the organization.
- **Email injection:** If email recipients or subject/body are not properly sanitized, header injection attacks are possible (e.g., injecting `Bcc:` headers to exfiltrate email to attacker's address).

### Callsites

Email is sent from:
- [app/api/admin/send-email/route.ts:34-39](../../../app/api/admin/send-email/route.ts#L34-L39) — admin manual email (hardcoded recipients)
- [app/api/operations/schedule-meeting/route.ts:175-227](../../../app/api/operations/schedule-meeting/route.ts#L175-L227) — meeting invitations
- [app/api/event-feedback/send-email/route.ts](../../../app/api/event-feedback/send-email/route.ts) — feedback notifications
- [lib/email.ts](../../../lib/email.ts) — multiple templates (welcome, approval, rejection, contribution, speedrun, etc.)

### Data Flowing to SMTP

- **Recipient email addresses** (from database or user input)
- **User names** (from application records)
- **Event/project titles** (from database)
- **Meeting links** (from Google Calendar)
- **Telegram IDs** (in approval emails, if provided)
- **Form data** (in event application notifications)

Example from [app/api/operations/schedule-meeting/route.ts:175-227](../../../app/api/operations/schedule-meeting/route.ts#L175-L227):

```typescript
const emailHtml = `
  ...
  <strong>Title:</strong> ${title}
  ...
  <strong>Date & Time:</strong> ${startDateTime.toLocaleString(...)}
  ...
  <a href="${meetEvent.meetLink}" ...>
`;
```

Meeting titles and links are exposed to the SMTP provider (and the email provider if using Gmail).

### Recommendation

1. **Email provider audit:**
   - Confirm the SMTP provider (Gmail, SendGrid, AWS SES, etc.).
   - If Gmail, verify app-specific password is used with 2FA enabled.
   - If custom SMTP, ensure encryption (TLS/SSL) and strong credentials.

2. **Header injection prevention:** Verify that email recipients, subject, and body are sanitized. Use a library like `email-validator` to validate recipient addresses.

3. **Data minimization:** Reduce PII in email bodies. Instead of including meeting links directly in the email, provide a link to the application with a token.

4. **Rate limiting:** Implement per-user email send rate limiting (e.g., 5 emails per hour) to prevent spam.

5. **Audit trail:** Log all emails sent (recipient, subject, timestamp) for audit purposes.

---

## Finding 9: Web Push Payload Control & VAPID Private Key (MEDIUM)

**Severity:** MEDIUM  
**CWE-345 (Insufficient Verification of Data Authenticity), CWE-798 (Hardcoded Credentials)**

### Details

Web Push notifications are signed using VAPID (Voluntary Application Server Identification) keys. The private key is stored in `VAPID_PRIVATE_KEY`:

**Location:**
- [app/api/push/send/route.ts:13-24](../../../app/api/push/send/route.ts#L13-L24)

```typescript
const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  return Response.json(
    { error: 'Push notifications not configured' },
    { status: 503 }
  );
}

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@team1india.com',
  publicKey,
  privateKey
);
```

### Issues

1. **Payload control:** The push payload is sent from the client and forwarded to FCM/APNs:
   ```typescript
   // app/api/push/send/route.ts:43, 60
   const { userId, notification } = await request.json();
   const payload = JSON.stringify(notification);  // ← User-supplied
   ```
   The `notification` object is user-supplied. Per Category 15 findings, if the payload includes user data (e.g., email, username), it is exposed to push providers (Google FCM, Apple).

2. **VAPID key storage:** The private key is in the environment. If it leaks, an attacker can sign push notifications as the organization. However, the attacker still needs to know the subscription endpoints of users (which are stored in the `PushSubscription` table).

3. **Subscription IDOR:** The route checks `userId !== session.user.id && session.user.role !== 'CORE'` (L46), preventing cross-user access. However, a CORE user can send push to any user.

### Impact

- **Push notification spam:** An attacker with the VAPID key and subscription endpoints can send arbitrary notifications.
- **PII in payloads:** User data in notifications is exposed to push providers (Google, Apple).

### Recommendation

1. **Payload validation:** Validate the notification payload schema. Restrict payloads to safe, pre-approved structures (e.g., title, body, icon URL only). Do not allow arbitrary user data in payloads.
2. **VAPID key rotation:** Rotate VAPID keys annually (or on suspected leak). This requires regenerating keys and potentially notifying users to re-subscribe.
3. **Push payload audit:** Log all push notifications sent (recipient, payload hash, timestamp) for audit purposes.
4. **Rate limiting:** Implement per-user push send rate limiting to prevent spam.

---

## Finding 10: Luma Event Data Trusted Without Verification (MEDIUM)

**Severity:** MEDIUM  
**CWE-345 (Insufficient Verification of Data Authenticity)**

### Details

Data fetched from Luma API is upserted into the database without signature verification or schema validation (beyond basic type checking):

**Location:**
- [lib/luma.ts:138-206](../../../lib/luma.ts#L138-L206)

```typescript
const data = (await res.json()) as {
  entries: LumaApiEntry[];
  next_cursor?: string;
  has_more?: boolean;
};

if (data.entries && data.entries.length > 0) {
  allEntries = allEntries.concat(data.entries);
}

// Later: upsert into DB without further validation
const upsertOps = allEntries.map((entry) =>
  prisma.lumaEvent.upsert({
    where: { apiId: entry.api_id },
    update: {
      name: entry.event.name,
      startAt: new Date(entry.event.start_at),
      // ... etc
    },
  })
);
```

### Risk

If Luma API is compromised or misconfigured, the application will ingest and display arbitrary event data:
- Event names could contain XSS payloads (mitigated by React's default escaping, but still a risk).
- Event URLs could redirect to phishing sites.
- Geo location data could be manipulated.

This is flagged as a Category 18 risk (Third-Party Data Trust) and is repeated here for completeness.

### Recommendation

1. **Schema validation:** Use a schema validator (zod, yup) to validate the Luma API response before upserting.
   ```typescript
   const LumaEventSchema = z.object({
     api_id: z.string(),
     event: z.object({
       api_id: z.string(),
       name: z.string().max(500),
       start_at: z.string().datetime(),
       end_at: z.string().datetime().optional(),
       cover_url: z.string().url().optional(),
       url: z.string().url(),
       // ... etc
     }),
   });
   
   const validated = LumaEventSchema.parse(entry);
   ```

2. **Signature verification:** If Luma supports signed responses, implement verification.

---

## Summary Table

| # | Finding | Severity | Type | Status |
|---|---------|----------|------|--------|
| 1 | Slack webhook URL in client bundle | CRITICAL | Exposed Secret | OPEN |
| 2 | Alert webhook URL in client bundle | CRITICAL | Exposed Secret | OPEN |
| 3 | Google OAuth state validation | MEDIUM | CSRF Prevention | OK (NextAuth) |
| 4 | Google Calendar refresh token storage | MEDIUM | Credential Mgmt | OPEN |
| 5 | Luma API key trusted on poll | MEDIUM | Data Integrity | OPEN |
| 6 | Cloudinary signed upload signature | MEDIUM | Signature TTL | OPEN |
| 7 | Vercel Blob token exposure | MEDIUM | Credential Mgmt | MITIGATED |
| 8 | SMTP credentials in environment | MEDIUM | Email Injection | OPEN |
| 9 | Web Push payload control & VAPID key | MEDIUM | Push Notification Spoofing | OPEN |
| 10 | Luma event data trust | MEDIUM | Data Integrity | OPEN (Cat 18) |

---

## Outbound Data Egress Summary

**Per integration, data flowing to vendor:**

### Google OAuth
- **What flows:** Email, full name, profile picture URL
- **When:** On every signIn (L79 logs email plaintext)
- **Risk:** Email is logged plaintext; see Category 13 (Logging)

### Google Calendar
- **What flows:** Meeting title, description, attendee email addresses, meeting dates/times, Google Meet link
- **When:** On `/api/operations/schedule-meeting` POST
- **Risk:** Attendee email addresses are exposed to Google as calendar attendees

### Luma API
- **What flows:** None (read-only from Luma)
- **When:** Cron job `/api/cron/sync-events` (nightly or hourly)

### SMTP (Email Provider)
- **What flows:** Recipient email address, subject, body (HTML), sender email
- **Body contains:** User names, event titles, meeting links, form data, application status, telegram IDs
- **When:** Application sends email (welcome, approval, rejection, meeting invitation, feedback notification)
- **Risk:** PII in email bodies (names, IDs, links) is exposed to email provider

### Vercel Blob
- **What flows:** File content (images: JPEG, PNG, WebP, GIF), file name
- **When:** Client uploads via `/api/upload/token`
- **Risk:** File metadata (name, size, hash) is visible to Vercel

### Cloudinary
- **What flows:** Image file content, folder name, file name (with random suffix)
- **When:** Client uploads via signed request to Cloudinary API
- **Risk:** Image content is stored on Cloudinary servers (third-party)

### Web Push (FCM / Apple Push)
- **What flows:** Notification payload (user-supplied title, body, icon URL)
- **When:** Push notification is sent to subscribed user
- **Risk:** If payload contains PII, it flows to Google FCM or Apple

### Slack Webhook
- **What flows:** Error/alert messages (type, severity, message, details, timestamp)
- **When:** PWA alert is triggered (service worker error, cache corruption, quota exhaustion)
- **Risk:** Details could contain sensitive information; URL is exposed to anyone who fetches the client bundle

### Vercel Analytics
- **What flows:** Page views, performance metrics, browser/device/country (anonymized)
- **When:** Every page load (via `@vercel/analytics/react`)
- **Risk:** Low; Vercel analytics is anonymized and first-party

---

## Recommendations Prioritized

**Immediate (this sprint):**
1. Rotate Slack webhook URL and move to server-side secret.
2. Rotate alert webhook URL and move to server-side secret.

**Short-term (next sprint):**
3. Implement per-request token expiry for Cloudinary signatures.
4. Add schema validation for Luma API responses.
5. Implement push notification payload validation and rate limiting.

**Ongoing:**
6. Document and audit Google Calendar refresh token rotation policy.
7. Review and harden email injection prevention (sanitize recipients, subject, body).
8. Implement audit trails for sensitive integrations (Luma, Cloudinary, SMTP).

---

## Compliance & Assumptions

**GDPR / Data Processing:**
- Email addresses and names flow to SMTP provider (Google/SendGrid/etc.). DPA should cover data processing.
- Profile pictures flow to Google via OAuth. Google's privacy policy applies.
- Cloudinary and Vercel Blob store file content. Ensure terms allow user-uploaded content.

**Assumptions (from RECON.md §Step 15):**
1. SMTP provider (Gmail or other) has SPF/DKIM/DMARC posture and limits. (Open Assumption #4)
2. Vercel project settings include WAF and DDoS protection. (Open Assumption #1)
3. Vercel environment-protection is enabled to prevent preview deploys from accessing prod secrets. (Open Assumption #1)
4. Cloudinary upload preset config is reviewed and unsigned uploads are disabled. (Open Assumption #3)

---

**End of Category 24 Scan**
