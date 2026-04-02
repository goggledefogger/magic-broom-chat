# Compound Engineering — Ideation

**Date:** 2026-03-23
**Framework:** Compound Engineering (`ce-ideate` skill)
**Phase:** Ideation (pre-brainstorming)

## What Happened

Ran the `ce-ideate` workflow to generate and filter architectural ideas for building Magic Brooms from scratch. Five parallel ideation agents each generated ~8 ideas from different frames (pain/friction, missing capability, inversion/automation, assumption-breaking, leverage/compounding), producing 40 raw candidates.

After merge, dedup, and adversarial filtering, 7 ideas survived. A mid-ideation review of the [Supabase Realtime docs](https://supabase.com/docs/guides/realtime) corrected a key architecture assumption: **Broadcast + DB triggers** is the right messaging pattern, not `postgres_changes` (which has a single-threaded RLS bottleneck the docs explicitly warn against for chat).

## Key Decisions

- **Supabase-first, zero backend** — no Express/Node server needed
- **Schema-first development** — design the DB via Supabase MCP before writing any UI
- **Broadcast for messaging** — write to messages table, trigger broadcasts; use replay for catch-up
- **Realtime Presence for online/typing** — not a heartbeat table
- **Postgres FTS for search** — no external service needed for MVP
- **Thread-ready schema** — nullable `parent_id` from day one

## Time/Effort

- ~15 minutes wall clock for ideation + filtering + docs review
- 5 parallel sub-agents for divergent ideation, then orchestrator merge/critique
- 1 mid-process correction after checking actual Supabase docs (important — don't trust assumptions about APIs)

## Noteworthy

- Checking the actual Supabase Realtime docs mid-ideation changed the #4 ranked idea. The `postgres_changes` approach that other versions of this project used has known performance issues. Always verify against current docs.
- The Compound Engineering `ce-ideate` workflow produces a ranked artifact in `docs/ideation/` — this persists the thinking so future sessions can pick up without re-deriving.

## What's Next

Pick an idea (or the full set) and run `ce-brainstorm` to define requirements precisely enough for planning.
