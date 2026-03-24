# Compound Engineering — Full MVP Implementation

**Date:** 2026-03-23
**Framework:** Compound Engineering (`ce-work` skill)
**Phase:** Implementation (all 8 phases)

## What Happened

Executed the full implementation plan across 8 phases, from empty folder to working chat app:

1. **Scaffolding** — Vite 8 + React 19 + TypeScript + Tailwind v4 + shadcn/ui
2. **Database Schema + RLS** — All tables, policies, triggers via Supabase MCP (schema-first)
3. **Authentication** — Email/password + GitHub OAuth, AuthContext, AuthGuard
4. **Channels** — Sidebar, create (public/private), browse, join, unread tracking
5. **Messaging** — Real-time via Broadcast + DB trigger, optimistic sends, edit/delete, pagination
6. **Presence** — Online/offline via Supabase Realtime Presence, typing via Broadcast
7. **Search** — Postgres FTS via RPC, enriched results with channel/sender info
8. **Polish** — Inter font, warm theme tokens, Vercel SPA config (deployment deferred)

## Key Decisions During Implementation

- **Typing indicators use Broadcast, not Presence** — Supabase docs warn Presence has computational overhead; Broadcast is fire-and-forget
- **Single global presence channel** — not per-room, to minimize overhead
- **GithubIcon as inline SVG** — lucide-react doesn't export a GitHub brand icon
- **shadcn/ui path alias fix** — `npx shadcn add` wrote to literal `@/` dir instead of resolving the alias; had to move files manually
- **Schema migrations split** — RLS policies referencing `channel_members` had to go in a separate migration from the table creation (forward reference)

## Time/Effort

- ~25 minutes wall clock for all 8 phases
- 8 sequential commits, one per phase
- The Compound Engineering workflow (ideate → brainstorm → plan → work) front-loaded decisions so implementation was straightforward — no mid-build pivots
- Supabase MCP made schema work fast — applied 7 migrations without leaving the editor

## Noteworthy

- The schema-first approach paid off. By the time I wrote React components, the TypeScript types were already generated from the live schema. No type mismatches.
- The `AskUserQuestion` tool in earlier phases (ideation/brainstorm) made product decisions fast and interactive. By the time we hit implementation, there was nothing left to decide.
- The Compound Engineering plugin's workflow (`ce-ideate` → `ce-brainstorm` → `ce-plan` → `ce-work`) creates a clear artifact trail: ideation doc → requirements doc → plan doc → code. Each step builds on the last without re-deriving decisions.

## What's Next

- Deployment (deferred — Vercel config is ready)
- GitHub OAuth app registration and configuration
- Live testing with real users
- Consider adding InviteMemberDialog for private channels (UI exists in plan, not yet built)
