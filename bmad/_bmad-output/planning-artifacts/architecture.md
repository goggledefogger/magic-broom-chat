---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-22'
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
  - `/login`, `/signup`, `/forgot-password` — auth pages
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

## Implementation Patterns & Consistency Rules

### Critical Conflict Points Identified

12 areas where AI agents could make different choices, organized into 5 categories below.

### Naming Patterns

**Database Naming Conventions (PostgreSQL/Supabase):**
- Tables: `snake_case`, plural — `channels`, `messages`, `gallery_cards`, `channel_members`
- Columns: `snake_case` — `created_at`, `channel_id`, `user_id`
- Foreign keys: `{referenced_table_singular}_id` — `channel_id`, `user_id`
- Indexes: `idx_{table}_{columns}` — `idx_messages_channel_id`
- RLS policies: `{table}_{action}_{role}` — `messages_insert_authenticated`
- Enums: `snake_case` — `channel_type`, values like `'standard'`, `'gallery'`

**TypeScript/React Code Naming Conventions:**
- Components: `PascalCase` files and exports — `ChatView.tsx`, `GalleryCard.tsx`
- Hooks: `camelCase` with `use` prefix — `useMessages.ts`, `useChannel.ts`
- Utilities: `camelCase` — `formatDate.ts`, `supabaseClient.ts`
- Types/interfaces: `PascalCase`, no `I` prefix — `Channel`, `Message`, `GalleryCard`
- Variables/functions: `camelCase` — `channelId`, `handleSendMessage`
- Constants: `UPPER_SNAKE_CASE` — `MAX_FILE_SIZE`, `SUPPORTED_IMAGE_TYPES`
- Directories: `kebab-case` — `features/`, `components/ui/`

**Supabase ↔ TypeScript Boundary:**
- Database returns `snake_case`, TypeScript uses `camelCase`
- Transform at the data layer (inside hooks), never in components
- Use Supabase-generated types as the source of truth, derive app types from them

### Structure Patterns

**Project Organization:**
- Feature-based folders: `features/{name}/` contains components, hooks, types for that feature
- Tests: co-located — `ChatView.test.tsx` next to `ChatView.tsx`
- Shared hooks: `hooks/` at project root
- Shared components: `components/shared/` for app-wide reusable components, `components/ui/` for shadcn
- Supabase types: auto-generated via `supabase gen types typescript` into `lib/database.types.ts`
- One component per file, one hook per file

**File Structure Patterns:**
- Environment: `.env.local` for local dev (gitignored), Vercel dashboard for production
- Supabase migrations: `supabase/migrations/{timestamp}_{description}.sql`
- Static assets: `public/` for favicons/manifest, component-level imports for images

### Format Patterns

**API Response Formats:**
- Supabase PostgREST handles response structure — no custom wrapper
- Edge Functions return `{ data, error }` matching supabase-js conventions
- HTTP status codes: 200 success, 201 created, 400 bad request, 401 unauthorized, 403 forbidden, 404 not found

**Data Exchange Formats:**
- Dates: ISO 8601 strings in DB (`timestamptz`), formatted in UI via shared `formatDate` util
- IDs: UUIDs (Supabase default for `auth.users`, used across all tables)
- Booleans: `true`/`false` (native PostgreSQL/JSON)
- Nulls: explicit `null` in JSON, never `undefined` for DB fields

### Communication Patterns

**Realtime Event Patterns:**
- Channel names: `room:{channel_id}:messages`, `room:{channel_id}:reactions`, `room:{channel_id}:cards`
- Broadcast events: past-tense verbs — `message_created`, `message_deleted`, `reaction_added`, `card_created`, `card_updated`
- Payload: full row data from `realtime.broadcast_changes()` trigger
- Private channels: always use `config: { private: true }`
- Cleanup: `supabase.removeChannel()` in useEffect cleanup

**State Management Patterns:**
- TanStack Query keys: hierarchical arrays — `['channels']`, `['channels', channelId]`, `['messages', channelId]`
- Zustand stores: one store per concern — `useUIStore`, `useThemeStore`
- No direct Supabase calls in components — always through custom hooks
- Optimistic updates: via TanStack Query `onMutate` / `onError` rollback pattern

