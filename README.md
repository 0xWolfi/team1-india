# Team1India Platform

Member portal, admin dashboard, and public site for [india.team1.network](https://india.team1.network).

The app combines a public marketing surface (`/public`, `/speedrun`), a gated member portal (`/member`), and a CORE admin dashboard (`/core`) in a single Next.js codebase.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Webpack build)
- **Language:** TypeScript 5
- **UI:** React 19, Tailwind CSS 4, lucide-react icons
- **Database:** PostgreSQL via Prisma 5 (Neon for production)
- **Auth:** NextAuth.js 4 (Google OAuth + JWT sessions)
- **Storage:** Vercel Blob (uploads, hero video)
- **Email:** SMTP (configurable; Resend/Mailgun/Postmark all compatible)
- **PWA:** `@ducanh2912/next-pwa` with web-push notifications
- **Hosting:** Vercel (cron jobs configured in `vercel.json`)
- **Package manager:** npm (`package-lock.json` is the source of truth)

---

## Prerequisites

- **Node.js** 20 or newer
- **npm** 10 or newer (or use [Bun](https://bun.sh) — `bun install` works against `package-lock.json` too)
- **PostgreSQL** database. Free options:
  - [Neon](https://neon.tech) (recommended — matches production)
  - Local Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=dev postgres:16`
- A **Google Cloud OAuth client** for sign-in. Create one at [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID → Web application. Add `http://localhost:3000/api/auth/callback/google` (and your production callback) as authorized redirect URIs.

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/avalancheteam1/india.team1.network.git
cd india.team1.network

# 2. Install dependencies
npm install

# 3. Copy the env template and fill in values (see "Environment Variables" below)
cp .env.example .env

# 4. Push the Prisma schema to your DB
npx prisma migrate deploy
# or for first-time local setup: npx prisma db push

# 5. Generate Prisma client
npx prisma generate

# 6. Start the dev server
npm run dev
```

Visit `http://localhost:3000`. Sign in with Google to provision a user, then grant yourself CORE role by editing the `Member` table in your DB (or via your CORE-seed script).

---

## Environment Variables

Every key in `.env.example` is required for full functionality. Optional keys are marked.

### Database

| Key | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. For Neon, use the pooled URL. |

### Authentication

| Key | Description |
|---|---|
| `NEXTAUTH_URL` | Full base URL of the deployment (`http://localhost:3000` in dev, `https://india.team1.network` in prod). |
| `NEXTAUTH_SECRET` | Random 32+ byte secret. Generate with `openssl rand -base64 32`. |
| `GOOGLE_CLIENT_ID` | From your Google Cloud OAuth client. |
| `GOOGLE_CLIENT_SECRET` | From your Google Cloud OAuth client. |

### 2FA (optional — disabled by default)

| Key | Description |
|---|---|
| `ENABLE_2FA` | Set to `true` to enforce TOTP/passkey 2FA for CORE users. |
| `WEBAUTHN_RP_ID` | Hostname only (no protocol). `localhost` in dev, `india.team1.network` in prod. |
| `WEBAUTHN_ORIGIN` | Full origin with protocol. `http://localhost:3000` in dev, `https://india.team1.network` in prod. |

### PII vault (required for production)

The platform encrypts user PII (emails, names) in a separate vault table. Generate both keys with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

| Key | Description |
|---|---|
| `PII_ENCRYPTION_KEY` | Symmetric encryption key for PII fields. |
| `PII_HMAC_KEY` | HMAC key for the searchable index on encrypted PII. |

### Cron + scheduled jobs

| Key | Description |
|---|---|
| `CRON_SECRET` | Required by every `/api/cron/*` route. Vercel Cron passes it as `Authorization: Bearer <secret>`. Generate with `openssl rand -base64 32`. |

### Storage (Vercel Blob)

| Key | Description |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Generate in Vercel dashboard → Storage → Blob → Create token. Required for uploads (profile photos, cover images, hero video). |

### Image uploads via Cloudinary (optional)

If you'd rather use Cloudinary than Vercel Blob, set these and update the upload routes accordingly.

| Key | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret. |

### Email (SMTP)

Used for transactional email (registration confirmations, partner reviews, scheduled broadcasts).

| Key | Description |
|---|---|
| `SMTP_HOST` | SMTP host (e.g. `smtp.resend.com`). |
| `SMTP_PORT` | Usually `465` (SSL) or `587` (TLS). |
| `SMTP_USER` | SMTP username. |
| `SMTP_PASSWORD` | SMTP password / API key. |
| `SMTP_FROM_NAME` | Display name for outgoing email (e.g. `Team1 India`). |
| `CONTACT_EMAIL` | Inbox that receives contact-form submissions. |

### Google Calendar integration (optional)

For syncing event RSVPs to a Google Calendar.

| Key | Description |
|---|---|
| `GOOGLE_HOST_EMAIL` | Calendar owner email. |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token with calendar scope. |
| `GOOGLE_REDIRECT_URI` | Used during the initial refresh-token mint. |

### Luma (event sync)

| Key | Description |
|---|---|
| `LUMA_API` | Luma API key for syncing public events into the DB. |

### Web Push notifications

Required for the PWA "subscribe to notifications" flow. Generate a VAPID key pair with `npx web-push generate-vapid-keys`.

| Key | Description |
|---|---|
| `VAPID_PUBLIC_KEY` | Public VAPID key (also exposed to the client). |
| `VAPID_PRIVATE_KEY` | Private VAPID key. |
| `VAPID_SUBJECT` | `mailto:` URI or HTTPS URL identifying the sender. |

### Admin tooling (optional)

| Key | Description |
|---|---|
| `NEXT_PUBLIC_ADMIN_EMAIL` | Default admin contact shown in the UI. |
| `NEXT_PUBLIC_ADMIN_EMAIL_ENDPOINT` | Optional override for the admin-mail target endpoint. |
| `NEXT_PUBLIC_ALERT_WEBHOOK_URL` | Webhook for runtime alerts. |
| `NEXT_PUBLIC_SLACK_WEBHOOK_URL` | Slack webhook for ops notifications. |
| `NEXT_PUBLIC_ANALYTICS_ENDPOINT` | Internal analytics collector endpoint. |
| `NEXT_PUBLIC_PWA_MONITORING_ENDPOINT` | PWA monitoring beacon endpoint. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional Sentry DSN for error tracking. |

### Public site assets

| Key | Description |
|---|---|
| `NEXT_PUBLIC_HERO_VIDEO_URL` | Blob URL of the hero video on the homepage. Populated by `scripts/upload-hero-video.ts`. |
| `NEXT_PUBLIC_HERO_VIDEO_URL_MP` | Alternative hero video URL for mobile/poster. |

---

## Folder Structure

```
app/
  public/           Public marketing pages (homepage, projects, leaderboard, bounty)
  speedrun/         Public Speedrun campaign landing + month pages
  member/           Authenticated member portal (gated by MEMBER or CORE role)
  core/             Admin dashboard (gated by CORE role)
  api/              Backend routes (Server Functions style)
components/         Shared React components (UI primitives, navigation, modals)
lib/                Server-side utilities (Prisma, auth, wallet, email, etc.)
prisma/             Schema + migrations
public/             Static assets (logos, favicons, hero images, manifest)
scripts/            One-off operational scripts (DB resets, asset uploads, migrations)
```

---

## Common Tasks

### Database changes

```bash
# Edit prisma/schema.prisma, then either:
npx prisma migrate dev --name <change-description>  # local dev (creates migration file)
npx prisma db push                                   # local prototyping (no migration history)
npx prisma migrate deploy                            # production (applies pending migrations only)
```

Always commit the generated migration files in `prisma/migrations/`.

### Generating Prisma client

```bash
npx prisma generate
```

Run after every schema change or after pulling a branch that modified the schema. Stale clients cause `Unknown argument` errors at runtime.

### Inspecting the DB

```bash
npx prisma studio
```

### Running the security checks

```bash
npm run security-check   # eslint + tsc --noEmit
```

### Cron jobs

Cron schedules are declared in `vercel.json`. Each `/api/cron/*` route requires the `Authorization: Bearer $CRON_SECRET` header — verified server-side via `lib/cronAuth.ts`. Locally you can invoke them with:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/<job-name>
```

---

## Roles & Access Control

The platform recognises three roles via `session.user.role`:

| Role | Source table | Access |
|---|---|---|
| `CORE` | `Member` | Full admin (`/core`, all mutations) |
| `MEMBER` | `CommunityMember` | Member portal (`/member`), public surfaces |
| `PUBLIC` | `PublicUser` | Public surfaces (`/public`, `/speedrun`), Bounty submissions |

Server-side checks happen via `getServerSession(authOptions)` in API routes; client-side gating is via `MemberWrapper` / `CoreWrapper`. Never rely on client-side checks for security.

---

## Deployment

### Target environment

- **Production domain:** `india.team1.network` (proxied through Cloudflare/Vercel)
- **Host:** Vercel (Project: `team1india`)
- **Database:** Neon Postgres
- **Storage:** Vercel Blob
- **DNS:** Managed by the Team1 Tech team

### Pre-deploy checklist

1. Every key in `.env.example` is set in the Vercel project's Environment Variables (Production + Preview as needed).
2. `prisma migrate deploy` has been run against the production database for any pending migrations.
3. `NEXTAUTH_URL`, `WEBAUTHN_ORIGIN`, and `WEBAUTHN_RP_ID` match the production hostname.
4. Google OAuth client has `https://india.team1.network/api/auth/callback/google` listed as an authorized redirect URI.
5. `CRON_SECRET` is set; Vercel Cron entries in `vercel.json` are authoritative.
6. `BLOB_READ_WRITE_TOKEN` belongs to the production Vercel Blob store.

### Deploy

```bash
git push origin main
```

Vercel auto-deploys `main`. For preview/staging, push to any other branch and Vercel will spin up a preview deployment with its own env scope.

### Rollback

`git revert <commit>` and push, or roll back the deployment from the Vercel dashboard.

---

## Source of Truth

- **Production repo:** [`github.com/avalancheteam1/india.team1.network`](https://github.com/avalancheteam1/india.team1.network) — final code lives here.
- **Working fork:** `github.com/0xWolfi/team1-india` — used for testing branches before promotion.

Workflow: branch off `main`, push to the fork for testing, open a PR back into `avalancheteam1` when ready.

---

## Owners

Application Owner and Technical Owner are tracked in the Team1 owners sheet (separate from this repo). New deployments should register their owners there before going live.

---

## Useful References

- Next.js App Router: [nextjs.org/docs/app](https://nextjs.org/docs/app)
- Prisma: [prisma.io/docs](https://www.prisma.io/docs)
- NextAuth.js: [next-auth.js.org](https://next-auth.js.org)
- Vercel Blob: [vercel.com/docs/storage/vercel-blob](https://vercel.com/docs/storage/vercel-blob)
