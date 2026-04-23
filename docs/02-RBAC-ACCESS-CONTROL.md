# Team1India — RBAC & Access Control

> Auto-generated from codebase analysis (2026-04-22)

---

## 1. Role Hierarchy

The platform uses a **3-tier role system** determined by which database table the user's email is found in during sign-in:

```
┌──────────────────────────────────────────────────────┐
│                  ⚡ SUPER ADMIN                       │
│          (CORE + permissions["*"] = FULL_ACCESS)      │
├──────────────────────────────────────────────────────┤
│                    🛡️ CORE                            │
│              (Member table match)                     │
├──────────────────────────────────────────────────────┤
│                    👥 MEMBER                          │
│          (CommunityMember table match)                │
├──────────────────────────────────────────────────────┤
│                    🌐 PUBLIC                          │
│             (PublicUser / new signup)                  │
└──────────────────────────────────────────────────────┘
```

### Role Assignment Logic (`lib/auth-options.ts`)

```
1. User signs in with Google OAuth
2. signIn callback checks email against tables:
   - Member table found?        → role = CORE,   permissions from DB
   - CommunityMember found?     → role = MEMBER,  permissions = {}
   - PublicUser found?           → role = PUBLIC,  permissions = {}
   - No match?                   → Create PublicUser → role = PUBLIC
3. JWT token enriched with: id, role, permissions, tags, consent
4. Session object exposes: role, id, permissions, tags, consent
```

---

## 2. Permission Model

### Permission Levels

Defined in `lib/permissions.ts`:

| Level | Value | Description |
|-------|-------|-------------|
| READ | `"READ"` | View-only access |
| WRITE | `"WRITE"` | Create/update access (implies READ) |
| FULL_ACCESS | `"FULL_ACCESS"` | Full control (implies WRITE + READ) |
| DENY | `"DENY"` | Explicit denial (defense-in-depth) |

### Permission Storage

Permissions are stored as a **JSON object** on the `Member` model:

```json
{
  "*": "FULL_ACCESS",           // SuperAdmin — full access to everything
  "default": "READ",            // Fallback for unspecified resources
  "members": "WRITE",           // Resource-specific override
  "playbooks": "FULL_ACCESS"    // Resource-specific override
}
```

### Permission Resolution (`hasPermission` function)

```
1. Check explicit resource key → e.g., permissions["members"]
2. Fall back to wildcard key  → permissions["*"]
3. If found value is "DENY"   → REJECT (defense-in-depth)
4. If found value is "FULL_ACCESS" → ALLOW always
5. Otherwise compare levels:
   - READ requires:  READ | WRITE | FULL_ACCESS
   - WRITE requires: WRITE | FULL_ACCESS
   - FULL_ACCESS requires: FULL_ACCESS only
6. No match found → REJECT
```

---

## 3. Access Control Enforcement

### Server-Side (API Routes)

Three enforcement patterns are used:

#### Pattern 1: Role Check (most common)
```typescript
const session = await getServerSession(authOptions);
if (!session?.user) return 401;
if (session.user.role !== 'CORE') return 403;
```

**Used by**: `/api/media`, `/api/settings`, `/api/logs`, `/api/notes`, `/api/attendance`, etc.

#### Pattern 2: `checkCoreAccess` helper
```typescript
const access = checkCoreAccess(session);
if (!access.authorized) return access.response;
```

**Used by**: `/api/data-grid`, `/api/members`, `/api/community-members`, `/api/seed`

#### Pattern 3: Fine-grained Permission Check
```typescript
const access = checkCoreAccess(session); // Must be CORE first
if (!hasPermission(session.user.permissions, 'members', PERMISSIONS.WRITE)) return 403;
```

**Used by**: `/api/data-grid/[table]`, `/api/members`, `/api/community-members`

#### Pattern 4: SuperAdmin Check
```typescript
const userPermissions = session.user.permissions || {};
const isSuperAdmin = userPermissions['*'] === 'FULL_ACCESS';
if (!isSuperAdmin) return 403;
```

**Used by**: `/api/members` (POST/DELETE), `/api/experiments/[id]` (status/delete), `/api/seed`

#### Pattern 5: Self-or-Admin (IDOR prevention)
```typescript
if (userId !== session.user.id && session.user.role !== 'CORE') return 403;
```

**Used by**: `/api/push/*` endpoints

---

### Server-Side (Page Routes)

Two layout guards protect page-level access:

#### `app/core/layout.tsx` — CORE Guard
```typescript
if (!session) redirect('/public?error=login_required');
if (userRole !== 'CORE') redirect('/public?error=access_denied');
```

#### `app/member/layout.tsx` — MEMBER Guard
```typescript
if (!session) redirect('/public?error=login_required');
if (userRole !== 'MEMBER' && userRole !== 'CORE') redirect('/public?error=access_denied');
```

