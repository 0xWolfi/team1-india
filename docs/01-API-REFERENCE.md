# Team1India — API Reference

> Auto-generated from codebase analysis (2026-04-22)

---

## Overview

All APIs live under `app/api/`. Authentication uses **NextAuth v4** with Google OAuth. Sessions are JWT-based (30-day TTL). Three user tiers exist: `CORE`, `MEMBER`, `PUBLIC`.

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public (no auth) |
| 🔒 | Authenticated (any role) |
| 👥 | MEMBER + CORE |
| 🛡️ | CORE only |
| ⚡ | SuperAdmin (FULL_ACCESS on `*`) |
| 🚦 | Rate-limited |

---

## 1. Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `*` | `/api/auth/[...nextauth]` | 🔓 | NextAuth catch-all (signin, signout, session, callback) |
| `GET` | `/api/auth/check-validity` | 🔒 | Check if current session/token is valid |

**Auth Flow**: Google OAuth → `signIn` callback checks `Member` → `CommunityMember` → `PublicUser` tables (in that order). Creates `PublicUser` if no match. JWT token is enriched with `role`, `permissions`, `tags`, `consent`.

---

## 2. Members (Core Team)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/members` | 🛡️ + `READ` on `members` | List all core members |
| `POST` | `/api/members` | ⚡ | Add new core member (sends welcome email) |
| `DELETE` | `/api/members` | ⚡ | Soft-delete core member (sends removal email) |
| `PUT` | `/api/members/[id]/permissions` | ⚡ | Update member permissions (Zod-validated) |
| `PATCH` | `/api/members/[id]/status` | 🛡️ | Change member status |
| `PUT` | `/api/members/[id]/tags` | 🛡️ | Update member tags |
| `GET` | `/api/members/check-email` | 🛡️ | Check if email exists in Member/CommunityMember |

---

## 3. Community Members

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/community-members` | 👥 | List community members |
| `POST` | `/api/community-members` | 🛡️ + `WRITE` on `members` | Add community member |
| `DELETE` | `/api/community-members` | 🛡️ + `WRITE` on `members` | Soft-delete community member |
| `GET` | `/api/community-members/[id]` | 🛡️ | Get single community member |
| `PATCH` | `/api/community-members/[id]` | 🛡️ | Update community member |
| `GET` | `/api/community-members/[id]/activity` | 🛡️ | Get member activity/contributions |

---

## 4. Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/admin/public-users` | 🛡️ | List all public users |
| `POST` | `/api/admin/send-email` | 🛡️ | Send custom email to user |

---

## 5. Playbooks

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/playbooks` | 🛡️ | List all playbooks (filtered by visibility for role) |
| `POST` | `/api/playbooks` | 🛡️ | Create new playbook |
| `GET` | `/api/playbooks/[id]` | 🛡️ | Get playbook by ID |
| `PATCH` | `/api/playbooks/[id]` | 🛡️ | Update playbook |
| `DELETE` | `/api/playbooks/[id]` | 🛡️ | Soft-delete playbook |
| `POST` | `/api/playbooks/[id]/lock` | 🛡️ | Lock playbook for editing |
| `POST` | `/api/playbooks/[id]/unlock` | 🛡️ | Unlock playbook |

---

## 6. Operations

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/operations` | 🛡️ | List all operations/tasks |
| `POST` | `/api/operations` | 🛡️ | Create operation |
| `GET` | `/api/operations/[id]` | 🛡️ | Get single operation |
| `PATCH` | `/api/operations/[id]` | 🛡️ | Update operation |
| `DELETE` | `/api/operations/[id]` | 🛡️ | Soft-delete operation |
| `POST` | `/api/operations/schedule-meeting` | 🛡️ | Schedule Google Meet via Calendar API |

---

