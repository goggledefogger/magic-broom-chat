# bmad-007: Zulip Data Migration & Badge Bug Fix

**Date:** 2026-03-31
**Framework:** BMAD (production)
**Phase:** Post-sprint polish

## What Was Completed

### Zulip → BMAD Data Migration
Migrated all data from the Zulip instance (apc.zulipchat.com) into the BMAD Supabase database via direct SQL using the Supabase MCP tools.

**Data migrated:**
- 2 users: Danny Bauman (updated existing profile → instructor), Dan Hahn (new auth.users + profile → instructor)
- 8 channels: 5 new (welcome, announcements, cohort-2, pilot-cohort, random) + 3 existing updated (general, resources, project-showcase)
- 14 messages into standard channels
- 4 gallery cards into showcase channels (project-showcase, resources)

**Channel mapping decisions:**
- `show-and-tell` → `project-showcase` (existing gallery channel)
- `tools-and-resources` → `resources` (existing gallery channel)
- `general` → `general` (existing, description updated)
- All others created as new standard channels

### Bug Fix: Gallery Channel Badges
- Gallery channels (project-showcase, resources) were showing incorrect unread message badges because migrated content was initially inserted into the `messages` table instead of `gallery_cards`
- Fixed by converting content to proper gallery cards with titles/descriptions/links
- Added `useGalleryCardCounts` hook — gallery channels now show total card count as their badge
- Added realtime subscriptions to both `useUnreadCounts` and `useGalleryCardCounts` so badges update instantly on message/card insert/delete
- Fixed `useDeleteMessage` and `useMarkChannelRead` to invalidate unread counts

## Key Decisions
- Zulip topics ignored (all were "chat" — no information loss)
- DMs skipped (BMAD doesn't support DMs, only 1 trivial DM existed)
- Dan Hahn created via admin SQL insert into auth.users (no login capability, but messages display correctly)
- Both Danny and Dan set as instructors with channel management permissions

## Files Changed
- `bmad/app/src/hooks/useUnreadCounts.ts` — added `useGalleryCardCounts`, realtime subscriptions, invalidation on mark-read
- `bmad/app/src/hooks/useMessages.ts` — invalidate unread counts on message delete
- `bmad/app/src/components/shared/AppLayout.tsx` — sidebar badges use card counts for gallery channels

## Sprint Status
All 5 epics remain **done**. Next steps are polish: QA testing (`bmad-bmm-qa-automate`), code review (`bmad-bmm-code-review`), then targeted quick-dev fixes.

## What's Next
- Run QA to systematically find remaining bugs
- Code review pass for quality
- Optional retrospective for course material
