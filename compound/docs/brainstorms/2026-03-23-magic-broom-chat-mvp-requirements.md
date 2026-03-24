---
date: 2026-03-23
topic: magic-broom-chat-mvp
---

# Magic Broom Chat — MVP Requirements

## Problem Frame

Students in an AI-assisted development course need a real-time team chat application to learn and practice with. The app should be functional enough to actually use in a classroom setting — channels, real-time messaging, presence, and search — while serving as a teaching artifact for how modern web apps are built with AI assistance.

## Requirements

### Authentication
- R1. Users can sign up and log in with email + password
- R2. Users can sign up and log in with GitHub OAuth
- R3. Users land on a logged-in home view after auth; unauthenticated users see a login/signup page
- R4. Users can log out

### Channels
- R5. Users can create public channels (visible and joinable by anyone)
- R6. Users can create private channels (visible only to members, join by invite)
- R7. Users can browse and join public channels
- R8. New users are auto-joined to a #general channel on first login
- R9. Channel list in sidebar shows joined channels, with unread indicators

### Messaging
- R10. Users can send text messages in any channel they've joined
- R11. Messages appear in real time for all channel members (Broadcast + DB trigger pattern)
- R12. Messages persist and load on channel open (with Broadcast replay for catch-up)
- R13. Messages display sender name, avatar, and timestamp
- R14. Optimistic send — message appears immediately, with inline retry on failure

### Presence
- R15. Users appear as online/offline in the sidebar or member list (Supabase Realtime Presence)
- R16. Typing indicators show when someone is composing a message in the current channel

### Search
- R17. Users can search across messages in channels they belong to (Postgres full-text search)
- R18. Search results show the message, sender, channel, and timestamp with a link to context

### Data Model
- R19. Messages table includes a nullable `parent_id` for future threading (no threading UI in MVP)
- R20. Channel membership is an explicit join table with `role` and `joined_at`
- R21. All authorization enforced via Postgres Row Level Security policies

## Success Criteria

- A user can sign up, land in #general, send a message, and see it appear in real time — in under 60 seconds of first visit
- Two users in the same channel see each other's messages and presence without page refresh
- Search returns relevant messages from joined channels
- Private channels are invisible to non-members (enforced at DB level, not just UI)

## Scope Boundaries

- **No threading UI** — data model supports it, UI does not
- **No file uploads or media** — text messages only
- **No notifications** — no email, push, or desktop notifications
- **No user profiles or settings** — just display name and avatar from auth provider
- **No admin panel** — channel management happens inline
- **No mobile-specific layout** — responsive is fine, but no native or PWA features

## Key Decisions

- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase only (auth, database, realtime, storage) — no custom server
- **Realtime messaging:** Broadcast + DB triggers via `realtime.broadcast_changes()`, not `postgres_changes`
- **Presence:** Supabase Realtime Presence (ephemeral, CRDT-based) — not a heartbeat table
- **Search:** Postgres `tsvector` + `tsquery` via RPC function — no external service
- **Auth methods:** Email/password + GitHub OAuth
- **Channel model:** Public + private, with explicit membership join table
- **Visual tone:** Warm + inviting — earthy tones, friendly typography, approachable classroom feel
- **Schema-first:** Design and deploy DB schema via Supabase MCP before writing frontend code
- **RLS-first:** Write Row Level Security policies before application code

## Dependencies / Assumptions

- Supabase project exists and MCP tools are configured
- GitHub OAuth app registered for auth
- Deployment target TBD during planning

## Outstanding Questions

### Deferred to Planning
- [Affects R13][Needs research] Avatar source — use Supabase auth metadata, Gravatar, or generated avatars?
- [Affects R9][Technical] Unread tracking strategy — per-channel last-read timestamp in membership table, or separate tracking?
- [Affects R6][Technical] Private channel invite flow — how does the inviter add members? Direct invite, or share link?
- [Affects R14][Technical] Optimistic UI reconciliation — use local UUID replaced by server ID, or Supabase's `returning` pattern?
- [Technical] Deployment target — Vercel, Netlify, or Cloudflare Pages?

## Next Steps

→ `/ce:plan` for structured implementation planning
