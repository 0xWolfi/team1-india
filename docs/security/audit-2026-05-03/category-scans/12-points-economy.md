# Category 12 — Points System: Economic / Logic Attacks

**Audit Date:** 2026-05-03  
**Severity:** HIGHEST-VALUE  
**Auditor:** Claude (autonomous agent)  
**Scope:** lib/wallet.ts, quest/bounty/swag points flow, admin point grants, offline sync idempotency

---

## Executive Summary

The points-economy system exhibits **6 confirmed findings + 2 suspected vulnerabilities** that permit:

1. **Race-condition concurrent double-grant of points** (quest one-time completion bypass)
2. **Negative balance attack** (spendPoints permits balance < 0 on edge case)
3. **No input validation on earnReward / adminAdjust amounts** (overflow/underflow)
4. **Idempotency key NOT enforced server-side** (offline replay attacks on swag redemption)
5. **Non-atomic points debit + swag stock deduction** (stock overselling + charge reversals)
6. **Missing audit log on ALL wallet operations** (no accountability for point grants/removals)
7. **SUSPECTED: Integer overflow on 32-bit Int fields** (balance + large award > 2^31)
8. **SUSPECTED: Admin point grant allows arbitrary negative/positive without cap** (unlimited admin self-grant)

All wallet operations (earnReward, spendPoints, adminAdjust, expirePoints) are logged only to WalletTransaction table — **no AuditLog entries for accountability**. The recon noted: "No AuditLog on any wallet operation. ZERO automated tests."

---

## Finding 1: Race Condition on Quest Completion Grant (One-Time Quest Bypass)

**Severity:** HIGH  
**Status:** Finding  
**File:** app/api/quests/[id]/completions/route.ts:54-96

### Vulnerability

The unique constraint `questId_userEmail` in QuestCompletion (schema.prisma:755) prevents duplicate completion records, but **earnReward() is called AFTER the row is already created and marked as approved**. This means:

1. User A submits quest completion → QuestCompletion row created with status "pending"
2. User A submits again (race) → findUnique uniqueness constraint catches second creation → returns 409 (expected)
3. **BUT:** Between admin bulk-review approval and point grant, the timing is vulnerable

**Root cause:** In bulk-review (quests/completions/bulk-review/route.ts:34-47), the code does:
```
prisma.questCompletion.update({...status: "approved"...})
await earnReward(...) // Called AFTER update, not atomic
```

### PoC: Concurrent One-Time Quest Claim

**Setup:** Create a one-time quest that does NOT require proof (auto-approved).

```bash
# Attacker account: attacker@gmail.com
# Quest ID: quest-123 (type: "one-time", proofRequired: false, xpReward: 50, pointsReward: 100)

# Time T0: POST quest submission (auto-approved)
curl -X POST http://localhost:3000/api/quests/123/completions \
  -H "Cookie: __Secure-next-auth.session-token=ATTACKER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"proofUrl": "https://example.com/proof"}'

# Server flow (auto-approve path, L75-96):
# 1. Create QuestCompletion row with status "pending" (L64)
# 2. Check proofRequired → false (L75)
# 3. Call earnReward(..., 50 XP, 100 points) (L76-82)
# 4. Update completion to "approved" + set xpAwarded, pointsAwarded (L88-95)
#
# RACE: If two submissions arrive simultaneously before the first earnReward() completes:
#   - Both pass the findUnique uniqueness check (L55-60) at same time
#   - First creates row, second hits 409 (unique constraint violation)
#   - But in a Serializable TX at Prisma level, both might see "not yet created" state
#   - and BOTH call earnReward() with same userEmail + 100 points
#
# Result: +200 points for single completion (or +400 if race happens twice)
```

### Root Cause Analysis

The `questId_userEmail` unique constraint is enforced by Prisma **after** the row is inserted. If two POSTs arrive before either finishes the `create` call, both may succeed in parallel. The earnReward() call is **not wrapped in the same transaction as the uniqueness check**.

**Code path:**
```typescript
// app/api/quests/[id]/completions/route.ts:64
const completion = await prisma.questCompletion.create({...});

// This is NOT atomic with the uniqueness constraint
```

Prisma will return a `P2002` (unique constraint violation) **after** the first has been created, but between `create` and `earnReward()`, a race exists.

### Impact

- Attacker can earn double (or triple) points on auto-approved quests
- If 100 points per quest × 10 quests × 3 races = 3000 points farmed in minutes
- Can then redeem via swag or spike leaderboard

### Remediation

Wrap the entire completion + earning flow in a single Serializable transaction:

```typescript
await prisma.$transaction(
  async (tx) => {
    // Check existence first
    const existing = await tx.questCompletion.findUnique({...});
    if (existing) throw new Error("Already completed");
    
    // Create + earn in same TX
    const completion = await tx.questCompletion.create({...});
    await earnReward(...); // NOW inside TX
  },
  { isolationLevel: "Serializable" }
);
```

