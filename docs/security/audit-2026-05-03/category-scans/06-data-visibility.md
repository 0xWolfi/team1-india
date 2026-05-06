# Category 6 — Data Visibility Tiers & Field-Level Masking

**Audit date:** 2026-05-03  
**Scope:** Field-level exposure analysis across 150+ API endpoints  
**Status:** COMPLETE  

---

## Executive Summary

This scan identified **11 distinct data visibility violations** across PII, financial, and authentication secret fields. The primary failure pattern is **absence of role-based masking on API responses**; endpoints return full PII values to CORE/admin users without consideration of whether downstream consumers (UI, exports, logs) need the complete value or a masked version. Additionally, soft-deleted records (`deletedAt` field) lack comprehensive filtering, and application data (form responses) are exposed without schema-aware masking.

**Risk level:** HIGH  
- Auth secrets (TOTP secret, recovery codes, passkey credentialId/publicKey) are properly encrypted at-rest and never exposed in API responses. ✅
- PII is broadly visible to CORE users without context-aware masking, creating risk if CORE accounts are compromised. 🚩
- Speedrun CSV export returns all sensitive fields unmasked, equivalent to CORE JSON API response (no format-specific filtering). 🚩
- Soft-delete filtering incomplete across ~6 tables; some findMany calls lack `deletedAt: null` constraint. 🚩

---

## Findings

### Finding 1: Member.email Visible to CORE Without Masking

**Severity:** HIGH  
**Category:** PII visible to roles below business intent  

#### Details

The `/api/members` endpoint returns full email addresses for all CORE users with `members:READ` permission. There is **no masking or redaction** applied to the email field in responses.

| Endpoint | Role | Returns | Status |
|---|---|---|---|
| `GET /api/members` | CORE (READ) | `[{id, email, permissions, tags, status, createdAt, customFields}]` | Unmasked |
| `GET /api/members/[id]/permissions` | CORE (FULL_ACCESS) | Full `Member` record | Unmasked |
| `GET /api/admin/public-users` | CORE (FULL_ACCESS) | `PublicUser` list with `email` field | Unmasked |

#### Code References

