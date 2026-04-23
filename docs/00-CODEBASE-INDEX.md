# Team1India — Codebase Index

> **Purpose**: Quick-lookup index for AI assistants and developers. Use this file to locate any file, feature, or concept in the codebase instantly.
>
> Auto-generated from codebase analysis (2026-04-22)

---

## Quick Links to Other Docs

| Doc | Path | Content |
|---|---|---|
| API Reference | `docs/01-API-REFERENCE.md` | All 76 API endpoints with methods, access, descriptions |
| RBAC & Access Control | `docs/02-RBAC-ACCESS-CONTROL.md` | Roles, permissions, enforcement patterns, access matrix |
| Routes & Flows | `docs/03-ROUTES-AND-FLOWS.md` | Route tree, user flows, layout hierarchy, diagrams |
| Features | `docs/04-FEATURES.md` | All 22 feature areas, integrations, tech stack |

---

## Project Structure

```
team1-india/
├── app/                      # Next.js App Router pages + API
│   ├── api/                  # All REST API routes (33 groups)
│   ├── core/                 # CORE team dashboard pages
│   ├── member/               # MEMBER community pages
│   ├── public/               # PUBLIC-facing pages
│   ├── auth/                 # Auth pages (signin)
│   ├── campaign/             # Public campaign pages
│   ├── event-feedback/       # Public feedback forms
│   ├── hackathon/            # Public hackathon pages
│   ├── workshop/             # Public workshop pages
│   ├── access-check/         # Debug page
│   ├── offline/              # PWA offline fallback
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Landing homepage
│   ├── globals.css           # Global styles
│   └── providers.tsx         # Client providers
├── components/               # React components (110+ files)
│   ├── auth/                 # Auth components
│   ├── bounty/               # Bounty components
│   ├── calendar/             # Calendar components
│   ├── core/                 # Core dashboard components
│   ├── data-grid/            # Generic data grid
│   ├── form-builder/         # Dynamic form builder
│   ├── guides/               # Guide components
│   ├── media/                # Media pipeline components
│   ├── member/               # Member dashboard components
│   ├── playbooks/            # Playbook editor components
│   ├── public/               # Public page components
│   ├── ui/                   # Shared UI components
│   └── website/              # Marketing website components
├── hooks/                    # Custom React hooks
├── lib/                      # Server utilities & business logic
├── prisma/                   # Database schema & migrations
├── scripts/                  # DB scripts & migrations
├── types/                    # TypeScript type definitions
├── public/                   # Static assets
└── docs/                     # This documentation
```

---

## File Index by Concept

### Authentication & Authorization

| What | File |
|---|---|
| NextAuth config & callbacks | `lib/auth-options.ts` |
| NextAuth route handler | `app/api/auth/[...nextauth]/route.ts` |
| Permission levels & checks | `lib/permissions.ts` |
| Role resolution | `lib/roles.ts` |
| Session type definitions | `types/next-auth.d.ts` |
| usePermission hook | `hooks/usePermission.ts` |
| Core layout guard | `app/core/layout.tsx` |
| Member layout guard | `app/member/layout.tsx` |
| Sign-in page | `app/auth/signin/page.tsx` |
| Access check/debug page | `app/access-check/page.tsx` |
| Access denied handler | `components/auth/AccessDeniedHandler.tsx` |
| Public consent modal | `components/public/auth/PublicConsentModal.tsx` |
| Public login modal | `components/public/auth/PublicLoginModal.tsx` |

### Database

| What | File |
|---|---|
| Prisma schema (all models) | `prisma/schema.prisma` |
| Prisma client singleton | `lib/prisma.ts` |
| Database seed | `prisma/seed.ts` |
| Migrations | `prisma/migrations/` |
| DB reset script | `scripts/reset-db.ts` |
| Legacy data migration | `scripts/migrate-legacy-data.ts` |

### Members

| What | File |
|---|---|
| Members API (list/add/delete) | `app/api/members/route.ts` |
| Member permissions API | `app/api/members/[id]/permissions/route.ts` |
| Member status API | `app/api/members/[id]/status/route.ts` |
| Member tags API | `app/api/members/[id]/tags/route.ts` |
| Email check API | `app/api/members/check-email/route.ts` |
| Community members API | `app/api/community-members/route.ts` |
| Community member detail | `app/api/community-members/[id]/route.ts` |
| Community member activity | `app/api/community-members/[id]/activity/route.ts` |
| Members page (core) | `app/core/members/page.tsx` |
| Member detail page (core) | `app/core/members/[id]/page.tsx` |
| Member directory (member) | `app/member/directory/page.tsx` |
| Member dashboard component | `components/member/MemberDashboard.tsx` |
| Member profile client | `components/member/MemberProfileClient.tsx` |

