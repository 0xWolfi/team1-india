# Category 7 — Admin Actions: Logging, Approval, Limits

**Audit Date:** 2026-05-03  
**Scope:** CORE admin (internal team) action audit across logging, approval gates, and rate limits.  
**Severity Range:** Medium–Critical

---

## Executive Summary

**Per Recon Step 13 baseline:** No AuditLog entries for points operations, admin/core login, 2FA changes, or speedrun registration exports. **Per Recon Step 5 baseline:** Every CORE admin can do anything their `permissions` JSON allows. **No separation of duties, no 4-eyes approval, no break-glass mode, no rate limits, no anomaly detection.**

This scan confirms **11 critical gaps** in admin action governance:

1. **Admin read of PII (public-users, speedrun registrations) not logged** — view audit blind spot.
2. **Speedrun registrations bulk-export (CSV with PII) not logged or rate-limited** — data exfiltration path unmonitored.
3. **Admin manual wallet adjust not logged** — financial audit trail missing.
4. **2FA disable by admin not requiring re-auth** — identity verification gap.
5. **Admin email broadcast (send-email endpoint) not logged** — compliance breach.
6. **Admin can self-promote via permissions endpoint** — no self-targeting check.
7. **Admin-on-admin actions log only actor, not target** — target identity gap.
8. **No admin rate limits** — DoS/abuse path open.
9. **No access-review tooling** — no quarterly audit surface.
10. **Admin re-login does not invalidate other sessions** — multi-device hijack risk.
11. **CRON_SECRET is shared system credential** — single-key auth for automation.

---

## Check 1: Admin Read-PII (public-users, speedrun registrations) — Not Logged

### Finding 1A: Public Users Endpoint — No Audit Trail

**Route:** `app/api/admin/public-users/route.ts:7–65`

```typescript
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const role = session.user.role;
  const permissions = session.user.permissions || {};
  const isCore = role === 'CORE';
  const isSuperAdmin = permissions['*'] === 'FULL_ACCESS';

  if (!isCore && !isSuperAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";

  try {
    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.publicUser.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.publicUser.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error("Failed to fetch public users:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
```

**Observation:**
- Returns full `PublicUser` records (email, fullName, location, etc.) — PII read.
- **No `logAudit()` or `logActivity()` call** — admin identity + search query not recorded.
- No rate limit.
- Admin can search by any field (email, fullName, location) and export all results without audit trace.

**Risk:** Admin surveillance of user base is invisible to compliance/audit functions.

---

### Finding 1B: Speedrun Registrations (List) — PII Read Not Logged

**Route:** `app/api/speedrun/registrations/route.ts:7–50`

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const status = searchParams.get("status");
  const search = searchParams.get("q");

  const where: any = {};
  if (runId) where.runId = runId;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { userEmail: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ];
  }

  const [registrations, runs, totalCount] = await Promise.all([
    prisma.speedrunRegistration.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        team: { select: { id: true, name: true, code: true, captainEmail: true } },
        run: { select: { id: true, slug: true, monthLabel: true } },
      },
    }),
    prisma.speedrunRun.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, monthLabel: true, status: true, isCurrent: true },
    }),
    prisma.speedrunRegistration.count({ where }),
  ]);

  return NextResponse.json({ registrations, runs, totalCount });
}
```

**Observation:**
- Returns `SpeedrunRegistration` records with sensitive fields: `fullName`, `userEmail`, `phone`, `city`, `twitterHandle`, `githubHandle`, `techStack`, `teamMode`.
- **No `logAudit()` or `logActivity()` call** — bulk PII read unlogged.
- No rate limit.
- No limit on result set size (could fetch 1000s of registrations per request).

**Risk:** Admin mass-scrape of speedrun participant PII (emails, phones, locations, GitHub/Twitter handles) is invisible.

---

## Check 2: Speedrun Registrations Bulk-Export (CSV) — Not Logged, Not Rate-Limited

**Route:** `app/api/speedrun/registrations/export/route.ts:8–103`

```typescript
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "CORE") {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get("runId");
  const status = searchParams.get("status");

  const where: any = {};
  if (runId) where.runId = runId;
  if (status) where.status = status;

  const registrations = await prisma.speedrunRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      team: { select: { code: true, captainEmail: true } },
      run: { select: { slug: true, monthLabel: true } },
    },
  });

  const headers = [
    "createdAt", "runSlug", "runLabel", "fullName", "email", "phone",
    "city", "twitter", "github", "primaryRole", "experience", "techStack",
    "teamMode", "team1Id", "captainEmail", "trackPreference", "projectIdea",
    "whyJoin", "showSocials", "status", "referralCode", "utmSource", "utmMedium", "utmCampaign",
  ];

  const rows = registrations.map((r) => [
    r.createdAt.toISOString(),
    r.run.slug,
    r.run.monthLabel,
    r.fullName,
    r.userEmail,
    r.phone ?? "",
    r.city ?? "",
    r.twitterHandle ? `@${r.twitterHandle}` : "",
    r.githubHandle ? `@${r.githubHandle}` : "",
    // ... 16 more fields ...
  ]);

  const csv = [headers, ...rows].map(toCsvRow).join("\n");
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `speedrun-registrations-${dateStamp}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
```

