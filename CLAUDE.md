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