### Playbooks

| What | File |
|---|---|
| Playbooks API (CRUD) | `app/api/playbooks/route.ts` |
| Playbook detail API | `app/api/playbooks/[id]/route.ts` |
| Lock API | `app/api/playbooks/[id]/lock/route.ts` |
| Unlock API | `app/api/playbooks/[id]/unlock/route.ts` |
| Public playbooks API | `app/api/public/playbooks/route.ts` |
| Public playbook detail | `app/api/public/playbooks/[id]/route.ts` |
| BlockNote editor | `components/playbooks/Editor.tsx` |
| Playbook shell layout | `components/playbooks/PlaybookShell.tsx` |
| Table of contents | `components/playbooks/TableOfContents.tsx` |
| Validation schema | `lib/schemas.ts` → `PlaybookSchema` |

### Media Pipeline

| What | File |
|---|---|
| Media API (list/create) | `app/api/media/route.ts` |
| Media detail API | `app/api/media/[id]/route.ts` |
| Media status API | `app/api/media/[id]/status/route.ts` |
| Comments API | `app/api/comments/route.ts` |
| Media modal | `components/media/MediaModal.tsx` |
| Modal activity tab | `components/media/modal/MediaModalActivity.tsx` |
| Modal details tab | `components/media/modal/MediaModalDetails.tsx` |
| Validation schemas | `lib/schemas.ts` → `MediaItemSchema`, `MediaStatusSchema`, `CommentSchema` |

### Guides (Events/Programs/Workshops)

| What | File |
|---|---|
| Guides API (CRUD) | `app/api/guides/route.ts` |
| Guide detail API | `app/api/guides/[id]/route.ts` |
| Guide applications API | `app/api/guides/[id]/applications/route.ts` |
| Public guide API | `app/api/public/guides/[id]/route.ts` |
| Applications API (submit/review) | `app/api/applications/route.ts` |
| Application detail API | `app/api/applications/[id]/route.ts` |
| Guide builder | `components/guides/GuideBuilder.tsx` |
| Guide detail view | `components/guides/GuideDetail.tsx` |
| Guide list | `components/guides/GuideList.tsx` |
| Form builder | `components/form-builder/FormBuilder.tsx` |
| Application form | `components/public/ApplicationForm.tsx` |
| Application modal | `components/public/ApplicationModal.tsx` |

### Bounty System

| What | File |
|---|---|
| Bounty API | `app/api/bounty/route.ts` |
| Bounty detail API | `app/api/bounty/[id]/route.ts` |
| Bounty reset API | `app/api/bounty/reset/route.ts` |
| Submissions API | `app/api/bounty/submissions/route.ts` |
| Submission review API | `app/api/bounty/submissions/[id]/route.ts` |
| Public bounty API | `app/api/public/bounty/route.ts` |
| Leaderboard API | `app/api/leaderboard/route.ts` |
| Public leaderboard API | `app/api/public/leaderboard/route.ts` |
| Bounty builder | `components/bounty/BountyBuilder.tsx` |
| Bounty board | `components/member/BountyBoard.tsx` |

### Experiments

| What | File |
|---|---|
| Experiments API | `app/api/experiments/route.ts` |
| Experiment detail API | `app/api/experiments/[id]/route.ts` |
| Experiment comments API | `app/api/experiments/[id]/comments/route.ts` |

### Contributions

| What | File |
|---|---|
| Contributions API | `app/api/contributions/route.ts` |
| Contribution review API | `app/api/contributions/[id]/route.ts` |
| Contribution modal | `components/member/ContributionModal.tsx` |
| Submit quest form | `components/member/SubmitQuestForm.tsx` |

### Communication

| What | File |
|---|---|
| Announcements API | `app/api/announcements/route.ts` |
| Polls API | `app/api/polls/route.ts` |
| Notes API | `app/api/notes/route.ts` |
| Action items API | `app/api/action-items/route.ts` |
| Announcement viewer | `components/public/AnnouncementViewer.tsx` |

### Email