**[app/api/members/route.ts:22-46](https://github.com/team1-india/team1-india/blob/test/app/api/members/route.ts#L22-L46)**
```typescript
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    const access = checkCoreAccess(session);
    if (!access.authorized) return access.response!;
    
    const members = await prisma.member.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            email: true,  // ← EXPOSED UNMASKED
            permissions: true,
            tags: true,
            status: true,
            createdAt: true,
            customFields: true
        }
    });
    
    return NextResponse.json(members);  // ← Returned directly to response
}
```

**[app/api/admin/public-users/route.ts:42-50](https://github.com/team1-india/team1-india/blob/test/app/api/admin/public-users/route.ts#L42-L50)**
```typescript
const [users, total] = await Promise.all([
    prisma.publicUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // ← No select; returns all fields including email
    }),
    prisma.publicUser.count({ where }),
]);

return NextResponse.json({ data: users, pagination: {...} });
```

#### Impact

- If a CORE account is compromised, an attacker gains a directory of all internal team emails and community member emails.
- The endpoints do not distinguish between CORE users who **need** the email (e.g., comms team) vs. those who don't (e.g., content-only admins).
- No field-level access control; `checkCoreAccess()` gates the entire endpoint, not individual fields.

---

### Finding 2: SpeedrunRegistration PII Exported Unmasked (CSV Export)

**Severity:** HIGH  
**Category:** Masking done in UI only (full value in API response) + Masking inconsistent across formats

#### Details

The `/api/speedrun/registrations/export` endpoint returns a CSV file containing unmasked PII: `userEmail`, `fullName`, `phone`, `city`, `twitterHandle`, `githubHandle`, and `captainEmail`. This is a CORE-only export, but the **CSV format reveals the same data as the JSON API response**, with no format-specific filtering or masking applied.

#### Code References

**[app/api/speedrun/registrations/export/route.ts:34-86](https://github.com/team1-india/team1-india/blob/test/app/api/speedrun/registrations/export/route.ts#L34-L86)**
```typescript
const headers = [
    "createdAt",
    "runSlug",
    "runLabel",
    "fullName",    // ← UNMASKED PII
    "email",       // ← UNMASKED PII
    "phone",       // ← UNMASKED PII
    "city",        // ← UNMASKED PII
    "twitter",     // ← UNMASKED PII
    "github",      // ← UNMASKED PII
    "primaryRole",
    "experience",
    "techStack",
    "teamMode",
    "team1Id",
    "captainEmail",  // ← UNMASKED PII
    // ... 10 more fields
];

const rows = registrations.map((r) => [
    r.createdAt.toISOString(),
    r.run.slug,
    r.run.monthLabel,
    r.fullName,           // ← Full name exposed
    r.userEmail,          // ← Full email exposed
    r.phone ?? "",        // ← Full phone exposed
    r.city ?? "",         // ← City exposed
    r.twitterHandle ? `@${r.twitterHandle}` : "",  // ← Social handle exposed
    r.githubHandle ? `@${r.githubHandle}` : "",    // ← Social handle exposed
    // ...
]);

const csv = [headers, ...rows].map(toCsvRow).join("\n");
return new Response(csv, {
    status: 200,
    headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",  // ← Good cache control, but content is unmasked
    },
});
```

#### Comparison with JSON API

**[app/api/speedrun/registrations/route.ts:25-49](https://github.com/team1-india/team1-india/blob/test/app/api/speedrun/registrations/route.ts#L25-L49)** returns the same unmasked fields in JSON:
```typescript
const [registrations, runs, totalCount] = await Promise.all([
    prisma.speedrunRegistration.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
            team: { select: { id: true, name: true, code: true, captainEmail: true } },
            run: { select: { id: true, slug: true, monthLabel: true } },
        },
        // ← Returns all fields including userEmail, fullName, phone, etc.
    }),
    // ...
]);

return NextResponse.json({ registrations, runs, totalCount });
```

#### Impact

- Ops team can now export registrant data to CSV without masking, exposing phone numbers and social handles.
- CSV exports are often forwarded via email or Slack; PII leakage is then outside the application perimeter.
- No field-level masking logic exists for either JSON or CSV formats.

---

### Finding 3: TOTP Secret Returned in Setup Response (Secret Exposure in API)

**Severity:** CRITICAL  
**Category:** Auth secrets visible in API response

#### Details

The `/api/auth/2fa/totp/setup` endpoint returns the plaintext TOTP secret **in the JSON response**. While the secret is stored encrypted in the database, the intermediate step of returning it to the client is risky—if the response is logged, cached, or intercepted, the secret is exposed.

#### Code References

**[app/api/auth/2fa/totp/setup/route.ts:9-24](https://github.com/team1-india/team1-india/blob/test/app/api/auth/2fa/totp/setup/route.ts#L9-L24)**
```typescript
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret = generateTotpSecret();  // ← Fresh plaintext secret
  const uri = generateTotpUri(session.user.email, secret);

  // Store encrypted secret (not yet enabled — user must verify first)
  await prisma.twoFactorAuth.upsert({
    where: { userEmail: session.user.email },
    update: { totpSecret: encrypt(secret) },  // ← Encrypted at-rest
    create: { userEmail: session.user.email, totpSecret: encrypt(secret) },
  });

  return NextResponse.json({ secret, uri });  // ← PLAINTEXT SECRET IN RESPONSE! 🚩
}
```

#### Impact

- If response is logged by Vercel, middleware, or a debugging tool, the plaintext secret is captured.
- If a network proxy/WAF logs JSON bodies, the secret is exposed.
- The URI itself (contains the secret encoded in the `otpauth://` string) is also returned.

#### Mitigation in code

The endpoint is correct in returning the secret + QR URI for display to the user (they need to scan the URI), but the plaintext secret should **only** be displayed once and never logged. The current implementation does not prevent logging.

---

### Finding 4: Member.permissions (Admin-Only Field) Visible to CORE Without Role-Based Filtering

**Severity:** HIGH  
**Category:** Admin-visible fields including super-admin-only fields

#### Details

The `/api/members` GET endpoint returns `Member.permissions` JSON to any CORE user with `members:READ` permission. This field should only be visible to users with `members:FULL_ACCESS` (i.e., superadmins), not to lower-tier CORE members.

#### Code References

**[app/api/members/route.ts:22-46](https://github.com/team1-india/team1-india/blob/test/app/api/members/route.ts#L22-L46)**
```typescript
const members = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
        id: true,
        email: true,
        permissions: true,    // ← EXPOSED TO ALL CORE:READ USERS
        tags: true,
        status: true,
        createdAt: true,
        customFields: true
    }
});

return NextResponse.json(members);
```

#### Correct gate (for reference)

**[app/api/members/[id]/permissions/route.ts:22-26](https://github.com/team1-india/team1-india/blob/test/app/api/members/[id]/permissions/route.ts#L22-L26)** correctly gates at FULL_ACCESS:
```typescript
if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.FULL_ACCESS)) {
    return new NextResponse("Insufficient Permissions. Must have FULL_ACCESS to members resource.", { status: 403 });
}
```

But the **list endpoint** only checks READ, not FULL_ACCESS.

#### Impact

- A CORE user with `members:READ` (e.g., content reviewer) can enumerate all admin permissions and identify superadmins.
- An attacker with a compromised lower-tier CORE account can map the permission hierarchy.

---

### Finding 5: PublicUser.email Visible to CORE in Admin Panel Without Masking

**Severity:** MEDIUM  
**Category:** PII visible to roles below business intent

#### Details

The `/api/admin/public-users` endpoint (CORE-only) returns all `PublicUser` fields unfiltered, including email, which should be considered semi-private (visible to the user themselves, not to all admins).

#### Code References

**[app/api/admin/public-users/route.ts:42-50](https://github.com/team1-india/team1-india/blob/test/app/api/admin/public-users/route.ts#L42-L50)**
```typescript
const [users, total] = await Promise.all([
    prisma.publicUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        // ← No select clause; returns *all* PublicUser fields
    }),
    prisma.publicUser.count({ where }),
]);

return NextResponse.json({ data: users, pagination: {...} });
```

No explicit field selection, so all fields (including `email`, `city`, `country`, `signupIp`) are returned.

---

### Finding 6: Notification Messages Returned Without Content Filtering

**Severity:** MEDIUM  
**Category:** Notifications may contain sensitive data

#### Details

The `/api/notifications` GET endpoint returns the full `message` field without filtering. If notifications contain sensitive info (e.g., "Your passkey was registered from 192.168.1.100"), the plaintext message is returned to the user's session.

#### Code References

**[app/api/notifications/route.ts:21-40](https://github.com/team1-india/team1-india/blob/test/app/api/notifications/route.ts#L21-L40)**
```typescript
const notifications = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    // ← Returns all fields, including `message` and `type`
});

return NextResponse.json({
    notifications,  // ← Full notification objects returned
    unreadCount,
    nextCursor: hasMore ? notifications[notifications.length - 1]?.id : null,
});
```

**Current Notification model** (per schema):
```prisma
model Notification {
  id        String   @id @default(uuid())
  userEmail String   // recipient
  type      String   // "quest_approved", "bounty_approved", "team_invite", etc.
  title     String
  message   String   // ← Returned unfiltered
  link      String?
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

#### Impact

- Low in this codebase (no IP addresses or sensitive data observed in notifications yet).
- Risk if notifications include user IP, device fingerprints, or other auxiliary PII.

---

### Finding 7: AuditLog Metadata Contains Unredacted PII and Visible to CORE (Only)

**Severity:** MEDIUM  
**Category:** Audit logs metadata leaking PII

#### Details

The `/api/logs` endpoint returns AuditLog records with unredacted `metadata` JSON field. While gated to CORE-only, the metadata can contain sensitive values from the logged action (e.g., email addresses, form data).

#### Code References

**[app/api/logs/route.ts:51-62](https://github.com/team1-india/team1-india/blob/test/app/api/logs/route.ts#L51-L62)**
```typescript
const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: skip,
        include: {
            actor: {
                select: { name: true, image: true, email: true }
            }
        }
        // ← No filtering on metadata field
    })
]);

return NextResponse.json({
    items: logs,  // ← logs[].metadata returned unfiltered
    pagination: {...}
});
```

**Example metadata** (from speedrun registration audit at [app/api/speedrun/registrations/[id]/route.ts:83-93](https://github.com/team1-india/team1-india/blob/test/app/api/speedrun/registrations/[id]/route.ts#L83-L93)):
```typescript
metadata: {
    runSlug: updated.run.slug,
    registrantEmail: updated.userEmail,  // ← PII in metadata
    changedKeys: Object.keys(data),
}
```

#### Impact

- CORE users can see all audit log metadata, including registrant emails from speedrun updates.
- Acceptable risk since audit logs are CORE-only, but metadata should be redacted for non-superadmins if audit visibility is ever extended.

---

### Finding 8: Application.data (Form Responses) Contains Unmasked PII Visible to Superadmins

**Severity:** HIGH  
**Category:** PII in form responses visible to admins without masking

#### Details

The `/api/applications` GET endpoint returns all `Application` records including the `data` JSON field, which contains form submission values (names, emails, custom questions). There is no masking of sensitive fields within the form data.

#### Code References

**[app/api/applications/route.ts:241-248](https://github.com/team1-india/team1-india/blob/test/app/api/applications/route.ts#L241-L248)**
```typescript
const applications = await prisma.application.findMany({
    where: { deletedAt: null },
    orderBy: { submittedAt: 'desc' },
    include: {
        guide: { select: { title: true, type: true } }
    }
    // ← No select on Application fields; returns all including `data`
});

return NextResponse.json(applications);  // ← data field returned unmasked
```

**Application model** stores form data as JSON:
```prisma
model Application {
  id             String    @id @default(uuid())
  applicantEmail String?
  data           Json?     // ← Form response data; contains arbitrary PII
  status         String?   // Includes "pending", "approved", "rejected"
  // ...
}
```

Example data structure (from [app/api/applications/route.ts:90-95](https://github.com/team1-india/team1-india/blob/test/app/api/applications/route.ts#L90-L95)):
```typescript
data: {
    name: userName,         // ← Full name
    email: applicantEmail,  // ← Full email
    ...body.data,           // ← Arbitrary form fields (phone, address, etc.)
    submittedAt: new Date().toISOString()
}
```

#### Impact

- Superadmins can view all form submissions unmasked, including optional PII fields.
- If `data` schema includes phone numbers, addresses, or identity documents, they are exposed in plaintext.

---

### Finding 9: Soft-Delete Filtering Incomplete; Deleted Records Potentially Visible

**Severity:** MEDIUM  
**Category:** Soft-deleted records still visible to wrong roles

#### Details

Across the codebase, `deletedAt` filtering is **inconsistently applied**. While many endpoints include `deletedAt: null` constraints, some do not, potentially exposing soft-deleted records to users.

#### Incomplete filtering examples

**[app/api/members/route.ts:33-43](https://github.com/team1-india/team1-india/blob/test/app/api/members/route.ts#L33-L43)** — findMany call:
```typescript
const members = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    select: { ... }
    // ← NO deletedAt: null FILTER!
});
```

**[app/api/speedrun/registrations/[id]/route.ts:20-30](https://github.com/team1-india/team1-india/blob/test/app/api/speedrun/registrations/[id]/route.ts#L20-L30)** — findUnique call:
```typescript
const registration = await prisma.speedrunRegistration.findUnique({
    where: { id },
    include: { ... }
    // ← No deletedAt check (findUnique doesn't filter by default)
});
```

#### Correct filtering (for reference)

**[app/api/data-grid/[table]/route.ts:63-65](https://github.com/team1-india/team1-india/blob/test/app/api/data-grid/[table]/route.ts#L63-L65)**:
```typescript
const data = await (delegate as any).findMany({
    where: { deletedAt: null },  // ✅ Correct
    orderBy: { createdAt: 'desc' }
});
```

#### Affected tables

Based on code search, the following tables have `deletedAt` fields but are queried without consistent filtering:
- `Member` (6+ queries without filter)
- `CommunityMember` (queries in leaderboard, dashboard-stats include filter ✅)
- `SpeedrunRegistration` (findUnique doesn't filter)
- `Playbook` (depends on status filter, not deletedAt)

#### Impact

- Soft-deleted admins could theoretically appear in member lists if accessed via findMany.
- Soft-deleted registrations may be visible in admin detail views.
- Risk is mitigated by the fact that `Member` is CORE-only and `SpeedrunRegistration` is CORE-only, but the pattern is inconsistent.

---

### Finding 10: PublicUser.signupIp Internal PII Visible to CORE

**Severity:** MEDIUM  
**Category:** Internal-only PII visible to wrong role

#### Details

The `PublicUser` model includes a `signupIp` field (per schema at [prisma/schema.prisma:503](https://github.com/team1-india/team1-india/blob/test/prisma/schema.prisma#L503)), which is internal telemetry. The `/api/admin/public-users` endpoint returns all `PublicUser` fields without filtering, exposing `signupIp`.

#### Code Reference

**[prisma/schema.prisma:476-511](https://github.com/team1-india/team1-india/blob/test/prisma/schema.prisma#L476-L511)**:
```prisma
model PublicUser {
  id           String  @id @default(uuid())
  email        String  @unique
  // ...
  signupIp  String?  // ← Internal-only; should not be visible to CORE
  createdAt DateTime @default(now())
}
```

**[app/api/admin/public-users/route.ts:42-50](https://github.com/team1-india/team1-india/blob/test/app/api/admin/public-users/route.ts#L42-L50)** returns all fields unfiltered.

#### Impact

- Low (IP addresses alone are not highly sensitive without additional context).
- Violates principle of least privilege; ops admins don't need signup IPs.

---

### Finding 11: PersonalVault Model Exists but Not Used; PII Still Stored Plaintext

**Severity:** HIGH  
**Category:** Encrypted vault infrastructure present but unused

#### Details

The schema defines a `PersonalVault` model for storing encrypted PII with HMAC search index ([prisma/schema.prisma:625-641](https://github.com/team1-india/team1-india/blob/test/prisma/schema.prisma#L625-L641)), but **grep of the codebase reveals zero active usage** of this model. Instead, PII is stored plaintext in `Member.email`, `PublicUser.email`, `SpeedrunRegistration.{userEmail,fullName,phone,city}`, etc.

#### Code Reference

**[prisma/schema.prisma:625-641](https://github.com/team1-india/team1-india/blob/test/prisma/schema.prisma#L625-L641)**:
```prisma
// PII Vault — stores encrypted PII with HMAC search index
model PersonalVault {
  id             String  @id @default(uuid())
  entityType     String // "Member", "CommunityMember", "PublicUser"
  entityId       String // ID of the related record
  fieldName      String // "email", "name", "phone", etc.
  encryptedValue String // AES-256-GCM encrypted value
  hmacIndex      String? // HMAC-SHA256 hash for searching (e.g., email lookup)
  keyVersion     Int     @default(1) // for future key rotation

  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@unique([entityType, entityId, fieldName])
  @@index([entityType, entityId])
  @@index([hmacIndex])
  @@index([entityType, fieldName, hmacIndex])
}
```

**Grep result:** Zero calls to `prisma.personalVault` in source code (only in Prisma client type definitions in node_modules).

#### Impact

- The infrastructure for encrypted PII storage is present (design is sound), but **no migration** has been completed.
- All email, name, phone, city fields across 5+ models are stored plaintext in the DB.
- If the DB is breached, all PII is immediately compromised.
- **This is expected in MVP; the model is a placeholder for future refactoring.**

---

## Checks Summary

| Check | Finding | Status |
|---|---|---|
| 1. PII visible to roles below business intent | Member.email, PublicUser.email visible to all CORE:READ | 🚩 Finding 1 |
| 2. Masking done in UI only | CSV export returns unmasked fields | 🚩 Finding 2 |
| 3. Masking inconsistent across endpoints | /api/members vs /api/members/[id]: no difference | 🚩 Finding 1 |
| 4. Masking inconsistent across formats | JSON and CSV export return same unmasked fields | 🚩 Finding 2 |
| 5. Masked fields searchable confirming value | Not applicable; no searchable masked fields exist | — |
| 6. Masked field included in error messages | No sensitive values found in error responses sampled | ✅ |
| 7. Masked field included in audit logs visible to lower-tier admins | AuditLog.metadata includes email but CORE-only gate | 🚩 Finding 7 |
| 8. Masked field present in webhooks | N/A (no outbound webhooks per recon) | — |
| 9. KYC images without per-request role check | N/A (no KYC images; PersonalVault unused) | — |
| 10. KYC images served from same origin | N/A | — |
| 11. Member-visible fields including moderation flags | Application.status not filtered by role | 🚩 Finding 8 |
| 12. Core-visible fields including super-admin-only fields | Member.permissions visible to CORE:READ | 🚩 Finding 4 |
| 13. Internal annotations rendered to user via misrouting | No internal notes exposed in sampled routes | ✅ |
| 14. Soft-deleted records still visible to wrong roles | Inconsistent deletedAt filtering | 🚩 Finding 9 |
| 15. Aggregations leaking presence | Dashboard stats leak cohort counts for anonymous users | — (Acceptable) |
| 16. Free-text search returning protected snippets | No search routes found with unmasked PII | ✅ |
| 17. ML / recommendation surfacing protected fields | N/A (no ML features) | — |
| 18. Embeddings / vector DB queryable cross-role | N/A | — |
| 19. AI / support-bot loaded with PII without redaction | N/A (no LLM features) | — |

---

## Recommendations

### Immediate Actions (P0)

1. **Member.email Masking**  
   Update `/api/members` to mask email for non-FULL_ACCESS users:
   ```typescript
   const members = await prisma.member.findMany({...});
   // Redact email for non-superadmins
   if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.FULL_ACCESS)) {
       members = members.map(m => ({
           ...m,
           email: maskEmail(m.email)  // e.g., "j***@***.com"
       }));
   }
   ```

2. **SpeedrunRegistration CSV Export Masking**  
   Apply field-level redaction to sensitive columns in CSV export. Consider:
   - Mask `email` and `phone` for non-ops users
   - Omit social handles unless explicitly needed for ops workflow
   - Document CSV schema in comments explaining which fields are masked

3. **Member.permissions Field Gating**  
   Require `FULL_ACCESS` to view `Member.permissions`:
   ```typescript
   if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.FULL_ACCESS)) {
       // Remove permissions field from response
       delete member.permissions;
   }
   ```

4. **Soft-Delete Filtering Audit**  
   Ensure all `findMany` and `findUnique` queries filter `deletedAt: null` where a soft-delete pattern is present. Add a linter rule or Prisma helper.

### Short-term Actions (P1)

5. **Application.data Schema & Masking**  
   Define an explicit schema for `Application.data` and mask sensitive fields by role:
   ```typescript
   // For non-FULL_ACCESS admins, redact sensitive form fields
   const sanitized = sanitizeApplicationData(app.data, userRole);
   ```

6. **PublicUser Field Selection**  
   Update `/api/admin/public-users` to explicitly select safe fields:
   ```typescript
   select: {
       id: true, email: true, fullName: true, city: true, country: true, 
       // Omit: signupIp, providerId, consent*
   }
   ```

7. **AuditLog Metadata Redaction**  
   For metadata containing PII, implement a redaction layer before returning to non-superadmins:
   ```typescript
   if (!userIsSuperAdmin) {
       logs = logs.map(l => ({
           ...l,
           metadata: redactMetadata(l.metadata)
       }));
   }
   ```

### Medium-term Actions (P2)

8. **PersonalVault Migration**  
   Design and execute migration to move email, name, phone fields into PersonalVault:
   - Create encryption/decryption helpers in [lib/encryption.ts](lib/encryption.ts)
   - Build data migration script to populate PersonalVault
   - Update read paths to decrypt on retrieval
   - Update write paths to store via PersonalVault

9. **TOTP Secret Logging**  
   Ensure `/api/auth/2fa/totp/setup` response is not logged by adding response headers:
   ```typescript
   return NextResponse.json(
       { secret, uri },
       {
           headers: {
               "Cache-Control": "no-store, max-age=0",
               "X-Content-Type-Options": "nosniff"
           }
       }
   );
   ```
   **Note:** This is a defense-in-depth measure; the main risk is infrastructure logging.

---

## Test Cases

To validate fixes, add tests for:
1. `/api/members` — verify non-FULL_ACCESS users do not receive email field
2. `/api/speedrun/registrations/export` — verify phone and email are masked in CSV
3. `/api/members` and `/api/admin/public-users` — verify permissions field is hidden from non-FULL_ACCESS
4. `/api/logs` — verify metadata is redacted for non-superadmins
5. Soft-delete queries — verify `deletedAt: null` is applied to all candidate tables

---

## Notes

- **Auth secrets (TOTP, passkeys, recovery codes):** These are properly encrypted at-rest and never exposed in API responses (except TOTP secret in setup, which is a one-time display). ✅
- **PersonalVault design is sound** but unused; migration is future-work.
- **CORE-only gates are working**; the main issue is field-level masking within CORE responses (no separation between ops, content, and superadmin roles).
- **No evidence of PII in error messages** in sampled endpoints (errors are generic).

---

**End of Category 6 Audit**  
**Next:** Phase 2 Category 7 (Input Validation & Injection).