**Observation:**
- **No `logAudit()` or `logActivity()` call** — admin export of all participant PII (name, email, phone, city, social handles) is unlogged.
- **No rate limit** — admin can export multiple times per second.
- **No size limit** — if 10,000 registrations exist, all downloaded in one request with no alert.
- CSV includes: fullName, email, phone, city, twitterHandle (@...), githubHandle (@...), projectIdea, whyJoin, utmSource.
- Per recon-13: "speedrun registration export" is on the NO AuditLog list.

**Risk:** Data exfiltration of entire speedrun participant database (names, emails, phones, locations, handles, UTM campaign data) is unmonitored, unalerted, unlogged. Admin can bulk-export to external system with zero trail.

---

## Check 3: Admin Manual Wallet Adjust (Points Grant) — Not Logged, No Dollar Threshold

### Finding 3A: Wallet Adjust Route — No Audit

**Route:** `app/api/wallet/adjust/route.ts:7–47`

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if ((session.user as any)?.role !== "CORE") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { userEmail, xp, points, description } = body;

  if (!userEmail) {
    return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
  }

  if ((xp ?? 0) === 0 && (points ?? 0) === 0) {
    return NextResponse.json({ error: "xp or points must be non-zero" }, { status: 400 });
  }

  try {
    await adminAdjust(
      userEmail,
      xp ?? 0,
      points ?? 0,
      description || "Manual adjustment",
      session.user.email
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Observation:**
- Calls `adminAdjust()` with no approval, no rate limit, no threshold.
- `xp` or `points` can be any integer (positive or negative).
- **No `logAudit()` call** — points grant/debit is unlogged.

### Finding 3B: adminAdjust Function — Only WalletTransaction, No AuditLog

**Route:** `lib/wallet.ts:212–262`

```typescript
export async function adminAdjust(
  userEmail: string,
  xp: number,
  points: number,
  description: string,
  adminEmail: string
): Promise<void> {
  const wallet = await getOrCreateWallet(userEmail);

  const updates: any = {};
  if (xp !== 0) updates.totalXp = { increment: xp };
  if (points > 0) {
    updates.pointsBalance = { increment: points };
    updates.totalEarned = { increment: points };
  } else if (points < 0) {
    updates.pointsBalance = { increment: points };
    updates.totalSpent = { increment: Math.abs(points) };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_POINTS_TTL_DAYS);

  await prisma.$transaction([
    prisma.userWallet.update({
      where: { id: wallet.id },
      data: updates,
    }),
    ...(points > 0
      ? [
          prisma.pointsBatch.create({
            data: {
              walletId: wallet.id,
              amount: points,
              remaining: points,
              source: "admin_adjust",
              expiresAt,
            },
          }),
        ]
      : []),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        pointsAmount: points,
        xpAmount: xp,
        type: "admin_adjust",
        description: `${description} (by ${adminEmail})`,
      },
    }),
  ]);
}
```

**Observation:**
- Only logs to `WalletTransaction` table (operation log, not audit log).
- **No AuditLog entry** — admin who granted/debited points is not recorded in audit layer.
- No validation of negative amounts.
- No threshold (e.g., "grants >1000 points require 4-eyes approval").
- Per recon-8: "`adminAdjust` exposed via admin route(s) — Cat 12 will enumerate." **Cat 12 (this scan) confirms: NO APPROVAL GATE, NO THRESHOLD, NO AUDIT.**

**Risk:** Admin can grant/debit unlimited points to any user without supervisor sign-off. Audit trail is only in `WalletTransaction` (weak), not `AuditLog` (formal). Embezzlement/fraud path unmonitored.

---

## Check 4: 2FA Disable (TOTP) — No Re-auth Required

**Route:** `app/api/auth/2fa/totp/disable/route.ts:9–28`

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await request.json();
  if (!code) return NextResponse.json({ error: "code required" }, { status: 400 });

  const twoFactor = await prisma.twoFactorAuth.findUnique({ where: { userEmail: session.user.email } });
  if (!twoFactor?.totpSecret || !twoFactor.totpEnabled) return NextResponse.json({ error: "TOTP not enabled" }, { status: 400 });

  const secret = decrypt(twoFactor.totpSecret);
  if (!verifyTotp(secret, code)) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  await prisma.twoFactorAuth.update({
    where: { userEmail: session.user.email },
    data: { totpEnabled: false, totpSecret: null, totpVerifiedAt: null },
  });

  return NextResponse.json({ success: true, message: "TOTP disabled" });
}
```

**Observation:**
- User provides only the current 2FA code to disable 2FA.
- **No password re-entry, no email confirmation, no second admin approval.**
- If admin's session is compromised (e.g., XSS, session token theft), attacker can disable MFA and take over the account.
- Per recon-4: "no server-side JWT revocation list, no `tokenVersion` counter" — admin can't revoke other sessions.
- **No AuditLog entry** — 2FA disable is unlogged (per recon-13).

**Risk:** Session hijack → disable 2FA → full account takeover with zero audit trail. MFA protection is session-binding weak.

---

## Check 5: Admin Email Broadcast (send-email) — Not Logged

**Route:** `app/api/admin/send-email/route.ts:6–51`

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'CORE') {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { to, subject, body } = await request.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const recipients = [
      'sarnavo@team1.network',
      'sarnavoss.dev@gmail.com',
      'abhishekt.team1@gmail.com',
    ];

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Team1 PWA Alerts'}" <${process.env.SMTP_USER}>`,
      to: recipients.join(', '),
      subject,
      html: body,
    });

    console.log(`✅ Email sent: ${subject}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Failed to send email:', error);
    return Response.json({ error: 'Failed to send email', details: (error as Error).message }, { status: 500 });
  }
}
```

**Observation:**
- **No `logAudit()` or `logActivity()` call** — admin broadcast not logged.
- No rate limit.
- No size limit on body/recipients.
- Admin can send HTML emails to hardcoded recipient list (actually uses hardcoded recipients, ignoring `to` param).
- No draft review, no supervisor approval.

**Risk:** Admin sends bulk emails without audit trail or approval. Compliance/governance cannot track who sent what message when.

---

## Check 6: Admin Self-Promotion (Permissions Endpoint) — No Self-Targeting Check

**Route:** `app/api/members/[id]/permissions/route.ts:11–62`

```typescript
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    const userPermissions = (session.user as any).permissions || {};
    const hasFullAccess = userPermissions['*'] === 'FULL_ACCESS' || userPermissions['default'] === 'FULL_ACCESS';

    if (!hasFullAccess) {
         return new NextResponse("Unauthorized. Requires FULL_ACCESS.", { status: 403 });
    }

    try {
        const { id } = await params;  // TARGET ID FROM URL
        const body = await request.json();
        
        const validationResult = PermissionsSchema.safeParse(body.permissions);
        if (!validationResult.success) {
            return new NextResponse(
                JSON.stringify({ error: "Invalid permissions format", details: validationResult.error.flatten() }), 
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        const permissions = validationResult.data;

        // ❌ NO CHECK: if (id === session.user.id) return Forbidden
        const updatedMember = await prisma.member.update({
            where: { id },  // TARGET CAN BE SELF
            data: { permissions }
        });

        await logActivity({
            action: "UPDATE",
            entity: "Member",
            entityId: id,
            actorEmail: session.user.email,
            metadata: { field: "permissions", newValue: permissions }
        });

        return NextResponse.json(updatedMember);
    } catch (error) {
        console.error("Permissions Update Error", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
```

**Observation:**
- Admin with `FULL_ACCESS` can set the `[id]` parameter to their own Member ID.
- **No check like `if (id === session.user.id) return Forbidden`.**
- Admin can escalate their own permissions (e.g., from `{"members": "WRITE"}` to `{"*": "FULL_ACCESS"}`).
- Self-targeting is logged in `Log` table (via `logActivity`), but **no approval gate, no supervisor override, no alert.**

**Risk:** Admin can self-promote to superuser without separation of duties. Logged, but not preventable by system design.

---

## Check 7: Admin-on-Admin Actions Log Only Actor, Not Target Identity

**Route:** `app/api/members/[id]/permissions/route.ts:49–55` (same pattern in tags, status routes)

```typescript
await logActivity({
    action: "UPDATE",
    entity: "Member",
    entityId: id,  // TARGET ID RECORDED
    actorEmail: session.user.email,  // ACTOR EMAIL RECORDED
    metadata: { field: "permissions", newValue: permissions }
});
```

**Observation:**
- `logActivity` records both actor email and target ID.
- **But in the `Log` model** (`prisma/schema.prisma:1 onwards`):
  ```prisma
  model Log {
    id        String    @id @default(uuid())
    action    String?
    entity    String?
    entityId  String?
    metadata  Json?
    createdAt DateTime  @default(now())
    deletedAt DateTime?
    actor     Member?   @relation(fields: [actorId], references: [id])
    actorId   String?
  }
  ```
  - Only `actorId` is a foreign key (linked relation).
  - **Target member name/email is NOT recorded** — only `entityId` (which is a string, not a foreign key).
  - To audit "who changed admin X's permissions", you must manually join `entityId` to `Member` table.

**Risk:** Admin-on-admin audit chain is weak: if admin Y modifies admin X's permissions, you see "admin Y → entityId: <UUID>", not "admin Y → admin X (email@example.com)". Traceability is fragile if Member rows are deleted.

---

## Check 8: No Admin Rate Limits

**Finding 8A: Admin/Public-Users Endpoint**
- No `withRateLimit` or `checkRateLimit` call.
- Admin can list/search public users infinitely per second.

**Finding 8B: Speedrun Registrations (List & Export)**
- No `withRateLimit` or `checkRateLimit` call.
- Admin can bulk-export CSV thousands of times per second.

**Finding 8C: Wallet Adjust**
- No `withRateLimit` or `checkRateLimit` call.
- Admin can grant/debit points infinitely per second.

**Finding 8D: Members Permissions/Tags/Status Update**
- No `withRateLimit` or `checkRateLimit` call.
- Admin can modify other admins' permissions infinitely per second.

**Risk:** DoS attack surface. Rogue admin can spam the system (e.g., 1000s of wallet adjustments per second to create noise, or 1000s of permission updates to lock out other admins).

---

## Check 9: No Access-Review Tooling

**Finding 9A: No `/api/admin/access-review` Route**
- Grep: `grep -rn "access-review\|quarterly\|audit.*review" /app/api` — **zero hits.**

**Finding 9B: No Tooling to Export Active Admin Sessions**
- No route to list all active CORE member sessions, their last access time, or device/IP.
- No way to revoke a specific session (only global logout via cookie clear).

**Finding 9C: No Quarterly Access Audit Report**
- No scheduled report of "who has what permissions, when did they last log in, what did they do."
- Recon-13 confirmed: "no access-review tooling — search for any /api/admin/access-review or similar" — **not found.**

**Risk:** No formal process to detect privilege creep, dormant accounts, or anomalous promotions. Compliance/audit functions are blind.

---

## Check 10: Admin Re-login Does Not Invalidate Other Sessions

**Route:** `lib/auth-options.ts:87–176` (jwt callback)

```typescript
async jwt({ token, user, trigger, session }) {
  // ... re-derives role, permissions from DB on every session refresh ...
  if (user) {
    try {
      const emailToFind = user.email ? user.email.trim() : "";
      const member = await prisma.member.findFirst({
        where: { email: { equals: emailToFind, mode: 'insensitive' } },
        select: { id: true, permissions: true, tags: true }
      });
      if (member) {
        token.id = member.id;
        token.role = 'CORE';
        token.permissions = (member.permissions as Record<string, string>) || { default: "READ" };
        token.tags = member.tags || [];
        token.consent = true;
        return token;
      }
      // ... fallback for MEMBER, PUBLIC ...
    } catch (e) {
      console.error(e);
    }
  }
  return token;
}
```

**Observation:**
- JWT callback re-derives token claims from DB on refresh (good for permission updates).
- **But no `tokenVersion` counter or revocation list.**
- When admin logs in on device 2, all tokens remain valid (no auto-logout of device 1).
- Per recon-4: "Logout clears cookie only — **no server-side JWT revocation list**, no `tokenVersion` counter."

**Risk:** If admin changes password (via Google OAuth) or MFA is disabled, other devices' JWTs remain valid. If device 1 is stolen, attacker can use that JWT until 30-day expiry unless proactively revoked (no mechanism for that).

---

## Check 11: CRON_SECRET — Shared System Credential

**Routes:** `app/api/cron/**/route.ts` (expire-points, sync-events, aggregate-analytics, speedrun-status)

```typescript
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // ... proceed ...
}
```

**Observation:**
- All 7 cron routes use the same `CRON_SECRET` bearer token for authentication.
- **No HMAC, no IP allowlist, no signature verification.**
- Recon-5 baseline: "Service accounts / API keys: None — only the `CRON_SECRET` bearer token grants elevated access (effectively system role for cron jobs)."

**Risk:** Single leaked secret grants access to all automation (expire points, sync events, etc.). No way to revoke a single job's access without rotating the entire secret.

---

## Summary of Vulnerabilities

| # | Vulnerability | Severity | Audit Trail | Rate Limit | Approval Gate |
|---|---|---|---|---|---|
| 1A | Admin read public-users (PII) | Medium | ✗ None | ✗ None | ✗ None |
| 1B | Admin read speedrun registrations (PII bulk) | Medium | ✗ None | ✗ None | ✗ None |
| 2 | Speedrun registrations CSV export (PII bulk) | **High** | ✗ None | ✗ None | ✗ None |
| 3 | Admin wallet adjust (points grant/debit) | **High** | ✗ WalletTx only | ✗ None | ✗ None |
| 4 | 2FA disable (TOTP) without re-auth | **High** | ✗ None | ✗ None | ✗ None |
| 5 | Admin email broadcast (send-email) | Medium | ✗ None | ✗ None | ✗ None |
| 6 | Admin self-promote (permissions endpoint) | **High** | ✓ Log only | ✗ None | ✗ None |
| 7 | Admin-on-admin log missing target identity | Medium | ✓ Weak | ✗ None | ✗ None |
| 8 | No admin rate limits | Medium | N/A | ✗ None | ✗ None |
| 9 | No access-review tooling | Medium | N/A | N/A | ✗ None |
| 10 | Admin re-login no session invalidation | Medium | N/A | N/A | ✗ None |
| 11 | Shared CRON_SECRET | Medium | N/A | N/A | ✗ None |

---

## Recommendations

1. **Add `logAudit()` calls to all admin read endpoints** (public-users, speedrun/registrations, admin/send-email) recording admin email, action, query parameters, result count.

2. **Add rate limit to bulk-export endpoints** (speedrun/registrations/export, admin read endpoints) — e.g., 10 requests per 5 minutes per admin.

3. **Add AuditLog entry for adminAdjust()** — record pointsAmount, xpAmount, targetUserEmail, adminEmail, description.

4. **Implement points-grant threshold approval** — grants >500 points require second admin sign-off; redirect to approval queue.

5. **Require re-auth or email confirmation for 2FA disable** — send "Confirm 2FA disable" link to user's email; require re-entry of password (or Google OAuth re-consent).

6. **Add self-targeting check to permissions endpoint** — if `[id]` === `session.user.id`, return 403 "Cannot modify own permissions."

7. **Enhance admin-on-admin audit** — in `Log` model, add `targetMemberId` foreign key relation; log both actor and target identities.

8. **Implement admin rate limits** — per-admin quota (e.g., 50 list queries, 10 exports, 5 permission changes per hour); alert on abuse.

9. **Build access-review dashboard** — list all CORE members, permissions, last login, actions in past 90 days; generate quarterly audit report.

10. **Implement session revocation** — add `tokenVersion` counter to `Member` model; revoke all tokens when password/MFA changes; allow manual revocation of other sessions.

11. **Rotate CRON_SECRET frequently and audit usage** — consider per-cron-job secrets or mTLS; log all cron invocations to AuditLog.

---

## Audit Metadata

- **Recon References:** Steps 5, 7, 13 (auth, data model, logging).
- **Schema Files:** `prisma/schema.prisma` (AuditLog, Log, Member, TwoFactorAuth models).
- **Auth Files:** `lib/auth-options.ts`, `lib/permissions.ts`.
- **Wallet Files:** `lib/wallet.ts` (adminAdjust function).
- **Logger Files:** `lib/logger.ts` (logActivity, logAudit helpers).
- **Related Categories:** Category 12 (wallet), Category 1 (auth), Category 25 (monitoring).