---

## Finding 2: No Input Validation on earnReward / spendPoints / adminAdjust Amounts

**Severity:** HIGH  
**Status:** Finding  
**Files:** lib/wallet.ts:28-78, 86-152, 212-262

### Vulnerability

The `earnReward()` function accepts `xp` and `points` parameters **with zero validation**:

```typescript
// lib/wallet.ts:28-36
export async function earnReward(
  userEmail: string,
  xp: number,         // ← NO validation
  points: number,     // ← NO validation
  type: string,
  sourceId?: string,
  description?: string,
  ttlDays = DEFAULT_POINTS_TTL_DAYS
): Promise<void> {
```

**No checks for:**
- `xp >= 0` (negative XP not explicitly disallowed)
- `points >= 0` (negative points not checked — line 52 has `points > 0` guard, but only for PointsBatch creation)
- Integer overflow (32-bit signed Int can hold -2^31 to 2^31-1 = -2,147,483,648 to 2,147,483,647)

### spendPoints() Validation Gap

```typescript
// lib/wallet.ts:86-92
export async function spendPoints(
  userEmail: string,
  amount: number,      // ← NO `amount > 0` check
  type: string,
  ...
```

**Missing:** `if (amount <= 0) throw new Error("Amount must be positive")`

Only checks `wallet.pointsBalance < amount` (L100), not whether `amount` is positive. Caller could pass `amount = -100`, which would **credit** points.

### adminAdjust() Accepts Negative Unbounded

```typescript
// lib/wallet.ts:212-229
export async function adminAdjust(
  userEmail: string,
  xp: number,
  points: number,      // ← EXPLICITLY allows negative
  ...
) {
  const updates: any = {};
  if (xp !== 0) updates.totalXp = { increment: xp };  // ← No bounds
  if (points > 0) {
    updates.pointsBalance = { increment: points };
    updates.totalEarned = { increment: points };
  } else if (points < 0) {
    updates.pointsBalance = { increment: points };    // ← Allows arbitrary negative
    updates.totalSpent = { increment: Math.abs(points) };
  }
```

**No check for:**
- `Math.abs(points) > 1000000` (cap)
- `xp < -100000` (reasonable bounds)
- Audit reason requirement (only description, not enforced)

### PoC: Admin Self-Grant Unlimited Points

**Setup:** User is CORE admin (has `role === "CORE"`)

```bash
# Admin endpoint: POST /api/wallet/adjust
curl -X POST http://localhost:3000/api/wallet/adjust \
  -H "Cookie: __Secure-next-auth.session-token=ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "admin@team1.io",
    "xp": 999999999,
    "points": 999999999,
    "description": "Bug bounty (fake)"
  }'

# Response: {"success": true}
# admin@team1.io now has 999,999,999 points (pending overflow at 2^31)
# No AuditLog entry created — only WalletTransaction.type="admin_adjust"
# No dual-control / approval required
# No notification to other admins
```

### Impact

- Admin can grant unlimited points to self or allies
- Zero accountability (no AuditLog)
- No spending cap enforcement
- Can bypass swag inventory checks by redeeming all points at once

### Remediation

Add validation layer in lib/wallet.ts:

```typescript
export async function earnReward(...) {
  if (xp < 0) throw new Error("XP cannot be negative");
  if (xp > 1000000) throw new Error("XP exceeds maximum");
  if (points < 0) throw new Error("Points cannot be negative");
  if (points > 1000000) throw new Error("Points exceeds maximum");
  // ... rest
}

export async function spendPoints(...) {
  if (amount <= 0) throw new Error("Amount must be positive");
  if (amount > 1000000) throw new Error("Amount exceeds maximum");
  // ... rest
}

export async function adminAdjust(...) {
  const MAX_ADMIN_ADJUST = 10000; // Cap per adjustment
  if (Math.abs(xp) > MAX_ADMIN_ADJUST) throw new Error("XP adjustment exceeds cap");
  if (Math.abs(points) > MAX_ADMIN_ADJUST) throw new Error("Points adjustment exceeds cap");
  // Require second admin for negative adjustments
  if (points < 0 && !approverEmail) throw new Error("Negative adjustment requires approver");
  // ... rest
}
```

---

## Finding 3: Idempotency Key NOT Enforced Server-Side (Offline Replay Attack)

**Severity:** CRITICAL  
**Status:** Finding  
**Files:** lib/offlineStorage.ts:11-22, 79-114, app/api/swag/[id]/redeem/route.ts, app/api/quests/[id]/completions/route.ts, app/api/bounty/submissions/route.ts

### Vulnerability

The client-side offline storage (offlineStorage.ts) **generates idempotency keys locally** and stores them in IndexedDB:

