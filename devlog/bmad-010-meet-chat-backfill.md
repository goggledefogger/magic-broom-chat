# bmad-010: Meet Chat Backfill Ingest

**Date:** 2026-04-09

## What was completed

Ingested Dan Hahn's copy-pasted Google Meet chat history (Mar 24 → Apr 9 2026, 7 class sessions, 7 attendees) into Magic Brooms as real messages and gallery cards. The ingest is attribution-preserving, timestamp-accurate, fingerprint-idempotent, and designed so future sources (Slack/Discord/Gmail-API) can reuse the writer by swapping in a new parser.

**Results (first live run):**
- 8 ghost users created (7 attendees + 1 `Meet Archive` bot that owns session roots)
- 6 session thread roots in `#general` (`2026-04-01` had only link entries, so no root needed there)
- 42 threaded reply messages under the session roots
- 16 gallery cards in `#resources` (plus 2 duplicate URLs resolved via dedupe → same card, new provenance row)
- 66 provenance rows in a new `message_imports` sidecar table
- Re-run inserted **0** rows (fingerprint idempotency verified end-to-end)

## Architecture

```
bmad/app/scripts/ingest/
├── inputs/2026-04-09-dan-meet-chat-email.txt   ← raw email dump, committed
├── parse-meet-email.ts                          ← source-specific parser
├── resolve-timestamp.ts                         ← Gmail timestamp → ISO in PT
├── admin-supabase.ts                            ← service_role client factory
├── writer/
│   ├── ghost-users.ts         ← match-or-create attendees as "(imported)" ghost users
│   ├── session-roots.ts       ← one thread root per session_date, idempotent
│   ├── fingerprint.ts         ← sha256(source|date|author|ts|sha256(content))
│   ├── messages.ts            ← insert threaded reply + provenance
│   ├── gallery-cards.ts       ← URL-normalized dedupe + provenance
│   └── write-entries.ts       ← orchestrator
└── ingest-meet-chat.ts                          ← CLI: `npm run ingest:meet-chat`
```

New migration `00012_create_message_imports.sql` adds a sidecar provenance table with a `source_fingerprint UNIQUE` constraint and an XOR `CHECK` ensuring each row points to exactly one of `(message, gallery_card)`.

## Key decisions

- **Parser / writer split.** Email-specific logic lives in `parse-meet-email.ts`; the writer consumes a neutral `ParsedEntry[]`. Future sources plug in a new parser and reuse the writer unchanged. This was the highest-leverage design decision — it lets the "better way" (Gmail API / Meet Side Panel extension) inherit all the hard parts (ghost users, idempotency, dedupe, provenance) for free.
- **Ghost users over single bot.** Each Meet attendee gets a real `auth.users` row + profile so avatars, mentions, and thread attribution all work naturally. Ghosts have synthetic `imported+<slug>@magic-brooms.local` emails and impossible passwords. Display names end in `(imported)` so viewers can tell at a glance what came from backfill vs. live chat.
- **Sidecar provenance table** over a JSONB column on `messages`. Keeps the core schema clean and makes rollback a single `DELETE WHERE import_batch_id = ...` query.
- **Link extraction via L1 rule.** URL-only entries become gallery cards; URLs embedded in commands or prose stay in their message unchanged.
- **Fingerprint idempotency.** `sha256(source | session_date | author_raw | timestamp_raw | sha256(content))` with a UNIQUE constraint gives zero-dup re-runs. Editing a single line in the raw input and re-running imports only the changed line.
- **Semantic dedupe for shared URLs.** When the same link appears in multiple sessions (e.g., the `bmad-guide` page shared twice), the card is reused and a second provenance row records the second sharing — the resource gallery stays clean.

## Process observations

- **Subagent-driven development + two-stage reviews** (spec compliance + code quality) worked very well for this plan. 16 tasks, each implemented by a fresh subagent with full task context, then independently reviewed. Caught a real class of bugs — e.g., `ParsedEntry` was originally a flat type but the reviewer correctly pushed for a true discriminated union before any parser code depended on it.
- **Dry-run mode paid for itself immediately.** First real run needed zero rollback — the dry-run output let me eyeball the parser output against the raw email before touching the DB.
- **Environment issues hit us twice during Task 2** (Docker socket dropping, `/private/tmp` disk pressure). The fix was external but worth noting that long-running subagent sessions can stumble on transient host state.
- **One minor parser limitation surfaced in the data**: the Apr 9 4:44 PM entry has `https://kimi.com/.../ [Gmail preview title] [Gmail preview domain] https://openlm.ai/ https://ai.google.dev/`. The classifier allows ≤2 preview lines for the "URL + preview" branch and requires *all* lines to be URLs for the multi-URL branch; this entry satisfies neither, so it became a single message containing 3 URLs rather than 3 separate gallery cards. Real limitation but low impact — one entry out of 60.

