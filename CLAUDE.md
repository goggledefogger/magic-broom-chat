# Magic Brooms

Real-time chat app for A Portland Career's AI-Assisted Software Development course.

**Live:** [magic-brooms.vercel.app](https://magic-brooms.vercel.app)
**Primary app code:** `bmad/app/`

## Important Context

This repo started as a framework comparison experiment (5 versions of the same app). **BMAD won** and is the production app. The other versions (`compound/`, `superpowers/`, `vanilla/`, `gstack/`) remain as educational artifacts but are not actively developed.

All new work should happen in `bmad/app/`.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui components
- Supabase (auth, Postgres database, Realtime)
- TanStack Query (data fetching) + Zustand (state)
- Vercel (hosting)

## Deployment

The Vercel project is `team-town/magic-brooms`, linked in `bmad/app/.vercel/`.

**Goal state:** push to `main` → Vercel auto-deploys via GitHub integration. The push *is* the deploy. No manual `vercel deploy --prod`, no `vercel-deploy` skill, no `scripts/deploy.sh`, no empty "nudge" commits — those create a duplicate deployment racing the auto one.

**Current state (open action item from `devlog/bmad-010-meet-chat-backfill.md`):** the GitHub integration has been broken since ~2026-04-07 and pushes to `main` are **not** auto-deploying. Until the dashboard integration is reconnected, the workaround is: push to `main`, then run `npx vercel --prod --yes` from `bmad/app/` **exactly once**. Don't run it twice. Don't also invoke a deploy skill. That single manual call is the deploy — it's the legitimate escape hatch, not the long-term contract. When the integration is reconnected, delete this paragraph and the rule reverts to "the push is the deploy."

To verify a deploy: `vercel ls --cwd bmad/app` — top row should be Ready and recent. Use `vercel inspect <url> --cwd bmad/app` to confirm a specific deploy.

## Devlog Rule

After completing any major milestone, create a new entry in `/devlog/` and update `/devlog/README.md`. Use prefix `bmad-NNN` (e.g., `bmad-007-dark-mode.md`). Check existing entries first to avoid number collisions.

Devlog entries should include: date, what was completed, key decisions, time/effort observations, what's next.

## UX Conventions

- **Confirm before delete.** Any destructive action (deleting messages, removing avatars, leaving channels, etc.) must show a confirmation dialog before executing. Use shadcn AlertDialog, styled to match the app theme.

## Student Contributions

Students may contribute via GitHub PRs. See `CONTRIBUTING.md` for the workflow. Review PRs for:
- TypeScript correctness (`npm run build` must pass)
- No hardcoded credentials
- Changes scoped to `bmad/app/`
- Clear commit messages

## Kickoff Prompt

See `KICKOFF_PROMPT.md` for the original project brief used across all framework versions.