## 7. Media Pipeline

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/media` | 🔒 | List all media items (any authenticated user) |
| `POST` | `/api/media` | 🛡️ | Create media item |
| `GET` | `/api/media/[id]` | 🛡️ | Get media item with comments & audit logs |
| `PATCH` | `/api/media/[id]` | 🛡️ | Update media item |
| `DELETE` | `/api/media/[id]` | 🛡️ | Soft-delete media item |
| `PATCH` | `/api/media/[id]/status` | 🛡️ | Change media status (approval workflow) |
| `GET` | `/api/comments` | 🛡️ | List comments for a media item |
| `POST` | `/api/comments` | 🛡️ | Add comment to media item |

**Status Flow**: `draft` → `pending_approval` → `approved` / `needs_edit` → `posted`

---

## 8. Media Kit

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/mediakit` | 🔒 | List media kit resources (brand assets, colors, bios) |
| `POST` | `/api/mediakit` | 🛡️ | Create media kit resource |

---

## 9. Guides (Events / Programs / Workshops)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/guides` | 🔒 | List guides (visibility-filtered by role) |
| `POST` | `/api/guides` | 🛡️ | Create guide with form schema |
| `GET` | `/api/guides/[id]` | 🔒 | Get guide (visibility check per role) |
| `PUT` | `/api/guides/[id]` | 🛡️ | Update guide |
| `DELETE` | `/api/guides/[id]` | 🛡️ | Soft-delete guide |
| `GET` | `/api/guides/[id]/applications` | 🔒 | List applications for a guide |

---

## 10. Applications

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/applications` | 🛡️ | List all applications |
| `POST` | `/api/applications` | 🔒 | Submit application (sends confirmation email) |
| `PATCH` | `/api/applications/[id]` | 🛡️ | Update application status (approve/reject, sends email) |

---

## 11. Experiments (Proposals)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/experiments` | 🔒 | List experiments |
| `POST` | `/api/experiments` | 🔒 | Create experiment (CORE or MEMBER) |
| `GET` | `/api/experiments/[id]` | 🔒 | Get experiment with comments |
| `PATCH` | `/api/experiments/[id]` | 🔒 / ⚡ | Update experiment (status change requires SuperAdmin) |
| `DELETE` | `/api/experiments/[id]` | ⚡ | Delete experiment |
| `POST` | `/api/experiments/[id]/comments` | 🔒 | Add comment to experiment |
| `GET` | `/api/experiments/comments` | 🔒 | Get experiment comments |
| `POST` | `/api/experiments/comments` | 🛡️ | Add experiment comment (legacy) |

---

## 12. Bounty System

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/bounty` | 👥 | List bounties (MEMBER sees `audience:member` only) |
| `POST` | `/api/bounty` | 🛡️ | Create bounty |
| `PATCH` | `/api/bounty/[id]` | 🛡️ | Update bounty |
| `DELETE` | `/api/bounty/[id]` | 🛡️ | Delete bounty |
| `POST` | `/api/bounty/reset` | 🛡️ | Reset bounty cycle |
| `GET` | `/api/bounty/submissions` | 🔒 | List submissions (scoped to role) |
| `POST` | `/api/bounty/submissions` | 👥 / PUBLIC | Submit bounty proof |
| `PATCH` | `/api/bounty/submissions/[id]` | 🛡️ | Approve/reject submission (awards XP) |

---

## 13. Contributions

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/contributions` | 🔒 | List contributions (CORE sees all, others see own) |
| `POST` | `/api/contributions` | 👥 | Submit contribution |
| `PATCH` | `/api/contributions/[id]` | 🛡️ | Approve/reject contribution |

---

## 14. Content Resources

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/content` | 🔒 | List content resources |
| `POST` | `/api/content` | 🛡️ | Create content resource |

---

## 15. Leaderboard

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/leaderboard` | 👥 | Get member leaderboard (bounty XP) |

---

## 16. Data Grid (Generic CRUD)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/data-grid/[table]` | 🛡️ + `READ` on table | Generic list for any model |
| `POST` | `/api/data-grid/[table]` | 🛡️ + `WRITE` on table | Generic create |
| `PATCH` | `/api/data-grid/[table]/[id]` | 🛡️ | Generic update |
| `DELETE` | `/api/data-grid/[table]/[id]` | 🛡️ | Generic soft-delete |
| `POST` | `/api/data-grid/[table]/config` | 🛡️ | Save table column config |

---

