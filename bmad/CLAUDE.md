# BMAD Version — Magic Brooms

This is the BMAD Method version of Magic Brooms.

## Deployment

Production target is the `team-town/magic-brooms` Vercel project (linked in `app/.vercel/`). The intended flow is push-to-main auto-deploy via GitHub integration, but that integration has been broken since ~2026-04-07 (open action item from `../devlog/bmad-010-meet-chat-backfill.md`). Until reconnected: push to `main`, then run `npx vercel --prod --yes` from `app/` **exactly once**. Don't run it twice. Don't also invoke a `vercel-deploy` skill. See root `CLAUDE.md` for the full rule and the conditions for retiring the workaround.

## Devlog Rule

After completing any major milestone (brainstorming, PRD, architecture, sprint planning, story implementation, etc.), **automatically** create a devlog entry in `../devlog/` and update `../devlog/README.md`. Use the prefix `bmad-NNN` (e.g., `bmad-001-brainstorming.md`). Check existing `bmad-*` entries in `../devlog/` first to pick the next number. See the root `CLAUDE.md` for content details.
