# Team1India — Features

> Auto-generated from codebase analysis (2026-04-22)

---

## Platform Overview

Team1India is a **community management platform** built with Next.js 16, Prisma, PostgreSQL, and NextAuth. It serves three user tiers (CORE team, MEMBER community, PUBLIC users) with distinct dashboards and capabilities.

**Live URL**: `https://team1india.vercel.app`

---

## 1. Authentication & Identity

| Feature | Details |
|---|---|
| **Google OAuth** | Single sign-on via Google (NextAuth v4) |
| **3-Tier Roles** | CORE (team), MEMBER (community), PUBLIC (anyone) |
| **JWT Sessions** | 30-day TTL, HttpOnly, Secure cookies |
| **Auto-Registration** | New users auto-created as PublicUser on first login |
| **Consent Flow** | Post-login consent modal for GDPR compliance |
| **Profile Sync** | Google profile (name, image) synced on each login |

---

## 2. Member Management

| Feature | Details |
|---|---|
| **Core Members** | Full CRUD by SuperAdmins with email notifications |
| **Community Members** | Managed by CORE with WRITE permissions |
| **Public Users** | Self-registered, managed via admin panel |
| **Permission System** | Per-resource JSON permissions (READ/WRITE/FULL_ACCESS/DENY) |
| **Tag System** | Flexible string tags on members for categorization |
| **Status Tracking** | applied → approved → active → paused lifecycle |
| **Member Directory** | Searchable directory for community members |
| **Profile Pages** | Extended profiles with roles, skills, social links, availability |
| **Welcome Emails** | Auto-sent on member addition |
| **Removal Emails** | Auto-sent on member removal |
| **Email Existence Check** | Verify if email exists across all user tables |

---

## 3. Playbook System

| Feature | Details |
|---|---|
| **Rich Text Editor** | BlockNote block-based editor |
| **Collaborative Editing** | Lock/unlock mechanism prevents conflicts |
| **Visibility Control** | CORE / MEMBER / PUBLIC per playbook |
| **Versioning** | Auto-incrementing version numbers |
| **Cover Images** | Custom cover image support |
| **Markdown Export** | Export to markdown format |
| **Public Reader** | Clean public-facing playbook viewer |
| **Table of Contents** | Auto-generated TOC from headings |
| **Soft Delete** | Recoverable deletion |

---

## 4. Guide System (Events / Programs / Content / Workshops / Hackathons)

| Feature | Details |
|---|---|
| **Unified Guide Model** | Single model for events, programs, workshops, hackathons |
| **Dynamic Form Builder** | Visual form builder for application forms (JSON schema) |
| **Application Processing** | Submit → Review → Approve/Reject pipeline |
| **Email Notifications** | Confirmation, approval, rejection, and custom emails |
| **Visibility Control** | CORE / MEMBER / PUBLIC per guide |
| **Submission Limits** | Configurable max submissions per user type |
| **Audience Targeting** | Multi-audience selection for guides |
| **Slug Support** | SEO-friendly URLs |
| **Luma Event Sync** | Auto-sync events from Luma API |

---

## 5. Media Pipeline

| Feature | Details |
|---|---|
| **Content Workflow** | draft → pending_approval → approved/needs_edit → posted |
| **Multi-Platform** | Track content across multiple social platforms |
| **Comment System** | Threaded comments on media items |
| **Audit Trail** | Full audit log of all status changes |
| **Link Tracking** | Multiple reference links per item |
| **Post URL Recording** | Track where content was actually posted |

---

## 6. Media Kit

| Feature | Details |
|---|---|
| **Brand Assets** | Manage logos, graphics, visual assets |
| **Color Palettes** | Store and share brand colors |
| **Bios** | Standard bio text management |
| **File Storage** | Vercel Blob for file uploads |
| **Searchable** | Filter by type and search by title |

---

## 7. Bounty & XP System

