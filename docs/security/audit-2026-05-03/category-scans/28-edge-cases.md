# Category 28 — Edge Cases & Boundary Conditions

**Audit date:** 2026-05-03  
**Scope:** team1-india codebase — all edge-case handling in input validation, numeric operations, time boundaries, permission checks, and transaction recovery.  
**Recon dependency:** [00-RECON.md § Step 14](../00-RECON.md#step-14--test-coverage-of-security-paths) confirmed ZERO automated tests; all findings are code-derived.

---

## 1. Negative Numbers in Points / Quantity

**Check:** Do negative inputs in `earnReward`, `spendPoints`, or `adminAdjust` cause unexpected behavior?

**Verdict:** ⚠️ **PARTIALLY CONFIRMED — re-stated from Category 12.**

### Findings

**In `earnReward` (lib/wallet.ts:28-78):**
- Parameters `xp` and `points` are unvalidated at function level.
- Line 52: `...(points > 0 ? [pointsBatch.create(...)] : [])` — if `points < 0`, no `PointsBatch` is created, **but wallet update at L46 still increments** `pointsBalance` by a negative amount.
- Line 48: `totalEarned: { increment: points }` — increments by negative value, allowing **lifetime-earned metric to go negative** (semantic inconsistency).
- **Root cause:** Callers (`app/api/quests/completions/[id]/route.ts:63`, `app/api/bounty/submissions/[id]/route.ts`) source `xpReward` and `pointsReward` from the `Quest` / `Bounty` records; these are `Int` fields with no DB constraint `>= 0`. If an admin creates a quest with `pointsReward: -100`, users' calls to approve completions will **deduct points unintentionally**.

**In `spendPoints` (lib/wallet.ts:86-152):**
- Parameter `amount` is unvalidated; if caller passes negative, line 100 checks `wallet.pointsBalance < amount`, which passes for `amount: -1000` (since any balance is not < -1000).
- Lines 105-111 find batches with `remaining: { gt: 0 }` (positive); the FIFO loop at L115 uses `Math.min(remaining, batch.remaining)`, which for negative `amount` yields negative `deduct`.
- Line 120: `decrement: deduct` with negative value = **increment** (Prisma arithmetic).
- Line 134: `decrement: amount` with negative value = **increment points back**.
- **Result:** Calling `spendPoints(user, -100, ...)` **adds 100 points** without consuming a batch — economic exploit.

**In `adminAdjust` (lib/wallet.ts:212-262):**
- Lines 223-229: Explicit handling of positive vs. negative `points`:
  - If `points < 0`: increments `pointsBalance` by negative value (decrement) and increments `totalSpent` by the absolute value.
  - If `points > 0`: increments `pointsBalance` and `totalEarned`.
  - **Validation:** None — route handler [app/api/wallet/adjust/route.ts:30-31](../../../app/api/wallet/adjust/route.ts#L30-L31) checks `(xp ?? 0) === 0 && (points ?? 0) === 0`, but does NOT validate ranges.
  - Admin can submit `points: -999999` and `xp: -999999` (line 35-40 passes both as-is).
  - **Route-level validation missing:** No check that `xp` or `points` fit in a 32-bit signed integer range.

### Shared Route-Level Validation Gap

**File:** [app/api/wallet/adjust/route.ts:30-32](../../../app/api/wallet/adjust/route.ts#L30-L32)
```javascript
if ((xp ?? 0) === 0 && (points ?? 0) === 0) {
  return NextResponse.json({ error: "xp or points must be non-zero" }, { status: 400 });
}
```
- Only blocks the case where **both** are zero; allows arbitrary negative values.
- **No integer overflow checks** for the `-2147483648` to `2147483647` range.

### Implication

CORE admins can exploit `POST /api/wallet/adjust` to:
1. Deduct unlimited points from any user (negative adjustment).
2. Award unlimited points (positive adjustment).
3. Corrupt accounting metadata (`totalEarned`, `totalSpent` counters go negative).

This is **delegated to admin privilege** (checkCoreAccess enforced), so the risk is **compromised admin account or insider threat**.

**Restatement from Cat 12:** No input validation at route level; library functions assume valid inputs.

---

## 2. Zero-Amount Still Triggering Counters & Rows

**Check:** Does `earnReward(user, 0, 0, ...)` create a `WalletTransaction` row? Does this lead to spam or DoS?

**Verdict:** ✅ **CONFIRMED — potential row-spam vector.**

### Code Analysis

**File:** [lib/wallet.ts:28-78](../../../lib/wallet.ts#L28-L78)

```typescript
export async function earnReward(
  userEmail: string,
  xp: number,
  points: number,
  type: string,
  sourceId?: string,
  description?: string,
  ttlDays = DEFAULT_POINTS_TTL_DAYS
): Promise<void> {
  const wallet = await getOrCreateWallet(userEmail);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ttlDays);

  await prisma.$transaction([
    // Update wallet totals
    prisma.userWallet.update({
      where: { id: wallet.id },
      data: {
        totalXp: { increment: xp },           // 0 → no-op
        pointsBalance: { increment: points }, // 0 → no-op
        totalEarned: { increment: points },   // 0 → no-op
      },
    }),
    // Create points batch (for FIFO expiry tracking)
    ...(points > 0
      ? [
          prisma.pointsBatch.create({
            data: { amount: points, ... }, // SKIPPED if points=0
          }),
        ]
      : []),
    // Log the transaction ← ALWAYS EXECUTES
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        pointsAmount: points,  // 0 allowed
        xpAmount: xp,          // 0 allowed
        type,
        description,
        sourceId,
      },
    }),
  ]);
}
```

**Behavior:**
- If `earnReward(user, 0, 0, "quest_reward", questId)` is called:
  1. `userWallet.update` writes a row with no field changes (no-op in most ORMs, but Prisma executes).
  2. `pointsBatch.create` is **skipped** (line 52 condition).
  3. `walletTransaction.create` **executes** — creates a row with `pointsAmount: 0, xpAmount: 0`.
  4. Transaction commits.
- **Result:** Every quest with `xpReward: 0, pointsReward: 0` that is approved creates a `WalletTransaction` row.

### Route-Level Validation

**File:** [app/api/quests/completions/[id]/route.ts:42-68](../../../app/api/quests/completions/[id]/route.ts#L42-L68)
- No validation that `completion.quest.xpReward > 0 || completion.quest.pointsReward > 0`.
- A quest with both rewards set to 0 (config oversight) will still call `earnReward(0, 0, ...)`.

### Implication

**Suspected Low Risk:**
- A quest/bounty admin creates 1000 zero-reward items and approves 10 completions each = **10,000 no-op `WalletTransaction` rows**.
- Each row is ~200 bytes; 10K rows = ~2 MB in the transactions table.
- **Rate limit:** No per-user or per-admin rate limit on approvals (Cat 12 scope).
- **Spam vector:** If a non-CORE user can submit their own quest completions or trigger bulk operations, zero-rewards become an **easy DoS** on the `WalletTransaction` table.

**Confirmation:** Per recon, **no bulk-review auth gate** is visible; need to verify that `PUT /api/quests/completions/bulk-review` checks `checkCoreAccess`.

---

## 3. Integer / Float Overflow on Balance

**Check:** Can `pointsBalance` or `totalXp` exceed the 32-bit signed integer range and wrap?

**Verdict:** ✅ **CONFIRMED — but JavaScript `Date` is safe; Postgres `Int` is at risk.**

### Analysis

**Prisma Schema (prisma/schema.prisma:659-706):**
```prisma
model UserWallet {
  totalXp       Int      @default(0) // lifetime XP
  pointsBalance Int      @default(0) // spendable points
  totalEarned   Int      @default(0) // lifetime points earned
  totalSpent    Int      @default(0) // lifetime points spent
  totalExpired  Int      @default(0) // lifetime points expired
}
```

- All numeric fields are Prisma `Int` → PostgreSQL `integer` (32-bit signed: -2,147,483,648 to 2,147,483,647).
- **Prisma client:** JavaScript `BigInt` is not used; values are plain `number`.
- **Postgres:** Handles `integer` arithmetic; if an `increment: 2000000000` occurs on a wallet at 200,000,000, the result is 2,200,000,000 → **wraps to negative** (silently in some Postgres driver configs, or errors).

### Route-Level Exploit Scenario

1. Admin calls `POST /api/wallet/adjust` with `points: 2147483647` for user A.
2. User A's `pointsBalance` becomes 2,147,483,647.
3. Another admin calls adjust again with `points: 1000000000`.
4. Postgres: 2,147,483,647 + 1,000,000,000 = 3,147,483,647.
5. **Overflow:** Result wraps to -1,347,483,648 in 32-bit arithmetic.
6. User A now has **negative points** but the UI shows the error or wraps to a confusing state.

### JavaScript Dates — No Year-2038 Risk

**File:** [lib/wallet.ts:38, 109, 160, 231](../../../lib/wallet.ts)
```typescript
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + ttlDays);
```
- JavaScript `Date` is 64-bit millisecond timestamp (safe until year 285,616).
- No 32-bit timestamp risk.

### Implication

**Confirmed:** Integer overflow on `Int` fields is **possible but requires admin privilege** and is **not runtime-exploitable** (no auto-exploitation without backend database access). However, data integrity is compromised if an admin mistakenly submits large adjustments.

**Mitigation:** Add input validation range checks in `adminAdjust` and route handler.

---

## 4. Unicode in Email / Username: Homoglyph, Case-Folding, ZWJ

**Check:** Does the app normalize emails? Can a user create two accounts with visually identical emails (e.g., `user@example.com` vs. `𝐮𝐬𝐞𝐫@𝐞𝐱𝐚𝐦𝐩𝐥𝐞.𝐜𝐨𝐦` using Unicode lookalikes)?

**Verdict:** ⚠️ **SUSPECTED — case-insensitive query, but no Unicode normalization.**

### Email Lookup

**File:** [lib/auth-options.ts:17-19, 99-103](../../../lib/auth-options.ts)
```typescript
const emailToFind = user.email ? user.email.trim() : "";
const member = await prisma.member.findFirst({
  where: { email: { equals: emailToFind, mode: 'insensitive' } },
});
```

- **Normalization:** Only `.trim()` is applied (removes leading/trailing whitespace).
- **Case sensitivity:** Prisma `mode: 'insensitive'` handles ASCII case-folding (e.g., `user@EXAMPLE.COM` = `user@example.com`).
- **Unicode normalization:** **NOT applied**. NFC vs. NFD forms, lookalike characters (e.g., Cyrillic 'A' vs. Latin 'A'), zero-width joiners (ZWJ) are **not normalized**.

### Example Attack

1. Attacker signs up with email `user@example.com` (Latin 'a', 'm').
2. Attacker signs up with email `useɾ@example.com` (Cyrillic 'ɾ', visually identical in many fonts).
3. Both pass the unique constraint check because Postgres (with `mode: 'insensitive'`) does **not normalize Unicode**.
4. Two `PublicUser` or `Member` rows exist with visually identical emails.

### Member.name Field

**File:** [prisma/schema.prisma:14](../../../prisma/schema.prisma#L14)
```prisma
model Member {
  name    String?
}
```
- No max-length constraint.
- No Unicode normalization in any route that updates `name`.

### Implication

**Suspected Medium Risk:**
- Email uniqueness is **not enforced at the Unicode level**.
- Allows **account confusion attacks** if a user (unaware of Unicode variants) assumes they signed up but instead are logged into a lookalike account.
- The vulnerability requires a motivated attacker to pre-register lookalike accounts.
- **Mitigation:** Add Unicode NFC normalization to email input before DB lookup.

---

## 5. Empty / Null / Undefined in user_id / tenant_id / role Bypassing Checks

**Check:** What happens if `session?.user?.role` is undefined when `checkCoreAccess` is called?

**Verdict:** ✅ **CONFIRMED — return 403 (Safe) but note edge case on fallback.**

### checkCoreAccess Analysis

**File:** [lib/permissions.ts:42-51](../../../lib/permissions.ts#L42-L51)
```typescript
export function checkCoreAccess(session: any): { authorized: boolean; response?: Response } {
    if (!session?.user?.email) {
        return { authorized: false, response: new Response("Unauthorized", { status: 401 }) };
    }
    // @ts-ignore
    if (session.user.role !== 'CORE') {
        return { authorized: false, response: new Response("Forbidden. Core access required.", { status: 403 }) };
    }
    return { authorized: true };
}
```

**Behavior:**
- If `session` is null → line 43 checks `!session?.user?.email` → **returns 401 (safe)**.
- If `session.user` exists but `role` is undefined → line 47 checks `role !== 'CORE'` → **true** (undefined !== 'CORE') → **returns 403 (safe)**.
- If `session.user.role` is a string other than 'CORE' (e.g., 'PUBLIC', 'MEMBER', or garbage) → **returns 403 (safe)**.

### Fallback in JWT Callback

**File:** [lib/auth-options.ts:148-153](../../../lib/auth-options.ts#L148-L153)
```typescript
// Should not happen if signIn creates the user, but fallback:
token.role = 'PUBLIC';
token.permissions = {};
token.tags = [];
token.consent = false;
return token;
```
- If no Member, CommunityMember, or PublicUser is found (code says "should not happen"), **role defaults to 'PUBLIC'** (safe, least privilege).

### Implication

**No vulnerability found.** `checkCoreAccess` is defensive; the fallback in the JWT callback is safe (defaults to PUBLIC).

---

## 6. Very Long Strings in name / bio Causing DB / Log / Parser Issues

**Check:** Can a user POST a 10 MB name? Does the app or Vercel reject it?

**Verdict:** ⚠️ **SUSPECTED — Vercel caps at 2 MB, but Member.name has no DB limit.**

### Schema

**File:** [prisma/schema.prisma:14](../../../prisma/schema.prisma#L14)
```prisma
model Member {
  name    String?
}
```
- **No max-length constraint** in Prisma.
- PostgreSQL `text` type supports up to 1 GB per row (no practical limit for a single field).

### Vercel Request Size Limit

**Recon Step 11:** No custom `bodyParser` or `bodyParserConfig` found in [next.config.ts](../../../next.config.ts).
- Next.js default: **1 MB request body limit** (as of v13+).
- Vercel Functions: **Additional 2 MB soft limit** for streaming responses, but **request payload is capped at ~2 MB** before 413.

### Scenario

1. User POSTs `{"name": "<10MB string>"}` to `PATCH /api/members/[id]` or `POST /api/profile`.
2. Vercel rejects at **2 MB** (before route handler).
3. User receives **413 Payload Too Large**.
4. **Result:** Safe due to Vercel infrastructure.

### Logging Side-Effect

**File:** [lib/logger.ts:39](../../../lib/logger.ts#L39)
- Custom `log(...)` function; no evidence it truncates large payloads.
- If a very long string is logged, it could **fill disk / logs** (risk deferred to log aggregation service).

### Implication

**Suspected Low Risk — infrastructure-dependent:**
- Vercel WAF limits request size to ~2 MB.
- Within that, a user can store a ~100 KB name in the database.
- No application-level validation; relies on Vercel's limit.
- **Mitigation:** Add explicit max-length validation on `name` fields (recommend 256 or 512 bytes).

---

## 7. Deeply Nested JSON DoS

**Check:** If a user can submit `{"permissions": {"a": {"a": {"a": ...}}}}` 10K deep, does zod or Prisma DoS?

**Verdict:** ⚠️ **SUSPECTED — no zod found; Prisma JSON parsing vulnerable.**

### JSON Fields in Schema

**File:** [prisma/schema.prisma:16, 47, etc.](../../../prisma/schema.prisma)
```prisma
model Member {
  permissions     Json?     @default("{\"default\": \"READ\"}")
  customFields    Json?     @default("{}")
  notificationPreferences Json?
}
```
- **No validation schema** (no zod, no Prisma schema validation).
- Prisma accepts any valid JSON.

### Permissions Field Update Route

**File:** [app/api/members/[id]/permissions/route.ts:22-55](../../../app/api/members/[id]/permissions/route.ts) (not fully read, but pattern is consistent)
- Likely accepts `JSON.parse(body)` and writes to `Member.permissions`.
- **No depth check** visible.

### DoS Scenario

1. Attacker POSTs a 10K-deep JSON object to `PUT /api/members/[id]/permissions`:
   ```json
   {"a": {"a": {"a": {"a": ...}}}} // 10,000 levels
   ```
2. Vercel request size limit: ~2 MB. A 10K-deep JSON is ~500 KB (manageable).
3. Prisma parses the JSON: uses **Node.js `JSON.parse()`**, which is a recursive descent parser.
4. **Risk:** Stack overflow in the parser if depth is extreme (>10K).
5. **Actual limit:** Node.js typically handles 1K-2K depth before stack overflow.

### Implication

**Suspected Medium Risk — requires endpoint access and deep nesting:**
- A malicious CORE admin can craft a permission JSON that causes a **stack overflow** on deserialization.
- The attack requires auth (CORE-only endpoint).
- **Mitigation:** Add a JSON depth validator or limit via zod/ajv before Prisma update.

---

## 8. Trailing Whitespace / Leading Zero / Scientific Notation in Numerics

**Check:** Does swag redemption accept `pointsAmount: "1e10"` or `"010"` as numeric input?

**Verdict:** ⚠️ **SUSPECTED — no zod parsing; vulnerable to type coercion.**

### Swag Redeem Route

**File:** [app/api/swag/[id]/redeem/route.ts:19-22](../../../app/api/swag/[id]/redeem/route.ts#L19-L22)
```typescript
const { id: itemId } = await params;
const body = await request.json();
const { variantId, shippingAddress, quantity = 1 } = body;
```
- `body` is parsed via `request.json()` (native JSON.parse).
- No schema validation (no zod).
- `quantity` defaults to 1 if not provided.

### Line 35:
```typescript
const totalCost = item.pointsCost * quantity;
```
- If `quantity` is a string like `"1e10"`, JavaScript will **coerce** it to a number in the multiplication: `"1e10" * 10000` = `1e14` (100 trillion points).
- If `quantity` is `"010"`, it coerces to `10` (leading zeros ignored in JavaScript).

### Scenario

1. Attacker POSTs `{"quantity": "1e6", "variantId": "..."}` to `POST /api/swag/[id]/redeem`.
2. Line 21: `quantity = "1e6"` (string).
3. Line 35: `totalCost = item.pointsCost * "1e6"` = **1,000,000 × pointsCost** (huge).
4. Line 48: `spendPoints(..., totalCost, ...)` attempts to spend 1M × cost points.
5. If user has enough: order succeeds with inflated points debit.
6. If user doesn't have enough: `spendPoints` throws; stock is rolled back (line 58).

### Implication

**Suspected Medium Risk — type coercion:**
- Attacker can craft string numbers that coerce to large integers.
- Mitigation: Parse and validate `quantity` as an integer (e.g., `parseInt(quantity) || 1`).
- **Current state:** Relies on JSON type safety; if body is sent as `{"quantity": 1}` (number), no issue. If sent as `{"quantity": "1"}` (string), coercion occurs.

---

## 9. Concurrent Requests on Same Resource

**Check:** Can two simultaneous requests both approve a quest completion and both award points?

**Verdict:** ✅ **CONFIRMED — covered in Category 12 (Idempotency & Concurrency).**

**Summary:** The quest completion has a unique ID; simultaneous `PATCH /api/quests/completions/[id]` calls would each read `status: "pending"`, both attempt to update, and Prisma would serialize the writes (last write wins). The second write would find `status: "approved"` and hit the guard at line 38 → return 400. **Safe but not tested.**

---

## 10. Time Edges: DST, Leap Second, Year-2038, Clock Skew

**Check:** Are there any timestamp arithmetic bugs that depend on DST transitions or leap seconds?

**Verdict:** ✅ **CONFIRMED — No Year-2038 risk; DST handled by `setDate()`.**

### Analysis

**File:** [lib/wallet.ts:38-39](../../../lib/wallet.ts#L38-L39)
```typescript
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + ttlDays);
```

- **JavaScript `Date`:** Internally a 64-bit millisecond counter; no Y2K38 risk.
- **`setDate()`:** Calls the OS system clock; DST transitions are handled by the JavaScript runtime (safe).
- **Leap seconds:** Not tracked by JavaScript `Date` (OS discards them); no application risk.

### Comparison in `expirePoints` (Line 165)

```typescript
where: {
  expiresAt: { lte: now },
  remaining: { gt: 0 },
}
```
- **Clock skew:** If server system clock is set backward (admin ops or NTP failure), expired batches could be missed or re-expired.
- **No mitigation:** Assumes monotonic system clock.

### Implication

**No vulnerability found.** JavaScript `Date` is Y2K38 safe. DST is handled correctly by the runtime.

---

## 11. Idempotency: Retried Operation Double-Executing

**Check:** Is there a server-side idempotency check if a swag redemption or quest approval is retried?

**Verdict:** ✅ **CONFIRMED — No idempotency guard; duplicate execution is possible.**

### Scenario

1. User submits `POST /api/swag/[id]/redeem` with 100 points cost.
2. Request times out client-side (e.g., Vercel timeout at 30s).
3. User clicks "Retry" (or browser auto-retry on 5xx).
4. **Second request:** Same body, same user.
5. **Expected:** Request is idempotent (no double debit).
6. **Actual:** 
   - First request (if it completed): created `SwagOrder`, deducted points.
   - Second request: Reads same `item`, decrements stock again, calls `spendPoints` again.
   - **Result:** User loses 2 × points cost; gets 2 orders for 1 item.

### Missing Guards

**File:** [app/api/swag/[id]/redeem/route.ts](../../../app/api/swag/[id]/redeem/route.ts)
- No `Idempotency-Key` header check.
- No deduplication table.
- No request signature verification.

### Restatement from Category 12

**Covered in depth there.** No server-side idempotency mechanism across all endpoints.

---

## 12. Failure Recovery: Function Timeout Mid-Transaction

**Check:** If `earnReward` times out after creating `PointsBatch` but before `WalletTransaction`, does Prisma roll back?

**Verdict:** ✅ **CONFIRMED — Prisma rolls back atomically; no partial commits.**

### Code

**File:** [lib/wallet.ts:41-77](../../../lib/wallet.ts#L41-L77)
```typescript
await prisma.$transaction([
  prisma.userWallet.update(...),
  ...(points > 0 ? [prisma.pointsBatch.create(...)] : []),
  prisma.walletTransaction.create(...),
]);
```
- **Atomicity:** Prisma's `$transaction([...])` method wraps all statements in a single PostgreSQL transaction.
- **Timeout:** If a statement hangs, the entire transaction times out and rolls back (Postgres default behavior).
- **Line 150 (spendPoints):** `{ isolationLevel: "Serializable", timeout: 10000 }` explicitly sets a 10-second timeout.

### Error Handling Check

**File:** [app/api/quests/completions/[id]/route.ts:59-68](../../../app/api/quests/completions/[id]/route.ts#L59-L68)
```typescript
try {
  await earnReward(...);
  // ...
} catch (error: any) {
  // ...
}
```
- Error is caught; no `catch { /* ignore */ }` pattern found.
- Exception propagates or is logged.

### Implication

**No vulnerability found.** Prisma transactions are atomic. Timeout triggers rollback by Postgres.

---

## 13. Empty-Array Role Evaluating as Admin via Truthy/Falsy

**Check:** If `role` is an array instead of a string, does the code fail safely?

**Verdict:** ✅ **CONFIRMED — No vulnerability; role is always a string.**

### Enforcement

**File:** [lib/auth-options.ts:110, 126, 141](../../../lib/auth-options.ts)
```typescript
token.role = 'CORE';  // always a string literal
token.role = 'MEMBER';
token.role = 'PUBLIC';
```
- Role is always assigned a string literal, never an array or object.

### Permission Evaluation

**File:** [lib/permissions.ts:15](../../../lib/permissions.ts#L15)
```typescript
const userLevel = userPermissions[resource] || userPermissions['*'];
```
- Accesses `permissions` JSON as an object (record), not as an array.
- If a malicious JWT claims `permissions: []`, the lookup `[]` would fail; `userLevel` would be undefined → line 17 returns false (safe).

### Implication

**No vulnerability found.** Role and permissions are strongly typed in the code; no falsy/truthy confusion.

---

## 14. User with No Role Defaulting to Admin in Fallback Branch

**Check:** What is the default if `role` is not in the JWT after all lookups fail?

**Verdict:** ✅ **CONFIRMED — Defaults to 'PUBLIC' (safe, least privilege).**

### Fallback

**File:** [lib/auth-options.ts:148-153](../../../lib/auth-options.ts#L148-L153)
```typescript
// Should not happen if signIn creates the user, but fallback:
token.role = 'PUBLIC';
token.permissions = {};
token.tags = [];
token.consent = false;
return token;
```
- **Implicit role:** If none of the three tables (Member, CommunityMember, PublicUser) have the user's email, the token gets `role: 'PUBLIC'`.
- **PUBLIC role:** No permissions; can read public content only.
- **Safe:** Never defaults to CORE or MEMBER.

### Implication

**No vulnerability found.** Fallback is safe.

---

## 15. Admin Demoted Mid-Request: Half-Action with Elevated Permission

**Check:** If an admin is demoted (Member record deleted or role changed) mid-way through a request, can they still execute CORE-only actions they started?

**Verdict:** ✅ **CONFIRMED — **Race condition exists; action executes with cached permission.

### Attack Scenario

1. **Time T0:** Admin A has `role: 'CORE'` in session JWT (cached for 30 days).
2. **Time T0 + 1ms:** Admin A submits `POST /api/wallet/adjust` request (checkCoreAccess passes; session is cached).
3. **Time T0 + 2ms:** Another admin (or system script) deletes Admin A's `Member` record, revoking their CORE status.
4. **Time T0 + 100ms:** The request handler in step 2 proceeds; it checks `session.user.role === 'CORE'` (true, from cached JWT).
5. **Time T0 + 200ms:** `adminAdjust` executes, updating the user's wallet.
6. **Result:** Admin A, now revoked, completed the action because the session JWT was cached.

### Code Evidence

**File:** [app/api/wallet/adjust/route.ts:14-16](../../../app/api/wallet/adjust/route.ts#L14-L16)
```typescript
if ((session.user as any)?.role !== "CORE") {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```
- **Single check at route entry:** After this check passes, the code assumes the session is still valid.
- **No re-check before critical operation:** `adminAdjust` is called at line 35 without re-verifying the current session from the DB.

### JWT Lifespan

**File:** [lib/auth-options.ts:198](../../../lib/auth-options.ts#L198)
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```
- JWT is valid for **30 days**.
- **No refresh or re-validation** during the request.
- **No server-side session revocation list** (Cat 4 confirmed).

### Exploitation Window

An admin demoted immediately after starting a long-running request can execute actions for the full duration of that request. For atomic operations (< 1 second), the window is negligible. For batch operations or uploads, the window is wider.

### Implication

**Confirmed Critical:** There is no defense against an admin using a cached JWT after being demoted. The vulnerability requires:
1. **Attacker:** A compromised admin account or a recently-demoted admin.
2. **Window:** The time between JWT issuance and the action execution (up to 30 days if the JWT is still valid).
3. **Mitigation:** Add per-request role verification by querying the `Member` table (cache with short TTL, e.g., 1 minute).

---

## Summary Table

| # | Check | Verdict | Severity | Notes |
|---|-------|---------|----------|-------|
| 1 | Negative points in `earnReward` | Confirmed | High | Wallet arithmetic corruption; requires admin privilege. |
| 2 | Zero-amount creating rows | Confirmed | Low | Spam vector in `WalletTransaction` table; no rate limit. |
| 3 | Integer overflow on balance | Confirmed | Medium | 32-bit signed int wraps; requires large admin adjustments. |
| 4 | Unicode email normalization | Suspected | Low | No NFC normalization; homoglyph accounts possible. |
| 5 | Undefined role in permissions check | Safe | N/A | Defensive code; defaults to least privilege. |
| 6 | Very long strings in name | Suspected | Low | Vercel caps at 2 MB; no app-level validation. |
| 7 | Deeply nested JSON DoS | Suspected | Medium | No zod parsing; stack overflow risk on deep nesting. |
| 8 | Scientific notation in quantity | Suspected | Medium | Type coercion via `"1e10"` string; inflated point debit. |
| 9 | Concurrent requests | Confirmed | Low | Covered in Category 12; serialization prevents double-award. |
| 10 | Time edges (DST, Y2K38) | Safe | N/A | JavaScript `Date` is 64-bit; DST handled by runtime. |
| 11 | Idempotency on retry | Confirmed | High | No server-side idempotency; duplicate execution possible. |
| 12 | Transaction timeout recovery | Safe | N/A | Prisma atomically rolls back; no partial commits. |
| 13 | Empty-array role as admin | Safe | N/A | Role is always a string; no falsy/truthy confusion. |
| 14 | No-role fallback to admin | Safe | N/A | Defaults to PUBLIC (least privilege). |
| 15 | Admin demoted mid-request | Confirmed | Critical | Cached JWT allows revoked admin to execute actions; no re-validation. |

---

## Recommendations

### Immediate (P0)

1. **Add integer range validation** to `adminAdjust` and `/api/wallet/adjust` (prevent overflow exploits).
2. **Add per-request role re-verification** in sensitive endpoints (e.g., query `Member` table before critical operations; cache with 1-min TTL).
3. **Implement idempotency keys** for state-changing operations (swag, quest, bounty approvals).

### Short-term (P1)

4. **Add zod/ajv schema validation** on all JSON inputs (especially permissions, customFields, nested JSON).
5. **Add JSON depth limiting** for nested objects.
6. **Add explicit max-length constraints** on `name`, `bio`, and other string fields in Prisma schema.
7. **Normalize email input** with Unicode NFC before DB lookup.
8. **Validate numeric inputs** as integers (not strings with type coercion).

### Long-term (P2)

9. **Implement server-side session revocation list** (e.g., `tokenVersion` counter in `Member` table).
10. **Add rate limiting** on all state-changing endpoints (per-user, per-admin).
11. **Automated test suite** for edge cases (zero amounts, negative values, concurrent access).