| What | File |
|---|---|
| Email transporter + all templates | `lib/email.ts` |
| Admin send email API | `app/api/admin/send-email/route.ts` |
| Event feedback email API | `app/api/event-feedback/send-email/route.ts` |

Templates in `lib/email.ts`:
- `getWelcomeEmailTemplate` — New member welcome
- `getApprovalEmailTemplate` — Application approved
- `getRejectionEmailTemplate` — Application rejected
- `getCustomApprovalEmailTemplate` — Custom approval
- `getCustomRejectionEmailTemplate` — Custom rejection
- `getApplicationSubmittedEmailTemplate` — Application received
- `getDiscussionEmailTemplate` — Proposal under discussion
- `getContributionApprovalEmailTemplate` — Contribution approved
- `getContributionRejectionEmailTemplate` — Contribution rejected
- `getMemberRemovalEmailTemplate` — Member removed
- `getEventApplicationEmailTemplate` — Event application notification

### Data Grid

| What | File |
|---|---|
| Generic table API | `app/api/data-grid/[table]/route.ts` |
| Record detail API | `app/api/data-grid/[table]/[id]/route.ts` |
| Table config API | `app/api/data-grid/[table]/config/route.ts` |
| DataGrid component | `components/data-grid/DataGrid.tsx` |

### Upload & Storage

| What | File |
|---|---|
| Upload token API | `app/api/upload/token/route.ts` |
| Image cropper | `components/ui/ImageCropper.tsx` |
| Crop utility | `lib/cropImage.ts` |

### Push Notifications

| What | File |
|---|---|
| VAPID key API | `app/api/push/vapid-key/route.ts` |
| Subscribe API | `app/api/push/subscribe/route.ts` |
| Unsubscribe API | `app/api/push/subscribe/[userId]/route.ts` |
| Send API | `app/api/push/send/route.ts` |
| Preferences API | `app/api/push/preferences/[userId]/route.ts` |
| Push subscription utility | `lib/pushSubscription.ts` |
| Notification manager | `lib/notificationManager.ts` |
| Notification preferences | `lib/notificationPreferences.ts` |
| Notification prompt | `components/NotificationPermissionPrompt.tsx` |
| Notification preferences UI | `components/NotificationPreferences.tsx` |

### PWA

| What | File |
|---|---|
| PWA config | `next.config.ts` (withPWA) |
| Manifest | `app/manifest.ts` |
| Offline page | `app/offline/page.tsx` |
| Install prompt | `components/PWAInstallPrompt.tsx` |
| Update prompt | `components/PWAUpdatePrompt.tsx` |
| Offline storage | `lib/offlineStorage.ts` |
| Background sync | `lib/backgroundSync.ts` |
| Cross-tab sync | `lib/crossTabSync.ts` |
| Conflict resolution | `lib/conflictResolution.ts` |
| Optimistic UI | `lib/optimisticUI.ts` |
| Network stability | `lib/networkStability.ts` |
| Offline analytics | `lib/offlineAnalytics.ts` |
| PWA analytics | `lib/pwaAnalytics.ts` |
| PWA monitoring | `lib/pwaMonitoring.ts` |
| Cache monitoring hook | `hooks/useCacheMonitoring.ts` |
| Prefetch hook | `hooks/usePredictivePrefetch.ts` |

### Integrations

| What | File |
|---|---|
| Google Calendar | `lib/google-calendar.ts` |
| Luma events | `lib/luma.ts` |
| Luma sync cron | `app/api/cron/sync-events/route.ts` |
| Luma events API | `app/api/luma-events/route.ts` |
| Vercel Analytics | `app/layout.tsx` (`@vercel/analytics`) |

### Logging & Monitoring

| What | File |
|---|---|
| Structured logger | `lib/logger.ts` |
| Audit log utility | `lib/audit.ts` |
| Activity logs API | `app/api/logs/route.ts` |
| Rate limiter | `lib/rate-limit.ts` |
| Health reports | `lib/healthReports.ts` |
| Alert notifications | `lib/alertNotifications.ts` |
| Admin monitoring | `components/AdminMonitoringDashboard.tsx` |
| Analytics dashboard | `components/AnalyticsDashboard.tsx` |
| Cache monitoring | `components/CacheMonitoringPanel.tsx` |

### Website / Marketing

