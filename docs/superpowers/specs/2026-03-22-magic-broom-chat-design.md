# Magic Broom Chat — Design Spec

**Date:** 2026-03-22
**Framework:** Superpowers
**Status:** Draft

## Overview

A Zulip-inspired real-time team chat web app. MVP delivers channel-based messaging with user authentication, presence, and search. Topic-based threading is a future goal, not part of this spec.

## Tech Stack

- **Frontend:** React (Vite) + TailwindCSS + TypeScript
- **Backend:** Supabase (Postgres + Auth + Realtime)
- **Architecture:** No custom backend — React talks directly to Supabase with Row Level Security (RLS)

## Data Model

Four tables:

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, references auth.users |
| username | text | unique, not null |
| avatar_url | text | nullable |
| status | text | 'online' / 'idle' / 'offline', default 'offline' |
| created_at | timestamptz | default now() |

### channels
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | unique, not null |
| description | text | nullable |
| created_by | uuid | FK → profiles.id |
| created_at | timestamptz | default now() |

### channel_members
| Column | Type | Notes |
|--------|------|-------|
| channel_id | uuid | FK → channels.id, part of composite PK |
| user_id | uuid | FK → profiles.id, part of composite PK |
| joined_at | timestamptz | default now() |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| channel_id | uuid | FK → channels.id, not null |
| user_id | uuid | FK → profiles.id, not null |
| content | text | not null |
| created_at | timestamptz | default now() |

**Indexes:** `messages(channel_id, created_at)` for efficient message history queries. Full-text search index on `messages.content` for search functionality.

**RLS policies:**
- Profiles: users can read all profiles, update only their own
- Channels: all authenticated users can read and create channels
- Channel members: users can read all memberships, insert/delete only their own
- Messages: users can read messages in channels they belong to, insert messages only in channels they belong to

## UI Layout

Three-column layout that collapses responsively.

### Desktop (>= 1024px)

| Sidebar (256px fixed) | Message Area (flexible) | Member List (200px, collapsible) |
|---|---|---|

### Tablet (768-1023px)
- Sidebar becomes a slide-out drawer (hamburger toggle)
- Member list hidden behind a toggle
- Message area takes full width

### Mobile (< 768px)
- Full-screen views that stack: Channel List -> Message View -> Member List
- Bottom nav or swipe gestures to navigate between views

### Sidebar contents (top to bottom)
1. App logo / workspace name
2. User avatar + status indicator (online/idle/offline)
3. Search input
4. Channel list (joined channels, with unread counts)
5. "Browse channels" link
6. Sign out button at bottom

### Message area
1. Channel header (name, description, member count, member list toggle, "Leave" button)
2. Scrollable message list (infinite scroll upward for history)
3. Message input bar pinned to bottom (text input + send button, no file uploads in MVP)

### Key interactions
- New messages auto-scroll to bottom only if already scrolled to bottom
- Unread indicator ("X new messages") when scrolled up and new messages arrive
- Presence dots on user avatars (green = online, yellow = idle, gray = offline)
- Leave channel: "Leave" button in channel header removes membership, navigates to next joined channel (or browse view if none left)
- Search result click: navigates to that channel and scrolls to the message with a brief highlight

## Component Structure

### File organization

```
src/
  components/
    auth/          # Login, SignUp, AuthGuard
    layout/        # AppShell, Sidebar, MemberList
    channels/      # ChannelList, ChannelItem, BrowseChannels, CreateChannel
    messages/      # MessageList, MessageItem, MessageInput, UnreadBanner
    presence/      # PresenceIndicator, UserAvatar
    search/        # SearchInput, SearchResults
    ui/            # Shared primitives (Button, Modal, Spinner, ErrorMessage)
  hooks/
    useAuth.ts         # Auth state + sign in/out/up
    useChannels.ts     # Channel CRUD + membership
    useMessages.ts     # Fetch, send, realtime subscription
    usePresence.ts     # Track + broadcast presence
    useSearch.ts       # Message search
  lib/
    supabase.ts        # Supabase client init
    types.ts           # DB types (generated from Supabase)
  pages/
    LoginPage.tsx
    ChatPage.tsx       # Main app shell after auth
```