> **Note**: CORE users can access MEMBER pages (downward compatibility).

---

### Client-Side (React Components)

#### `usePermission` Hook
```typescript
import { usePermission } from "@/hooks/usePermission";

const canWrite = usePermission('members', 'WRITE');
// Returns boolean — reads permissions from session
```

---

## 4. Access Matrix

| Resource / Action | PUBLIC | MEMBER | CORE | SuperAdmin |
|---|:---:|:---:|:---:|:---:|
| **Pages** |
| `/public/*` | ✅ | ✅ | ✅ | ✅ |
| `/member/*` | ❌ | ✅ | ✅ | ✅ |
| `/core/*` | ❌ | ❌ | ✅ | ✅ |
| **Members** |
| List members | ❌ | ❌ | ✅ (READ) | ✅ |
| Add/remove members | ❌ | ❌ | ❌ | ✅ |
| Edit permissions | ❌ | ❌ | ❌ | ✅ |
| **Community Members** |
| List | ❌ | ✅ (read) | ✅ | ✅ |
| Add/remove | ❌ | ❌ | ✅ (WRITE) | ✅ |
| **Playbooks** |
| View (public) | ✅ | ✅ | ✅ | ✅ |
| View (member) | ❌ | ✅ | ✅ | ✅ |
| View (core) | ❌ | ❌ | ✅ | ✅ |
| Create/edit | ❌ | ❌ | ✅ | ✅ |
| **Media Pipeline** |
| View items | ❌ | ❌ | ✅ | ✅ |
| Create/edit | ❌ | ❌ | ✅ | ✅ |
| Approve/reject | ❌ | ❌ | ✅ (admin tags) | ✅ |
| **Experiments** |
| View | ❌ | ✅ | ✅ | ✅ |
| Create/comment | ❌ | ✅ | ✅ | ✅ |
| Change status | ❌ | ❌ | ❌ | ✅ |
| Delete | ❌ | ❌ | ❌ | ✅ |
| **Bounties** |
| View | ❌ | ✅ (member) | ✅ (all) | ✅ |
| Submit | ✅ (public) | ✅ (member) | ❌ | ❌ |
| Create/manage | ❌ | ❌ | ✅ | ✅ |
| Approve submissions | ❌ | ❌ | ✅ | ✅ |
| **Contributions** |
| Submit | ❌ | ✅ | ✅ | ✅ |
| Review | ❌ | ❌ | ✅ | ✅ |
| **Guides** |
| View (public) | ✅ | ✅ | ✅ | ✅ |
| Create/edit/delete | ❌ | ❌ | ✅ | ✅ |
| **Settings/Logs** |
| View/edit | ❌ | ❌ | ✅ | ✅ |
| **Upload (Blob)** |
| Upload files | ❌ | ✅ | ✅ | ✅ |
| **Push Notifications** |
| Own subscriptions | ✅ | ✅ | ✅ | ✅ |
| Others' subscriptions | ❌ | ❌ | ✅ | ✅ |

---

## 5. Rate Limiting

Rate limiting is DB-backed (`RateLimit` model) using IP-based keys with atomic operations:

| Endpoint Pattern | Limit | Window |
|---|---|---|
| `/api/public/home` | 30 req | 1 min |
| `/api/public/members` | 30 req | 1 min |
| `/api/public/playbooks` | 20 req | 1 min |
| `/api/public/playbooks/[id]` | 20 req | 1 min |
| `/api/public/guides/[id]` | 20 req | 1 min |
| `/api/public/check-member` | 30 req | 1 hour |

> **Fail-closed**: On DB error, requests are **rejected** to prevent abuse during outages.

---

## 6. Security Features

| Feature | Implementation |
|---|---|
| **JWT Sessions** | 30-day TTL, HttpOnly cookies, Secure in production |
| **CSRF Protection** | NextAuth built-in CSRF token |
| **Input Validation** | Zod schemas on all write endpoints |
| **Audit Logging** | `AuditLog` + `Log` models + stdout JSON |
| **Soft Deletes** | `deletedAt` on all models |
| **CSP Headers** | Strict Content-Security-Policy in `next.config.ts` |
| **HSTS** | 2-year max-age with preload |
| **Permission Injection Prevention** | Zod enum validation on permission updates |
| **IDOR Prevention** | Self-or-admin checks on push notification endpoints |

---

## 7. Known Gaps & Recommendations

| Issue | Severity | Details |
|---|---|---|
| No middleware-level auth | Medium | Auth is checked per-route, not via Next.js middleware |
| Member media GET open | Low | `/api/media` GET allows any authenticated user, not just CORE |
| Polls/announcements POST | Low | Some POST endpoints only check `session.user.email`, not role |
| No rate limiting on auth'd endpoints | Medium | Only public endpoints are rate-limited |
| CRON secret validation varies | Low | Cron routes use different auth patterns |
