# Superpowers 006 — Code Review Fixes

**Date:** 2026-03-22
**Framework:** Superpowers
**Phase:** Code Review / Refactor

## What Was Done

Applied four targeted fixes from a code review pass on the Magic Broom Chat implementation:

### Fix 1: usePresence cleanup bug
The original cleanup function fired a `supabase.from('profiles').update({ status: 'offline' })` without awaiting it, then immediately removed the channel — meaning the update never had a chance to complete. The fix removes the offline update from cleanup entirely (it's unreliable in all teardown scenarios: browser close, tab close, React StrictMode double-invoke, etc.). Supabase Presence handles real-time status ephemerally. The online update on mount was also made error-visible via `.then()` instead of silently fire-and-forget.

### Fix 2: Move direct Supabase calls out of components
Three locations had `import { supabase }` and direct query calls that belonged in hooks:

- **BrowseChannelsModal** — was calling `supabase.from('channels').select(...)` directly. Moved to a new `fetchAllChannels` function in `useChannels`, passed as a prop.
- **ChatPage** — had three inline `useEffect` blocks making direct Supabase calls (own profile, all profiles, channel members) plus an inline heartbeat subscription. Extracted into three new hooks:
  - `useProfiles(userId)` — owns profile + profiles map state
  - `useChannelMembers(channelId, channelsDep)` — owns member list for active channel
  - `useConnectionStatus()` — owns heartbeat subscription and returns `'connected' | 'reconnecting'`

ChatPage now has zero direct Supabase imports — all data access goes through hooks.

### Fix 3: Wire up loadMore in MessageList
`useMessages` already had a `loadMore` function, but it was never called from the UI. Added `onLoadMore` prop to `MessageList` and triggered it from the existing `handleScroll` function when `scrollTop < 100`.

### Fix 4: Delete dead AuthGuard component
`src/components/auth/AuthGuard.tsx` was never imported anywhere — `App.tsx` handles auth routing inline. Deleted.

## Key Decisions

- Kept `profiles.status` update on mount (best-effort sync for offline-first fallback) but documented clearly that it's not reliable for teardown
- `useChannelMembers` takes a `channelsDep` parameter (the channels array) so it re-fetches when membership changes — same pattern as the original ChatPage effect
- `onLoadMore` is called on every scroll event when near top; `loadMore` in `useMessages` is already guarded against running with no messages or no channelId, so repeated calls are safe

## Test Results

All 16 tests pass after changes. No test modifications needed.

## Effort

- ~15 back-and-forth exchanges for this fix batch
- The refactor was mechanical — reading existing code, extracting into hooks, updating imports
- The presence bug was subtle (easy to miss that `.update()` without `.then()` is a no-op query that never executes)

## What's Next

- Remaining stories from the implementation plan (search, thread views, invite flows)
- Add tests for the new hooks (useProfiles, useChannelMembers, useConnectionStatus)