### Process Patterns

**Error Handling Patterns:**
- Supabase errors wrapped via `handleSupabaseError()` util returning user-friendly messages
- React Error Boundaries at route level for crash recovery
- Themed error messages using Sorcerer's Apprentice voice
- Console errors in development only, never in production builds

**Loading State Patterns:**
- TanStack Query `isLoading` / `isPending` for all server state
- Skeleton components for initial data loads
- Inline spinners for user-initiated actions (send message, upload image)
- No full-page loading screens after initial app load

### Enforcement Guidelines

**All AI Agents MUST:**
- Run `supabase gen types typescript` after any migration to keep types in sync
- Co-locate tests with the code they test
- Transform snake_case ↔ camelCase in hooks, never in components
- Use TanStack Query for all Supabase data access, never raw `supabase.from()` in components
- Follow the event naming conventions for all broadcast events

**Anti-Patterns (Never Do This):**
- Direct Supabase calls in React components
- Mixing snake_case and camelCase in the same layer
- Creating a custom API wrapper when PostgREST handles it
- Using `postgres_changes` instead of Broadcast + DB triggers
- Storing UI state in TanStack Query or server state in Zustand

## Project Structure & Boundaries

### Complete Project Directory Structure

```
magic-broom-chat/
├── .env.local                          # Local Supabase URL + anon key (gitignored)
├── .env.example                        # Template for required env vars
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                      # Lint, type-check, test on PR
├── index.html                          # Vite entry HTML
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts                      # Vite + SWC + Tailwind plugins, path aliases
├── eslint.config.js
├── components.json                     # shadcn/ui configuration
├── public/
│   ├── favicon.svg
│   └── manifest.json
├── supabase/
│   ├── config.toml                     # Local Supabase config
│   ├── migrations/
│   │   ├── 00001_create_profiles.sql   # profiles table + trigger on auth.users
│   │   ├── 00002_create_channels.sql   # channels table + channel_members
│   │   ├── 00003_create_messages.sql   # messages + broadcast trigger
│   │   ├── 00004_create_gallery.sql    # gallery_cards + comments + broadcast triggers
│   │   ├── 00005_create_reactions.sql  # reactions table + broadcast trigger
│   │   ├── 00006_create_search.sql     # tsvector indexes for full-text search
│   │   └── 00007_create_rls.sql        # RLS policies for all tables
│   └── seed.sql                        # Default channels + test data for local dev
├── src/
│   ├── main.tsx                        # App entry point
│   ├── App.tsx                         # Router setup + auth provider
│   ├── index.css                       # Tailwind directives + theme tokens
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client singleton
│   │   ├── database.types.ts           # Auto-generated: supabase gen types typescript
│   │   ├── utils.ts                    # shadcn cn() util + shared helpers
│   │   └── errors.ts                   # handleSupabaseError() wrapper
│   ├── hooks/
│   │   ├── useAuth.ts                  # Auth state, login, signup, logout
│   │   ├── useProfile.ts              # Profile CRUD + role checking
│   │   ├── useChannels.ts             # Channel list, join, leave, create
│   │   ├── useMessages.ts            # Messages for a channel + send
│   │   ├── useGalleryCards.ts         # Gallery card CRUD
│   │   ├── useReactions.ts            # Add/remove reactions
│   │   ├── useSearch.ts               # Full-text search
│   │   ├── useUnreadCounts.ts         # Per-channel unread badges
│   │   └── useRealtimeSubscription.ts # Generic broadcast subscription hook
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components (Button, Card, Input, etc.)
│   │   └── shared/
│   │       ├── AppLayout.tsx           # Sidebar + content area shell
│   │       ├── ProtectedRoute.tsx      # Auth guard wrapper
│   │       ├── ErrorBoundary.tsx       # Route-level error boundary
│   │       ├── LoadingSkeleton.tsx     # Reusable skeleton component
│   │       ├── EmojiPicker.tsx         # Shared emoji picker for reactions
│   │       └── ThemeProvider.tsx       # Sorcerer's Apprentice theme context
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx           # FR1, FR2
│   │   │   ├── SignupPage.tsx          # FR1
│   │   │   ├── ForgotPasswordPage.tsx  # FR5 — password recovery via Supabase Auth
│   │   │   ├── LoginPage.test.tsx
│   │   │   ├── SignupPage.test.tsx
│   │   │   └── ForgotPasswordPage.test.tsx
│   │   ├── channels/
│   │   │   ├── ChannelList.tsx         # FR6 — sidebar channel list
│   │   │   ├── ChannelHeader.tsx       # Channel name, description, settings
│   │   │   ├── ChannelSettings.tsx     # FR12 — instructor channel config
│   │   │   ├── CreateChannelDialog.tsx # FR7 — new channel form
│   │   │   ├── ChatView.tsx            # FR9, FR10 — standard message stream
│   │   │   ├── MessageItem.tsx         # Single message with reactions
│   │   │   ├── MessageInput.tsx        # Compose + send message
│   │   │   ├── ChannelList.test.tsx
│   │   │   ├── ChatView.test.tsx
│   │   │   └── types.ts               # Channel, Message, ChannelMember types
│   │   ├── gallery/
│   │   │   ├── GalleryView.tsx         # FR15 — visual card grid
│   │   │   ├── GalleryCard.tsx         # FR14 — image + title + description + link
│   │   │   ├── GalleryCardDetail.tsx   # FR19 — full card with comments
│   │   │   ├── CreateCardDialog.tsx    # FR14 — new gallery card form
│   │   │   ├── CardComments.tsx        # FR16 — comments on a card
│   │   │   ├── GalleryView.test.tsx
│   │   │   ├── GalleryCard.test.tsx
│   │   │   └── types.ts               # GalleryCard, CardComment types
│   │   ├── search/
│   │   │   ├── SearchBar.tsx           # FR20 — search input
│   │   │   ├── SearchResults.tsx       # FR21 — results with context
│   │   │   ├── SearchResults.test.tsx
│   │   │   └── types.ts               # SearchResult type
│   │   └── profile/
│   │       ├── ProfilePage.tsx         # FR3 — edit display name, avatar
│   │       ├── ProfilePage.test.tsx
│   │       └── types.ts               # Profile type
│   └── stores/
│       ├── uiStore.ts                  # Sidebar open/closed, active modal
│       └── themeStore.ts               # Theme preferences
└── vitest.config.ts                    # Test configuration
```

