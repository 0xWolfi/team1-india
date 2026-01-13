# Complete Routing and API Documentation

## Table of Contents
1. [Frontend Routes](#frontend-routes)
   - [Public Routes](#public-routes)
   - [Member Routes](#member-routes)
   - [Core Routes](#core-routes)
2. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication)
   - [Public APIs](#public-apis)
   - [Member Management](#member-management)
   - [Community Members](#community-members)
   - [Content & Guides](#content--guides)
   - [Playbooks](#playbooks)
   - [Experiments](#experiments)
   - [Media Management](#media-management)
   - [Applications](#applications)
   - [Announcements](#announcements)
   - [Operations](#operations)
   - [Data Grid](#data-grid)
   - [Other APIs](#other-apis)

---

## Frontend Routes

### Public Routes
**Base Path:** `/public`

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home page (landing page) | Public |
| `/public` | Public dashboard/landing | Public |
| `/public/playbooks/[id]` | View public playbook | Public |
| `/public/guides/[id]` | View public guide | Public |
| `/public/events` | List public events | Public |
| `/public/events/[id]` | View public event details | Public |
| `/public/programs` | List public programs | Public |
| `/public/programs/[id]` | View public program details | Public |
| `/public/content` | List public content/bounties | Public |

### Member Routes
**Base Path:** `/member`

| Route | Description | Access |
|-------|-------------|--------|
| `/member` | Member dashboard | Member |
| `/member/announcements` | Member announcements | Member |
| `/member/content` | Member content list | Member |
| `/member/content/[id]` | View content details | Member |
| `/member/directory` | Member directory | Member |
| `/member/events` | Member events list | Member |
| `/member/events/[id]` | View event details | Member |
| `/member/experiments` | Experiments list | Member |
| `/member/experiments/new` | Create new experiment | Member |
| `/member/experiments/[id]` | View experiment details | Member |
| `/member/playbooks` | Playbooks list | Member |
| `/member/playbooks/[id]` | View playbook | Member |
| `/member/programs` | Programs list | Member |
| `/member/programs/[id]` | View program details | Member |
| `/member/profile` | User profile | Member |

### Core Routes
**Base Path:** `/core`

| Route | Description | Access |
|-------|-------------|--------|
| `/core` | Core dashboard | Core Admin |
| `/core/admin` | Admin panel (member management) | Core Admin |
| `/core/announcements` | Manage announcements | Core Admin |
| `/core/applications` | View/manage applications | Core Admin |
| `/core/attendance` | Attendance tracking | Core Admin |
| `/core/content` | Content management | Core Admin |
| `/core/content/guides` | Manage guides | Core Admin |
| `/core/content/guides/new` | Create new guide | Core Admin |
| `/core/content/guides/[id]` | View guide | Core Admin |
| `/core/content/guides/[id]/edit` | Edit guide | Core Admin |
| `/core/events` | Event management | Core Admin |
| `/core/events/guides` | Manage event guides | Core Admin |
| `/core/events/guides/new` | Create event guide | Core Admin |
| `/core/events/guides/[id]` | View event guide | Core Admin |
| `/core/events/guides/[id]/edit` | Edit event guide | Core Admin |
| `/core/experiments` | Experiments management | Core Admin |
| `/core/experiments/new` | Create experiment | Core Admin |
| `/core/experiments/[id]` | View experiment | Core Admin |
| `/core/logs` | Audit logs | Core Admin |
| `/core/media` | Media management | Core Admin |
| `/core/mediakit` | Media kit management | Core Admin |
| `/core/mediakit/new` | Create media kit item | Core Admin |
| `/core/members` | Member management | Core Admin |
| `/core/notes` | Meeting notes | Core Admin |
| `/core/operations` | Operations/tasks management | Core Admin |
| `/core/partners` | Partners management | Core Admin |
| `/core/playbooks` | Playbooks management | Core Admin |
| `/core/playbooks/[id]` | View/edit playbook | Core Admin |
| `/core/poll` | Polls management | Core Admin |
| `/core/programs` | Programs management | Core Admin |
| `/core/programs/guides` | Manage program guides | Core Admin |
| `/core/programs/guides/new` | Create program guide | Core Admin |
| `/core/programs/guides/[id]` | View program guide | Core Admin |
| `/core/programs/guides/[id]/edit` | Edit program guide | Core Admin |
| `/core/projects` | Projects management | Core Admin |
| `/core/settings` | System settings | Core Admin |

### Authentication Routes
| Route | Description | Access |
|-------|-------------|--------|
| `/auth/signin` | Sign in page | Public |
| `/access-check` | Access check page | Public |

---

## API Endpoints

### Authentication

#### `GET/POST /api/auth/[...nextauth]`
- **Description:** NextAuth authentication handler
- **Methods:** GET, POST
- **Access:** Public
- **Purpose:** Handles OAuth and session management

---

### Public APIs

#### `POST /api/public/check-member`
- **Description:** Check if email/X handle/Telegram belongs to a member
- **Method:** POST
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "string (optional)",
    "xHandle": "string (optional)",
    "telegram": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "isMember": boolean,
    "name": "string",
    "role": "string (Core Member | Contributor)",
    "tags": ["string"]
  }
  ```

#### `GET /api/public/playbooks/[id]`
- **Description:** Get public playbook by ID
- **Method:** GET
- **Access:** Public
- **Response:** Playbook object (only if visibility is PUBLIC)

#### `GET /api/public/guides/[id]`
- **Description:** Get public guide by ID
- **Method:** GET
- **Access:** Public
- **Response:** Guide object (only if visibility is PUBLIC)

---

### Member Management

#### `GET /api/members`
- **Description:** Get all core members
- **Method:** GET
- **Access:** Core Admin (READ permission required)
- **Response:** Array of member objects

#### `POST /api/members`
- **Description:** Create new core member
- **Method:** POST
- **Access:** Core Admin (WRITE permission required)
- **Request Body:**
  ```json
  {
    "email": "string (required)",
    "permissions": "object (optional)",
    "tags": ["string"] (optional)
  }
  ```
- **Response:** Created member object

#### `DELETE /api/members`
- **Description:** Delete core member
- **Method:** DELETE
- **Access:** Core Admin (WRITE permission required)
- **Query Params:** `id` (required)

#### `PUT /api/members/[id]/tags`
- **Description:** Update member tags
- **Method:** PUT
- **Access:** Core Admin (WRITE permission required)
- **Request Body:**
  ```json
  {
    "tags": ["string"]
  }
  ```

#### `PUT /api/members/[id]/status`
- **Description:** Update member status
- **Method:** PUT
- **Access:** Core Admin (WRITE permission required)
- **Request Body:**
  ```json
  {
    "status": "applied | approved | active | paused"
  }
  ```

#### `PUT /api/members/[id]/permissions`
- **Description:** Update member permissions
- **Method:** PUT
- **Access:** Core Admin (FULL_ACCESS required)
- **Request Body:**
  ```json
  {
    "permissions": {}
  }
  ```

---

### Community Members

#### `GET /api/community-members`
- **Description:** Get all community members
- **Method:** GET
- **Access:** Core Admin (READ permission required)
- **Response:** Array of community member objects

#### `POST /api/community-members`
- **Description:** Create new community member
- **Method:** POST
- **Access:** Core Admin (WRITE permission required)
- **Request Body:**
  ```json
  {
    "email": "string (required)",
    "name": "string (required)",
    "telegram": "string (required)",
    "xHandle": "string (required)",
    "tags": "string (optional)"
  }
  ```
- **Response:** Created community member object

#### `DELETE /api/community-members`
- **Description:** Delete community member
- **Method:** DELETE
- **Access:** Core Admin (WRITE permission required)
- **Query Params:** `id` (required)

---

### Content & Guides

#### `GET /api/guides`
- **Description:** Get all guides (filtered by type/visibility)
- **Method:** GET
- **Access:** Authenticated
- **Query Params:**
  - `type`: EVENT | PROGRAM | CONTENT
  - `visibility`: CORE | MEMBER | PUBLIC
- **Response:** Array of guide objects

#### `POST /api/guides`
- **Description:** Create new guide
- **Method:** POST
- **Access:** Core Admin (WRITE permission on guide type)
- **Request Body:**
  ```json
  {
    "type": "EVENT | PROGRAM | CONTENT",
    "title": "string (required)",
    "coverImage": "string (optional)",
    "visibility": "CORE | MEMBER | PUBLIC (default: CORE)",
    "audience": ["string"] (optional),
    "body": {
      "description": "string (optional)",
      "kpis": [{"label": "string", "value": "string", "color": "string"}] (optional),
      "timeline": [{"step": "string", "duration": "string"}] (optional),
      "rules": ["string"] (optional)
    },
    "formSchema": "any (optional)"
  }
  ```
- **Response:** Created guide object

#### `GET /api/guides/[id]`
- **Description:** Get guide by ID
- **Method:** GET
- **Access:** Authenticated
- **Response:** Guide object

#### `PUT /api/guides/[id]`
- **Description:** Update guide
- **Method:** PUT
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "string",
    "audience": ["string"],
    "body": {},
    "formSchema": "any",
    "visibility": "string"
  }
  ```

#### `DELETE /api/guides/[id]`
- **Description:** Soft delete guide
- **Method:** DELETE
- **Access:** Authenticated
- **Response:** `{ success: true }`

#### `GET /api/guides/[id]/applications`
- **Description:** Get applications for a guide
- **Method:** GET
- **Access:** Authenticated
- **Response:** Array of application objects

#### `GET /api/content`
- **Description:** Get all content resources
- **Method:** GET
- **Access:** Authenticated
- **Response:** Array of content resource objects

#### `POST /api/content`
- **Description:** Create content resource
- **Method:** POST
- **Access:** Authenticated
- **Request Body:** (Validated by ContentSchema)
- **Response:** Created content resource

---

### Playbooks

#### `GET /api/playbooks`
- **Description:** Get all playbooks
- **Method:** GET
- **Access:** Authenticated
- **Response:** Array of playbook objects

#### `POST /api/playbooks`
- **Description:** Create new playbook
- **Method:** POST
- **Access:** Core Admin (WRITE permission on playbooks)
- **Request Body:**
  ```json
  {
    "title": "string (required)",
    "description": "string (optional)",
    "coverImage": "string (optional)",
    "visibility": "CORE | MEMBER | PUBLIC (default: CORE)"
  }
  ```
- **Response:** Created playbook object (auto-locked for creator)

#### `GET /api/playbooks/[id]`
- **Description:** Get playbook by ID
- **Method:** GET
- **Access:** Authenticated
- **Response:** Playbook object

#### `PUT /api/playbooks/[id]`
- **Description:** Update playbook (requires lock ownership)
- **Method:** PUT
- **Access:** Core Admin (WRITE permission on playbooks)
- **Request Body:**
  ```json
  {
    "body": [],
    "title": "string",
    "visibility": "string",
    "coverImage": "string",
    "description": "string"
  }
  ```
- **Note:** Playbook must be locked by current user

#### `DELETE /api/playbooks/[id]`
- **Description:** Delete playbook
- **Method:** DELETE
- **Access:** Core Admin (WRITE permission on playbooks)
- **Response:** `{ success: true }`

#### `POST /api/playbooks/[id]/lock`
- **Description:** Acquire lock on playbook
- **Method:** POST
- **Access:** Authenticated
- **Response:**
  ```json
  {
    "success": boolean,
    "lockedBy": "string (if locked by another user)"
  }
  ```
- **Note:** Lock expires after 5 minutes

#### `POST /api/playbooks/[id]/unlock`
- **Description:** Release lock on playbook
- **Method:** POST
- **Access:** Authenticated
- **Response:** `{ success: true }`
- **Note:** Superadmin can force unlock

---

### Experiments

#### `GET /api/experiments`
- **Description:** Get all experiments (filtered by stage)
- **Method:** GET
- **Access:** Authenticated
- **Query Params:** `stage` (optional): PROPOSED | DISCUSSION | APPROVED | REJECTED
- **Response:** Array of experiment objects with creator and comment count

#### `POST /api/experiments`
- **Description:** Create new experiment/proposal
- **Method:** POST
- **Access:** Authenticated (Member or Core)
- **Request Body:**
  ```json
  {
    "title": "string (required)",
    "description": "string (required)"
  }
  ```
- **Response:** Created experiment (stage: PROPOSED)

#### `GET /api/experiments/[id]`
- **Description:** Get experiment by ID with comments
- **Method:** GET
- **Access:** Authenticated
- **Response:** Experiment object with comments

#### `PATCH /api/experiments/[id]`
- **Description:** Update experiment (stage changes require superadmin)
- **Method:** PATCH
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "string (optional)",
    "description": "string (optional)",
    "stage": "PROPOSED | DISCUSSION | APPROVED | REJECTED (optional, superadmin only)"
  }
  ```
- **Note:** Stage changes send email notifications

#### `DELETE /api/experiments/[id]`
- **Description:** Soft delete experiment
- **Method:** DELETE
- **Access:** Superadmin only
- **Response:** `{ success: true }`

#### `POST /api/experiments/[id]/comments`
- **Description:** Add comment to experiment
- **Method:** POST
- **Access:** Authenticated (Member or Core)
- **Request Body:**
  ```json
  {
    "body": "string (required)"
  }
  ```
- **Response:** Created comment object

#### `GET /api/experiments/comments`
- **Description:** Get comments for an experiment
- **Method:** GET
- **Access:** Authenticated
- **Query Params:** `experimentId` (required)
- **Response:** Array of comment objects

#### `POST /api/experiments/comments`
- **Description:** Create comment on experiment (legacy endpoint)
- **Method:** POST
- **Access:** Authenticated (Core members only)
- **Request Body:**
  ```json
  {
    "experimentId": "string",
    "text": "string"
  }
  ```

---

### Media Management

#### `GET /api/media`
- **Description:** Get all media items (filtered by status)
- **Method:** GET
- **Access:** Authenticated
- **Query Params:** `status` (optional): draft | pending_approval | approved | posted | needs_edit | ALL
- **Response:** Array of media items with creator and post count

#### `POST /api/media`
- **Description:** Create new media item
- **Method:** POST
- **Access:** Authenticated
- **Request Body:** (Validated by MediaItemSchema)
  ```json
  {
    "title": "string (required)",
    "description": "string (optional)",
    "platform": "string (required)",
    "links": ["string"] (required)
  }
  ```
- **Response:** Created media item (status: draft)

#### `GET /api/media/[id]`
- **Description:** Get media item by ID with posts, comments, and audit logs
- **Method:** GET
- **Access:** Authenticated
- **Response:** Media item object with related data

#### `PUT /api/media/[id]`
- **Description:** Update media item (only if status is draft or needs_edit)
- **Method:** PUT
- **Access:** Authenticated
- **Request Body:** (Validated by MediaItemSchema)
- **Response:** Updated media item

#### `DELETE /api/media/[id]`
- **Description:** Soft delete media item
- **Method:** DELETE
- **Access:** Authenticated
- **Response:** 204 No Content

#### `PUT /api/media/[id]/status`
- **Description:** Update media item status (state machine transitions)
- **Method:** PUT
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "status": "draft | pending_approval | approved | posted | needs_edit",
    "postUrl": "string (required if status is posted)"
  }
  ```
- **Valid Transitions:**
  - `draft` → `pending_approval`
  - `needs_edit` → `pending_approval` or `draft`
  - `pending_approval` → `approved` or `needs_edit` (admin only)
  - `approved` → `posted` or `needs_edit`
  - `posted` → (end state)
- **Response:** Updated media item

#### `POST /api/comments`
- **Description:** Create comment on media item
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "content": "string (required)",
    "mediaId": "string (required)"
  }
  ```
- **Response:** Created comment object

---

### Applications

#### `GET /api/applications`
- **Description:** Get all applications
- **Method:** GET
- **Access:** Authenticated (Admin)
- **Response:** Array of application objects with guide info

#### `POST /api/applications`
- **Description:** Submit application for a guide/event/program
- **Method:** POST
- **Access:** Public
- **Request Body:**
  ```json
  {
    "guideId": "string (required)",
    "email": "string (required)",
    "data": {} (optional)
  }
  ```
- **Response:** `{ success: true, id: "string" }`
- **Note:** Prevents duplicate submissions within 7 days

#### `PATCH /api/applications/[id]`
- **Description:** Update application status (approve/reject)
- **Method:** PATCH
- **Access:** Core Admin only
- **Request Body:**
  ```json
  {
    "status": "PENDING | APPROVED | REJECTED"
  }
  ```
- **Note:** Sends email notification on status change

---

### Announcements

#### `GET /api/announcements`
- **Description:** Get announcements (filtered by audience)
- **Method:** GET
- **Access:** Public
- **Query Params:** `audience` (optional): PUBLIC | MEMBER | ALL
- **Response:** Array of announcement objects
- **Note:** Automatically filters out expired announcements

#### `POST /api/announcements`
- **Description:** Create new announcement
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "string (required)",
    "link": "string (optional)",
    "audience": "PUBLIC | MEMBER | ALL (optional, default: ALL)",
    "expiresAt": "ISO date string (optional)"
  }
  ```
- **Response:** Created announcement
- **Note:** Maximum 6 active announcements per audience view

#### `DELETE /api/announcements`
- **Description:** Delete announcement
- **Method:** DELETE
- **Access:** Authenticated
- **Query Params:** `id` (required)
- **Response:** `{ success: true }`

---

### Operations

#### `GET /api/operations`
- **Description:** Get all operations/tasks
- **Method:** GET
- **Access:** Authenticated
- **Query Params:**
  - `type`: task | meeting
  - `status`: todo | in_progress | done | cancelled
- **Response:** Array of operation objects with assignee

#### `POST /api/operations`
- **Description:** Create new operation
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "string (optional, default: 'Untitled Task')",
    "type": "task | meeting (optional, default: 'task')",
    "status": "todo (optional, default: 'todo')",
    "dueDate": "ISO date string (optional)",
    "timeEstimate": "number (optional)",
    "assigneeId": "string (optional, defaults to current user)",
    "links": ["string"] (optional)
  }
  ```
- **Response:** Created operation object

#### `PUT /api/operations/[id]`
- **Description:** Update operation
- **Method:** PUT
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "string",
    "status": "string",
    "dueDate": "ISO date string",
    "timeEstimate": "number",
    "timeLogged": "number",
    "assigneeId": "string",
    "links": ["string"]
  }
  ```

#### `DELETE /api/operations/[id]`
- **Description:** Delete operation
- **Method:** DELETE
- **Access:** Authenticated
- **Response:** `{ success: true }`

---

### Data Grid

#### `GET /api/data-grid/[table]`
- **Description:** Get data for a table (members, projects, partners)
- **Method:** GET
- **Access:** Core Admin (READ permission on table)
- **Path Params:** `table` (members | projects | partners)
- **Response:**
  ```json
  {
    "data": [],
    "config": []
  }
  ```

#### `POST /api/data-grid/[table]`
- **Description:** Create new record in table
- **Method:** POST
- **Access:** Core Admin (WRITE permission on table)
- **Path Params:** `table` (members | projects | partners)
- **Request Body:** Object or array of objects
- **Response:** Created object(s)

#### `PATCH /api/data-grid/[table]/[id]`
- **Description:** Update record in table
- **Method:** PATCH
- **Access:** Core Admin only
- **Path Params:** `table`, `id`
- **Request Body:** Update object

#### `DELETE /api/data-grid/[table]/[id]`
- **Description:** Delete record from table
- **Method:** DELETE
- **Access:** Core Admin only
- **Path Params:** `table`, `id`
- **Response:** Deleted object

#### `POST /api/data-grid/[table]/config`
- **Description:** Update table configuration
- **Method:** POST
- **Access:** Authenticated
- **Path Params:** `table`
- **Request Body:**
  ```json
  {
    "columns": []
  }
  ```
- **Response:** Updated config object

---

### Other APIs

#### `GET /api/action-items`
- **Description:** Get all action items
- **Method:** GET
- **Access:** Authenticated
- **Response:** Array of action item objects

#### `POST /api/action-items`
- **Description:** Create action item
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "text": "string (required)"
  }
  ```

#### `PATCH /api/action-items`
- **Description:** Update action item (mark as done)
- **Method:** PATCH
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "id": "string",
    "isDone": boolean
  }
  ```

#### `DELETE /api/action-items`
- **Description:** Delete action item
- **Method:** DELETE
- **Access:** Authenticated
- **Query Params:** `id` (required)

#### `GET /api/attendance`
- **Description:** Get all members for attendance list
- **Method:** GET
- **Access:** Authenticated
- **Response:** Array of members (Core + Community)

#### `POST /api/attendance`
- **Description:** Create attendance record
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "date": "ISO date string",
    "presentIds": ["string"],
    "note": "string (optional)"
  }
  ```

#### `GET /api/logs`
- **Description:** Get audit logs with pagination
- **Method:** GET
- **Access:** Authenticated
- **Query Params:**
  - `action`: CREATE | UPDATE | DELETE | STATUS_CHANGE | ALL
  - `resource`: EXPERIMENT | MEDIAITEM | OPERATION | ALL
  - `actorId`: string | ALL
  - `from`: ISO date string
  - `to`: ISO date string
  - `page`: number (default: 1)
  - `limit`: number (default: 50)
- **Response:**
  ```json
  {
    "items": [],
    "pagination": {
      "total": number,
      "page": number,
      "limit": number,
      "pages": number
    }
  }
  ```

#### `GET /api/mediakit`
- **Description:** Get media kit resources
- **Method:** GET
- **Access:** Authenticated
- **Query Params:**
  - `search`: string
  - `type`: BRAND_ASSET | COLOR_PALETTE | BIO | FILE | ALL
- **Response:** Array of content resource objects

#### `POST /api/mediakit`
- **Description:** Create media kit resource
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "title": "string (required)",
    "type": "BRAND_ASSET | COLOR_PALETTE | BIO | FILE (required)",
    "content": "string (optional)",
    "customFields": {} (optional)
  }
  ```
- **Response:** Created resource (status: published)

#### `GET /api/notes`
- **Description:** Get latest meeting note
- **Method:** GET
- **Access:** Authenticated
- **Response:** Note object or `{ content: "" }`

#### `POST /api/notes`
- **Description:** Save meeting note (updates if created today, else creates new)
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "content": "string"
  }
  ```

#### `GET /api/polls`
- **Description:** Get all polls
- **Method:** GET
- **Access:** Authenticated
- **Response:** Array of poll objects

#### `POST /api/polls`
- **Description:** Create new poll
- **Method:** POST
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "question": "string (required)",
    "options": [{"id": "string", "text": "string", "votes": 0}] (required)
  }
  ```

#### `PATCH /api/polls`
- **Description:** Vote on poll or update poll status
- **Method:** PATCH
- **Access:** Public/Authenticated
- **Request Body:**
  ```json
  {
    "id": "string",
    "type": "VOTE | STATUS",
    "optionId": "string (required if type is VOTE)",
    "status": "string (required if type is STATUS)"
  }
  ```

#### `GET /api/profile`
- **Description:** Get user profile custom fields
- **Method:** GET
- **Access:** Authenticated
- **Response:** Custom fields object

#### `PATCH /api/profile`
- **Description:** Update user profile custom fields
- **Method:** PATCH
- **Access:** Authenticated
- **Request Body:**
  ```json
  {
    "customFields": {},
    "tags": ["string"] (optional, locked for community members)
  }
  ```

#### `GET /api/settings`
- **Description:** Get system settings
- **Method:** GET
- **Access:** Core Admin only
- **Response:** Settings object (key-value pairs)

#### `POST /api/settings`
- **Description:** Update system setting
- **Method:** POST
- **Access:** Core Admin only
- **Request Body:**
  ```json
  {
    "key": "string (required)",
    "value": "string"
  }
  ```

#### `POST /api/upload`
- **Description:** Upload image file to Vercel Blob Storage
- **Method:** POST
- **Access:** Authenticated
- **Request:** FormData with `file` field
- **Constraints:**
  - Max file size: 5MB
  - Only image files allowed
- **Response:**
  ```json
  {
    "url": "string"
  }
  ```

#### `GET /api/seed/announcements`
- **Description:** Seed announcements (development/testing)
- **Method:** GET
- **Access:** Public
- **Response:** `{ success: true, count: number }`

#### `GET /api/cron/cleanup`
- **Description:** Cron job for cleanup (deprecated)
- **Method:** GET
- **Access:** Protected (requires CRON_SECRET header)
- **Response:** `{ message: "Cleanup deprecated...", count: 0 }`

---

## Access Control Summary

### Role-Based Access
- **Public:** No authentication required
- **Authenticated:** Any logged-in user (Member or Core)
- **Member:** Community members and Core members
- **Core Admin:** Core members only
- **Superadmin:** Core members with `permissions['*'] === 'FULL_ACCESS'`

### Permission-Based Access
- **READ:** View/list resources
- **WRITE:** Create, update, delete resources
- **FULL_ACCESS:** Complete control (superadmin)

### Resource-Specific Permissions
Permissions are checked per resource type:
- `members`, `community-members`
- `playbooks`, `playbook`
- `event`, `program`, `content`
- `experiments`
- `media`
- `operations`

---

## Notes

1. **Soft Deletes:** Most DELETE operations perform soft deletes (set `deletedAt` timestamp) rather than hard deletes
2. **Audit Logging:** Many operations create audit log entries for tracking
3. **Email Notifications:** Status changes on experiments and applications trigger email notifications
4. **Lock Mechanism:** Playbooks use a locking system to prevent concurrent edits (5-minute timeout)
5. **State Machines:** Media items use strict state machine transitions for status changes
6. **Rate Limiting:** Application submissions are limited to once per 7 days per guide
7. **Announcement Limits:** Maximum 6 active announcements per audience view (PUBLIC/MEMBER)

---

**Last Updated:** Generated from codebase analysis
**Project:** Team1India
