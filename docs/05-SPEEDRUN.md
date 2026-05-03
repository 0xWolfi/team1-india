# Speedrun — Routes, APIs, and Flows

> Monthly themed build sprint. Each calendar month is a new run; users register
> per run, build solo or in a duo, then submit a project that's mapped back to
> the run.

---

## 1. Concepts

| Term | Meaning |
|---|---|
| **Run** | One month's Speedrun. Identified by a slug like `may-26`. Has its own theme, dates, sponsors, prizes, tracks, and FAQ. |
| **Current run** | The single run flagged `isCurrent = true`. Featured on the `/speedrun` landing hero. |
| **Track** | A focused lane within a run (e.g. DeFi, AI / Agents, Consumer). Built per-run so themes can vary monthly. |
| **Team1 ID** | System-generated team identifier (`T1-XXXXXX`). Doubles as both display label and invite code. We do **not** collect user-supplied team names. |
| **Registration** | One row per user per run (`SpeedrunRegistration`, unique on `runId + userEmail`). |
| **Submission** | A `UserProject` row that links back to the run via `speedrunRunId` (and optionally `speedrunTeamId` / `speedrunTrackId`). |

### Status state machine

```
upcoming
  → registration_open
  → submissions_open
  → submissions_closed
  → irl_event
  → judging
  → completed
(cancelled is terminal from any state)
```

Product rule: **registration and submissions close together** at the same `registrationDeadline`. After that, team changes are locked.

### Privacy rules

| Field | Where shown |
|---|---|
| Email | **Never** publicly. Only on the registrant's own status page (themselves) and admin-only API. |
| Full name | Admin-only. Public team page shows **first name only** (split on first whitespace). |
| Team1 ID, city, primary role | Public on team and run pages. |
| X / GitHub handles | Public **only if** registrant set `showSocials: true` (default true; opt-out toggle on the registration form). |

---

## 2. URL structure

### Public

| Route | Component | Purpose |
|---|---|---|
| `/speedrun` | `app/speedrun/SpeedrunClient.tsx` | Landing page with **Live / Past** toggle, FAQ, who-should-apply, referral block. |
| `/speedrun/[month]` | `app/speedrun/[month]/RunDetailsClient.tsx` | Per-run details: hero + tabs (Overview, Timeline, Tracks, Projects, Teams, FAQ). |
| `/speedrun/[month]/register` | `app/speedrun/[month]/register/RegisterClient.tsx` | Signed-in registration form. Status-gated on `registration_open`. |
| `/speedrun/[month]/registration` | `app/speedrun/[month]/registration/RegistrationStatusClient.tsx` | "Your registration" page — view team, leave/swap/create team, see your details. |
| `/speedrun/[month]/team/[team1id]` | `app/speedrun/[month]/team/[team1id]/TeamPageClient.tsx` | Public team profile — Team1 ID, first names, opt-in socials, that team's submitted projects. |
| `/speedrun/[month]/submit` | `app/speedrun/[month]/submit/SubmitProjectClient.tsx` | Project submission form. Requires registration; status-gated on `submissions_open`. |
| `/r/[code]` | `app/r/[code]/page.tsx` | Referral redirector — increments click counter and forwards to `/speedrun?ref=...`. |

### Admin (CORE)

| Route | Component | Purpose |
|---|---|---|
| `/core/speedrun` | `app/core/speedrun/page.tsx` | Tabbed dashboard: **Registrations**, **Runs**, **Referrals**. |
| `/core/speedrun/[id]` | `app/core/speedrun/[id]/page.tsx` | View / edit a single registration (admin notes, status). |
| `/core/speedrun/runs/new` | `app/core/speedrun/runs/new/page.tsx` | Create a new run (markdown editor for theme, sponsors, FAQ; inline track editor). |
| `/core/speedrun/runs/[slug]` | `app/core/speedrun/runs/[slug]/page.tsx` | Edit existing run + tracks. "Set as current" action. |

---

## 3. APIs

All endpoints live under `app/api/speedrun/`. Auth conventions:

