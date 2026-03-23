# Superpowers-008 — Supabase MCP Project Setup

**Date:** 2026-03-22
**Framework:** superpowers
**Phase:** Infrastructure / Supabase setup

## What was completed

Used the Supabase MCP server to set up the backend for the superpowers version:

- Paused `llm-music` project to free a slot (2 free project limit)
- Created new project `magic-broom-superpowers` in us-east-1
- Applied the full migration via `apply_migration` — 4 tables (profiles, channels, channel_members, messages), RLS policies, indexes, FTS, realtime publications, and auth trigger
- Generated TypeScript types from the live schema via `generate_typescript_types`
- Created `.env.local` with project URL and anon key
- Fixed build issues: vite/vitest version conflict (separated configs), unused import, stale hand-written types
- Merged feature branch code to main, committed and pushed

## Key decisions

- **New project, not reuse:** `magic-broom-claude-code` already existed but belonged to a different framework version — created a dedicated project to keep the experiment clean
- **Generated types over hand-written:** The original types file was missing the `__InternalSupabase` metadata the newer Supabase JS client needs for Postgrest version detection, causing `never` type errors on all insert/update operations
- **Separated vite/vitest configs:** Vite 8 and Vitest bundle different versions of the vite internals (rolldown vs rollup), causing plugin type conflicts when combined in one config file

## Effort observations

- Supabase MCP made project creation and migration application seamless — no dashboard clicking needed
- The type generation from MCP was the key fix for build errors — the devlog-002 observation about missing MCP usage was validated here
- Total: ~10 minutes from "let's set up Supabase" to running dev server

## What's noteworthy

- **devlog-002 prediction confirmed.** The earlier observation that the implementation session missed the Supabase MCP was spot-on. Using it here for schema application and type generation was significantly smoother than manual setup would have been.
- **Free tier limits are real friction.** Had to pause another project to create this one — worth noting for students.

## What's next

- Manual smoke test (sign up, create channel, send messages, verify realtime)