| What | File |
|---|---|
| Homepage | `app/page.tsx` |
| Navbar | `components/website/Navbar.tsx` |
| Home Navbar | `components/website/HomeNavbar.tsx` |
| Hero section | `components/website/HeroScroll.tsx` |
| Events section | `components/website/Events.tsx` |
| Programs section | `components/website/Programs.tsx` |
| Members section | `components/website/Members.tsx` |
| Impact section | `components/website/Impact.tsx` |
| Gallery | `components/website/Gallery.tsx` |
| Footer | `components/website/Footer.tsx` |
| Theme toggle | `components/website/ThemeToggle.tsx` |
| Globe gallery | `components/website/GlobeGallery.tsx` |
| Get involved | `components/website/GetInvolved.tsx` |
| What we do | `components/website/WhatWeDo.tsx` |
| SEO | `app/sitemap.ts`, `app/robots.ts` |

### Configuration

| What | File |
|---|---|
| Next.js config | `next.config.ts` |
| TypeScript config | `tsconfig.json` |
| ESLint config | `eslint.config.mjs` |
| PostCSS config | `postcss.config.mjs` |
| Package manifest | `package.json` |
| Vercel config | `vercel.json` |
| Git ignore | `.gitignore` |
| NPM config | `.npmrc` |

### Validation Schemas (`lib/schemas.ts`)

| Schema | Used For |
|---|---|
| `EventSchema` | Event validation in data-grid |
| `ProgramSchema` | Program validation in data-grid |
| `ContentSchema` | Content resource validation |
| `MediaItemSchema` | Media pipeline items |
| `CommentSchema` | Media comments |
| `PlaybookSchema` | Playbook creation/update |
| `MediaStatusSchema` | Media status transitions |

---

## Database Models (Prisma)

| Model | Purpose | Key Fields |
|---|---|---|
| `Member` | Core team members | email, permissions(JSON), tags[], status |
| `CommunityMember` | Community members | email, tags, totalXp, status |
| `PublicUser` | Public registrants | email, consent*, profile fields |
| `MemberExtraProfile` | Extended profile | skills, roles, social, availability |
| `Playbook` | Playbooks/docs | title, body(JSON), visibility, version |
| `Operation` | Tasks/ops | title, type, status, dueDate, assignee |
| `MediaItem` | Media content | title, platform[], status, links[] |
| `MediaPost` | Published posts | postUrl, postedAt |
| `Comment` | Media comments | content, mediaId, authorId |
| `Guide` | Events/programs/etc | title, type, body(JSON), formSchema(JSON) |
| `Application` | Guide applications | data(JSON), status, applicantEmail |
| `Experiment` | Proposals | title, stage, upvotes |
| `ExperimentComment` | Proposal comments | body, parentId |
| `Bounty` | Bounty definitions | title, type, xpReward, frequency |
| `BountySubmission` | Bounty proof | proofUrl, status, xpAwarded |
| `Contribution` | Member contributions | type, name, email, status |
| `ContentResource` | Content items | title, type, status, content |
| `Project` | Ecosystem projects | name, status, visibility, social links |
| `Partner` | Partners/sponsors | name, type, status, visibility |
| `Announcement` | Announcements | title, link, audience, expiresAt |
| `Poll` | Polls | question, options(JSON), status |
| `MeetingNote` | Meeting notes | content |
| `ActionItem` | Action items | text, isDone |
| `AttendanceRecord` | Attendance | date, presentMemberIds[] |
| `Log` | Activity logs | action, entity, actorId, metadata |
| `AuditLog` | Audit trail | action, resource, metadata |
| `TableConfig` | Data grid config | tableName, columns(JSON) |
| `SystemSettings` | Key-value settings | key, value |
| `RateLimit` | Rate limiting | key, count, resetAt |
| `PushSubscription` | Push subs | userId, endpoint, keys(JSON) |
| `LumaEvent` | Synced events | apiId, name, startAt, coverUrl |

---

## Environment Variables

Required (from `.env.example` and codebase analysis):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_URL` | App base URL |
| `NEXTAUTH_SECRET` | NextAuth JWT secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Google Calendar refresh token |
| `GOOGLE_HOST_EMAIL` | Calendar event organizer email |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI |
| `SMTP_HOST` | Email server host |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email username |
| `SMTP_PASSWORD` | Email password |
| `SMTP_FROM_NAME` | Email sender name |
| `LUMA_API` | Luma API key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `VAPID_PUBLIC_KEY` | Push notification public key |
| `VAPID_PRIVATE_KEY` | Push notification private key |
| `CRON_SECRET` | Cron job authentication |
