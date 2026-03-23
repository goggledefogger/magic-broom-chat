---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ['_bmad-output/prd.md', '_bmad-output/brainstorming/brainstorming-session-2026-03-21-2300.md']
workflowType: 'architecture'
project_name: 'Magic Broom Chat'
user_name: 'Danny'
date: '2026-03-22'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
28 FRs across 6 categories:
- **User Management (FR1-5):** Auth flow (email/password), profile editing, instructor role management, password recovery. Standard auth patterns — no OAuth/SSO complexity in MVP.
- **Channels & Messaging (FR6-13):** Channel CRUD, join/leave, real-time text messaging via WebSocket, message history, emoji reactions, instructor moderation. The core real-time backbone.
- **Gallery & Resource Sharing (FR14-19):** Gallery cards as first-class entities (image + title + description + link), visual grid rendering, card-level comments and reactions separate from gallery browse, instructor-controlled channel type designation. The differentiating feature and riskiest architectural component.
- **Search (FR20-21):** Full-text search across messages and cards with contextual results.
- **Notifications & Awareness (FR22-23):** Pull-based unread badges per channel. No push notifications.
- **Theming & Administration (FR24-28):** Sorcerer's Apprentice theme in copy/UI, channel pre-population, batch card creation, channel archival.

**Non-Functional Requirements:**
- **Performance:** 3s initial load, <500ms message delivery, <1s gallery render (100 cards), <1s search
- **Security:** Hashed passwords, HTTPS/WSS, expiring/revocable tokens, image validation/sanitization
- **Scalability:** Up to 50 concurrent users, single-instance deployment, indefinite data persistence
- **Accessibility:** WCAG AA — semantic HTML, keyboard navigation, color contrast, alt text, ARIA labels
- **Reliability:** WebSocket auto-reconnect, no message loss during brief disconnects, refresh-resilient sessions

**Scale & Complexity:**
- Primary domain: Full-stack real-time web application
- Complexity level: Medium
- Estimated architectural components: ~8-10 (auth, channels, messaging/WebSocket, gallery cards, search, image storage, notifications/unread tracking, theming, admin/moderation)

### Technical Constraints & Dependencies

- Greenfield project — no legacy systems or migration requirements
- Small user base (cohort of ~20-50) eliminates need for horizontal scaling, sharding, or CDN complexity in MVP
- Single-instance deployment keeps infrastructure simple
- No SSR — client-side SPA only (private app, no SEO needs)
- Modern evergreen browsers only — no IE/legacy polyfill burden
- Desktop-first with responsive fallback
- The codebase itself becomes a teaching artifact in later phases — clean separation of concerns matters more than in a typical project

### Cross-Cutting Concerns Identified

- **Authentication & Authorization:** Permeates every endpoint and WebSocket connection. Two roles (student/instructor) with distinct permissions across channels, messages, gallery cards, and admin functions.
- **Real-time Event Distribution:** WebSocket layer touches messaging, reactions, unread badges, and gallery card updates. Needs a unified event model.
- **Image Upload Pipeline:** Gallery cards require image upload, validation, sanitization, and storage — affects API design, storage architecture, and frontend form handling.
- **Theming:** Sorcerer's Apprentice aesthetic isn't just CSS — it includes system messages, error copy, empty states, and UI personality. Needs a content/copy strategy alongside visual theming.
- **Unread Tracking:** Per-channel read state per user — requires tracking last-read position and computing badges. Touches both the WebSocket layer and REST API.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack real-time web application (SPA + BaaS) based on project requirements analysis

### Starter Options Considered

**Option 1: Vite + React + TypeScript (SELECTED)**
- Lightweight SPA scaffolding with no SSR overhead
- Perfect match for "no SSR needed" requirement (private app, no SEO)
- Fast dev server with HMR, SWC compiler for build speed
- Deploys to Vercel as a static site

**Option 2: Next.js**
- Rejected: SSR/SSG capabilities are unnecessary for this private app
- Added complexity without matching benefit
- API routes would duplicate what Supabase provides

**Option 3: T3 Stack (create-t3-app)**
- Rejected: tRPC and Prisma are redundant when Supabase provides the API layer and database
- Over-engineered for a Supabase-backed SPA

### Selected Starter: Vite + React + TypeScript (SWC)

**Rationale for Selection:**
Simplest foundation that meets all requirements. Supabase handles the entire backend (auth, database, realtime, storage, search), so a lightweight SPA starter avoids unnecessary server-side complexity. SWC variant chosen for faster compilation.

**Initialization Command:**