## 17. Announcements & Polls

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/announcements` | 🔒 | List announcements (filtered by role audience) |
| `POST` | `/api/announcements` | 🛡️ | Create announcement |
| `GET` | `/api/polls` | 👥 | List polls |
| `POST` | `/api/polls` | 🔒 | Create poll |
| `PATCH` | `/api/polls` | 🔒 | Vote on poll |

---

## 18. Meeting Notes & Action Items

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/notes` | 🛡️ | List meeting notes |
| `POST` | `/api/notes` | 🛡️ | Create/update meeting note |
| `DELETE` | `/api/notes` | 🛡️ | Delete meeting note |
| `GET` | `/api/action-items` | 🛡️ | List action items |
| `POST` | `/api/action-items` | 🛡️ | Create action item |
| `PATCH` | `/api/action-items` | 🛡️ | Toggle action item done status |

---

## 19. Attendance

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/attendance` | 🛡️ | List attendance records (includes CORE + MEMBER members) |
| `POST` | `/api/attendance` | 🛡️ | Record attendance |
| `DELETE` | `/api/attendance` | 🛡️ | Delete attendance record |

---

## 20. Logs & Settings

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/logs` | 🛡️ | Fetch activity logs |
| `GET` | `/api/settings` | 🛡️ | Get system settings |
| `POST` | `/api/settings` | 🛡️ | Update system setting |

---

## 21. Profile

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/profile` | 🔒 | Get current user profile |
| `PATCH` | `/api/profile` | 🔒 | Update profile |
| `GET` | `/api/profile/extra` | 🔒 | Get extended profile fields |
| `PATCH` | `/api/profile/extra` | 🔒 | Update extended profile fields |

---

## 22. Event Feedback

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/event-feedback` | 🛡️ | List feedback campaigns |
| `POST` | `/api/event-feedback` | 🛡️ | Create feedback campaign |
| `POST` | `/api/event-feedback/send-email` | 🛡️ | Send feedback request emails |

---

## 23. Push Notifications

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/push/vapid-key` | 🔓 | Get VAPID public key |
| `POST` | `/api/push/subscribe` | 🔒 | Subscribe to push (own user or CORE) |
| `DELETE` | `/api/push/subscribe/[userId]` | 🔒 | Unsubscribe (own user or CORE) |
| `POST` | `/api/push/send` | 🔒 | Send push notification (own user or CORE) |
| `GET` | `/api/push/preferences/[userId]` | 🔒 | Get notification preferences (own or CORE) |
| `PUT` | `/api/push/preferences/[userId]` | 🔒 | Update notification preferences (own or CORE) |

---

## 24. Upload

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/api/upload/token` | 👥 | Get Vercel Blob upload token |

---

## 25. Public APIs (No auth or rate-limited)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/public/home` | 🔓🚦 | Landing page data (playbooks, guides, members) |
| `GET` | `/api/public/members` | 🔓🚦 | Public member list |
| `GET` | `/api/public/playbooks` | 🔓🚦 | Public playbooks list |
| `GET` | `/api/public/playbooks/[id]` | 🔓🚦 | Single public playbook |
| `GET` | `/api/public/guides/[id]` | 🔓🚦 | Single public guide |
| `POST` | `/api/public/check-member` | 🔓🚦 | Verify member by X handle |
| `GET` | `/api/public/bounty` | 🔒 | Public bounties |
| `GET` | `/api/public/leaderboard` | 🔓 | Public bounty leaderboard |
| `GET` | `/api/public/profile` | PUBLIC only | Get public user profile |
| `PATCH` | `/api/public/profile` | PUBLIC only | Update public user profile |

---

## 26. Cron Jobs

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/cron/sync-events` | 🔓 (CRON_SECRET) | Sync Luma events to DB |
| `GET` | `/api/cron/cleanup` | 🔓 (CRON_SECRET) | Cleanup expired data |

---

## 27. Luma Events

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/luma-events` | 🔒 | Get synced Luma events |

---

## 28. Seed

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/seed/announcements` | ⚡ | Seed sample announcements |

---

## 29. Avatar

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/avatar` | 🔓 | Generate avatar from initials |