### Component tree

```
<AuthGuard>
  <AppShell>
    <Sidebar>
      <UserAvatar />
      <SearchInput />
      <ChannelList>
        <ChannelItem />  (x n)
      </ChannelList>
    </Sidebar>
    <MessageArea>
      <ChannelHeader />
      <MessageList>
        <MessageItem />  (x n)
        <UnreadBanner />
      </MessageList>
      <MessageInput />
    </MessageArea>
    <MemberList>       (collapsible)
      <UserAvatar />  (x n)
    </MemberList>
  </AppShell>
</AuthGuard>
```

### Key decisions
- **Custom hooks own all Supabase logic** — components never call Supabase directly. Keeps components as pure UI and simplifies testing.
- **AuthGuard** wraps the entire app — redirects to LoginPage if not authenticated, renders ChatPage if authenticated.
- **No global state library** — React context for auth state, custom hooks with useState/useEffect for everything else. Supabase's realtime subscriptions handle the "shared state" problem. Zustand can be added later if needed.
- **`ui/` folder for shared primitives** — keeps component folders focused on domain logic.

## Error Handling

### Auth errors
- Supabase session expires: `useAuth` detects it, redirects to login with a toast ("Session expired, please sign in again")
- Sign up / login failures: inline error below the form field (e.g., "Email already registered", "Invalid credentials")

### Network and realtime
- Supabase realtime disconnects: subtle banner at the top of the message area ("Reconnecting...") that auto-dismisses when the connection restores. Supabase's client handles reconnection automatically — we reflect the state.
- Failed message send: keep the message in the input, show inline error ("Couldn't send — try again")
- No optimistic UI for MVP — messages appear when the server confirms via the realtime subscription. Simpler, avoids rollback complexity.

### Data loading
- Spinner states for initial channel list load and message history fetch
- Empty states: "No channels yet — create one!" / "No messages in this channel"
- Failed channel fetch: error message with retry button

### React Error Boundary
- One top-level error boundary wrapping `<AppShell>` that catches render crashes and shows a "Something went wrong — reload" fallback
- Not per-component — overkill for MVP

### Explicitly out of scope
- No optimistic updates
- No offline support / queue
- No retry logic beyond Supabase client's built-in behavior

## Testing

### Tools
Vitest + React Testing Library

### What we test
- **Custom hooks** — core logic lives here. `useAuth`, `useChannels`, `useMessages` each get tests with a mocked Supabase client. Verify correct state transitions: loading -> data, loading -> error, realtime subscription setup/teardown.
- **Key user flows via component tests** — integration-style tests with React Testing Library:
  - Login form submits credentials, shows errors on failure
  - Channel list renders channels, clicking one updates the message area
  - Message input sends a message
- **RLS policies** — tested manually via Supabase dashboard SQL editor during development. Not automated in MVP.

### What we skip
- No E2E tests (Playwright/Cypress) — valuable but heavy for MVP
- No snapshot tests — brittle, low signal for a fast-moving MVP
- No testing of pure UI primitives
- No testing of Supabase client initialization

### Philosophy
Test the logic that could break in non-obvious ways (hooks with async state + subscriptions). Don't test what Supabase and React already guarantee. Keep the test suite small enough that it actually gets run.

## MVP Feature Summary

1. **Authentication:** Sign up, log in, log out via Supabase Auth
2. **Channels:** Create, join, browse, leave channels
3. **Real-time messaging:** Send and receive messages in channels with Supabase Realtime
4. **Presence:** Supabase Presence (ephemeral) is the live source of truth; `profiles.status` is updated on connect/disconnect to reflect last-known state
5. **Search:** Full-text search across messages using Postgres full-text search

## Out of Scope (Future)

- Topic-based threading (Zulip's key differentiator)
- File uploads / media attachments
- Message editing / deletion
- Reactions / emoji
- Direct messages
- Notifications (push/email)
- Admin roles / moderation
- Optimistic UI updates
- Offline support
