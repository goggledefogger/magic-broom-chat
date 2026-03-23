# 007 — Superpowers Design Spec Complete

**Date:** 2026-03-22
**Framework:** superpowers
**Phase:** Brainstorming → Spec written

## What Happened

Completed all remaining brainstorming design sections and consolidated them into a spec document at `docs/superpowers/specs/2026-03-22-magic-broom-chat-design.md` (225 lines, committed).

## Design Sections Completed This Session

All four sections were proposed by Claude and approved without changes:

1. **UI Layout** — Three-column responsive layout (sidebar / messages / member list) with tablet drawer and mobile full-screen stacking
2. **Component Structure** — File organization under `src/`, component tree, hooks-own-all-logic pattern (components never call Supabase directly), no global state library
3. **Error Handling** — Auth redirect on session expiry, reconnection banner, no optimistic UI, single top-level error boundary
4. **Testing** — Vitest + React Testing Library, test hooks and key user flows, skip E2E/snapshots for MVP

## Key Technical Decisions

- **Hooks own all Supabase logic** — components are pure UI
- **No global state library** — React context for auth, hooks for everything else, Supabase realtime handles shared state
- **No optimistic UI** — messages appear on server confirmation only (simpler, avoids rollback)
- **One error boundary** — not per-component, overkill for MVP
- **Test what could break non-obviously** — async hooks with subscriptions, not pure UI primitives

## Comparison Notes

The Superpowers spec is notably more implementation-specific than the BMAD PRD:
- BMAD's PRD has user personas, user stories, and acceptance criteria
- Superpowers' spec has file paths, component trees, specific hook names, and exact table schemas
- BMAD tells you *what* to build for *whom*; Superpowers tells you *how* to build it

The Superpowers brainstorming presented each section individually and waited for approval — a section-by-section design review rather than a monolithic document.

## Process Observations

- All four design sections were approved as-proposed with no changes — the earlier clarifying questions + architecture decisions provided enough context for Claude to nail the design on first pass
- The spec was auto-committed by the other session
- **Superpowers used the Context7 MCP server** during the spec review to verify library usage against up-to-date docs (e.g., Supabase API patterns, React Testing Library conventions). This is a nice quality gate — it catches stale API assumptions before they become implementation bugs. (Unknown whether BMAD used Context7 during its sessions — the devlogs don't mention it either way.)
- Next step per the Superpowers workflow: spec review loop (subagent reviews the spec), then user review, then transition to implementation planning

## What's Next

Spec review loop → user review of spec → writing-plans skill (implementation planning)