| Symbol | Meaning |
|---|---|
| 🔓 | Public (no auth) |
| 🔒 | Logged-in (any role) |
| 🛡️ | CORE-only |
| 🛡️* | CORE + `speedrun:READ`/`WRITE` permission key (CORE-default-allow; SuperAdmin can `DENY` a specific user) |

### Run management

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/speedrun/runs` | 🛡️* (READ) | All runs (admin) — includes counts and tracks |
| `POST` | `/api/speedrun/runs` | 🛡️* (WRITE) | Create a run (with optional inline tracks). Atomically clears other runs' `isCurrent` if created as current. **Audit-logged.** |
| `GET` | `/api/speedrun/runs/[slug]` | 🛡️* (READ) | Single run (admin) — full record + tracks + counts |
| `PATCH` | `/api/speedrun/runs/[slug]` | 🛡️* (WRITE) | Update run fields (whitelist-validated; status enum-validated; slug rename collision-checked). **Audit-logged.** |
| `DELETE` | `/api/speedrun/runs/[slug]` | 🛡️* (WRITE) | Soft-delete (refuses if `isCurrent`). **Audit-logged.** |
| `POST` | `/api/speedrun/runs/[slug]/set-current` | 🛡️* (WRITE) | Atomically promote a run as current; clears the flag elsewhere in one transaction. **Audit-logged.** |

### Tracks

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/speedrun/runs/[slug]/tracks` | 🛡️* (WRITE) | Add a track to a run (unique on `runId + name`) |
| `PATCH` | `/api/speedrun/tracks/[id]` | 🛡️* (WRITE) | Edit a track |
| `DELETE` | `/api/speedrun/tracks/[id]` | 🛡️* (WRITE) | Remove a track |

### Public reads

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/speedrun/runs/public` | 🔓 | List runs. `?scope=live` (current only) or `?scope=past` (completed) or default (both). No PII. Hides `upcoming`. |
| `GET` | `/api/speedrun/runs/[slug]/public` | 🔓 | Full run details + tracks + privacy-filtered projects + privacy-filtered teams. Hides `upcoming` runs. |

The team list returned here is privacy-filtered server-side: emails dropped, `firstName` derived, socials only if `showSocials`. Projects also lose `teamEmails` before being sent — only `memberCount` survives. Each project carries `team: { id, team1Id }` so the UI can render Team1 ID badges and the team page can filter to its own projects.

### Per-user actions

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/speedrun/runs/[slug]/my-registration` | 🔒 | Caller's registration for this run, including team + members. Returns `{ registered: false, run: {...} }` if not registered. |
| `POST` | `/api/speedrun/runs/[slug]/register` | 🔒 | Register. Validates `run.status === 'registration_open'` and that `registrationDeadline` hasn't passed. One-per-user enforced via DB unique. Sends a registration confirmation email + (on team join) a captain notification email. |
| `GET` | `/api/speedrun/runs/[slug]/teams/lookup?code=` | 🔒 | Verify a Team1 ID exists for this run (used by the registration form to preview before joining). |
| `POST` | `/api/speedrun/runs/[slug]/teams/leave` | 🔒 | Leave current team for this run. Promotes next-joined member to captain; deletes empty teams. Locked once `submissions_closed`. |
| `POST` | `/api/speedrun/runs/[slug]/teams/create` | 🔒 | Solo registrant creates a team and becomes captain (assigns a fresh Team1 ID). Locked once `submissions_closed`. |
| `POST` | `/api/speedrun/runs/[slug]/teams/join` | 🔒 | Solo registrant joins an existing team by Team1 ID. Notifies captain. Locked once `submissions_closed`. |

### Admin: registrations

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/speedrun/registrations` | 🛡️ | List/filter all registrations (`runId`, `status`, `q` search). Returns runs sidebar for filter dropdown. |
| `GET` | `/api/speedrun/registrations/[id]` | 🛡️ | Single registration + teammates |
| `PATCH` | `/api/speedrun/registrations/[id]` | 🛡️ | Update `status` (registered/confirmed/withdrawn/rejected) and `adminNotes`. |

### Referrals (cross-run, per user)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/speedrun/referrals/me` | 🔒 | Get-or-create the caller's referral code + click/conversion stats. |
| `GET` | `/api/speedrun/referrals/all` | 🛡️ | Admin overview — all codes with stats and referred registrants. |