### Architectural Boundaries

**Data Boundary (Supabase):**
- All data access goes through `hooks/` → `lib/supabase.ts` → Supabase PostgREST
- Components never import `supabase` directly
- RLS policies are the authorization layer — no app-level permission checks needed beyond role display

**Component Boundaries:**
- `features/` folders are self-contained — a feature imports from `hooks/`, `components/ui/`, `components/shared/`, and its own `types.ts`
- Features never import from other features directly — shared state goes through hooks or stores
- `components/shared/` is the only cross-feature component layer

**Realtime Boundary:**
- `useRealtimeSubscription` is the single hook managing broadcast subscriptions
- Feature hooks (`useMessages`, `useGalleryCards`) compose it internally
- TanStack Query cache is the integration point — realtime events invalidate/update queries

### Requirements to Structure Mapping

| FR Category | Feature Folder | Key Files | DB Tables |
|---|---|---|---|
| User Management (FR1-5) | `features/auth/`, `features/profile/` | LoginPage, SignupPage, ForgotPasswordPage, ProfilePage | `profiles` |
| Channels (FR6-8, FR12-13) | `features/channels/` | ChannelList, ChannelSettings, CreateChannelDialog | `channels`, `channel_members` |
| Messaging (FR9-11) | `features/channels/` | ChatView, MessageItem, MessageInput | `messages`, `reactions` |
| Gallery (FR14-19) | `features/gallery/` | GalleryView, GalleryCard, GalleryCardDetail, CardComments | `gallery_cards`, `card_comments` |
| Search (FR20-21) | `features/search/` | SearchBar, SearchResults | tsvector indexes |
| Notifications (FR22-23) | `hooks/useUnreadCounts.ts` | ChannelList (badge display) | `channel_members.last_read_at` |
| Theming (FR24-25) | `components/shared/ThemeProvider.tsx`, `index.css` | All components via Tailwind theme tokens | — |
| Admin (FR26-28) | `features/channels/` | ChannelSettings, CreateCardDialog (batch mode) | RLS policies |

