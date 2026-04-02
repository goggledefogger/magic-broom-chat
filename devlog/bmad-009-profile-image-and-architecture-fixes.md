# bmad-009: Profile Image Feature & Architecture Fixes

**Date:** 2026-04-02
**Phase:** Post-sprint polish

## Changes

### Profile Image Upload & Remove
- Clickable avatar with camera icon hover overlay
- Client-side resize to 400px via Canvas API (JPEG 0.85)
- Upload to Supabase Storage with upsert + cache busting
- Remove button deletes from storage and reverts to initials
- Created `avatars` storage bucket with RLS policies

### Architecture Fixes
- Memoized `galleryChannelIds` and `memberChannelIds` to stop subscription thrashing
- Parallelized gallery card count queries
- Narrowed realtime invalidation keys to specific userId/channelIds
- Stabilized auto-join effect dependencies
- Awaited membership update in useSendMessage (was fire-and-forget)
- Removed 30s polling, realtime-only for unread counts

### Vercel Environment Fix
- Found and fixed trailing newline in `VITE_SUPABASE_ANON_KEY` that broke all WebSocket connections in production

## Lessons Learned

**Check console errors in production early.** The WebSocket auth failure was silent to users but broke all realtime features. Would have caught it sooner with a post-deploy smoke test.

**BMAD quick-spec before quick-dev works well.** The spec took 5 minutes and gave clean task breakdown. Implementation went straight through with no backtracking.

**Memoize arrays passed to hooks.** Unstable array references in React cause subscription teardown/setup on every render. Always useMemo for derived arrays passed to custom hooks.

## Files Changed
- `bmad/app/src/features/profile/ProfilePage.tsx` - avatar upload/remove UI
- `bmad/app/src/hooks/useProfile.ts` - useRemoveAvatar hook, fixed useUploadAvatar
- `bmad/app/src/hooks/useUnreadCounts.ts` - memoized keys, parallel queries, no polling
- `bmad/app/src/hooks/useMessages.ts` - awaited membership update
- `bmad/app/src/components/shared/AppLayout.tsx` - memoized deps, stable auto-join
