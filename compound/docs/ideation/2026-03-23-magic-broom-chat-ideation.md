---
date: 2026-03-23
topic: magic-broom-chat-kickoff
focus: how to approach building Magic Broom Chat from scratch
---

# Ideation: Magic Broom Chat — Kickoff Architecture

## Codebase Context

- `compound/` is greenfield — only CLAUDE.md and settings exist
- Building a Zulip-like real-time web chat app (MVP: auth, channels, real-time messaging, presence, basic search)
- Tech stack is open; web only; clean/functional UI over polish
- Supabase MCP tools are available in the development environment
- Supabase Realtime docs confirm: **Broadcast** (not `postgres_changes`) is the right pattern for chat messaging

### Supabase Realtime Findings

Reviewing the current docs revealed critical architecture guidance:

- **Broadcast** supports client, REST API, and database-triggered sends via `realtime.send()` and `realtime.broadcast_changes()`
- **Broadcast has built-in persistence** — messages stored in `realtime.messages` (auto-deleted after 3 days)
- **Broadcast supports replay** — private channels can replay missed messages with a `since` timestamp
- **Postgres Changes is a performance bottleneck** — RLS checks run on a single thread per change per subscriber; docs discourage it for high-volume use cases like chat
- **Presence** is CRDT-based, auto-cleans on disconnect, supports custom payloads (typing indicators, online status)

Correct messaging pattern: write to own `messages` table + DB trigger calls `realtime.broadcast_changes()` for delivery. Use Broadcast replay for catching up.

## Ranked Ideas

### 1. Supabase-First, Zero Backend
**Description:** Use Supabase as the entire backend — auth, database, realtime, storage. No Express/Node server. Edge Functions only if needed for webhooks or non-database side effects.
**Rationale:** Eliminates an entire infrastructure layer. The MVP feature set maps cleanly to Supabase primitives. Fastest path to end-to-end working.
**Downsides:** Tight coupling to Supabase; custom server-side logic requires Edge Functions (Deno runtime, cold starts).
**Confidence:** 90%
**Complexity:** Low
**Status:** Unexplored

### 2. Schema-First Development via Supabase MCP
**Description:** Design and deploy the entire database schema (tables, constraints, RLS policies, indexes) before writing any frontend code. Use the Supabase MCP tools to iterate on the schema directly.
**Rationale:** Prevents the common AI-assisted-dev failure of UI-driven schemas. The database communicates the domain model; the UI is a projection of it.
**Downsides:** Requires discipline to not jump to UI; schema decisions made early can feel abstract.
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

### 3. RLS as the Authorization Layer
**Description:** Encode all permission rules in Postgres Row Level Security policies — not in application code. Write policies before UI code.
**Rationale:** Impossible to accidentally bypass. Supabase Realtime subscriptions also respect RLS, so feeds automatically scope correctly. High educational value.
**Downsides:** RLS debugging is harder than app-code debugging; complex policies can impact query performance.
**Confidence:** 85%
**Complexity:** Medium
**Status:** Unexplored

### 4. Broadcast + DB Trigger for Messaging (Not postgres_changes)
**Description:** Write messages to a `messages` table, use a Postgres trigger to call `realtime.broadcast_changes()` for delivery. Use Broadcast's replay feature for catching up on missed messages. Do NOT use `postgres_changes` for the message feed.
**Rationale:** `postgres_changes` has a single-threaded RLS bottleneck that makes it unsuitable for chat at any real scale. Broadcast is purpose-built for this. Replay eliminates the "missed messages between fetch and subscribe" race condition.
**Downsides:** Slightly more setup (trigger + broadcast config); replay has a 3-day window on the built-in `realtime.messages` table.
**Confidence:** 90%
**Complexity:** Medium
**Status:** Unexplored

### 5. Presence via Supabase Realtime Presence
**Description:** Use Supabase Realtime's built-in Presence feature for online/typing indicators instead of writing heartbeat timestamps to a DB table.
**Rationale:** Heartbeat tables create write amplification. Realtime Presence is push-based, auto-cleans on disconnect, and doesn't touch Postgres at all.
**Downsides:** Ephemeral — doesn't survive full reconnects without re-sync; less familiar pattern.
**Confidence:** 80%
**Complexity:** Medium
**Status:** Unexplored

### 6. Thread-Ready Data Model from Day One
**Description:** Add `parent_id uuid references messages(id)` as a nullable column on the messages table in the initial migration. No threading UI in MVP.
**Rationale:** Threading is Zulip's defining feature and a stated future goal. Retrofitting threading is the most painful migration in chat apps. A null column costs nothing.
**Downsides:** Mild schema complexity for a feature not yet built.
**Confidence:** 80%
**Complexity:** Low
**Status:** Unexplored

### 7. Postgres Full-Text Search (No External Service)
**Description:** Add a generated `tsvector` column to messages, updated via trigger, queried through a Supabase RPC function. No Algolia, no Elasticsearch.
**Rationale:** "Basic search" is the MVP spec. Postgres FTS handles thousands of messages easily, keeps the stack minimal, and is a high-value teachable pattern.
**Downsides:** Quality degrades at scale; ranking/highlighting requires more work than a hosted service.
**Confidence:** 85%
**Complexity:** Low
**Status:** Unexplored

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Custom CSS properties, no component library | Fights "functional UI over polish" constraint; too expensive for MVP |
| 2 | Subscribe-first, query never (postgres_changes for hydration) | postgres_changes has single-threaded RLS bottleneck; docs discourage for chat |
| 3 | URL-driven state without router library | Adds friction; standard router is more transferable |
| 4 | Message input as state machine | Good but too implementation-detailed for ideation |
| 5 | Single-file canonical schema.sql | Nice-to-have, not strategic |
| 6 | Edge Functions for search API | Over-engineering when direct FTS via RPC works |
| 7 | Radix + Tailwind, no component lib | Library choice belongs in brainstorming |
| 8 | Recursive CTE for threading | Premature when threading UI isn't in MVP |
| 9 | Channel subscriptions as mental model | Too vague to act on |
| 10 | Multi-tenant demo seed data | Creative but premature |
| 11 | Channels as Postgres schemas | Unnecessary complexity |
| 12 | Hybrid presence (broadcast + DB heartbeat) | Adds complexity over pure Realtime Presence for no MVP benefit |
| 13 | Optimistic UI with visible failure states | Good UX idea but implementation-level, not architecture-level |

## Session Log
- 2026-03-23: Initial ideation — 40 candidates generated across 5 parallel agents, 7 survived adversarial filtering. Supabase Realtime docs review corrected the messaging architecture (Broadcast + DB trigger, not postgres_changes).
- 2026-03-23: All 7 ideas explored via brainstorm → requirements doc at `docs/brainstorms/2026-03-23-magic-broom-chat-mvp-requirements.md`
