# bmad-008: UX Polish — Join Flow & First-Time Experience

**Date:** 2026-04-01  
**Phase:** Post-sprint polish

## Changes
- **Auto-join default channels on first login** — configurable list in `AUTO_JOIN_CHANNELS`, navigates to #general
- **One-click channel join** — join + navigate in single click (was two clicks)
- **Subtle join animation** — amber→purple shimmer using theme colors, 1.2s CSS keyframe

## Bug Found
Auto-join navigation got swallowed by React re-renders from membership query invalidation. Fixed by splitting into two effects: one fires joins, the other watches for memberships to populate then navigates.

## Lessons Learned

**Write tests before polish, not after.** Join flow and navigation timing are exactly what breaks silently in future PRs. Should have run `bmad-bmm-qa-automate` first to build a regression safety net.

**Use BMAD tools for what they're designed for.** Invoked Quinn (QA agent) but then did ad-hoc Playwright testing instead of generating automated tests. The right BMAD flow: QA generates tests → Quick Dev implements → CR reviews.

**Creating Supabase test users via raw SQL is fragile.** GoTrue requires `auth.identities` rows, bcrypt passwords, and specific field states. Simpler to clear an existing user's memberships to simulate a fresh login.

**Separate async side effects from navigation in React.** `Promise.all().then(navigate)` is unreliable when mutations trigger query invalidations. Use a state flag + separate effect instead.

## Files Changed
- `bmad/app/src/components/shared/AppLayout.tsx` — auto-join, one-click join, animation
- `bmad/app/src/index.css` — `@keyframes channel-join`