### Project submission (lives on the existing project API)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/projects` | 🔒 | Standard project creation. Accepts optional `speedrunRunId` and `speedrunTrackId`; if set, the server validates the caller is registered for that run and that the track belongs to it, then auto-populates `speedrunTeamId` from the caller's registration and adds a `speedrun` tag. |

---

## 4. Flows

### Registering for a run (anon → registered)

```
1. User lands on /speedrun
2. Hero CTA "Join the Run" — login modal (Google OAuth)
3. After sign-in → /speedrun/[currentSlug]/register
4. Form: profile + team mode (solo / create team / join with Team1 ID)
   - On submit: POST /api/speedrun/runs/[slug]/register
   - On "create": server generates a fresh T1-XXXXXX
   - On "join":   server validates the code belongs to this run + has space
5. Server emails the registrant; on join, server emails the captain.
6. Redirect → success screen → /speedrun/[slug]/registration
```

### Switching team after registration (until submissions close)

```
solo → create:  POST /api/speedrun/runs/[slug]/teams/create
solo → join:    POST /api/speedrun/runs/[slug]/teams/join
team → solo:    POST /api/speedrun/runs/[slug]/teams/leave
team → other:   leave + join (sequence)
```

All gated on `run.status ∈ {registration_open, submissions_open}`.

### Submitting a project

```
1. User on /speedrun/[slug]/submit (must be registered, status=submissions_open)
2. Form fills: title, description, links (demo/repo/video/X), track
3. POST /api/projects with speedrunRunId set
4. Server validates registration + track, links speedrunTeamId from reg, adds tag "speedrun"
5. Project lives at /public/projects/[slug] (canonical home — same as any other project)
6. Run page surfaces the project under its Projects tab + the team's page filters to it.
7. Edits remain allowed after close — every save creates a ProjectVersion.
```

### Authoring a new run (admin)

```
1. /core/speedrun → Runs tab → New Run
2. Fill identity (slug, monthLabel, theme), dates (the close-date sets BOTH
   registrationDeadline and endDate by default), markdown (theme description,
   sponsors, FAQ), tracks inline.
3. POST /api/speedrun/runs (audit-logged)
4. Optionally toggle "Set as current" on save, or use the "Set Current" button later.
5. Status transitions: upcoming → registration_open (manual flip to start the month).
```

---

## 5. Data model summary

```
SpeedrunRun (one per month)
├── tracks                SpeedrunTrack[]
├── teams                 SpeedrunTeam[]
│   ├── members           SpeedrunTeamMember[]
│   ├── registrations     SpeedrunRegistration[]
│   └── projects          UserProject[] (via speedrunTeamId)
├── registrations         SpeedrunRegistration[] (unique on runId+userEmail)
└── projects              UserProject[] (via speedrunRunId)

SpeedrunReferralCode (one per user — global, not per-run)
└── registrations         SpeedrunRegistration[] (denormalized referralCode)
```

Key invariants enforced in the database:

- `SpeedrunRun.slug` unique
- `SpeedrunRegistration` unique on `(runId, userEmail)` — one registration per user per run
- `SpeedrunTeam.code` unique globally — invite codes never collide
- `SpeedrunTeamMember` unique on `(teamId, email)` — idempotent joins
- `SpeedrunTrack` unique on `(runId, name)` — no duplicate track names within a run
- `SpeedrunReferralCode.userEmail` unique — one referral code per user

---

## 6. Email templates

All in [`lib/email.ts`](../lib/email.ts), all link to `/speedrun/[runSlug]/registration`.