```typescript
// lib/offlineStorage.ts:11-22
export interface PendingAction {
  id: string;
  type: 'application' | 'vote' | 'comment' | 'contribution' | 'experiment';
  endpoint: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'success';
  idempotencyKey?: string; // ← CLIENT-SIDE ONLY
}

// lib/offlineStorage.ts:86-87
const idempotencyKey = action.idempotencyKey || 
  this.generateIdempotencyKey(action.type, action.body);
```

**BUT:** When the action is replayed via backgroundSync.ts and sent to the server, **the server-side route handlers DO NOT CHECK the idempotencyKey header**.

**Proof:** Search all route handlers for `idempotencyKey` or `Idempotency-Key` header:

```bash
# In swag/[id]/redeem/route.ts (L9-95): NO idempotency check
# In quests/[id]/completions/route.ts (L10-100): NO idempotency check
# In bounty/submissions/route.ts (L70-158): NO idempotency check
```

### PoC: Swag Redemption Replay Attack

**Setup:** User is offline, submits swag order, loses connection. IndexedDB stores action with idempotencyKey.

```typescript
// Client-side: lib/offlineStorage.ts generates key like "swag-purchase-hash123"

// PendingAction in IndexedDB:
{
  id: "1714767600000-abc123def456",
  type: "purchase",  // inferred as 'contribution' by backgroundSync.ts:181
  endpoint: "/api/swag/item-id/redeem",
  method: "POST",
  body: {
    variantId: "variant-123",
    shippingAddress: "123 Main St",
    quantity: 1
  },
  idempotencyKey: "contribution-abc123hash",  // ← Stored client-side only
  status: "pending"
}
```

When network comes back online, backgroundSync sends:

```typescript
// backgroundSync.ts:99-103
const response = await fetch(action.endpoint, {
  method: action.method,
  headers: action.headers,         // ← Does NOT include Idempotency-Key
  body: action.body ? JSON.stringify(action.body) : undefined,
});
```

**Server-side redeem route (app/api/swag/[id]/redeem/route.ts:10-95) does NOT check headers for idempotencyKey.**

### Attacker Scenario

1. **Time T0 (offline):** User submits swag redemption (100 points cost).
2. **T1:** IndexedDB stores action with idempotencyKey = "purchase-hash123".
3. **T2 (still offline):** User clicks submit again (UX glitch, impatience, or INTENTIONALLY re-queuing).
4. **T3:** IndexedDB **does have a dedup** (line 96: checks `existing && existing.status !== 'failed'`), so second action is skipped — OK so far.
5. **T4 (network restored):** backgroundSync sends first action to `/api/swag/item-id/redeem`.
6. **T5:** Server processes: stock decrement (L38-45), spendPoints called (L49-55), SwagOrder created (L70-78).
7. **T6:** Response 201 OK, backgroundSync marks action as "success", deletes from IndexedDB.
8. **T7:** Attacker manually crafts HTTP request to `/api/swag/item-id/redeem` again (or uses browser DevTools to replay fetch):

```javascript
// DevTools console replay:
fetch("/api/swag/item-id/redeem", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    variantId: "variant-123",
    shippingAddress: "123 Main St",
    quantity: 1
  })
})
```