| Feature | Details |
|---|---|
| **Bounty Creation** | CORE creates bounties with XP rewards |
| **Bounty Types** | tweet, thread, blog, video, developer |
| **Frequency Cycles** | daily, twice-weekly, weekly, biweekly |
| **Audience Scoping** | Separate bounties for members vs public |
| **Proof Submission** | URL + note submission for verification |
| **Approval Workflow** | CORE reviews and approves/rejects submissions |
| **XP Tracking** | Automatic XP award on approval |
| **Leaderboard** | Ranked leaderboard by total XP |
| **Cycle Reset** | Manual bounty cycle reset by admin |
| **Per-Cycle Limits** | Configurable max submissions per cycle |

---

## 8. Experiments & Proposals

| Feature | Details |
|---|---|
| **Proposal System** | Members propose ideas/experiments |
| **Stage Workflow** | proposed → discussion → accepted/declined |
| **Commenting** | Both CORE and MEMBER can comment |
| **Upvoting** | Community upvote mechanism |
| **SuperAdmin Control** | Only SuperAdmins can change proposal status |

---

## 9. Contribution Tracking

| Feature | Details |
|---|---|
| **Contribution Types** | event-host, content, programs, internal-works, quest-fullstack, quest-creator, quest-builder |
| **Submission** | Members submit contributions with proof |
| **Review Pipeline** | CORE reviews and approves/rejects |
| **Email Notifications** | Approval and rejection emails |
| **Quest System** | Specialized quests with link submissions |

---

## 10. Operations & Task Management

| Feature | Details |
|---|---|
| **Task Tracking** | Create and track tasks/operations |
| **Meeting Scheduling** | Google Calendar + Google Meet integration |
| **Assignee System** | Assign tasks to team members |
| **Time Tracking** | Estimate and log time per task |
| **Status Management** | Flexible status tracking |
| **Calendar Integration** | Store calendar event IDs |

---

## 11. Communication

| Feature | Details |
|---|---|
| **Announcements** | Role-targeted announcements (PUBLIC/MEMBER/ALL) |
| **Expiring Announcements** | Auto-expire via `expiresAt` field |
| **Polls** | Create polls with voting for CORE/MEMBER |
| **Meeting Notes** | Rich-text meeting note editor |
| **Action Items** | Checklist-style action item tracking |
| **Email System** | Templated emails via Nodemailer (SMTP) |

---

## 12. Attendance Tracking

| Feature | Details |
|---|---|
| **Roll Call** | Record present members per date |
| **Multi-Source** | Combines CORE (Member) + MEMBER (CommunityMember) |
| **Notes** | Add notes to attendance records |
| **History** | Full attendance history |

---

## 13. Data Grid (Generic Admin)

| Feature | Details |
|---|---|
| **Dynamic Tables** | Generic CRUD for any Prisma model |
| **Column Config** | Saveable column visibility/width/order |
| **Permission-Based** | READ/WRITE per table resource |
| **Search & Filter** | Dynamic search across fields |
| **Inline Editing** | Edit records directly in grid |
| **Soft Delete** | Recoverable deletion for all entities |

---

## 14. Content Management

| Feature | Details |
|---|---|
| **Content Resources** | Blog, Video, Whitepaper, Case Study types |
| **Status Workflow** | draft → published lifecycle |
| **Custom Fields** | Extensible JSON custom fields |

---

## 15. Projects & Partners

| Feature | Details |
|---|---|
| **Project Tracking** | Manage ecosystem projects with social links |
| **Partner Management** | Sponsors, community partners, vendors |
| **Visibility Control** | CORE/MEMBER/PUBLIC per entity |
| **Social Links** | Website, Twitter, Telegram per entity |

---

## 16. Event Feedback

| Feature | Details |
|---|---|
| **Feedback Campaigns** | Create post-event feedback forms |
| **Email Distribution** | Bulk send feedback requests |
| **Public Forms** | Slug-based public feedback pages |
| **Results Dashboard** | View feedback results in core panel |

---

## 17. Push Notifications (PWA)

