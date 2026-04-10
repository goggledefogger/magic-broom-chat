# Meet Chat Backfill Ingest — Design

**Date:** 2026-04-09
**Status:** Draft, pending implementation plan
**Owner:** Danny Bauman

## 1. Goal

Import Dan Hahn's Google Meet chat email dump (covering Mar 24 → Apr 9 2026, 7 class sessions, 7 attendees) into Magic Brooms as real messages and gallery cards, with accurate attribution, timestamps, and per-message provenance.

The immediate task is a one-time backfill of the email dump. However, the implementation is deliberately structured as a reusable **parser → writer** pipeline so future ingests (next session, different source like Slack or Discord) can reuse the writer unchanged and only supply a new parser.

### Non-goals

- No OG image fetching for gallery cards.
- No AI-powered summarization, tagging, or clustering of sessions.
- No synthesizing of reactions, read-receipts, or other engagement metadata.
- No automatic re-run on cron / webhook / Gmail push — that is the "better way later" thread and is explicitly out of scope here.
- No parsing of the bottom half of the email thread (Dan's earlier 8:11 PM email) as a distinct source — it is redundant with the top half and fingerprint dedupe handles any overlap.

## 2. Architecture

```
bmad/app/scripts/ingest/
├── inputs/
│   └── 2026-04-09-dan-meet-chat-email.txt   ← raw email body, committed
├── parse-meet-email.ts    — source-specific parser
├── writer.ts              — reusable writer
└── ingest-meet-chat.ts    — entrypoint, run via `npm run ingest:meet-chat`
```

`ParsedEntry` is the clean interface between parser and writer. The writer never touches email-specific concerns; future sources write a new parser that emits the same shape:

```ts
type ParsedEntry = {
  kind: 'message' | 'link';
  author_raw: string;            // "Danny Bauman (via Meet)"
  author_display: string;        // "Danny Bauman"
  session_date: string;          // "2026-04-09" (resolved)
  timestamp_raw: string;         // "Tue 3:54 PM" (original, preserved)
  timestamp_resolved: string;    // ISO 8601 in America/Los_Angeles
  content: string;               // full line(s) for messages; URL for links
  preview_title?: string;        // Gmail preview text if present (links only)
};
```

### Why parser/writer split

- The parser handles a messy, source-specific input format (Gmail copy-paste with Gmail's timestamp quirks and preview-text artifacts). It has no database dependencies and is easy to unit test against fixtures.
- The writer handles Supabase: ghost user match-or-create, channel membership, thread roots, gallery dedupe, provenance. It has no knowledge of how its input was produced.
- This is the minimum clean boundary that makes the ongoing-pipeline use case trivial to add later without overbuilding now.

## 3. Schema changes

One new migration: `bmad/app/supabase/migrations/00012_create_message_imports.sql`.

```sql
CREATE TABLE message_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  gallery_card_id UUID REFERENCES gallery_cards(id) ON DELETE CASCADE,
  source TEXT NOT NULL,                  -- e.g. 'google-meet-email'
  session_date DATE NOT NULL,
  original_author_raw TEXT NOT NULL,
  original_timestamp_raw TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL UNIQUE,
  import_batch_id TEXT NOT NULL,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((message_id IS NOT NULL) <> (gallery_card_id IS NOT NULL))
);

CREATE INDEX idx_message_imports_session_date ON message_imports (session_date);
CREATE INDEX idx_message_imports_source ON message_imports (source);

ALTER TABLE message_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_imports_select_instructor" ON message_imports
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );
```

Notes:

- Provenance rows attach to **either** a message **or** a gallery card, never both — enforced by the `CHECK` constraint.
- `source_fingerprint` is a deterministic hash (sha256) of `source | session_date | author_raw | timestamp_raw | sha256(content)`. The `UNIQUE` constraint gives us idempotency via `ON CONFLICT DO NOTHING` on re-runs. Editing a line in the raw input and re-running imports only the changed line.
- RLS: only instructors can read provenance. Students do not need to see the import log.
- **No changes** to `messages`, `channels`, `gallery_cards`, or `profiles`. The core schema stays pure.

## 4. Parser rules

### Entry boundaries

A Gmail-formatted attribution header looks like:

```
<Name> (via Meet), *domain_disabled*
External user not managed by admin
, <timestamp>
```

Each attribution header starts a new entry. Everything from that header until the next attribution header is the entry's content. Entries with empty/whitespace-only content are dropped.

### Timestamp resolution

Today's date at ingest time: **2026-04-09 (Thursday)**. All timestamps are in `America/Los_Angeles` (Portland).

| Raw format                 | Example           | Resolution rule                                                                                                                                         |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Mon DD, H:MM PM`          | `Mar 24, 3:17 PM` | Assume current year (2026). `2026-03-24 15:17:00 America/Los_Angeles`.                                                                                  |
| `<Weekday> H:MM PM`        | `Tue 3:54 PM`     | Most recent past `<Weekday>` relative to email send date 2026-04-09. `Tue` → 2026-04-07.                                                                |
| `H:MM PM` (no date at all) | `3:05 PM`         | Current date (2026-04-09).                                                                                                                              |
| No timestamp               | top-of-email prelude | Assigned to the 2026-04-09 session, author Dan Hahn (email sender). Synthetic `created_at` values are spaced 1 second apart, the last of which is 1 second before the first real entry of the 2026-04-09 session. |

The raw string is **always** preserved in `message_imports.original_timestamp_raw`. If any inference is wrong, a human can fix the row without a re-import.

### Link extraction (L1)

An entry whose content consists of exactly one URL (optionally followed by Gmail's auto-generated preview text and preview domain on the next line or two) becomes `kind: 'link'`. The URL itself is the content; Gmail's preview text is captured as `preview_title` if present.

All other entries — including ones with URLs embedded inside prose, commands (`curl -fsSL https://claude.ai/install.sh | bash`), or multi-line prompts — become `kind: 'message'` with the full original text preserved, URLs inline.

### Multi-URL entries

An entry with multiple standalone URLs (e.g., Danny's 4:44 PM entry with Kimi + GLM + Gemini URLs, each on their own line) is split into N `kind: 'link'` entries, one per URL, each keeping the same author and timestamp. If non-URL text is also present in the same block, it becomes a separate `kind: 'message'` entry (none exists in the current dump, but the parser handles it).

### Multi-line message content

Multi-line prompts (e.g., the design-reviewer interview prompt, the pirate-reviewer skill file, the install-together activity) stay as **one** `kind: 'message'` entry with newlines preserved in content. Each attribution header = one entry, regardless of how many lines follow.

## 5. Writer rules

### Ghost user match-or-create

For each unique `author_display` in the parsed entries:

1. Normalize: lowercase, trim, collapse whitespace.
2. Look for an existing `profiles` row where `display_name` matches (case-insensitive, normalized). If found, reuse its `id`.
3. Otherwise create an `auth.users` row via the Supabase admin API:
   - `email`: `imported+<slug>@magic-brooms.local` (slug = lowercased name with non-alphanumerics → `-`)
   - `password`: cryptographic random, 64 chars, never logged or returned
   - `email_confirmed`: true
   - `user_metadata`: `{ source: 'google-meet-email', imported: true }`
   The existing `on_auth_user_created` trigger auto-creates the `profiles` row.
4. Update the auto-created profile:
   - `display_name = "<Name> (imported)"` (M2 suffix marker)
   - `role = 'student'` by default, with hardcoded overrides: **Danny Bauman → instructor**, **Dan Hahn → instructor**.
5. Cache the `author_display → user_id` mapping in memory for the rest of the run.

Ghost users cannot log in (impossible password, synthetic email). They exist purely as attribution anchors so avatars, mentions, and thread participation work as real users would.

### Channel membership

Before writing any content, ensure every ghost user (and the ingest bot) is a member of `#general` and `#resources`, via `INSERT ... ON CONFLICT DO NOTHING` into `channel_members`.

### Session thread roots

For each distinct `session_date`:

1. Check `message_imports` for an existing root: `source = 'google-meet-email-root' AND session_date = <date>`. If present, reuse it.
2. Otherwise create a root message in `#general`:
   - `user_id` = the ingest bot ghost user (`imported+ingest-bot@magic-brooms.local`, display_name `Meet Archive (imported)`, role `student`)
   - `content` = `📅 Meet chat — <pretty date> session` (e.g., `📅 Meet chat — Mar 24, 2026 session`)
   - `created_at` = that session's earliest resolved timestamp, minus 1 second
   - `parent_id` = NULL
3. Insert a provenance row with `source = 'google-meet-email-root'` and `message_id` pointing at the new root.

Each `kind: 'message'` entry then becomes a threaded reply:

- `channel_id` = `#general`
- `user_id` = ghost user for that author
- `content` = parsed content (multi-line preserved)
- `created_at` = resolved timestamp
- `parent_id` = the session root's id
- Insert a provenance row. The `source_fingerprint UNIQUE` constraint handles re-runs.

### Gallery cards (link side, D1 dedupe, TI1 title)

For each `kind: 'link'` entry:

1. **Normalize the URL**: lowercase the host, strip trailing `/`, leave path/query/fragment otherwise intact (fragments are sometimes semantic, e.g., `swiftlane-ir.netlify.app/#ai/1`).
2. **Dedupe lookup**: check whether a `gallery_cards` row in `#resources` already has that normalized URL.
   - If yes: skip the insert but still write a provenance row pointing at the existing `gallery_card_id`. This records that the link was also shared in this session.
   - If no: create the card.
3. **Create the card**:
   - `channel_id` = `#resources`
   - `user_id` = ghost user for the entry's author (first-sharer)
   - `title` = `preview_title` if present; otherwise humanized `host + path` (e.g., `stitch.withgoogle.com`, `aportlandcareer.com/ai-course/bmad-guide`)
   - `description` = `Shared by {author_display} on {pretty session_date}` (gives the gallery reader context at a glance)
   - `link` = normalized URL
   - `image_url` = NULL
   - `created_at` = resolved timestamp
4. Insert a provenance row with `gallery_card_id` set.

## 6. Run mechanism

`bmad/app/package.json`:

```json
{
  "scripts": {
    "ingest:meet-chat": "tsx scripts/ingest/ingest-meet-chat.ts",
    "ingest:meet-chat:dry-run": "tsx scripts/ingest/ingest-meet-chat.ts --dry-run"
  }
}
```

- Reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local`. Both are already used for Supabase admin work elsewhere.
- The entrypoint generates an `import_batch_id` of the form `<YYYY-MM-DD>-backfill` (e.g., `2026-04-09-backfill`) and passes it to the writer. All provenance rows from a single run share this id, so rollback of a specific batch is a single `WHERE import_batch_id = ...` clause (see §8).
- **Never runs in CI**. The script does not run on PR build or deploy.
- **Dry-run mode** logs every planned insert without touching the database. Use this first on a live run to eyeball the output.
- **Summary log** at the end of a real run:
  ```
  ✓ 6 ghost users created, 2 matched to existing profiles
  ✓ 7 session roots created
  ✓ 42 messages inserted (3 skipped by fingerprint)
  ✓ 18 gallery cards inserted (5 deduped to existing)
  ✓ 67 provenance rows written
  Batch id: 2026-04-09-backfill
  ```

## 7. Testing strategy

- **Parser unit tests** (fixture = a representative slice of Dan's email, committed alongside the tests):
  - Attribution header detection (including the `*domain_disabled*` and `External user...` lines that interrupt the name/timestamp on separate lines).
  - Timestamp resolution: all four flavors (full date, weekday-only, time-only, no-timestamp).
  - Link extraction: pure URL, URL + Gmail preview block, URL inside a shell command, URL inside prose.
  - Multi-URL entries split correctly.
  - Multi-line prompt content preserved as a single entry.
- **Writer unit tests** with a mocked Supabase client:
  - Ghost user match-or-create (both branches).
  - Thread root creation (both branches: fresh and re-run).
  - Gallery dedupe (both branches: fresh and existing URL).
  - Provenance fingerprinting: two runs on the same input result in zero new rows on the second run.
  - Role override (Danny Bauman / Dan Hahn get `instructor`, everyone else `student`).
- **Dry-run smoke test** on the real input file before the first live insert.
- **Post-import sanity check** (manual, documented): open the app, scroll through `#general` session threads, open `#resources` gallery, confirm display names render as `(imported)`, confirm session ordering.

## 8. Idempotency and rollback

### Idempotency

The `UNIQUE` constraint on `message_imports.source_fingerprint` combined with `ON CONFLICT DO NOTHING` on insert means:

- Running the script twice inserts nothing the second time.
- Editing a single line in `inputs/2026-04-09-dan-meet-chat-email.txt` and re-running imports only the changed line.
- Adding a new session to the input file and re-running imports only the new entries.

### Rollback

Every row written in a batch shares an `import_batch_id`. Rollback of a specific batch:

```sql
DELETE FROM messages WHERE id IN (
  SELECT message_id FROM message_imports WHERE import_batch_id = '2026-04-09-backfill' AND message_id IS NOT NULL
);
DELETE FROM gallery_cards WHERE id IN (
  SELECT gallery_card_id FROM message_imports WHERE import_batch_id = '2026-04-09-backfill' AND gallery_card_id IS NOT NULL
);
-- message_imports rows cascade via FK.
```

Ghost users are **not** removed on rollback. They are cheap to retain, and removing them would cascade-kill any real activity they may have since participated in via another feature. A separate cleanup query can remove them manually if needed.

## 9. Open risks and follow-ups

- **Timezone assumption.** Gmail renders timestamps in the reader's local time. If Dan copy-pasted while in a non-PT timezone, resolved `created_at` values will be off by the delta. Mitigation: raw string preserved in provenance, dry-run eyeball before live insert.
- **Attribution-header regex fragility.** Gmail's formatting of the `(via Meet), *domain_disabled* External user...` block is the main failure mode for the parser. Fixture tests cover the shapes seen in this dump, but a future Gmail format change could silently break the parser. Mitigation: the parser should fail loud (throw on unparseable lines) rather than silently skip them, so drift is caught on the next run.
- **Non-idempotent timestamp prelude.** The un-timestamped top-of-email lines get synthetic `created_at`s. If the raw input file is re-ordered in a future edit, fingerprints (which include `timestamp_raw`) should still match, but ordering in the resulting thread could shift. Low risk for this one-shot use; flagged for future.
- **"Better way later" thread.** Direct Gmail API / Meet API access to avoid copy-paste, or a Side Panel extension that captures chat live during a session. Not scoped here; revisit after this backfill proves the writer.