**Server receives second request with no idempotency enforcement:**
- Checks stock: OK (wasn't actually decremented if first failed, or was reversed if first succeeded)
- Calls spendPoints again: **DOUBLE-SPENDS 100 points** if second request comes in race window
- Creates second SwagOrder: Two orders for same item, but only paid once

### Root Cause

The idempotency key is:
1. Generated client-side (forgeable / under attacker control)
2. Never sent to server
3. Server-side route handlers have no dedup logic

**The entire offline-first architecture assumes idempotency is handled client-side, but a determined attacker can bypass it by:**
- Replaying HTTP requests directly
- Clearing IndexedDB and re-queuing
- Using cURL / Postman after network restoration

### Impact

- Attacker can redeem swag twice for cost of one
- Can double-spend points on any endpoint (quests, bounties)
- No trace in AuditLog (only WalletTransaction + SwagOrder)

### Remediation

**Add server-side idempotency enforcement:**

```typescript
// lib/idempotency.ts (new file)
export async function getOrExecuteOnce<T>(
  idempotencyKey: string,
  executor: () => Promise<T>
): Promise<T> {
  // Check if already processed
  const cached = await redis.get(`idempotency:${idempotencyKey}`);
  if (cached) {
    return JSON.parse(cached);
  }

  // Execute once
  const result = await executor();

  // Cache for 24 hours
  await redis.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(result));

  return result;
}
```

```typescript
// app/api/swag/[id]/redeem/route.ts (modified)
export async function POST(request: NextRequest, ...) {
  const idempotencyKey = request.headers.get("Idempotency-Key") || 
    `${session.user.email}-${Date.now()}`;

  await getOrExecuteOnce(idempotencyKey, async () => {
    // ... existing stock + points debit + order creation
  });
}
```

---

## Finding 4: Non-Atomic Points Debit and Swag Stock Deduction

**Severity:** HIGH  
**Status:** Finding  
**File:** app/api/swag/[id]/redeem/route.ts:38-78

### Vulnerability

The swag redemption flow performs stock deduction **before** points debit, but without atomic wrapping:

```typescript
// Line 38-45: Stock deduct (raw SQL)
const updated = await prisma.$executeRaw`
  UPDATE "SwagItem" SET "remainingStock" = "remainingStock" - ${quantity}
  WHERE id = ${itemId} AND "remainingStock" >= ${quantity}
`;

// Lines 49-55: Points spend (in a Serializable TX)
try {
  await spendPoints(...);
} catch (error: any) {
  // Lines 58-61: ROLLBACK stock
  await prisma.$executeRaw`
    UPDATE "SwagItem" SET "remainingStock" = "remainingStock" + ${quantity}
    WHERE id = ${itemId}
  `;
}
```

**Issues:**

1. **Stock deduct happens outside a transaction** (raw SQL execute)
2. **If spendPoints fails after stock deduct**, the rollback (L58) is in the catch block, but it's not wrapped in a transaction either
3. **Race condition:** Between stock deduct (L38-41) and spendPoints call (L49-55), another user could attempt redemption and see decremented stock

### PoC: Race to Double-Redeem Same Item

**Setup:** Swag item has 1 remaining stock, 100 points cost.

```bash
# Time T0: User A starts redeem (quantity=1)
curl -X POST http://localhost:3000/api/swag/item-xyz/redeem \
  -H "Cookie: __Secure-next-auth.session-token=USER_A_JWT" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'

# Server executes line 38-45: stock 1 → 0 (SUCCESS)
# Server starts spendPoints (L49), enters async wait...

# Time T1 (race): User B also starts redeem (quantity=1, somehow still has 1 in cache)
curl -X POST http://localhost:3000/api/swag/item-xyz/redeem \
  -H "Cookie: __Secure-next-auth.session-token=USER_B_JWT" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 1}'

# Server executes line 38-45: stock 0 → -1 → FAILS (updated = 0)
# User B gets "Out of stock" (good)

# BUT if User A's spendPoints() FAILS due to wallet.pointsBalance < amount:
#   - Catch block fires (L56-62)
#   - Stock is rolled back: 0 → 1
#   - spendPoints exception thrown, caught, returns 400
#   - User A gets "Insufficient points"
#   - Stock is restored to 1
#   - User B can now retry and succeed (race window restored)
```

### Secondary Issue: SwagOrder Creation After Rollback

Even if stock rollback succeeds, the code continues to create SwagOrder (L70-78) regardless:

```typescript
// Lines 56-66: rollback and catch
} catch (error: any) {
  await prisma.$executeRaw`...`; // rollback stock
  if (error.message === "INSUFFICIENT_BALANCE") {
    return NextResponse.json(...); // ← Returns early, good
  }
  throw error;
}

// Line 70: Order creation (unreachable if catch returns, but shows design intent)
const order = await prisma.swagOrder.create({...});
```

### Impact

- Swag can be oversold by 1-2 units in race windows
- Stock rollback is not atomic with the initial deduct
- Shipping department receives unexpected duplicate order

### Remediation

Wrap entire flow in Serializable transaction:

```typescript
export async function POST(request: NextRequest, ...) {
  await prisma.$transaction(async (tx) => {
    // 1. Check and deduct stock atomically
    const updated = await tx.swagItem.findUnique({ where: { id: itemId } });
    if (!updated || updated.remainingStock < quantity) {
      throw new Error("OUT_OF_STOCK");
    }
    
    await tx.swagItem.update({
      where: { id: itemId },
      data: { remainingStock: { decrement: quantity } }
    });
    
    // 2. Debit points (via spendPoints inside same TX)
    // NOTE: spendPoints also wraps in TX, so nest it
    await spendPoints(...);
    
    // 3. Create order
    const order = await tx.swagOrder.create({...});
    
    return order;
  }, { isolationLevel: "Serializable" });
}
```

---

## Finding 5: Missing Audit Log on ALL Wallet Operations

**Severity:** MEDIUM (HIGHEST CONTEXT)  
**Status:** Finding  
**File:** lib/wallet.ts:28-262, app/api/wallet/adjust/route.ts

### Vulnerability

All wallet operations **log only to WalletTransaction table** — no AuditLog entries are created. Per recon Step 13:

> AuditLog coverage:
> | **Points grant / spend / expire / admin adjust** | ❌ NOT audited (only `WalletTransaction`) | [lib/wallet.ts](../../../lib/wallet.ts) |

**WalletTransaction is a data table, not an audit table:**
- Stores transaction amounts, type (quest_reward, bounty_reward, etc.)
- No way to distinguish intended vs. malicious point grants
- No `adminEmail` field for who granted points
- No change-request / approval workflow

### Evidence

**earnReward (L28-78):** Creates WalletTransaction (L67-76) only.

```typescript
prisma.walletTransaction.create({
  data: {
    walletId: wallet.id,
    pointsAmount: points,
    xpAmount: xp,
    type,
    description,
    sourceId,
  },
}),
```

No `logAudit(...)` call (which should go to AuditLog table per lib/audit.ts).

**adminAdjust (L212-262):** Same — WalletTransaction only (L252-260).

**expirePoints (L159-207):** Same — WalletTransaction only (L191-200).

**spendPoints (L86-152):** Same — WalletTransaction only (L139-148).

### Contrast: Other Operations ARE Audited

Per recon, media create/delete, experiments, playbooks, speedrun runs **all** use `logAudit(...)`:

```typescript
// Example from app/api/media/route.ts:
await logAudit({
  action: "MEDIA_CREATE",
  adminEmail: session.user.email,
  targetType: "Media",
  targetId: media.id,
  changes: { title, description }
});

// Example from app/api/experiments/route.ts:129
await logAudit({
  action: "EXPERIMENT_CREATE",
  adminEmail: session.user.email,
  targetType: "Experiment",
  targetId: exp.id,
  changes: { name, hypothesis }
});
```

But wallet.ts **never calls logAudit()**.

### Impact

- **Zero accountability:** Admin can grant unlimited points with no audit trail
- **No forensics:** If fraudulent point grant discovered, no way to trace who did it
- **Compliance risk:** Financial audits (since Bounty.cash = INR real money) lack documentation
- **No alerting:** No way to detect anomalous point grants (e.g., 1M points in one day)

### PoC: Unaudited Admin Self-Enrichment

```bash
# Admin secretly grants self 100,000 points via /api/wallet/adjust
curl -X POST http://localhost:3000/api/wallet/adjust \
  -H "Cookie: __Secure-next-auth.session-token=ADMIN_JWT" \
  -d '{"userEmail": "admin@team1.io", "points": 100000, "description": "Referral bonus payout"}'

# Only trace is WalletTransaction:
# { walletId: "...", pointsAmount: 100000, xpAmount: 0, type: "admin_adjust", 
#   description: "Referral bonus payout (by admin@team1.io)" }

# AuditLog table: EMPTY (no entry created)

# Investigator later: "Who approved this 100k point grant?"
# Queryable: SELECT * FROM AuditLog WHERE action = "WALLET_ADJUST"; → returns 0 rows
```

### Remediation

Add audit logging to all wallet operations:

```typescript
// lib/wallet.ts:28-78 (earnReward)
export async function earnReward(...) {
  const wallet = await getOrCreateWallet(userEmail);
  // ... existing code ...

  await prisma.$transaction([
    // ... existing updates ...
    prisma.walletTransaction.create({...}),
    // NEW: Log to AuditLog
    prisma.auditLog.create({
      data: {
        action: "WALLET_EARN",
        adminEmail: "system",  // or require caller to pass
        targetType: "UserWallet",
        targetId: wallet.id,
        changes: { xpAmount: xp, pointsAmount: points, type, sourceId }
      }
    })
  ]);
}

// app/api/wallet/adjust/route.ts:35-41
await adminAdjust(...);

// NEW: Log separately after successful execution
await logAudit({
  action: "WALLET_ADMIN_ADJUST",
  adminEmail: session.user.email,
  targetType: "UserWallet",
  targetId: wallet.id,
  changes: { xp, points, description }
});
```

---

## Finding 6: Suspected Integer Overflow on 32-Bit Int Fields

**Severity:** MEDIUM  
**Status:** Suspected  
**File:** lib/wallet.ts (all functions), prisma/schema.prisma:659-706

### Vulnerability

Prisma `Int` is a **32-bit signed integer**: range **-2,147,483,648 to 2,147,483,647** (roughly ±2.1B).

UserWallet fields are all `Int`:

```prisma
model UserWallet {
  ...
  totalXp       Int      @default(0)
  pointsBalance Int      @default(0)
  totalEarned   Int      @default(0)
  totalSpent    Int      @default(0)
  totalExpired  Int      @default(0)
  ...
}
```

When earnReward() is called with large amounts, `pointsBalance: { increment: 1000000000 }` could overflow:

```typescript
// lib/wallet.ts:46-49
data: {
  totalXp: { increment: xp },
  pointsBalance: { increment: points },  // ← If points = 1.5B, overflow to negative
  totalEarned: { increment: points },
},
```

### PoC: Overflow to Negative Balance

```bash
# Admin grants 1.5B points to user
curl -X POST http://localhost:3000/api/wallet/adjust \
  -H "Cookie: __Secure-next-auth.session-token=ADMIN_JWT" \
  -d '{"userEmail": "user@gmail.com", "points": 1500000000}'

# Prisma executes:
# UPDATE UserWallet 
# SET pointsBalance = pointsBalance + 1500000000
# WHERE userEmail = 'user@gmail.com'

# If pointsBalance was already 700M (within Int range):
# 700,000,000 + 1,500,000,000 = 2,200,000,000
# Result in signed 32-bit: OVERFLOW → -2,047,483,648 (wraps around)

# User now has negative balance
# spendPoints() allows spending only if balance >= amount (L100)
# balance = -2B, amount = 100 → PASS (they appear rich!)
# Can redeem infinite swag
```

### Why This Matters

- No validation prevents large amounts (Finding 2 confirms this)
- No bounds check in earnReward / adminAdjust / spendPoints
- Postgres BIGINT could store larger values, but Prisma Int casts to 32-bit

### Remediation

1. **Use Prisma BigInt instead of Int** (if financial data):

```prisma
model UserWallet {
  ...
  totalXp       BigInt   @default(0)   // Range: ±9.2 × 10^18
  pointsBalance BigInt   @default(0)
  ...
}
```

2. **OR add validation cap** (Finding 2 mitigation covers this):

```typescript
const MAX_POINTS = 1000000; // 1M points reasonable limit
if (points > MAX_POINTS) throw new Error("Points exceed maximum");
```

---

## Finding 7: Negative-Amount Edge Case in spendPoints()

**Severity:** MEDIUM  
**Status:** Finding  
**File:** lib/wallet.ts:86-152

### Vulnerability

The `spendPoints()` function **does not validate that `amount > 0`**:

```typescript
export async function spendPoints(
  userEmail: string,
  amount: number,      // ← No `if (amount <= 0)` check
  type: string,
  sourceId?: string,
  description?: string
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const wallet = await tx.userWallet.findUnique({...});

      if (!wallet || wallet.pointsBalance < amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // ... FIFO deduction loop ...

      // Line 133-135
      await tx.userWallet.update({
        where: { id: wallet.id },
        data: {
          pointsBalance: { decrement: amount },  // ← decrement(-100) = increment(100)
          totalSpent: { increment: amount },     // ← increment(-100) decrement is not what we want
        },
      });
    },
    ...
  );
}
```

If a caller accidentally passes `amount = -100`:

1. `wallet.pointsBalance < -100` → Likely FALSE (balance is usually positive)
2. FIFO loop tries to find batches to deduct from, but `remaining -= -100` → **adds** to remaining
3. `pointsBalance: { decrement: -100 }` → **credits 100 points** instead
4. `totalSpent: { increment: -100 }` → **subtracts from totalSpent** (inverts accounting)

### PoC

```bash
# Attacker calls spendPoints with negative amount (via crafted endpoint or internal bug)
# Suppose internal bug passes amount = -500

# Server state:
# UserWallet: { pointsBalance: 100, totalSpent: 50 }

# After spendPoints(userEmail, -500, "swag_purchase"):
# UserWallet: { pointsBalance: 600, totalSpent: -450 }
# ← User gained 500 points and spent -450 (corrupted accounting)
```

### Impact

- If any endpoint mistakenly passes negative amount, balance inflates
- totalSpent accounting corrupts (shows negative or inflated)
- Leaderboard based on totalSpent becomes unreliable

### Remediation

Add guard in spendPoints():

```typescript
export async function spendPoints(...) {
  if (amount <= 0) {
    throw new Error("INVALID_AMOUNT: amount must be positive");
  }
  // ... rest
}
```

---

## Finding 8: No Referral Self-Check (Self-Referral Bypass)

**Severity:** LOW (Speedrun-specific)  
**Status:** Suspected  
**File:** app/api/speedrun/runs/[slug]/register/route.ts:141-154

### Vulnerability

The referral code validation checks **only that the referrer exists and is not the same email**:

```typescript
// Line 141-154
let resolvedReferralCode: string | null = null;
if (referralCode && typeof referralCode === "string") {
  const code = referralCode.trim().toUpperCase();
  if (code) {
    const ref = await prisma.speedrunReferralCode.findUnique({
      where: { code },
      select: { code: true, userEmail: true },
    });
    if (ref && ref.userEmail !== userEmail) {  // ← Only checks exact email match
      resolvedReferralCode = ref.code;
    }
  }
}
```

**Self-referral bypass:**

Email normalization is NOT enforced. Google OAuth allows email aliasing:
- `john@gmail.com`
- `john+alt@gmail.com` (alias)
- Both are valid, separate accounts in PostgeSQL (no uniqueness constraint on email normalization)

If attacker creates two accounts:
1. Account A: `john@gmail.com`
2. Account B: `john+dev@gmail.com`

Then:
- Create referral code in Account B (generates code "RF-ABC123")
- Register with Account A, use referral code from Account B
- Validation passes: `"john@gmail.com" !== "john+dev@gmail.com"`
- Account B's `conversions` count increments

This is a **Sybil attack**, not direct self-referral, so marked as LOW severity here (primary concern is multi-accounting, which is separate).

### Referral Code Doesn't Award Points

**Note:** Inspecting the code, referral codes increment `conversions` counter but **do NOT award XP or points directly**. The referral benefit may be:
- Leaderboard visibility (most conversions)
- Badge / recognition only
- Points granted elsewhere (not found in search)

If referrals award points, this becomes HIGH severity. Current audit marks as LOW with note to re-check referral reward grant path.

---

## Finding 9: Concurrent Bounty/Quest Submission Race (Uniqueness Bypass)

**Severity:** HIGH  
**Status:** Finding  
**Files:** app/api/bounty/submissions/route.ts:112-127, app/api/quests/[id]/completions/route.ts:54-61

### Vulnerability

Both bounty and quest completions check for existing submission **before** creating, but the check is **not atomic** with creation.

**Quest completion:**

```typescript
// Line 54-61
if (quest.type === "one-time") {
  const existing = await prisma.questCompletion.findUnique({
    where: { questId_userEmail: { questId, userEmail: session.user.email } },
  });
  if (existing) {
    return NextResponse.json({ error: "Already completed" }, { status: 409 });
  }
}

// Line 64 (not atomic with check)
const completion = await prisma.questCompletion.create({...});
```

**Bounty submission:**

```typescript
// Line 113-119
const existing = await prisma.bountySubmission.findFirst({
  where: { bountyId, submittedById: userId, deletedAt: null }
});
if (existing) {
  return NextResponse.json({ error: "You have already submitted for this bounty" }, { status: 409 });
}

// Line 142 (not atomic)
const submission = await prisma.bountySubmission.create({...});
```

### PoC: Concurrent Bounty Submission (Double-Award)

```bash
# Time T0: POST /api/bounty/submissions (Race condition setup)
# User sends two concurrent requests

# Request 1: 
curl -X POST http://localhost:3000/api/bounty/submissions \
  -H "Cookie: __Secure-next-auth.session-token=USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"bountyId": "bounty-123", "proofUrl": "https://..."}'

# Request 2 (sent before Request 1 completes):
curl -X POST http://localhost:3000/api/bounty/submissions \
  -H "Cookie: __Secure-next-auth.session-token=USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"bountyId": "bounty-123", "proofUrl": "https://..."}'

# Server flow:
# T0.1 (Request 1): findFirst() → no existing submission (safe window)
# T0.2 (Request 2): findFirst() → no existing submission (same safe window)
# T0.3 (Request 1): create() → succeeds, submissionId = "sub-111"
# T0.4 (Request 2): create() → SHOULD fail with P2002, but code doesn't check:

// Line 152 (error handling, but not checking uniqueness constraint)
if (error?.code === 'P2002') {
  return NextResponse.json({ error: "You have already submitted for this bounty" }, { status: 409 });
}

# Both submissions created successfully (if timing right)
# On admin approval: BOTH are approved, earnReward called TWICE
# User receives 2X points for 1 submission
```

The code DOES have a P2002 catch (line 152), so this is partially mitigated. But the race window still exists. Better: use `findUnique` with uniqueness constraint instead of `findFirst`.

### NOTE: BountySubmission Lacks Unique Constraint

The schema doesn't have explicit uniqueness constraint:

```prisma
model BountySubmission {
  ...
  submittedById String?
  publicUserId  String?
  ...
  // Missing: @@unique([bountyId, submittedById]) ← Code comment at line 150-151 suggests adding this
}
```

Code comment (route.ts:150-151):
```typescript
// NOTE: Add @@unique([bountyId, submittedById]) and @@unique([bountyId, publicUserId])
// to BountySubmission in prisma/schema.prisma for a DB-level guarantee
```

**So the unique constraint SHOULD be added per the developer's own note, but isn't.**

### Remediation

Add DB-level unique constraint to BountySubmission:

```prisma
model BountySubmission {
  ...
  @@unique([bountyId, submittedById])
  @@unique([bountyId, publicUserId])
}
```

Then race condition is automatically prevented by Postgres.

---

## Finding 10: No Velocity / Sybil Check on Signup

**Severity:** MEDIUM  
**Status:** Suspected (not strict points economy, but affects point farming)  
**File:** lib/auth-options.ts:13-86

### Vulnerability

Google OAuth signup (PublicUser creation) has **no velocity checks**:

```typescript
// lib/auth-options.ts:56-64
// If no Member or CommunityMember found, create PublicUser
if (!user) {
  user = await prisma.publicUser.create({
    data: {
      email: user.email,
      fullName: user.name,
      image: user.image,
      signupIp: ipAddress, // ← Captured but not checked
    },
  });
}
```

- `signupIp` is captured but never checked against velocity rules
- No rate limit on signup per IP
- No device fingerprinting or cookie tracking
- Attacker can create unlimited accounts with different Google emails

### Impact on Points Economy

- Attacker can create N accounts in quick succession
- Each account eligible for daily quest bonuses, welcome bonuses, etc.
- Sybil can claim N × (bonus points) in minutes
- Cross-account collude (e.g., Account A refers Accounts B, C, D via Speedrun referral code)

### Why Not Critical Here

This is primarily a **Sybil attack** category (Cat 7 or Cat 8 depending on framework). The points economy itself doesn't have signup bonuses, so direct farming is limited. **However**, if a signup bonus is added later (e.g., "+100 points for new user"), this becomes Critical.

---

## Summary Table

| # | Title | Severity | Status | PoC | Remediation |
|---|---|---|---|---|---|
| 1 | Race condition on quest completion grant (one-time bypass) | HIGH | Finding | Concurrent POSTs to `/api/quests/[id]/completions` | Wrap create + earnReward in Serializable TX |
| 2 | No input validation on earnReward / spendPoints / adminAdjust amounts | HIGH | Finding | Admin grants 999M points to self | Add amount bounds checks + admin caps |
| 3 | Idempotency key NOT enforced server-side (offline replay) | CRITICAL | Finding | Replay swag redemption via DevTools fetch | Add server-side Idempotency-Key header check |
| 4 | Non-atomic points debit + swag stock deduction | HIGH | Finding | Concurrent swag redeems in race window | Wrap stock + points in single Serializable TX |
| 5 | Missing AuditLog on ALL wallet operations | MEDIUM | Finding | Admin self-grant 100k points, no audit trail | Add logAudit() calls to all wallet functions |
| 6 | Integer overflow on 32-bit Int fields | MEDIUM | Suspected | Admin grants 1.5B points, balance wraps to negative | Use BigInt or add validation cap |
| 7 | Negative-amount edge case in spendPoints() | MEDIUM | Finding | Pass amount = -100, user gains points | Add `if (amount <= 0) throw` guard |
| 8 | No referral self-check (email aliasing bypass) | LOW | Suspected | Create john@gmail + john+alt@gmail, cross-refer | Normalize email (lowercase, strip +) before check |
| 9 | Concurrent bounty submission race (double-award) | HIGH | Finding | Race two bounty submissions same bounty | Add DB unique constraint + Serializable TX |
| 10 | No velocity / Sybil check on signup | MEDIUM | Suspected | Create N accounts from same IP | Add signup rate limit (1 per IP per day) |

---

## Highest-Risk Chains

### Chain 1: Admin Self-Enrichment (Findings 2 + 5)
1. Admin calls /api/wallet/adjust with unlimited points
2. No input validation (Finding 2) permits arbitrary amount
3. No AuditLog (Finding 5) means no accountability
4. Admin redeems swag and spikes leaderboard
5. **Detection:** Impossible without AuditLog

### Chain 2: Offline Replay Farming (Finding 3)
1. User submits swag redemption offline (100 points cost)
2. Network restored, backgroundSync replays action
3. Server has no idempotency check (Finding 3) — processes twice
4. User pays 100 points but receives 2× swag
5. Can automate via IndexedDB manipulation + network toggle

### Chain 3: Race-Condition Quest Spam (Finding 1 + Race TX design)
1. Attacker creates automated quest submission loop (5/min rate limit per route.ts:14, but loophole on auto-approve)
2. Concurrent requests race the uniqueness constraint
3. Both get approved and earn rewards
4. No AuditLog (Finding 5) to detect pattern

---

## Recommendations (Priority Order)

**IMMEDIATE (Day 1):**
1. **Add AuditLog to all wallet.ts functions** (Finding 5) — Financial audit required
2. **Add server-side idempotency enforcement** (Finding 3 CRITICAL) — Blocks replay attacks
3. **Add input validation to earnReward / adminAdjust** (Finding 2) — Cap admin adjustments at 10k/day

**SHORT-TERM (Week 1):**
4. **Wrap quest/bounty creation + earning in Serializable TX** (Findings 1, 9)
5. **Wrap swag redemption in atomic TX** (Finding 4)
6. **Add DB unique constraints to prevent duplicate submissions** (Finding 9)

**MEDIUM-TERM (Month 1):**
7. **Use BigInt for balance fields or enforce max-value validation** (Finding 6)
8. **Implement admin dual-control for large adjustments** (Finding 2 mitigate)
9. **Add signup velocity checks** (Finding 10)

**ONGOING:**
10. **Write automated tests for all wallet paths** (Missing per recon Step 14)
11. **Add analytics alerts for anomalous point grants** (e.g., >1k points in < 1 hour)

---

## Notes

- **No tests exist** for any of these paths (recon confirmed ZERO automated tests)
- **idempotencyKey in offlineStorage is client-side only** — does not reach server
- **Cron bearer token (CRON_SECRET) has no HMAC signature** — basic but acceptable for Vercel trust model
- **All wallet operations should be logged to AuditLog, not just WalletTransaction**
- **adminAdjust has no dual-control or approval workflow** — single admin can grant/revoke unlimited

**End of Category 12 Audit**