| Feature | Details |
|---|---|
| **Web Push** | VAPID-based push notifications |
| **Subscription Management** | Per-device subscription storage |
| **Preference Controls** | User notification preferences |
| **Multi-Device** | Support for multiple devices per user |
| **Service Worker** | Custom push service worker integration |

---

## 18. PWA Capabilities

| Feature | Details |
|---|---|
| **Installable** | Full PWA install support with manifest |
| **Offline Support** | Offline fallback page |
| **Update Prompt** | In-app update notification |
| **Smart Caching** | Route-based caching strategies |
| **Background Sync** | Offline action queue with retry |
| **Cross-Tab Sync** | BroadcastChannel-based sync |
| **Conflict Resolution** | Optimistic UI with conflict detection |

**Caching Strategy**:
| Route Pattern | Strategy | TTL |
|---|---|---|
| Public API | NetworkFirst | 1 hour |
| Core/Auth API | NetworkOnly | — |
| Images | CacheFirst | 30 days |
| Static assets | StaleWhileRevalidate | 7 days |
| Core pages | NetworkFirst | 5 min |
| Public pages | StaleWhileRevalidate | 1 hour |
| Playbooks | CacheFirst | 7 days |

---

## 19. Monitoring & Analytics

| Feature | Details |
|---|---|
| **Activity Logs** | Full activity log viewer for CORE |
| **Audit Logs** | Separate audit trail (CREATE/UPDATE/DELETE/LOGIN) |
| **Admin Dashboard** | System monitoring dashboard |
| **Cache Monitoring** | PWA cache usage tracking |
| **Analytics Dashboard** | Vercel Analytics integration |
| **PWA Monitoring** | Service worker health + offline analytics |
| **Health Reports** | System health report generation |

---

## 20. Security

| Feature | Details |
|---|---|
| **CSP Headers** | Strict Content-Security-Policy |
| **HSTS** | 2-year max-age with preload |
| **X-Frame-Options** | SAMEORIGIN |
| **XSS Protection** | X-XSS-Protection header |
| **Rate Limiting** | DB-backed, atomic, fail-closed |
| **Zod Validation** | Schema validation on all write endpoints |
| **Soft Deletes** | All entities support soft delete (`deletedAt`) |
| **Permission Injection Prevention** | Strict Zod enum on permission updates |
| **Audit Immutability** | Logs sent to stdout for external ingestion |

---

## 21. Website / Marketing

| Feature | Details |
|---|---|
| **Landing Page** | Full marketing homepage with sections |
| **3D Globe** | Cobe-based 3D globe visualization |
| **Gallery** | Image gallery with lightbox |
| **Members Showcase** | Team member cards with social links |
| **Impact Section** | Stats and metrics display |
| **Programs Section** | Programs overview |
| **Events Section** | Upcoming events from Luma |
| **Get Involved** | CTA section |
| **Footer** | Multi-column footer |
| **Theme Toggle** | Dark/light mode switching |
| **Smooth Scroll** | Lenis smooth scrolling |
| **SEO** | Sitemap, robots.txt, meta tags, Open Graph |

---

## 22. Integrations

| Service | Purpose |
|---|---|
| **Google OAuth** | Authentication |
| **Google Calendar** | Meeting scheduling + Google Meet |
| **Luma** | Event sync via API |
| **Vercel Blob** | File/image upload storage |
| **Vercel Analytics** | Usage analytics |
| **Nodemailer (SMTP)** | Email delivery |
| **Web Push (VAPID)** | Push notifications |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Prisma ORM) |
| Auth | NextAuth v4 (Google OAuth, JWT) |
| Styling | Tailwind CSS v4 |
| UI | Mantine, Lucide Icons, Framer Motion |
| Editor | BlockNote (block-based), TipTap |
| 3D | React Three Fiber, Three.js, Drei |
| PWA | @ducanh2912/next-pwa |
| Hosting | Vercel |
| Storage | Vercel Blob |
| Email | Nodemailer |
| Validation | Zod v4 |