## What's next

- **The "better way" pipeline.** The writer is now the reusable part; the remaining work is a better parser. Options worth exploring: Gmail API (authenticated fetch of a label/thread), a Meet Side Panel extension that captures chat live during class, or a Zapier/Pipedream trigger on a specific Gmail filter. All of these would write into `ParsedEntry[]` and call `writeEntries()` unchanged.
- **Parser polish** (low priority): handle the "first URL has preview + more URLs follow" Gmail layout to split the Kimi/GLM/Gemini-style entries correctly.
- **Browser sanity check**: open `http://localhost:5173` as an instructor, scroll through the session threads in `#general`, click through the `#resources` gallery, confirm dates render naturally.

## Files touched

Migration: `bmad/app/supabase/migrations/00012_create_message_imports.sql`
Deps: `bmad/app/package.json` (+tsx, +date-fns, +date-fns-tz, +ingest npm scripts)
New pipeline: `bmad/app/scripts/ingest/` (12 new `.ts` files, 5 test files, 1 raw input file)
Design + plan: `docs/superpowers/specs/2026-04-09-meet-chat-backfill-ingest-design.md`, `docs/superpowers/plans/2026-04-09-meet-chat-backfill-ingest.md`

## Follow-up fixes (2026-04-10)

Once the ingest landed in prod, three issues surfaced and were corrected in a follow-up pass (tech-spec `bmad/_bmad-output/implementation-artifacts/tech-spec-cohort-archive-fixes.md`):

- **Wrong channel.** All 48 imported messages and 6 session roots initially landed in `#general` because the ingest author didn't know about the `#cohort-2` channel (it wasn't in the original seed migration). Fixed in prod via a narrow SQL migration through the Supabase Management API: moved the 48 rows to `#cohort-2`, upserted the 5 imported profiles (4 ghost users + `Class Archive` bot) into `channel_members`. Gallery cards in `#resources` stayed put (correct destination). The ingest writer constants (`writer/write-entries.ts`, `writer/session-roots.ts`, `writer/messages.ts`) now point at `#cohort-2` and use a renamed `archiveChannelId` field so future re-runs route correctly.
- **Confusing naming.** "Meet Archive" / "📅 Meet chat — <date> session" read ambiguously ("meet" as verb? as Google Meet? as meeting?). Renamed the bot profile to `Class Archive (imported)` and rewrote the 6 session root contents to `📅 Class session — <date>`. Fingerprint `source` tags stayed unchanged (`google-meet-email` / `google-meet-email-root`) so idempotency held across the rename. One small gotcha: the original rewrite SQL used a double `REPLACE` which stripped ` session` twice, leaving `📅 Class — <date>` instead of `📅 Class session — <date>` — caught in verification and corrected with a second targeted UPDATE.
- **ThreadPanel UX regressions.** The bare `Loading replies...` text was replaced with a shadcn `Skeleton` component (3 placeholder rows with circular avatar + two text lines each, `aria-busy` for assistive tech). The scroll regression — main-body scroll getting pinned to the bottom whenever ThreadPanel mounted — was fixed by passing `{ block: 'nearest', inline: 'nearest' }` to the `scrollIntoView` calls in both `ThreadPanel.tsx` and `ChatView.tsx`. `block: 'nearest'` scrolls the minimum distance needed inside the nearest scrollable ancestor instead of traversing upward through the ancestor chain, which contained the scroll intent to each ScrollArea viewport.

Prod data verification after the migration: `#cohort-2` has exactly 48 imported messages, 6 session roots all prefixed `📅 Class session —`, `Class Archive (imported)` is the bot display name, `#general` has 0 leftover imported rows, and `#resources` still has its 19 gallery cards. UI verification (skeleton + scroll) happens once the PR deploys.
