# BMAD Playwright Testing & PostgREST FK Bugfix

**Date:** 2026-03-23
**Framework:** BMAD Method
**Phase:** QA / Testing

## What Happened

Danny noticed that posted messages weren't showing in the channel main view. Used Playwright MCP to run through the core user flows and diagnose the issue.

## Playwright Test Pass

Tested the following flows:

1. **Signup** — Created account with email/password/display name. Worked, but Supabase email confirmation was enabled by default. Manually confirmed user via SQL.
2. **Login** — Logged in with confirmed user. Redirected to main app. Sidebar showed 3 seeded channels and user display name.
3. **Join Channel** — Clicked #general "(join)" button. Channel appeared as active link.
4. **Enter Channel** — Navigated to #general. Channel header showed name and description.
5. **Send Message** — **FAILED** initially with 400 error on message fetch.
6. **After fix** — Messages displayed correctly with author name, avatar initials, timestamp.
7. **Emoji Reactions** — Opened emoji picker, added fire reaction. Showed "🔥 1" inline.
8. **Unread Badges** — Badge count "2" appeared on #general after sending messages.

## Bug Found & Fixed

**Root cause:** The `messages` table has `user_id` referencing `auth.users(id)`, but the hooks were trying to do embedded joins like `profiles(display_name, avatar_url)`. PostgREST couldn't resolve this because there was no foreign key from `messages` to `profiles` — only to `auth.users`.

**Fix:**
1. Added a new migration `add_profile_foreign_keys` creating FK constraints from `user_id` columns on `messages`, `gallery_cards`, `card_comments`, and `reactions` to `profiles(id)`.
2. Updated all hooks (`useMessages`, `useGalleryCards`, `useSearch`) to use explicit FK hints in PostgREST queries (e.g., `profiles!messages_user_id_profiles_fkey(display_name, avatar_url)`).

**Lesson:** When using Supabase PostgREST embedded joins and the FK target is `auth.users`, you need an additional FK to your public `profiles` table and must use FK hints to disambiguate.

## Bug #2: Realtime Messages Not Appearing Cross-Browser

Danny tested with two browser sessions and found that messages sent in one browser didn't appear in the other without a manual refresh.

**Root cause:** The architecture specified "Broadcast + Database Triggers" for realtime. The implementation used manual `channel.send()` to broadcast after DB writes, but the sender's channel wasn't subscribed before sending — Supabase Broadcast requires subscription before you can send. The broadcasts were silently failing.

**Fix:**
1. Switched from manual Broadcast to `postgres_changes` listeners — these subscribe to actual DB change events, so any insert/update/delete on a table automatically notifies all subscribed clients.
2. Removed manual `channel.send()` calls from `useSendMessage`, `useDeleteMessage`, and `useCreateGalleryCard`.
3. Added `supabase_realtime` publication for `messages`, `reactions`, `gallery_cards`, and `card_comments` tables (required for `postgres_changes` to work).

**Lesson:** Supabase Broadcast is peer-to-peer and requires both sides to subscribe before sending. For DB-backed realtime (where the source of truth is a table write), `postgres_changes` is simpler and more reliable — the DB itself emits the events.

**BMAD reflection:** Danny asked whether BMAD could have prevented these bugs. Answer: no — these are runtime integration issues that only surface when connecting real components. The BMAD architecture doc specified the pattern correctly at a design level, but the Supabase API contract details (FK hints for PostgREST, subscription-before-send for Broadcast) are implementation-level concerns that require live testing to catch. The BMAD process got us to a testable app quickly; iteration on live bugs is the expected next phase.

## What's Next

- Test gallery channel flows (create card, browse grid, detail view, comments)
- Test search functionality
- Test channel creation
- Deploy to Vercel for live testing
