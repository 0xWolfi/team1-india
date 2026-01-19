# Team1India Platform Documentation

Welcome to the Team1India codebase. This document outlines the project's design, architecture, and the operational logic behind the Core (Admin), Member, and Public views.

## 🛠 Technology Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Vanilla CSS for core styles)
- **Database:** Prisma ORM (SQLite/PostgreSQL)
- **Icons:** Lucide React
- **Authentication:** NextAuth.js

---

## 📂 Project Architecture

The application is structured around the Next.js App Router, with distinct sections for different user roles.

### Folder Structure (`/app`)

| Path | Purpose | Access Control |
|------|---------|----------------|
| `/public` (or root) | Public Landing Page | Public |
| `/core` | Admin Dashboard | **CORE** Role Only |
| `/member` | Community Dashboard | **MEMBER** Role |
| `/api` | Backend Routes | Varies (Secured) |

### Key Components

- **WraithSystem (Design System):** Use of specific dark-mode aesthetics (`zinc-900`, `white/10` borders) standardizes the look across Core and Member portals, creating a "premium" feel.
- **DataGrid (`components/data-grid`):** A powerhouse component used in `/core` to manage database tables dynamically. It handles sorting, filtering, custom columns, and CRUD operations for Members, Projects, and Partners.

---

## 🧠 Core Logic & Role Handling

The system controls views based on User Roles and Global System Settings.

### 1. The Core (Admin) View
**Location:** `/app/core`
- **Function:** The command center for the platform.
- **Capabilities:**
  - Manage database records via `DataGrid` (Members, Projects, Partners).
  - Configure global visibility settings (`/core/settings`).
  - View system logs.
- **Security:** Protected by Middleware and per-route Server Session checks. Only users with the `CORE` role can access these pages or hit modification APIs (`POST`, `PATCH`, `DELETE`).

### 2. The Member View
**Location:** `/app/member`
- **Function:** "Mission Control" for community members.
- **Capabilities:**
  - **Profile Management:** Edit bio, social links, and location.
  - **Resource Access:** View exclusive resources or "Missions" (future scope).
- **Design:** Uses `CoreWrapper` to share the same visual language as the Admin dashboard but with restricted options.

### 3. The Public View
**Location:** `/app/public/page.tsx` (Root)
- **Function:** Marketing and Information portal.
- **Dynamic Logic:**
  - The page serves as a dynamic container. It fetches **System Settings** (`prisma.systemSettings`) to decide *what* to render.
  - **Example:** If "Show Partners" is toggled OFF in Core, the Public page will not render the Partners section.
  - Data (Projects, Partners) is filtered by `visibility: 'PUBLIC'` at the database level before reaching the frontend.

---

## ⚙️ How It Works (Data Flow)

### DataGrid System
The `/core` pages utilize a generic API structure:
1. **Frontend:** `DataGrid` component requests `/api/data-grid/[table]`.
2. **API:** The generic route maps `[table]` (e.g., 'members') to a Prisma Delegate.
3. **Config:** Column configurations (visibility, order) are stored in `TableConfig` in the DB, allowing the UI to persist user preferences.

### System Settings (Feature Flags)
1. **Admin** toggles a setting in `/core/settings`.
2. **Database** updates the `SystemSettings` table (Key-Value pair).
3. **Public Page** (`page.tsx`) fetches these settings on load.
4. **Conditional Rendering:**
   ```tsx
   {settings.show_partners === 'true' && <PartnersSection />}
   ```

---

## 🚀 Development Workflow

1. **Database Changes:** Modify `prisma/schema.prisma` -> `npx prisma db push`.
2. **New Components:** Build in `components/`, utilizing existing UI tokens.
3. **API Logic:** Add routes in `app/api/`. Always implement Role checks for sensitive actions.

---
