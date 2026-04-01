# gstack-003: Framework Decision & Production Deploy

**Date:** 2026-03-31
**Framework:** All (comparison decision) + gstack (deployment)
**Phase:** Framework selection & production deployment

## What happened

After building the same chat app five different ways (BMAD, Compound, Superpowers, Vanilla, gstack), we did a careful comparison and chose **gstack** as the version to ship to production for course students.

## The Decision

### Why gstack?

**Eliminated early:**
- **Vanilla** — Fastest to build but no process artifacts, no TypeScript, custom Express+SQLite backend. Students wouldn't learn a production stack. Good as a "before" comparison baseline, not as the curriculum.
- **BMAD** — Thorough product thinking (12-step PRD, user journeys, acceptance criteria) but the process was too ceremonial for a solo builder. Uses `@base-ui` instead of the more mainstream shadcn/ui.
- **Superpowers** — TDD-first is valuable but 5-10x token cost, slowest wall-clock time, rigid mandatory gates. Great for teams with strict quality requirements, too heavy for a course.

**The real contest — Compound vs gstack:**
Both use the same tech stack (React 19 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase) and share the same Supabase backend. Compound had the cleanest planning workflow (~1 hour ideation-to-code).

**gstack wins because this app needs to be used by real people:**
- Slack-like design with aubergine sidebar, warm color palette
- Framer Motion animations on page transitions and message entry
- Message grouping (consecutive messages from same user within 5 min)
- Typing indicators with animated bouncing dots
- Skeleton loaders instead of blank loading states
- Cmd+K command palette for quick channel navigation
- Optimistic message updates with retry on failure
- Fixed the RLS infinite recursion bug that none of the other 4 builds caught

### Compound's role

Compound Engineering produced the best *process* — its ideate→brainstorm→plan→work pipeline is what we'll teach in the course. The SpecFlow analysis that caught 14 gaps before any code was written is a standout teaching moment. gstack benefits directly from Compound's schema-first approach and institutional learnings.

**Course structure recommendation:**
1. Demo vanilla as baseline
2. Teach with Compound Engineering's workflow
3. Show BMAD artifacts for "when heavier process is warranted"
4. Ship gstack as the production app students use

## Production Deployment

### What we deployed
- **URL:** https://gstack-navy.vercel.app
- **Platform:** Vercel (static SPA)
- **Backend:** Supabase (shared `magic-broom-compound` project)
- **Root directory:** `gstack/` within the monorepo

### What we added for production
- `vercel.json` — SPA rewrite rules
- `ForgotPasswordForm.tsx` + `ForgotPasswordPage.tsx` — Password reset request flow
- `ResetPasswordPage.tsx` — New password form (uses Supabase `PASSWORD_RECOVERY` event)
- `ErrorBoundary.tsx` — React class component wrapping the app
- "Forgot your password?" link on login form
- New routes: `/auth/forgot-password`, `/auth/reset-password`
- Removed unused `next-themes` dependency

### What was already in place
- `#general` channel seeded in Supabase
- Auto-join trigger (`on_profile_created_join_general`) — new users auto-join #general
- Profile auto-creation for dashboard-created users
- RLS policies with infinite recursion fix applied

### Supabase redirect URLs needed
- `https://gstack-navy.vercel.app/auth/callback`
- `https://gstack-navy.vercel.app/auth/reset-password`
- Site URL updated to production domain

## Key decisions
- **Keep shared Supabase project** — compound and gstack share the same backend, acceptable for course use
- **Default Vercel URL first** — custom domain can come later
- **Auto-join #general** — database trigger, not client-side logic

## Time/effort
- Framework comparison analysis: ~30 minutes
- Code changes (password reset, error boundary, cleanup): ~15 minutes
- Vercel deployment + env var config: ~10 minutes
- Supabase redirect URL config: ~5 minutes (manual dashboard step)

## What's next
- Smoke test the deployed app (signup, login, messaging, password reset)
- Two-tab real-time test
- Mobile viewport check
- Consider custom domain for course launch