| Template | Trigger | Recipient |
|---|---|---|
| `getSpeedrunRegistrationEmail` | POST `/api/speedrun/runs/[slug]/register` | The registrant |
| `getSpeedrunTeammateJoinedEmail` | When someone joins a team via code (registration time or post-reg `/teams/join`) | The team captain |
| `getSpeedrunLeaveTeamEmail` | POST `/api/speedrun/runs/[slug]/teams/leave` | The user who left |

---

## 7. Permissions

The new `speedrun` permission key:

```jsonc
{
  "speedrun": "WRITE"      // grants run/track management
  "speedrun": "READ"       // can list/view runs in admin but not edit
  "speedrun": "DENY"       // explicit denial overrides CORE default
}
```

**Default behavior:** any CORE user has WRITE. SuperAdmin (`*: FULL_ACCESS`) always has WRITE. Set an explicit `speedrun: DENY` on a specific Member to revoke admin access for that user only.

Implemented in `lib/permissions.ts` → `checkSpeedrunAccess(session, requiredLevel)`.

---

## 8. Audit logging

All run lifecycle mutations write an `AuditLog` row via `lib/audit.ts`:

| Action | Resource | When |
|---|---|---|
| `CREATE` | `SPEEDRUN_RUN` | Run created |
| `UPDATE` | `SPEEDRUN_RUN` | Run patched (changedKeys in metadata) |
| `UPDATE` | `SPEEDRUN_RUN` | Run promoted to current (`change: "set_as_current"` in metadata) |
| `DELETE` | `SPEEDRUN_RUN` | Run soft-deleted |

Track mutations are not audit-logged today — see launch checklist.

---

## 9. Runtime config

| Constant | Where | Value |
|---|---|---|
| `MAX_TEAM_SIZE` | `lib/speedrun.ts` | `2` (solo or duo) |
| Team1 ID prefix | `lib/speedrun.ts` `generateUniqueTeamCode` | `T1-` (legacy `TM-` still recognized) |
| Referral code prefix | `lib/speedrun.ts` `generateUniqueReferralCode` | `RF-` |

---

## 10. Code map

```
prisma/schema.prisma                # SpeedrunRun, SpeedrunTrack, SpeedrunTeam,
                                    # SpeedrunTeamMember, SpeedrunRegistration,
                                    # SpeedrunReferralCode + UserProject FKs
prisma/migrations/20260503_speedrun_per_month/migration.sql

lib/speedrun.ts                     # getRunBySlug, setCurrentRun, status
                                    # gates, code generators, firstNameFrom
lib/permissions.ts                  # checkSpeedrunAccess
lib/email.ts                        # 3 speedrun email templates
lib/audit.ts                        # logAudit (existing)

app/speedrun/                       # public pages
  page.tsx                          # /speedrun (landing)
  SpeedrunClient.tsx
  [month]/
    page.tsx                        # /speedrun/[month] (details)
    RunDetailsClient.tsx
    register/                       # /speedrun/[month]/register
    registration/                   # /speedrun/[month]/registration
    submit/                         # /speedrun/[month]/submit
    team/[team1id]/                 # /speedrun/[month]/team/[team1id]

app/api/speedrun/                   # APIs
  runs/route.ts                     # GET list / POST create
  runs/[slug]/route.ts              # GET / PATCH / DELETE
  runs/[slug]/set-current/
  runs/[slug]/tracks/               # POST add track
  runs/[slug]/public/               # public read
  runs/[slug]/my-registration/
  runs/[slug]/register/
  runs/[slug]/teams/lookup/
  runs/[slug]/teams/create/
  runs/[slug]/teams/join/
  runs/[slug]/teams/leave/
  runs/public/                      # list runs publicly
  tracks/[id]/                      # PATCH / DELETE
  registrations/                    # admin list
  registrations/[id]/               # admin view/edit
  referrals/me/                     # user's code
  referrals/all/                    # admin overview

app/core/speedrun/                  # admin pages
  page.tsx                          # /core/speedrun (tabs)
  [id]/page.tsx                     # registration detail
  runs/RunEditor.tsx                # shared form
  runs/new/                         # create
  runs/[slug]/                      # edit

components/core/MarkdownEditor.tsx  # split-view markdown editor (used by RunEditor)
```