### Data Flow

```
User Action → Component → Hook → Supabase PostgREST → PostgreSQL
                                                         ↓
                                                    DB Trigger
                                                         ↓
                                                  Broadcast Event
                                                         ↓
                                              useRealtimeSubscription
                                                         ↓
                                              TanStack Query Cache
                                                         ↓
                                                  Component Re-render
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Vite + React 19 + TypeScript + SWC is a standard combination. shadcn/ui works natively with Tailwind v4 and Vite. TanStack Query and Zustand have no conflicts. Supabase Realtime Broadcast is the current recommended approach per Supabase docs (not the deprecated postgres_changes).

**Pattern Consistency:** Naming conventions are internally consistent — snake_case in PostgreSQL, camelCase in TypeScript, PascalCase for components. The transform boundary is clearly defined at the hooks layer. Event naming follows a single convention (past-tense verbs, snake_case).

**Structure Alignment:** Feature-based folders map cleanly to FR categories. The hooks layer enforces the data boundary. Co-located tests match pattern decisions. No circular dependencies between features.

### Requirements Coverage Validation

**Functional Requirements:** All 28 FRs have architectural support. Every FR maps to a specific feature folder, database table, and component. FR5 (password recovery) now has an explicit ForgotPasswordPage component.

**Non-Functional Requirements:** All covered:
- Performance: Vite code splitting, Supabase Broadcast (<500ms), TanStack Query caching
- Security: Supabase Auth (bcrypt, JWT), RLS policies, Vercel HTTPS/WSS, Storage file validation
- Scalability: Single Supabase instance handles 50 concurrent users comfortably
- Accessibility: shadcn/ui Radix primitives provide keyboard nav and ARIA by default
- Reliability: DB-first write pattern guarantees no message loss; Supabase auto-reconnect handles disconnects

### Implementation Readiness Validation

**Decision Completeness:** All critical decisions documented with rationale. Technology stack fully specified. Implementation patterns cover naming, structure, format, communication, and process.

**Structure Completeness:** Complete project tree with every file mapped to specific FRs. Integration points clearly specified. Component boundaries well-defined with explicit rules (no cross-feature imports, no direct Supabase calls in components).

**Pattern Completeness:** All potential conflict points addressed. Anti-patterns explicitly listed. Enforcement guidelines documented.

### Gap Analysis Results

**Critical Gaps:** None found.

**Minor Items (not blocking):**
- E2E test structure: can be added when E2E tests are introduced
- Image resizing strategy: Edge Function placeholder exists, implementation details deferred to story level
- CI/CD workflow contents: standard pipeline, details deferred to scaffolding story

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with rationale
- [x] Technology stack fully specified
- [x] Integration patterns defined (Broadcast + DB triggers)
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established (DB, API, code)
- [x] Structure patterns defined (feature-based, co-located tests)
- [x] Communication patterns specified (realtime events, query keys)
- [x] Process patterns documented (error handling, loading states)

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High — all 28 FRs covered, no critical gaps, technology choices well-validated

**Key Strengths:**
- Supabase eliminates backend server complexity — fewer moving parts, less code to maintain
- Broadcast + DB triggers pattern is the current Supabase recommendation, avoids deprecated APIs
- Feature-based structure with clear boundaries will support student contributions in later phases
- shadcn/ui provides WCAG AA accessibility with minimal effort

**Areas for Future Enhancement:**
- E2E testing framework selection (Playwright recommended when needed)
- Image optimization pipeline details in Edge Functions
- Rate limiting if app opens beyond cohort use
- Monitoring upgrade if scale increases

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- When in doubt, check the Anti-Patterns section

**First Implementation Priority:**
```bash
npm create vite@latest magic-broom-chat -- --template react-swc-ts
```
Then: Tailwind v4 + shadcn/ui setup, Supabase project creation, initial schema migrations
