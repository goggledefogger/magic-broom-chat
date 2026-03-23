# BMAD Architecture Decisions (Steps 1-4)

**Date:** 2026-03-22
**Framework:** BMAD Method
**Phase:** Architecture Design (Steps 1-4 of 8)

## What was completed

Completed the first four steps of the BMAD architecture workflow:
1. **Initialization** — discovered PRD and brainstorming docs as inputs
2. **Project Context Analysis** — analyzed 28 FRs, NFRs, scale assessment, cross-cutting concerns
3. **Starter Template Evaluation** — evaluated Vite vs Next.js vs T3, selected Vite + React + TS (SWC)
4. **Core Architectural Decisions** — data architecture, auth, API patterns, frontend architecture, infrastructure

## Key decisions made

- **No separate backend server** — Supabase covers auth, database, realtime, storage, and search. The app is a static SPA talking directly to Supabase.
- **Realtime: Broadcast + DB Triggers** — not `postgres_changes` (deprecated/single-threaded). Write to DB, trigger broadcasts to subscribers. No message loss.
- **Profiles table for roles** — `student` | `instructor` role column instead of JWT custom claims. Simpler, immediate effect on role changes.
- **Gallery/Chat same data model** — channel `type` field drives which renderer (ChatView vs GalleryView) is used. Same underlying schema.
- **Stack:** Vite + React 19 + TypeScript + SWC + shadcn/ui + Tailwind v4 + Supabase + Vercel

## Observations

- Supabase MCP + context7 docs were valuable for discovering the Broadcast + DB Triggers pattern — this was a better approach than what the PRD assumed (raw WebSockets).
- The BMAD workflow is methodical but each step builds cleanly on the last. Steps 1-4 took one session.
- Still 4 more architecture steps to go (patterns, structure, validation, completion).

## What's next

- Step 5: Implementation patterns
- Step 6: Project structure
- Step 7: Validation
- Step 8: Architecture completion