```bash
npm create vite@latest magic-broom-chat -- --template react-swc-ts
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript with SWC compiler
- React 19 with modern hooks patterns
- ES modules throughout

**Styling Solution:**
- Tailwind CSS v4 (added post-scaffold via `@tailwindcss/vite` plugin)
- shadcn/ui component library (Radix primitives, copy-paste ownership)
- CSS custom properties for Sorcerer's Apprentice theme tokens

**Build Tooling:**
- Vite for development and production builds
- SWC for fast TypeScript transpilation
- Static output for Vercel deployment

**Testing Framework:**
- Vitest (Vite-native test runner)
- React Testing Library for component tests

**Code Organization:**
- Path aliases (`@/components`, `@/lib`, `@/hooks`)
- shadcn/ui component structure (`@/components/ui`)
- Feature-based organization for app code

**Development Experience:**
- Hot Module Replacement (HMR) via Vite
- TypeScript strict mode
- ESLint configuration

**Backend (Supabase — no separate server):**
- Supabase Auth: email/password authentication, JWT tokens, session management
- Supabase Database: PostgreSQL with Row Level Security for authorization
- Supabase Realtime: Broadcast channels for live messaging and presence
- Supabase Storage: Image upload for gallery cards with validation
- Supabase Edge Functions: Server-side logic (image processing, batch operations)
- PostgreSQL full-text search via tsvector

**State Management:**
- TanStack Query for server state (Supabase data fetching, caching, optimistic updates)
- Zustand for client-only state (UI state, theme, sidebar)

**Hosting:**
- Vercel for static SPA deployment (via Vercel CLI)
- Supabase hosted instance for all backend services

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Data access: Supabase-native PostgREST API with SQL migrations
- Realtime: Broadcast + Database Triggers (not postgres_changes)
- Auth: Supabase Auth with profiles table for role management
- RLS: Row Level Security policies for all data access
- Frontend routing: React Router

**Important Decisions (Shape Architecture):**
- Error handling: Consistent wrapper around Supabase errors + optimistic updates
- Component architecture: Feature-based folders with shared hooks
- Gallery/Chat: Same data model, type-driven renderer swap
- Local dev: supabase start (Docker) for local development

**Deferred Decisions (Post-MVP):**
- CDN/edge caching (not needed at cohort scale)
- Advanced monitoring/alerting (Supabase Dashboard sufficient)
- Rate limiting (50 users, not a concern)

### Data Architecture

- **Database:** Supabase PostgreSQL (managed)
- **Data Access:** Supabase PostgREST auto-generated API via supabase-js client — typed queries, no custom API layer
- **Edge Functions:** Reserved for server-side logic only (image validation, batch operations)
- **Migrations:** SQL migrations via supabase CLI, version-controlled in `supabase/migrations/`
- **Caching:** TanStack Query client-side caching with configurable stale times. No server-side cache needed at cohort scale.
- **Realtime Pattern:** Broadcast + Database Triggers
  - Write: Client → PostgREST insert → DB trigger → `realtime.broadcast_changes()` → subscribers notified
  - Read (live): Client subscribes to broadcast channel per room
  - Read (catch-up): Client queries DB for history on load/reconnect
  - Applied to: messages, reactions, gallery cards, comments, unread tracking
  - Private channels via `config: { private: true }`

### Authentication & Security

- **Auth Provider:** Supabase Auth — email/password signup, JWT tokens, session management
- **Role Management:** Profiles table with `role` column (`student` | `instructor`), not JWT custom claims
  - Rationale: Simpler to manage, role changes take effect immediately, profiles table needed anyway for display name + avatar
- **Authorization:** PostgreSQL Row Level Security (RLS) policies
  - Students: read joined channels/messages, insert own messages/cards/reactions
  - Instructors: all student permissions + channel config, message deletion, role management
- **Transport Security:** HTTPS/WSS enforced by Supabase and Vercel (default)
- **Password Hashing:** Supabase Auth bcrypt (default)
- **Token Expiry:** Configurable JWT expiry with refresh tokens
- **Image Upload Security:** Supabase Storage policies — file type whitelist, max file size

### API & Communication Patterns

- **Primary API:** Supabase PostgREST — auto-generated, typed via supabase-js
- **Realtime:** Supabase Broadcast + DB triggers (see Data Architecture)
- **Edge Functions:** Image validation/resizing, batch gallery card creation (FR27), future webhooks
- **Error Handling:** Consistent error wrapper around Supabase client errors. Realtime disconnects handled via built-in auto-reconnect with exponential backoff, then DB catch-up query.
- **Optimistic Updates:** TanStack Query mutations with optimistic UI for messages and reactions — show immediately, roll back on failure

### Frontend Architecture

- **Routing:** React Router
  - `/login`, `/signup` — auth pages
  - `/channels/:id` — chat or gallery view (determined by channel type)
  - `/channels/:id/card/:cardId` — gallery card detail
- **Component Architecture:** Feature-based folders
  - `features/auth`, `features/channels`, `features/gallery`, `features/search`
  - `components/ui` (shadcn), `components/shared`
  - `hooks/` for Supabase data hooks (`useMessages`, `useChannel`, `useRealtimeSubscription`)
- **State Management:**
  - TanStack Query: all server state (messages, channels, cards, user data)
  - Zustand: client-only state (sidebar, theme, UI preferences)
- **Gallery vs Chat Rendering:** Same channel data model with `type` field. `ChatView` and `GalleryView` as swappable content renderers in a shared layout shell.
- **Bundle Optimization:** Vite code splitting by route, lazy-loaded feature modules

### Infrastructure & Deployment

- **Hosting:** Vercel (static SPA) + Supabase (managed backend)
- **Deployment:** Vercel CLI (`vercel --prod`), preview deploys on PRs
- **Environment Config:** Vercel environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- **Local Development:** `supabase start` (Docker-based local instance), migrations in `supabase/migrations/`
- **CI/CD:** GitHub Actions — lint, type-check, test on PR. Auto-deploy to Vercel on merge to main.
- **Monitoring:** Supabase Dashboard (DB/auth/storage metrics) + Vercel Analytics (frontend performance). No additional tooling needed at cohort scale.

### Decision Impact Analysis

**Implementation Sequence:**
1. Project scaffold (Vite + React + TS + shadcn + Tailwind)
2. Supabase project setup + initial schema + RLS policies
3. Auth flow (signup/login/logout)
4. Channel data model + CRUD
5. Real-time messaging (broadcast + triggers)
6. Gallery channel type + card CRUD
7. Search
8. Unread tracking
9. Theming pass
10. Vercel deployment

**Cross-Component Dependencies:**
- Auth must be in place before any RLS-protected data access
- Channel model must exist before messaging or gallery features
- Realtime broadcast triggers depend on message/card table schemas
- Unread tracking depends on both messaging and the realtime subscription layer
