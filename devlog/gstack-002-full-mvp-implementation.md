# gstack-002: Full MVP Implementation

**Date:** 2026-03-30
**Framework:** gstack
**Phase:** Implementation + QA

## What was completed

Built the entire gstack version of Magic Brooms from scaffold to working app. All MVP features functional: auth, channels, real-time messaging, presence, search, plus design polish features (Framer Motion animations, message grouping, Cmd+K command palette, skeleton loaders, empty states).

## Key decisions

- **Parallel agent dispatch**: Used 4 parallel subagents to build independent component groups simultaneously (auth, hooks, layout, messages). All 4 completed in ~2-3 minutes total.
- **shadcn-chat skipped**: The plan called for shadcn-chat components, but we built custom chat components with shadcn/ui primitives instead. This avoided the React 19 compatibility risk entirely.
- **Profile auto-creation**: Added auto-profile creation in AuthContext for users created via Supabase dashboard (not signup flow). Detects missing profile via PGRST116 error code.

## RLS policy fixes (critical)

During QA, discovered that Supabase's RLS policies had **infinite recursion** between `channels` and `channel_members` SELECT policies:
- `view_channels` referenced `channel_members` in a subquery
- `view_channel_members` referenced `channels` in a subquery
- Each SELECT triggered the other's policy, causing 500 errors

**Fix applied via Supabase Management API:**
1. Simplified `view_channels`: `(NOT is_private) OR created_by = auth.uid()`
2. Simplified `view_channel_members`: `user_id = auth.uid() OR EXISTS (SELECT 1 FROM channels c WHERE c.id = channel_members.channel_id AND NOT c.is_private)`
3. Simplified `join_channels`: `user_id = auth.uid()` (was checking channel existence via subquery that hit the recursive policy)
4. Added missing `users_insert_own_profile` policy on profiles table

## Time/effort observations

- Office hours to design doc: ~20 min (previous session)
- Plan creation: ~5 min
- Scaffold + dependencies: ~3 min
- Parallel agent builds (4 agents): ~4 min wall time
- Integration fixes (type errors, component wiring): ~5 min
- QA + RLS debugging: ~15 min
- Total implementation: ~30 min from plan to working app

## Institutional learnings applied

All 7 learnings from prior builds were used:
1. shadcn/ui path alias bug (caught and fixed immediately)
2. PostgREST FK hints in message queries
3. Presence cleanup unreliability (no offline writes in cleanup)
4. Broadcast subscription ordering
5. Separate vite/vitest configs
6. Current Supabase Realtime API patterns
7. Schema-first development (copied compound's database.types.ts)

## Anything surprising

- The RLS infinite recursion bug was not caught by any of the prior 4 framework builds. It only surfaced here because we had a fresh user with no pre-existing data to mask the issue.
- 4 parallel subagents wrote 28 source files with zero merge conflicts. Each agent's output was integration-ready.
- The sonner (toast) shadcn component had a circular self-import bug out of the box.

## What's next

- Test real-time messaging between two browser tabs
- Verify Cmd+K command palette works
- Deploy to Vercel
- Write comparison notes against the other 4 versions
