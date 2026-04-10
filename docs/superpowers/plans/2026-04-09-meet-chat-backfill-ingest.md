# Meet Chat Backfill Ingest — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import Dan Hahn's Google Meet chat email dump (Mar 24 → Apr 9 2026) into Magic Brooms as real messages and gallery cards with accurate attribution, timestamps, and provenance, using a reusable parser/writer pipeline.

**Architecture:** A source-specific parser converts the raw email text into a neutral `ParsedEntry[]` shape. A reusable writer takes `ParsedEntry[]` and produces rows in Supabase: ghost users (via admin API), session thread roots in `#general`, threaded replies, gallery cards in `#resources` (deduped by URL), plus provenance rows in a new `message_imports` table (idempotent via a `source_fingerprint UNIQUE` constraint).

**Tech Stack:** TypeScript (ESM), Vitest (for unit tests), Supabase JS client (`@supabase/supabase-js` with service_role key for admin work), tsx (to run TS scripts directly in Node), date-fns-tz (for America/Los_Angeles timestamp resolution).

**Spec reference:** `docs/superpowers/specs/2026-04-09-meet-chat-backfill-ingest-design.md`

---

## File Structure

**New files (created by this plan):**

```
bmad/app/
├── supabase/migrations/
│   └── 00012_create_message_imports.sql       (Task 2)
├── scripts/ingest/
│   ├── inputs/
│   │   └── 2026-04-09-dan-meet-chat-email.txt (Task 3 — raw email body)
│   ├── types.ts                                (Task 4 — ParsedEntry + shared types)
│   ├── resolve-timestamp.ts                    (Task 5 — LA tz resolution)
│   ├── resolve-timestamp.test.ts               (Task 5 — tests)
│   ├── parse-meet-email.ts                     (Tasks 6, 7 — parser)
│   ├── parse-meet-email.test.ts                (Tasks 6, 7 — tests)
│   ├── admin-supabase.ts                       (Task 8 — admin client factory)
│   ├── writer/
│   │   ├── ghost-users.ts                      (Task 9)
│   │   ├── session-roots.ts                    (Task 10)
│   │   ├── fingerprint.ts                      (Task 11 — helper)
│   │   ├── messages.ts                         (Task 11)
│   │   ├── gallery-cards.ts                    (Task 12)
│   │   ├── write-entries.ts                    (Task 13 — orchestrator)
│   │   └── ghost-users.test.ts                 (Task 9)
│   │   └── fingerprint.test.ts                 (Task 11)
│   └── ingest-meet-chat.ts                     (Task 14 — entrypoint)
└── devlog/
    └── bmad-010-meet-chat-backfill.md          (Task 16)
```

**Modified files:**
- `bmad/app/package.json` — add `tsx`, `date-fns-tz` dev deps and `ingest:meet-chat` scripts (Task 1)
- `bmad/app/tsconfig.node.json` — include `scripts/**/*.ts` (Task 1)

**Responsibility per file:**
- `types.ts` — `ParsedEntry`, `WriterConfig`, `ImportStats` (shared between parser and writer)
- `resolve-timestamp.ts` — pure function: raw string + email-send date → ISO 8601 with PT offset
- `parse-meet-email.ts` — email text → `ParsedEntry[]`; no DB deps
- `admin-supabase.ts` — `createAdminClient()` reading `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env
- `writer/ghost-users.ts` — `matchOrCreateGhostUser()` + `ensureChannelMembership()`
- `writer/session-roots.ts` — `ensureSessionRoot()` per date, idempotent via provenance lookup
- `writer/fingerprint.ts` — `computeSourceFingerprint()` pure helper
- `writer/messages.ts` — `insertMessageWithProvenance()`
- `writer/gallery-cards.ts` — `insertOrReuseGalleryCard()` with URL dedupe
- `writer/write-entries.ts` — top-level orchestrator; takes `ParsedEntry[]` + config, returns `ImportStats`
- `ingest-meet-chat.ts` — CLI entrypoint: loads input file, runs parser, runs writer, prints summary

---

## Task 1: Add dependencies and npm scripts

**Files:**
- Modify: `bmad/app/package.json`
- Modify: `bmad/app/tsconfig.node.json`

- [ ] **Step 1: Install dev dependencies**

Run from `bmad/app/`:

```bash
npm install --save-dev tsx date-fns date-fns-tz
```

Expected: adds `tsx`, `date-fns`, `date-fns-tz` to `devDependencies` in `package.json` and updates `package-lock.json`.

- [ ] **Step 2: Add npm scripts**

Edit `bmad/app/package.json` and add these entries to the `"scripts"` object (alphabetical order preserved):

```json
"ingest:meet-chat": "tsx --env-file=.env.local scripts/ingest/ingest-meet-chat.ts",
"ingest:meet-chat:dry-run": "tsx --env-file=.env.local scripts/ingest/ingest-meet-chat.ts --dry-run"
```

The full `"scripts"` block should look like:

```json
"scripts": {
  "build": "tsc -b && vite build",
  "dev": "vite",
  "ingest:meet-chat": "tsx --env-file=.env.local scripts/ingest/ingest-meet-chat.ts",
  "ingest:meet-chat:dry-run": "tsx --env-file=.env.local scripts/ingest/ingest-meet-chat.ts --dry-run",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Update `tsconfig.node.json` to include the scripts dir**

Edit the `"include"` array at the bottom of `bmad/app/tsconfig.node.json`:

```json
"include": ["vite.config.ts", "vitest.config.ts", "scripts/**/*.ts"]
```

- [ ] **Step 4: Verify the build still passes**

Run from `bmad/app/`:

```bash
npm run build
```

Expected: builds successfully with no TypeScript errors. If `vitest.config.ts` was not previously in the include list it is now — this should still build cleanly since vitest is already a dev dep.

- [ ] **Step 5: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/package.json bmad/app/package-lock.json bmad/app/tsconfig.node.json
git commit -m "chore(bmad): add tsx and date-fns-tz for ingest scripts"
```

---

## Task 2: Create `message_imports` migration

**Files:**
- Create: `bmad/app/supabase/migrations/00012_create_message_imports.sql`

- [ ] **Step 1: Write the migration**

Create `bmad/app/supabase/migrations/00012_create_message_imports.sql`:

```sql
-- Provenance table for imported content (Meet chat backfill, future sources).
-- Each row points to exactly one of (message, gallery_card).
-- source_fingerprint UNIQUE gives idempotency for re-runs.

CREATE TABLE message_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  gallery_card_id UUID REFERENCES gallery_cards(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
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
CREATE INDEX idx_message_imports_batch ON message_imports (import_batch_id);

ALTER TABLE message_imports ENABLE ROW LEVEL SECURITY;

-- Only instructors can read provenance. Students do not need visibility.
CREATE POLICY "message_imports_select_instructor" ON message_imports
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'instructor')
  );
```

- [ ] **Step 2: Apply the migration locally**

Run from `bmad/app/`:

```bash
npx supabase db reset
```

Expected: all migrations re-apply cleanly, including `00012`. Look for `Applying migration 00012_create_message_imports.sql...` in the output and no errors.

- [ ] **Step 3: Verify the table and policy exist**

Run from `bmad/app/`:

```bash
npx supabase db execute --sql "\d message_imports"
```

Expected: shows the columns, CHECK constraint, UNIQUE index on `source_fingerprint`, and the three non-unique indexes.

If `supabase db execute` is unavailable in your CLI version, use psql directly against the local port (default 54322):

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\d message_imports"
```

- [ ] **Step 4: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/supabase/migrations/00012_create_message_imports.sql
git commit -m "feat(bmad): add message_imports provenance table"
```

---

## Task 3: Create the raw input file

**Files:**
- Create: `bmad/app/scripts/ingest/inputs/2026-04-09-dan-meet-chat-email.txt`

- [ ] **Step 1: Create the directory and file with the email body**

Create `bmad/app/scripts/ingest/inputs/2026-04-09-dan-meet-chat-email.txt` with the exact content Dan forwarded. Use the verbatim email body (spanning Mar 24 → Apr 9 2026, 7 sessions). The file should begin with the top-of-email prelude lines that have no timestamp:

```
Create a new branch called ui-experiment

https://stitch.withgoogle.com/

https://github.com/davideast/stitch-mcp
```

…and continue through every attribution header (`<Name> (via Meet), *domain_disabled* External user not managed by admin, <timestamp>`) and its content block, ending with the final entry in the email thread (`Dillon Schultz ... 5:00 PM / I'm excited for the M's`).

> **IMPORTANT:** Do NOT hand-edit the content. Paste it verbatim from the source conversation / email. Every whitespace quirk and line order matters because `source_fingerprint` hashes against the raw text. If you don't have the raw text, ask the project owner — do NOT guess.

- [ ] **Step 2: Verify file was written**

Run from `bmad/app/`:

```bash
wc -l scripts/ingest/inputs/2026-04-09-dan-meet-chat-email.txt
```

Expected: ~200+ lines (the dump is substantial; exact count depends on original whitespace).

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/inputs/2026-04-09-dan-meet-chat-email.txt
git commit -m "feat(bmad): add raw Meet chat email dump for backfill (2026-04-09)"
```

---

## Task 4: Define shared types

**Files:**
- Create: `bmad/app/scripts/ingest/types.ts`

- [ ] **Step 1: Write the types file**

Create `bmad/app/scripts/ingest/types.ts`:

```ts
export type ParsedEntry = {
  kind: 'message' | 'link';
  author_raw: string;          // "Danny Bauman (via Meet)"
  author_display: string;      // "Danny Bauman"
  session_date: string;        // "2026-04-09" (YYYY-MM-DD)
  timestamp_raw: string;       // "Tue 3:54 PM" (original, preserved)
  timestamp_resolved: string;  // ISO 8601 with PT offset
  content: string;             // full multi-line for messages; URL for links
  preview_title?: string;      // Gmail preview text if present (links only)
};

export type WriterConfig = {
  source: string;              // e.g. 'google-meet-email'
  importBatchId: string;       // e.g. '2026-04-09-backfill'
  instructorDisplayNames: readonly string[];
  dryRun: boolean;
};

export type ImportStats = {
  ghostUsersCreated: number;
  ghostUsersMatched: number;
  sessionRootsCreated: number;
  sessionRootsReused: number;
  messagesInserted: number;
  messagesSkipped: number;
  galleryCardsInserted: number;
  galleryCardsDeduped: number;
  provenanceRows: number;
};
```

- [ ] **Step 2: Verify it compiles**

Run from `bmad/app/`:

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/types.ts
git commit -m "feat(bmad): define ParsedEntry and ingest writer types"
```

---

## Task 5: Implement `resolveTimestamp()`

**Files:**
- Create: `bmad/app/scripts/ingest/resolve-timestamp.ts`
- Create: `bmad/app/scripts/ingest/resolve-timestamp.test.ts`

**Rules to implement (from spec §4):**
- `Mon DD, H:MM PM` → that month/day in 2026 at HH:MM PT
- `<Weekday> H:MM PM` → most recent past weekday relative to the email-send date
- `H:MM PM` (no date) → email-send date
- Returns `{ iso: string, sessionDate: string }`. `iso` includes offset. `sessionDate` is `YYYY-MM-DD` in PT.

- [ ] **Step 1: Write the failing tests**

Create `bmad/app/scripts/ingest/resolve-timestamp.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { resolveTimestamp } from './resolve-timestamp';

const EMAIL_SENT = new Date('2026-04-09T20:14:00-07:00'); // Thu Apr 9 2026, 8:14 PM PT

describe('resolveTimestamp', () => {
  it('resolves a full-date form (Mar 24, 3:17 PM)', () => {
    const result = resolveTimestamp('Mar 24, 3:17 PM', EMAIL_SENT);
    expect(result.sessionDate).toBe('2026-03-24');
    expect(result.iso).toBe('2026-03-24T15:17:00-07:00');
  });

  it('resolves a full-date form in April (Apr 2, 4:13 PM)', () => {
    const result = resolveTimestamp('Apr 2, 4:13 PM', EMAIL_SENT);
    expect(result.sessionDate).toBe('2026-04-02');
    expect(result.iso).toBe('2026-04-02T16:13:00-07:00');
  });

  it('resolves a weekday-only form (Tue 3:54 PM) to the most recent past Tuesday', () => {
    // email sent Thu 2026-04-09, most recent past Tuesday = 2026-04-07
    const result = resolveTimestamp('Tue 3:54 PM', EMAIL_SENT);
    expect(result.sessionDate).toBe('2026-04-07');
    expect(result.iso).toBe('2026-04-07T15:54:00-07:00');
  });

  it('resolves a bare time form (3:05 PM) to the email-send date', () => {
    const result = resolveTimestamp('3:05 PM', EMAIL_SENT);
    expect(result.sessionDate).toBe('2026-04-09');
    expect(result.iso).toBe('2026-04-09T15:05:00-07:00');
  });

  it('resolves AM times correctly (Mar 24, 11:45 AM)', () => {
    const result = resolveTimestamp('Mar 24, 11:45 AM', EMAIL_SENT);
    expect(result.iso).toBe('2026-03-24T11:45:00-07:00');
  });

  it('throws on unparseable input', () => {
    expect(() => resolveTimestamp('gibberish', EMAIL_SENT)).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/resolve-timestamp.test.ts
```

Expected: FAIL — module `./resolve-timestamp` not found.

- [ ] **Step 3: Implement `resolveTimestamp()`**

Create `bmad/app/scripts/ingest/resolve-timestamp.ts`:

```ts
import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'America/Los_Angeles';

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

const WEEKDAYS: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

export type ResolvedTimestamp = {
  iso: string;
  sessionDate: string; // YYYY-MM-DD in PT
};

/**
 * Resolve a raw Gmail-copy-pasted timestamp string to an ISO 8601 value in PT
 * and the session date (YYYY-MM-DD in PT).
 *
 * Supported formats:
 *   - "Mon DD, H:MM AM/PM"   (e.g. "Mar 24, 3:17 PM")
 *   - "Weekday H:MM AM/PM"   (e.g. "Tue 3:54 PM") — most recent past weekday
 *   - "H:MM AM/PM"           (e.g. "3:05 PM") — email-send date
 *
 * Year is assumed to be the email-send date's year (2026 here).
 * Timezone is America/Los_Angeles (PT); the current dump is entirely in PDT (-07:00)
 * but the implementation handles either offset via date-fns-tz.
 */
export function resolveTimestamp(raw: string, emailSentAt: Date): ResolvedTimestamp {
  const trimmed = raw.trim();

  // "Mon DD, H:MM AM/PM"
  const fullMatch = trimmed.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (fullMatch) {
    const [, monStr, dayStr, hourStr, minStr, meridiem] = fullMatch;
    const month = MONTHS[monStr];
    if (!month) throw new Error(`Unknown month: ${monStr}`);
    const year = parseInt(formatInTimeZone(emailSentAt, TZ, 'yyyy'), 10);
    return buildResolved(year, month, parseInt(dayStr, 10), parseInt(hourStr, 10), parseInt(minStr, 10), meridiem);
  }

  // "Weekday H:MM AM/PM"
  const weekdayMatch = trimmed.match(/^([A-Z][a-z]{2}) (\d{1,2}):(\d{2}) (AM|PM)$/);
  if (weekdayMatch) {
    const [, dayStr, hourStr, minStr, meridiem] = weekdayMatch;
    const target = WEEKDAYS[dayStr];
    if (target === undefined) throw new Error(`Unknown weekday: ${dayStr}`);
    const sentYmd = formatInTimeZone(emailSentAt, TZ, 'yyyy-MM-dd');
    const sentDow = parseInt(formatInTimeZone(emailSentAt, TZ, 'i'), 10) % 7; // 1..7 → 0..6 w/ Sun=0
    // Compute days back from sent date to target weekday. If same weekday, it's the prior week (7 days back).
    const daysBack = ((sentDow - target + 7) % 7) || 7;
    const [sy, sm, sd] = sentYmd.split('-').map(Number);
    const sent = new Date(Date.UTC(sy, sm - 1, sd));
    sent.setUTCDate(sent.getUTCDate() - daysBack);
    return buildResolved(
      sent.getUTCFullYear(),
      sent.getUTCMonth() + 1,
      sent.getUTCDate(),
      parseInt(hourStr, 10),
      parseInt(minStr, 10),
      meridiem,
    );
  }

  // "H:MM AM/PM" (email-send date)
  const bareMatch = trimmed.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (bareMatch) {
    const [, hourStr, minStr, meridiem] = bareMatch;
    const [y, m, d] = formatInTimeZone(emailSentAt, TZ, 'yyyy-MM-dd').split('-').map(Number);
    return buildResolved(y, m, d, parseInt(hourStr, 10), parseInt(minStr, 10), meridiem);
  }

  throw new Error(`Unparseable timestamp: ${raw}`);
}

function buildResolved(
  year: number, month: number, day: number,
  hour12: number, minute: number, meridiem: string,
): ResolvedTimestamp {
  let hour24 = hour12 % 12;
  if (meridiem === 'PM') hour24 += 12;

  // Build a Date that represents the instant year-month-day hour24:minute:00 in PT.
  // Strategy: construct a UTC Date with the local wall-clock fields, then ask
  // formatInTimeZone for the PT offset at that moment, and correct.
  const naive = new Date(Date.UTC(year, month - 1, day, hour24, minute, 0));
  const offsetStr = formatInTimeZone(naive, TZ, 'xxx'); // "-07:00" or "-08:00"
  const sign = offsetStr[0] === '-' ? 1 : -1;
  const [offH, offM] = offsetStr.slice(1).split(':').map(Number);
  const offsetMs = sign * (offH * 60 + offM) * 60 * 1000;
  const instant = new Date(naive.getTime() + offsetMs);

  const iso = formatInTimeZone(instant, TZ, "yyyy-MM-dd'T'HH:mm:ssxxx");
  const sessionDate = formatInTimeZone(instant, TZ, 'yyyy-MM-dd');
  return { iso, sessionDate };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/resolve-timestamp.test.ts
```

Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/resolve-timestamp.ts bmad/app/scripts/ingest/resolve-timestamp.test.ts
git commit -m "feat(bmad): resolveTimestamp() helper for Meet chat ingest"
```

---

## Task 6: Implement email attribution header parsing and entry grouping

**Files:**
- Create: `bmad/app/scripts/ingest/parse-meet-email.ts`
- Create: `bmad/app/scripts/ingest/parse-meet-email.test.ts`

**Rules (from spec §4):**
- An attribution header is the pattern: a line `<Name> (via Meet), *domain_disabled*` (or variants), followed by a line `External user not managed by admin`, followed by a line that starts with `, ` and contains the timestamp.
- Entry content starts after the timestamp line and ends at the next attribution header or EOF.
- Top-of-email content before the first attribution header → assigned author "Dan Hahn" (email sender), session 2026-04-09, with synthetic timestamps (1 second apart, last one 1 second before the first real 2026-04-09 entry).
- Each attribution header = exactly ONE entry of kind `'message'` by default. Link classification happens in Task 7.
- Entries with empty/whitespace-only content are dropped.

- [ ] **Step 1: Write the failing tests**

Create `bmad/app/scripts/ingest/parse-meet-email.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseMeetEmail } from './parse-meet-email';

const EMAIL_SENT = new Date('2026-04-09T20:14:00-07:00');

const FIXTURE_HEADER_BASIC = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 24, 3:17 PM

supabase.com
`;

const FIXTURE_TWO_ENTRIES = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 24, 3:17 PM

supabase.com

Dillon Schultz (via Meet), *domain_disabled*

External user not managed by admin

, Mar 24, 4:35 PM

I did my fair share of unit tests
`;

const FIXTURE_MULTILINE = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 26, 4:02 PM

Activity: Install Together

Create a new folder called todo-bmad inside your Desktop

Open that folder in Cursor
`;

const FIXTURE_WITH_PRELUDE = `Create a new branch called ui-experiment

https://stitch.withgoogle.com/

Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, 3:54 PM

hello
`;

describe('parseMeetEmail', () => {
  it('parses a single attribution header + content', () => {
    const entries = parseMeetEmail(FIXTURE_HEADER_BASIC, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      kind: 'message',
      author_raw: 'Danny Bauman (via Meet)',
      author_display: 'Danny Bauman',
      session_date: '2026-03-24',
      timestamp_raw: 'Mar 24, 3:17 PM',
      content: 'supabase.com',
    });
    expect(entries[0].timestamp_resolved).toMatch(/^2026-03-24T15:17:00/);
  });

  it('parses two consecutive entries', () => {
    const entries = parseMeetEmail(FIXTURE_TWO_ENTRIES, EMAIL_SENT);
    expect(entries).toHaveLength(2);
    expect(entries[0].author_display).toBe('Danny Bauman');
    expect(entries[0].content).toBe('supabase.com');
    expect(entries[1].author_display).toBe('Dillon Schultz');
    expect(entries[1].content).toBe('I did my fair share of unit tests');
  });

  it('preserves multi-line content as a single entry with newlines', () => {
    const entries = parseMeetEmail(FIXTURE_MULTILINE, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0].content).toBe(
      'Activity: Install Together\n\nCreate a new folder called todo-bmad inside your Desktop\n\nOpen that folder in Cursor',
    );
  });

  it('assigns top-of-email prelude lines to Dan Hahn on the email-send date', () => {
    const entries = parseMeetEmail(FIXTURE_WITH_PRELUDE, EMAIL_SENT);
    // prelude: 2 non-empty lines ("Create a new branch..." and "https://stitch...")
    // plus the Danny Bauman entry
    const prelude = entries.filter((e) => e.author_display === 'Dan Hahn');
    expect(prelude).toHaveLength(2);
    for (const p of prelude) {
      expect(p.session_date).toBe('2026-04-09');
      expect(p.timestamp_raw).toBe('(email prelude — no timestamp in source)');
    }
    // Synthetic timestamps: 1 second apart, last one 1 second before the first real 2026-04-09 entry.
    // The Danny Bauman entry is at "3:54 PM" = 2026-04-09T15:54:00-07:00.
    // Prelude entries should be at 15:53:58 and 15:53:59 in that order.
    expect(prelude[0].timestamp_resolved).toMatch(/T15:53:58/);
    expect(prelude[1].timestamp_resolved).toMatch(/T15:53:59/);
  });

  it('drops entries with empty content', () => {
    const fixture = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 24, 3:17 PM


Dillon Schultz (via Meet), *domain_disabled*

External user not managed by admin

, Mar 24, 4:35 PM

hi
`;
    const entries = parseMeetEmail(fixture, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0].author_display).toBe('Dillon Schultz');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/parse-meet-email.test.ts
```

Expected: FAIL — module `./parse-meet-email` not found.

- [ ] **Step 3: Implement the parser (header detection + grouping + prelude)**

Create `bmad/app/scripts/ingest/parse-meet-email.ts`:

```ts
import type { ParsedEntry } from './types';
import { resolveTimestamp } from './resolve-timestamp';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'America/Los_Angeles';

// Attribution header is three logical lines:
//   Line A: "<Name> (via Meet), *domain_disabled*"
//   Line B: "External user not managed by admin"
//   Line C: ", <timestamp>"
// Blank lines between them are allowed (Gmail copy-paste adds them).
const NAME_LINE_RE = /^(.+?) \(via Meet\),\s*\*domain_disabled\*\s*$/;
const EXTERNAL_LINE_RE = /^External user not managed by admin\s*$/;
const TS_LINE_RE = /^,\s*(.+?)\s*$/;

type RawEntry = {
  author_raw: string;
  author_display: string;
  timestamp_raw: string;
  contentLines: string[];
};

export function parseMeetEmail(source: string, emailSentAt: Date): ParsedEntry[] {
  const lines = source.split(/\r?\n/);
  const rawEntries: RawEntry[] = [];
  const preludeLines: string[] = [];
  let sawFirstHeader = false;
  let current: RawEntry | null = null;

  let i = 0;
  while (i < lines.length) {
    const nameMatch = lines[i].match(NAME_LINE_RE);
    if (nameMatch) {
      // Lookahead: skip blank lines, expect External line, more blanks, expect ", <timestamp>".
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j += 1;
      if (j >= lines.length || !EXTERNAL_LINE_RE.test(lines[j])) {
        // Not a real header, treat this line as content.
        if (current) current.contentLines.push(lines[i]);
        else preludeLines.push(lines[i]);
        i += 1;
        continue;
      }
      j += 1;
      while (j < lines.length && lines[j].trim() === '') j += 1;
      const tsMatch = j < lines.length ? lines[j].match(TS_LINE_RE) : null;
      if (!tsMatch) {
        if (current) current.contentLines.push(lines[i]);
        else preludeLines.push(lines[i]);
        i += 1;
        continue;
      }

      // Commit the previous entry.
      if (current) rawEntries.push(current);

      const authorRaw = `${nameMatch[1]} (via Meet)`;
      current = {
        author_raw: authorRaw,
        author_display: nameMatch[1].trim(),
        timestamp_raw: tsMatch[1],
        contentLines: [],
      };
      sawFirstHeader = true;
      i = j + 1;
      continue;
    }

    if (!sawFirstHeader) {
      preludeLines.push(lines[i]);
    } else if (current) {
      current.contentLines.push(lines[i]);
    }
    i += 1;
  }
  if (current) rawEntries.push(current);

  // Resolve timestamps and drop empty-content entries.
  const realEntries: ParsedEntry[] = [];
  for (const r of rawEntries) {
    const content = normalizeContent(r.contentLines);
    if (content.length === 0) continue;
    const resolved = resolveTimestamp(r.timestamp_raw, emailSentAt);
    realEntries.push({
      kind: 'message',
      author_raw: r.author_raw,
      author_display: r.author_display,
      session_date: resolved.sessionDate,
      timestamp_raw: r.timestamp_raw,
      timestamp_resolved: resolved.iso,
      content,
    });
  }

  // Prelude synthesis: lines that appeared before the first attribution header
  // are assigned to Dan Hahn on the email-send date, with synthetic timestamps
  // 1 second apart ending 1 second before the first real 2026-04-09 entry.
  const prelude = buildPreludeEntries(preludeLines, realEntries, emailSentAt);

  // Return prelude entries first (they belong chronologically at the top of the
  // 2026-04-09 session), then the real entries in source order.
  return [...prelude, ...realEntries];
}

function normalizeContent(contentLines: string[]): string {
  // Trim leading and trailing blank lines; preserve internal blank lines.
  let start = 0;
  let end = contentLines.length;
  while (start < end && contentLines[start].trim() === '') start += 1;
  while (end > start && contentLines[end - 1].trim() === '') end -= 1;
  return contentLines.slice(start, end).join('\n');
}

function buildPreludeEntries(
  preludeLines: string[],
  realEntries: ParsedEntry[],
  emailSentAt: Date,
): ParsedEntry[] {
  // Keep only non-empty prelude lines. Each one becomes its own entry.
  const meaningful = preludeLines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (meaningful.length === 0) return [];

  const sendSessionDate = formatInTimeZone(emailSentAt, TZ, 'yyyy-MM-dd');

  // Find the first real entry on the email-send-date session to compute anchor time.
  const firstOnSendDate = realEntries.find((e) => e.session_date === sendSessionDate);
  const anchorIso = firstOnSendDate?.timestamp_resolved;

  let anchorInstant: Date;
  if (anchorIso) {
    anchorInstant = new Date(anchorIso);
  } else {
    // No real entries on send date — anchor to email-send moment.
    anchorInstant = new Date(emailSentAt);
  }

  // Last prelude entry is 1 second before anchor; earlier ones each 1 second earlier.
  const count = meaningful.length;
  return meaningful.map((line, idx) => {
    const offsetSeconds = count - idx; // 1..count, last entry gets 1
    const instant = new Date(anchorInstant.getTime() - offsetSeconds * 1000);
    const iso = formatInTimeZone(instant, TZ, "yyyy-MM-dd'T'HH:mm:ssxxx");
    return {
      kind: 'message' as const,
      author_raw: 'Dan Hahn (email sender)',
      author_display: 'Dan Hahn',
      session_date: sendSessionDate,
      timestamp_raw: '(email prelude — no timestamp in source)',
      timestamp_resolved: iso,
      content: line,
    };
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/parse-meet-email.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/parse-meet-email.ts bmad/app/scripts/ingest/parse-meet-email.test.ts
git commit -m "feat(bmad): parse Meet chat email attribution headers and prelude"
```

---

## Task 7: Link classification and multi-URL splitting

**Files:**
- Modify: `bmad/app/scripts/ingest/parse-meet-email.ts`
- Modify: `bmad/app/scripts/ingest/parse-meet-email.test.ts`

**Rules (spec §4, L1):**
- An entry whose content is exactly one URL (optionally followed by Gmail preview title + domain lines) → `kind: 'link'`, `content = URL`, `preview_title = Gmail preview text` if present.
- An entry with multiple standalone URLs → split into N link entries (one per URL), preserving author + timestamp. If any non-URL text remains, it stays as one message entry (in practice none does in this dump).
- Entries with URLs embedded in prose or commands stay as `'message'` with content untouched.

- [ ] **Step 1: Add failing tests for link classification**

Append to `bmad/app/scripts/ingest/parse-meet-email.test.ts`:

```ts
describe('parseMeetEmail link classification', () => {
  const EMAIL_SENT = new Date('2026-04-09T20:14:00-07:00');

  it('classifies a bare URL entry as a link', () => {
    const fixture = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 24, 3:17 PM

https://supabase.com/
`;
    const entries = parseMeetEmail(fixture, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('link');
    expect(entries[0].content).toBe('https://supabase.com/');
    expect(entries[0].preview_title).toBeUndefined();
  });

  it('captures Gmail preview title when present', () => {
    const fixture = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 31, 3:38 PM

https://whisperflow.app/

Whisper Flow

whisperflow.app
`;
    const entries = parseMeetEmail(fixture, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('link');
    expect(entries[0].content).toBe('https://whisperflow.app/');
    expect(entries[0].preview_title).toBe('Whisper Flow');
  });

  it('splits an entry with multiple URLs into N link entries', () => {
    const fixture = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Apr 9, 4:44 PM

https://www.kimi.com/ai-models/kimi-k2-5

https://openlm.ai/glm-5.1/

https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash
`;
    const entries = parseMeetEmail(fixture, EMAIL_SENT);
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.kind === 'link')).toBe(true);
    expect(entries.map((e) => e.content)).toEqual([
      'https://www.kimi.com/ai-models/kimi-k2-5',
      'https://openlm.ai/glm-5.1/',
      'https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash',
    ]);
    // All three share the same author + timestamp
    expect(new Set(entries.map((e) => e.author_display))).toEqual(new Set(['Danny Bauman']));
    expect(new Set(entries.map((e) => e.timestamp_raw))).toEqual(new Set(['Apr 9, 4:44 PM']));
  });

  it('keeps URLs embedded in shell commands as message content', () => {
    const fixture = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Mar 31, 4:12 PM

curl -fsSL https://claude.ai/install.sh | bash
`;
    const entries = parseMeetEmail(fixture, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('message');
    expect(entries[0].content).toBe('curl -fsSL https://claude.ai/install.sh | bash');
  });

  it('keeps multi-line prompt content as a single message entry', () => {
    const fixture = `Danny Bauman (via Meet), *domain_disabled*

External user not managed by admin

, Apr 2, 4:47 PM

I want to create a Design Reviewer Skill.

Interview me about what makes a good UI.
`;
    const entries = parseMeetEmail(fixture, EMAIL_SENT);
    expect(entries).toHaveLength(1);
    expect(entries[0].kind).toBe('message');
    expect(entries[0].content).toBe(
      'I want to create a Design Reviewer Skill.\n\nInterview me about what makes a good UI.',
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/parse-meet-email.test.ts
```

Expected: FAIL — link classification tests fail because current parser returns `kind: 'message'` for everything.

- [ ] **Step 3: Implement link classification**

Edit `bmad/app/scripts/ingest/parse-meet-email.ts` to add link classification. Replace the `realEntries` loop with a two-pass approach: first produce raw message entries, then post-process each one through `classifyEntry()` which may emit one or more final `ParsedEntry` values.

Replace the block starting with `// Resolve timestamps and drop empty-content entries.` through `}` (the loop that pushes to `realEntries`) with:

```ts
  // Resolve timestamps, drop empty-content entries, and classify links.
  const realEntries: ParsedEntry[] = [];
  for (const r of rawEntries) {
    const content = normalizeContent(r.contentLines);
    if (content.length === 0) continue;
    const resolved = resolveTimestamp(r.timestamp_raw, emailSentAt);
    const base = {
      author_raw: r.author_raw,
      author_display: r.author_display,
      session_date: resolved.sessionDate,
      timestamp_raw: r.timestamp_raw,
      timestamp_resolved: resolved.iso,
    };
    for (const classified of classifyContent(content, base)) {
      realEntries.push(classified);
    }
  }
```

Then add this helper function below `normalizeContent()`:

```ts
// Matches an HTTP(S) URL, including query strings and fragments. Anchored to
// be the only content on its line (after trimming).
const URL_LINE_RE = /^(https?:\/\/[^\s]+)$/;

type EntryBase = Omit<ParsedEntry, 'kind' | 'content' | 'preview_title'>;

/**
 * Classify an entry's content into one or more ParsedEntry values.
 *
 * Cases:
 *   1. Content is a single URL line (optionally followed by Gmail preview
 *      text/domain lines) → one 'link' entry with preview_title.
 *   2. Content is multiple URL lines (blank lines between) → N 'link' entries.
 *   3. Content mixes URLs and prose → stays as one 'message' entry, content
 *      preserved as-is.
 */
function classifyContent(content: string, base: EntryBase): ParsedEntry[] {
  const lines = content.split('\n');
  const nonBlank = lines.map((l) => l.trim()).filter((l) => l.length > 0);

  // Gmail often renders a bare URL like:
  //   https://whisperflow.app/
  //   Whisper Flow
  //   whisperflow.app
  // The 2nd and 3rd lines are Gmail's preview title and domain.
  // Detect: 1 URL line followed by 1-2 non-URL lines where the last is a
  // plausible bare domain of the URL.
  if (nonBlank.length >= 1 && URL_LINE_RE.test(nonBlank[0])) {
    const url = nonBlank[0];
    const rest = nonBlank.slice(1);
    if (rest.length === 0) {
      return [{ ...base, kind: 'link', content: url }];
    }
    if (
      rest.length <= 2 &&
      rest.every((l) => !URL_LINE_RE.test(l)) &&
      looksLikePreviewDomain(rest[rest.length - 1], url)
    ) {
      return [{
        ...base,
        kind: 'link',
        content: url,
        preview_title: rest.length === 2 ? rest[0] : undefined,
      }];
    }
  }

  // Multiple URL lines with no prose in between → N link entries.
  if (nonBlank.length >= 2 && nonBlank.every((l) => URL_LINE_RE.test(l))) {
    return nonBlank.map((url) => ({ ...base, kind: 'link' as const, content: url }));
  }

  // Everything else stays as a message.
  return [{ ...base, kind: 'message', content }];
}

function looksLikePreviewDomain(line: string, url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const candidate = line.trim().replace(/^www\./, '');
    return candidate.startsWith(host);
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run the tests to verify all pass**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/parse-meet-email.test.ts
```

Expected: PASS (10 tests total — 5 from Task 6, 5 new).

- [ ] **Step 5: Run the parser against the real input as a smoke test**

Create a temporary scratch file — do NOT commit this — to confirm the parser handles the full real email without throwing. Run this one-liner from `bmad/app/`:

```bash
npx tsx -e "
import { readFileSync } from 'node:fs';
import { parseMeetEmail } from './scripts/ingest/parse-meet-email.ts';
const src = readFileSync('scripts/ingest/inputs/2026-04-09-dan-meet-chat-email.txt', 'utf8');
const entries = parseMeetEmail(src, new Date('2026-04-09T20:14:00-07:00'));
console.log('Total entries:', entries.length);
console.log('Messages:', entries.filter(e => e.kind === 'message').length);
console.log('Links:', entries.filter(e => e.kind === 'link').length);
const dates = new Set(entries.map(e => e.session_date));
console.log('Session dates:', [...dates].sort());
const authors = new Set(entries.map(e => e.author_display));
console.log('Authors:', [...authors].sort());
"
```

Expected:
- No thrown errors.
- Session dates include `2026-03-24`, `2026-03-26`, `2026-03-31`, `2026-04-01`, `2026-04-02`, `2026-04-07`, `2026-04-09`.
- Authors include at minimum: Danny Bauman, Dan Hahn, Dillon Schultz, Damon Brennen, David Rosenberg, Melissa Cikara, wtswill@gmail.com (or whatever the parser extracts from the raw email).
- Messages + Links count is plausible (~60-80 combined).

If the run fails, fix the parser before proceeding. Common issues: a header variant in the raw email that doesn't match the regexes (look at the offending line number in the thrown error).

- [ ] **Step 6: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/parse-meet-email.ts bmad/app/scripts/ingest/parse-meet-email.test.ts
git commit -m "feat(bmad): classify Meet chat entries as link vs message"
```

---

## Task 8: Admin Supabase client factory

**Files:**
- Create: `bmad/app/scripts/ingest/admin-supabase.ts`

- [ ] **Step 1: Write the client factory**

Create `bmad/app/scripts/ingest/admin-supabase.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Create a Supabase admin client using the service_role key.
 *
 * Reads:
 *   - VITE_SUPABASE_URL     (reused from the app's .env.local)
 *   - SUPABASE_SERVICE_ROLE_KEY (must be added to .env.local for ingest work)
 *
 * The service_role key bypasses RLS and can use the auth admin API. This
 * client must NEVER be imported from application code or committed to the
 * browser bundle.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'VITE_SUPABASE_URL is missing. Set it in bmad/app/.env.local.',
    );
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Add it to bmad/app/.env.local for ingest scripts. ' +
        'Get it from `npx supabase status` (local) or the Supabase dashboard (remote).',
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run from `bmad/app/`:

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/admin-supabase.ts
git commit -m "feat(bmad): admin Supabase client factory for ingest scripts"
```

---

## Task 9: Ghost user match-or-create + channel membership

**Files:**
- Create: `bmad/app/scripts/ingest/writer/ghost-users.ts`
- Create: `bmad/app/scripts/ingest/writer/ghost-users.test.ts`

**Rules (spec §5):**
- Input: `author_display` (e.g., "Danny Bauman"). Output: `user_id` (UUID).
- Normalize `author_display` (lowercase, trim, collapse whitespace).
- Lookup existing profile by `display_name` case-insensitively. If match → return its `id`.
- Otherwise create via admin API: email `imported+<slug>@magic-brooms.local`, random 64-char password, `email_confirmed: true`, metadata `{ source: 'google-meet-email', imported: true }`.
- Update the auto-created profile: `display_name = "<Name> (imported)"`, role based on hardcoded instructor list.
- Ensure the user is a member of `#general` and `#resources` via `INSERT ... ON CONFLICT DO NOTHING`.
- Cache results in memory for the run.

- [ ] **Step 1: Write the failing tests**

Create `bmad/app/scripts/ingest/writer/ghost-users.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeGhostUserResolver, slugifyDisplayName } from './ghost-users';

describe('slugifyDisplayName', () => {
  it('lowercases and replaces non-alphanumerics with hyphens', () => {
    expect(slugifyDisplayName('Danny Bauman')).toBe('danny-bauman');
    expect(slugifyDisplayName("  Dillon   Schultz ")).toBe('dillon-schultz');
    expect(slugifyDisplayName('wtswill@gmail.com')).toBe('wtswill-gmail-com');
  });
});

describe('makeGhostUserResolver', () => {
  let mockClient: any;
  let profilesRows: Array<{ id: string; display_name: string; role: string }>;
  let usersCreated: Array<{ email: string }>;
  let channelMembersInserted: Array<{ channel_id: string; user_id: string }>;

  beforeEach(() => {
    profilesRows = [];
    usersCreated = [];
    channelMembersInserted = [];

    mockClient = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              ilike: vi.fn((_col: string, value: string) => ({
                maybeSingle: vi.fn(async () => {
                  const normalized = value.replace(/%/g, '').toLowerCase();
                  const match = profilesRows.find(
                    (p) => p.display_name.toLowerCase() === normalized,
                  );
                  return { data: match ?? null, error: null };
                }),
              })),
            })),
            update: vi.fn((patch: any) => ({
              eq: vi.fn(async (_col: string, id: string) => {
                const row = profilesRows.find((p) => p.id === id);
                if (row) Object.assign(row, patch);
                return { error: null };
              }),
            })),
          };
        }
        if (table === 'channels') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(async () => ({
                data: [
                  { id: 'channel-general', name: 'general' },
                  { id: 'channel-resources', name: 'resources' },
                ],
                error: null,
              })),
            })),
          };
        }
        if (table === 'channel_members') {
          return {
            upsert: vi.fn(async (rows: any) => {
              const arr = Array.isArray(rows) ? rows : [rows];
              // Simulate ignoreDuplicates: skip rows whose (channel_id, user_id)
              // is already present.
              for (const row of arr) {
                const dupe = channelMembersInserted.find(
                  (m) => m.channel_id === row.channel_id && m.user_id === row.user_id,
                );
                if (!dupe) channelMembersInserted.push(row);
              }
              return { error: null };
            }),
          };
        }
        throw new Error(`Unmocked table: ${table}`);
      }),
      auth: {
        admin: {
          createUser: vi.fn(async ({ email }: { email: string }) => {
            const id = `user-${usersCreated.length + 1}`;
            usersCreated.push({ email });
            // Simulate the on_auth_user_created trigger inserting the profile.
            profilesRows.push({ id, display_name: '', role: 'student' });
            return { data: { user: { id } }, error: null };
          }),
        },
      },
    };
  });

  it('creates a new ghost user on first lookup, then reuses from cache', async () => {
    const resolver = makeGhostUserResolver(mockClient, {
      instructorDisplayNames: ['Danny Bauman'],
    });

    const id1 = await resolver.resolve('Dillon Schultz');
    const id2 = await resolver.resolve('Dillon Schultz');

    expect(id1).toBe(id2);
    expect(usersCreated).toHaveLength(1);
    expect(usersCreated[0].email).toBe('imported+dillon-schultz@magic-brooms.local');

    // Display name was updated with "(imported)" suffix
    const row = profilesRows.find((p) => p.id === id1);
    expect(row?.display_name).toBe('Dillon Schultz (imported)');
    expect(row?.role).toBe('student');
  });

  it('applies instructor role override for matching display names', async () => {
    const resolver = makeGhostUserResolver(mockClient, {
      instructorDisplayNames: ['Danny Bauman', 'Dan Hahn'],
    });

    await resolver.resolve('Danny Bauman');
    const danny = profilesRows.find((p) => p.display_name === 'Danny Bauman (imported)');
    expect(danny?.role).toBe('instructor');
  });

  it('matches an existing profile by display_name (case-insensitive) without creating', async () => {
    profilesRows.push({ id: 'existing-1', display_name: 'Melissa Cikara', role: 'student' });

    const resolver = makeGhostUserResolver(mockClient, {
      instructorDisplayNames: [],
    });
    const id = await resolver.resolve('melissa cikara');

    expect(id).toBe('existing-1');
    expect(usersCreated).toHaveLength(0);
  });

  it('matches a previously-imported ghost by display_name with "(imported)" suffix', async () => {
    // Simulate a prior run having already created this ghost.
    profilesRows.push({ id: 'ghost-1', display_name: 'Dillon Schultz (imported)', role: 'student' });

    const resolver = makeGhostUserResolver(mockClient, { instructorDisplayNames: [] });
    const id = await resolver.resolve('Dillon Schultz');

    expect(id).toBe('ghost-1');
    expect(usersCreated).toHaveLength(0);
  });

  it('ensures channel membership in general and resources for created ghost', async () => {
    const resolver = makeGhostUserResolver(mockClient, { instructorDisplayNames: [] });
    const id = await resolver.resolve('Damon Brennen');

    const forThisUser = channelMembersInserted.filter((m) => m.user_id === id);
    expect(forThisUser).toHaveLength(2);
    expect(forThisUser.map((m) => m.channel_id).sort()).toEqual(
      ['channel-general', 'channel-resources'].sort(),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/writer/ghost-users.test.ts
```

Expected: FAIL — module `./ghost-users` not found.

- [ ] **Step 3: Implement `ghost-users.ts`**

Create `bmad/app/scripts/ingest/writer/ghost-users.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

export function slugifyDisplayName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export type GhostUserResolverConfig = {
  instructorDisplayNames: readonly string[];
};

export type GhostUserResolver = {
  resolve(authorDisplay: string): Promise<string>;
  stats(): { created: number; matched: number };
};

type ChannelCache = { general: string; resources: string } | null;

export function makeGhostUserResolver(
  client: SupabaseClient,
  config: GhostUserResolverConfig,
): GhostUserResolver {
  const cache = new Map<string, string>(); // author_display (normalized) → user_id
  let created = 0;
  let matched = 0;
  let channelCache: ChannelCache = null;
  const instructorSet = new Set(
    config.instructorDisplayNames.map((n) => n.trim().toLowerCase()),
  );

  async function loadChannelIds(): Promise<{ general: string; resources: string }> {
    if (channelCache) return channelCache;
    const { data, error } = await client
      .from('channels')
      .select('id, name')
      .in('name', ['general', 'resources']);
    if (error) throw new Error(`Failed to load channel ids: ${error.message}`);
    const byName = new Map<string, string>();
    for (const row of data ?? []) byName.set(row.name as string, row.id as string);
    const general = byName.get('general');
    const resources = byName.get('resources');
    if (!general || !resources) {
      throw new Error('Seed channels #general and #resources must exist before ingest');
    }
    channelCache = { general, resources };
    return channelCache;
  }

  async function ensureMembership(userId: string): Promise<void> {
    const { general, resources } = await loadChannelIds();
    // Upsert with ignoreDuplicates — the UNIQUE (channel_id, user_id) index
    // on channel_members gives us ON CONFLICT DO NOTHING semantics.
    const { error } = await client.from('channel_members').upsert(
      [
        { channel_id: general, user_id: userId },
        { channel_id: resources, user_id: userId },
      ],
      { onConflict: 'channel_id,user_id', ignoreDuplicates: true },
    );
    if (error) {
      throw new Error(`Failed to insert channel membership: ${error.message}`);
    }
  }

  async function resolve(authorDisplay: string): Promise<string> {
    const normalized = authorDisplay.trim().toLowerCase();
    const cached = cache.get(normalized);
    if (cached) return cached;

    // 1a. Look for an existing profile by exact display_name (case-insensitive).
    //     This matches real Magic Brooms users.
    let { data: existing, error: lookupErr } = await client
      .from('profiles')
      .select('id, display_name, role')
      .ilike('display_name', authorDisplay.trim())
      .maybeSingle();
    if (lookupErr) throw new Error(`Profile lookup failed: ${lookupErr.message}`);

    // 1b. Also look for a previously-imported ghost (display_name ends with " (imported)").
    //     This matches ghosts created on a prior run, making the resolver idempotent.
    if (!existing) {
      const { data: imported, error: importedErr } = await client
        .from('profiles')
        .select('id, display_name, role')
        .ilike('display_name', `${authorDisplay.trim()} (imported)`)
        .maybeSingle();
      if (importedErr) throw new Error(`Profile imported lookup failed: ${importedErr.message}`);
      if (imported) existing = imported;
    }

    if (existing) {
      cache.set(normalized, existing.id);
      matched += 1;
      await ensureMembership(existing.id);
      return existing.id;
    }

    // 2. Create a ghost user via the admin API.
    const slug = slugifyDisplayName(authorDisplay);
    const email = `imported+${slug}@magic-brooms.local`;
    const password = randomBytes(48).toString('base64'); // 64 chars, thrown away
    const { data: createdData, error: createErr } = await client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: 'google-meet-email', imported: true },
    });
    if (createErr || !createdData?.user) {
      throw new Error(`Failed to create ghost user for ${authorDisplay}: ${createErr?.message}`);
    }
    const userId = createdData.user.id;

    // 3. Update the auto-created profile: display_name + role.
    const role = instructorSet.has(normalized) ? 'instructor' : 'student';
    const { error: updateErr } = await client
      .from('profiles')
      .update({ display_name: `${authorDisplay.trim()} (imported)`, role })
      .eq('id', userId);
    if (updateErr) throw new Error(`Failed to update profile for ${authorDisplay}: ${updateErr.message}`);

    cache.set(normalized, userId);
    created += 1;
    await ensureMembership(userId);
    return userId;
  }

  return {
    resolve,
    stats: () => ({ created, matched }),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run from `bmad/app/`:

```bash
npx vitest run scripts/ingest/writer/ghost-users.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/writer/ghost-users.ts bmad/app/scripts/ingest/writer/ghost-users.test.ts
git commit -m "feat(bmad): ghost user resolver for Meet chat ingest"
```

---

## Task 10: Session thread root creation

**Files:**
- Create: `bmad/app/scripts/ingest/writer/session-roots.ts`

**Rules (spec §5):**
- For each distinct `session_date`, create (or reuse) one root message in `#general` authored by the "Meet Archive (imported)" ghost user.
- `content = "📅 Meet chat — <pretty date> session"`.
- `created_at = minEntryInstant - 1 second`.
- Before creating, look up `message_imports` for an existing root: `source = 'google-meet-email-root' AND session_date = <date>`. Reuse if found.
- On create, insert a provenance row with `source = 'google-meet-email-root'`, `message_id = <new root id>`, `original_author_raw = 'Meet Archive'`, `original_timestamp_raw = 'session root'`, and a fingerprint of `'session-root|<date>'`.

- [ ] **Step 1: Write `session-roots.ts`**

Create `bmad/app/scripts/ingest/writer/session-roots.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

export type SessionRootsConfig = {
  importBatchId: string;
  ingestBotUserId: string;
  generalChannelId: string;
};

export type SessionRootResolver = {
  ensure(sessionDate: string, earliestEntryIso: string): Promise<string>;
  stats(): { created: number; reused: number };
};

const ROOT_SOURCE = 'google-meet-email-root';

export function makeSessionRootResolver(
  client: SupabaseClient,
  config: SessionRootsConfig,
): SessionRootResolver {
  const cache = new Map<string, string>(); // session_date → message_id
  let created = 0;
  let reused = 0;

  async function ensure(sessionDate: string, earliestEntryIso: string): Promise<string> {
    const cached = cache.get(sessionDate);
    if (cached) return cached;

    // Look for an existing root via provenance.
    const { data: existing, error: lookupErr } = await client
      .from('message_imports')
      .select('message_id')
      .eq('source', ROOT_SOURCE)
      .eq('session_date', sessionDate)
      .maybeSingle();
    if (lookupErr) throw new Error(`Root lookup failed for ${sessionDate}: ${lookupErr.message}`);

    if (existing?.message_id) {
      cache.set(sessionDate, existing.message_id);
      reused += 1;
      return existing.message_id;
    }

    // Create the root message.
    const anchor = new Date(earliestEntryIso);
    const rootInstant = new Date(anchor.getTime() - 1000);
    const pretty = formatPrettyDate(sessionDate);
    const content = `📅 Meet chat — ${pretty} session`;

    const { data: msgData, error: msgErr } = await client
      .from('messages')
      .insert({
        channel_id: config.generalChannelId,
        user_id: config.ingestBotUserId,
        content,
        created_at: rootInstant.toISOString(),
        parent_id: null,
      })
      .select('id')
      .single();
    if (msgErr || !msgData) throw new Error(`Root message insert failed: ${msgErr?.message}`);

    // Provenance row for the root.
    const fingerprint = createHash('sha256').update(`session-root|${sessionDate}`).digest('hex');
    const { error: provErr } = await client.from('message_imports').insert({
      message_id: msgData.id,
      gallery_card_id: null,
      source: ROOT_SOURCE,
      session_date: sessionDate,
      original_author_raw: 'Meet Archive',
      original_timestamp_raw: 'session root',
      source_fingerprint: fingerprint,
      import_batch_id: config.importBatchId,
    });
    if (provErr) throw new Error(`Root provenance insert failed: ${provErr.message}`);

    cache.set(sessionDate, msgData.id);
    created += 1;
    return msgData.id;
  }

  return {
    ensure,
    stats: () => ({ created, reused }),
  };
}

/**
 * "2026-03-24" → "Mar 24, 2026"
 */
function formatPrettyDate(sessionDate: string): string {
  const [y, m, d] = sessionDate.split('-').map(Number);
  const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
  return `${monthName} ${d}, ${y}`;
}
```

- [ ] **Step 2: Verify it compiles**

Run from `bmad/app/`:

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/writer/session-roots.ts
git commit -m "feat(bmad): idempotent session thread root resolver"
```

---

## Task 11: Fingerprint helper + message insert with provenance

**Files:**
- Create: `bmad/app/scripts/ingest/writer/fingerprint.ts`
- Create: `bmad/app/scripts/ingest/writer/fingerprint.test.ts`
- Create: `bmad/app/scripts/ingest/writer/messages.ts`

**Rules (spec §3, §5):**
- Fingerprint = `sha256(source | session_date | author_raw | timestamp_raw | sha256(content))`.
- Same inputs → same hash. Different content → different hash.
- Message insert: create the row in `messages`, then insert provenance pointing at the new message id. On `source_fingerprint` conflict, skip.

- [ ] **Step 1: Write the failing fingerprint tests**

Create `bmad/app/scripts/ingest/writer/fingerprint.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeSourceFingerprint } from './fingerprint';

describe('computeSourceFingerprint', () => {
  it('is deterministic for the same inputs', () => {
    const a = computeSourceFingerprint({
      source: 'google-meet-email',
      sessionDate: '2026-03-24',
      authorRaw: 'Danny Bauman (via Meet)',
      timestampRaw: 'Mar 24, 3:17 PM',
      content: 'supabase.com',
    });
    const b = computeSourceFingerprint({
      source: 'google-meet-email',
      sessionDate: '2026-03-24',
      authorRaw: 'Danny Bauman (via Meet)',
      timestampRaw: 'Mar 24, 3:17 PM',
      content: 'supabase.com',
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs when content differs', () => {
    const a = computeSourceFingerprint({
      source: 'google-meet-email',
      sessionDate: '2026-03-24',
      authorRaw: 'Danny Bauman (via Meet)',
      timestampRaw: 'Mar 24, 3:17 PM',
      content: 'foo',
    });
    const b = computeSourceFingerprint({
      source: 'google-meet-email',
      sessionDate: '2026-03-24',
      authorRaw: 'Danny Bauman (via Meet)',
      timestampRaw: 'Mar 24, 3:17 PM',
      content: 'bar',
    });
    expect(a).not.toBe(b);
  });

  it('differs when timestamp differs', () => {
    const a = computeSourceFingerprint({
      source: 'google-meet-email',
      sessionDate: '2026-03-24',
      authorRaw: 'Danny Bauman (via Meet)',
      timestampRaw: 'Mar 24, 3:17 PM',
      content: 'foo',
    });
    const b = computeSourceFingerprint({
      source: 'google-meet-email',
      sessionDate: '2026-03-24',
      authorRaw: 'Danny Bauman (via Meet)',
      timestampRaw: 'Mar 24, 3:18 PM',
      content: 'foo',
    });
    expect(a).not.toBe(b);
  });
});
```

- [ ] **Step 2: Run to verify fail**

```bash
npx vitest run scripts/ingest/writer/fingerprint.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the fingerprint helper**

Create `bmad/app/scripts/ingest/writer/fingerprint.ts`:

```ts
import { createHash } from 'node:crypto';

export type FingerprintInput = {
  source: string;
  sessionDate: string;
  authorRaw: string;
  timestampRaw: string;
  content: string;
};

export function computeSourceFingerprint(input: FingerprintInput): string {
  const contentHash = createHash('sha256').update(input.content).digest('hex');
  return createHash('sha256')
    .update(
      [input.source, input.sessionDate, input.authorRaw, input.timestampRaw, contentHash].join('|'),
    )
    .digest('hex');
}
```

- [ ] **Step 4: Run the fingerprint tests to verify pass**

```bash
npx vitest run scripts/ingest/writer/fingerprint.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Implement `messages.ts`**

Create `bmad/app/scripts/ingest/writer/messages.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedEntry } from '../types';
import { computeSourceFingerprint } from './fingerprint';

export type MessageWriterConfig = {
  source: string;
  importBatchId: string;
  generalChannelId: string;
};

export type MessageWriteResult = 'inserted' | 'skipped';

/**
 * Insert a threaded reply into #general under the given session root.
 * Also writes a provenance row. Idempotent via source_fingerprint.
 */
export async function insertMessageWithProvenance(
  client: SupabaseClient,
  entry: ParsedEntry,
  params: {
    userId: string;
    sessionRootId: string;
    config: MessageWriterConfig;
  },
): Promise<MessageWriteResult> {
  const fingerprint = computeSourceFingerprint({
    source: params.config.source,
    sessionDate: entry.session_date,
    authorRaw: entry.author_raw,
    timestampRaw: entry.timestamp_raw,
    content: entry.content,
  });

  // Short-circuit: if fingerprint already exists, skip.
  const { data: existing, error: lookupErr } = await client
    .from('message_imports')
    .select('id')
    .eq('source_fingerprint', fingerprint)
    .maybeSingle();
  if (lookupErr) throw new Error(`Provenance lookup failed: ${lookupErr.message}`);
  if (existing) return 'skipped';

  // Insert message.
  const { data: msgData, error: msgErr } = await client
    .from('messages')
    .insert({
      channel_id: params.config.generalChannelId,
      user_id: params.userId,
      content: entry.content,
      created_at: entry.timestamp_resolved,
      parent_id: params.sessionRootId,
    })
    .select('id')
    .single();
  if (msgErr || !msgData) throw new Error(`Message insert failed: ${msgErr?.message}`);

  // Insert provenance.
  const { error: provErr } = await client.from('message_imports').insert({
    message_id: msgData.id,
    gallery_card_id: null,
    source: params.config.source,
    session_date: entry.session_date,
    original_author_raw: entry.author_raw,
    original_timestamp_raw: entry.timestamp_raw,
    source_fingerprint: fingerprint,
    import_batch_id: params.config.importBatchId,
  });
  if (provErr) throw new Error(`Provenance insert failed: ${provErr.message}`);

  return 'inserted';
}
```

- [ ] **Step 6: Verify it compiles**

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/writer/fingerprint.ts bmad/app/scripts/ingest/writer/fingerprint.test.ts bmad/app/scripts/ingest/writer/messages.ts
git commit -m "feat(bmad): fingerprint helper and idempotent message insert"
```

---

## Task 12: Gallery card insert with URL dedupe

**Files:**
- Create: `bmad/app/scripts/ingest/writer/gallery-cards.ts`

**Rules (spec §5):**
- Normalize URL: lowercase host, strip trailing `/`, preserve path/query/fragment.
- Look up existing `gallery_cards` row in `#resources` by normalized `link`. If found → skip insert, still write provenance pointing at the existing card id. If not → create card.
- `title` = `preview_title` if present; else humanized `host + path`.
- `description` = `Shared by <author_display> on <pretty session_date>`.

- [ ] **Step 1: Write `gallery-cards.ts`**

Create `bmad/app/scripts/ingest/writer/gallery-cards.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedEntry } from '../types';
import { computeSourceFingerprint } from './fingerprint';

export type GalleryCardWriterConfig = {
  source: string;
  importBatchId: string;
  resourcesChannelId: string;
};

export type GalleryCardWriteResult = 'inserted' | 'deduped' | 'skipped';

export async function insertOrReuseGalleryCard(
  client: SupabaseClient,
  entry: ParsedEntry,
  params: {
    userId: string;
    config: GalleryCardWriterConfig;
  },
): Promise<GalleryCardWriteResult> {
  if (entry.kind !== 'link') {
    throw new Error(`insertOrReuseGalleryCard called with non-link entry (kind=${entry.kind})`);
  }

  const normalizedUrl = normalizeUrl(entry.content);

  const fingerprint = computeSourceFingerprint({
    source: params.config.source,
    sessionDate: entry.session_date,
    authorRaw: entry.author_raw,
    timestampRaw: entry.timestamp_raw,
    content: normalizedUrl,
  });

  // Short-circuit: already processed this exact (author+timestamp+url) before.
  const { data: existingProv, error: provLookupErr } = await client
    .from('message_imports')
    .select('id')
    .eq('source_fingerprint', fingerprint)
    .maybeSingle();
  if (provLookupErr) throw new Error(`Gallery provenance lookup failed: ${provLookupErr.message}`);
  if (existingProv) return 'skipped';

  // Look for an existing card with this URL in #resources.
  const { data: existingCard, error: cardLookupErr } = await client
    .from('gallery_cards')
    .select('id')
    .eq('channel_id', params.config.resourcesChannelId)
    .eq('link', normalizedUrl)
    .maybeSingle();
  if (cardLookupErr) throw new Error(`Gallery card lookup failed: ${cardLookupErr.message}`);

  let cardId: string;
  let result: GalleryCardWriteResult;
  if (existingCard) {
    cardId = existingCard.id;
    result = 'deduped';
  } else {
    const title = entry.preview_title ?? humanizeUrl(normalizedUrl);
    const description = `Shared by ${entry.author_display} on ${prettyDate(entry.session_date)}`;
    const { data: newCard, error: cardErr } = await client
      .from('gallery_cards')
      .insert({
        channel_id: params.config.resourcesChannelId,
        user_id: params.userId,
        image_url: null,
        title,
        description,
        link: normalizedUrl,
        created_at: entry.timestamp_resolved,
      })
      .select('id')
      .single();
    if (cardErr || !newCard) throw new Error(`Gallery card insert failed: ${cardErr?.message}`);
    cardId = newCard.id;
    result = 'inserted';
  }

  // Provenance row (always, for both insert and dedupe).
  const { error: provErr } = await client.from('message_imports').insert({
    message_id: null,
    gallery_card_id: cardId,
    source: params.config.source,
    session_date: entry.session_date,
    original_author_raw: entry.author_raw,
    original_timestamp_raw: entry.timestamp_raw,
    source_fingerprint: fingerprint,
    import_batch_id: params.config.importBatchId,
  });
  if (provErr) throw new Error(`Gallery provenance insert failed: ${provErr.message}`);

  return result;
}

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hostname = u.hostname.toLowerCase();
    let out = u.toString();
    // Strip trailing slash on path (but not if path is just "/").
    if (out.endsWith('/') && u.pathname !== '/') {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return raw.trim();
  }
}

function humanizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname.replace(/\/$/, '');
    return path ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

function prettyDate(sessionDate: string): string {
  const [y, m, d] = sessionDate.split('-').map(Number);
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1];
  return `${month} ${d}, ${y}`;
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/writer/gallery-cards.ts
git commit -m "feat(bmad): gallery card writer with URL dedupe"
```

---

## Task 13: Top-level writer orchestrator

**Files:**
- Create: `bmad/app/scripts/ingest/writer/write-entries.ts`

- [ ] **Step 1: Write the orchestrator**

Create `bmad/app/scripts/ingest/writer/write-entries.ts`:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedEntry, WriterConfig, ImportStats } from '../types';
import { makeGhostUserResolver } from './ghost-users';
import { makeSessionRootResolver } from './session-roots';
import { insertMessageWithProvenance } from './messages';
import { insertOrReuseGalleryCard } from './gallery-cards';

/**
 * Orchestrate the full ingest:
 *   1. Resolve channel ids for #general and #resources.
 *   2. Resolve the ingest-bot ghost user (owns session roots).
 *   3. For each unique author, resolve/create a ghost user.
 *   4. For each unique session_date, ensure a thread root.
 *   5. For each entry: insert message (under root) or upsert gallery card.
 *
 * Returns ImportStats. Does NOT touch the DB when config.dryRun is true —
 * instead returns a synthetic stats object with zero "created" counts and
 * the write plan printed to stdout.
 */
export async function writeEntries(
  client: SupabaseClient,
  entries: ParsedEntry[],
  config: WriterConfig,
): Promise<ImportStats> {
  if (config.dryRun) {
    return dryRun(entries);
  }

  // 1. Channel ids.
  const { data: channelData, error: channelErr } = await client
    .from('channels')
    .select('id, name')
    .in('name', ['general', 'resources']);
  if (channelErr) throw new Error(`Channel lookup failed: ${channelErr.message}`);
  const channelByName = new Map<string, string>();
  for (const row of channelData ?? []) channelByName.set(row.name as string, row.id as string);
  const generalChannelId = channelByName.get('general');
  const resourcesChannelId = channelByName.get('resources');
  if (!generalChannelId || !resourcesChannelId) {
    throw new Error('Seed channels #general and #resources must exist');
  }

  // 2. Ghost user resolver (the ingest bot is just another ghost user).
  const resolver = makeGhostUserResolver(client, {
    instructorDisplayNames: config.instructorDisplayNames,
  });
  const ingestBotUserId = await resolver.resolve('Meet Archive');

  // 3. Session root resolver.
  const rootResolver = makeSessionRootResolver(client, {
    importBatchId: config.importBatchId,
    ingestBotUserId,
    generalChannelId,
  });

  // 4. Pre-compute earliest instant per session_date for root anchoring.
  const earliestBySession = new Map<string, string>();
  for (const entry of entries) {
    const prev = earliestBySession.get(entry.session_date);
    if (!prev || entry.timestamp_resolved < prev) {
      earliestBySession.set(entry.session_date, entry.timestamp_resolved);
    }
  }

  let messagesInserted = 0;
  let messagesSkipped = 0;
  let galleryCardsInserted = 0;
  let galleryCardsDeduped = 0;

  for (const entry of entries) {
    const userId = await resolver.resolve(entry.author_display);

    if (entry.kind === 'link') {
      const result = await insertOrReuseGalleryCard(client, entry, {
        userId,
        config: {
          source: config.source,
          importBatchId: config.importBatchId,
          resourcesChannelId,
        },
      });
      if (result === 'inserted') galleryCardsInserted += 1;
      else if (result === 'deduped') galleryCardsDeduped += 1;
      continue;
    }

    // Message: ensure its session root exists first.
    const earliest = earliestBySession.get(entry.session_date);
    if (!earliest) throw new Error(`No earliest timestamp for ${entry.session_date}`);
    const rootId = await rootResolver.ensure(entry.session_date, earliest);

    const result = await insertMessageWithProvenance(client, entry, {
      userId,
      sessionRootId: rootId,
      config: {
        source: config.source,
        importBatchId: config.importBatchId,
        generalChannelId,
      },
    });
    if (result === 'inserted') messagesInserted += 1;
    else messagesSkipped += 1;
  }

  const ghostStats = resolver.stats();
  const rootStats = rootResolver.stats();
  return {
    ghostUsersCreated: ghostStats.created,
    ghostUsersMatched: ghostStats.matched,
    sessionRootsCreated: rootStats.created,
    sessionRootsReused: rootStats.reused,
    messagesInserted,
    messagesSkipped,
    galleryCardsInserted,
    galleryCardsDeduped,
    provenanceRows:
      messagesInserted + galleryCardsInserted + galleryCardsDeduped + rootStats.created,
  };
}

function dryRun(entries: ParsedEntry[]): ImportStats {
  console.log('--- DRY RUN ---');
  const authors = new Set<string>();
  const sessions = new Set<string>();
  let messages = 0;
  let links = 0;
  for (const e of entries) {
    authors.add(e.author_display);
    sessions.add(e.session_date);
    if (e.kind === 'message') messages += 1;
    else links += 1;
    console.log(
      `[${e.session_date} ${e.timestamp_resolved}] ${e.author_display} (${e.kind}): ${
        e.content.length > 80 ? e.content.slice(0, 77) + '...' : e.content
      }`,
    );
  }
  console.log('--- DRY RUN SUMMARY ---');
  console.log(`Authors: ${authors.size}`);
  console.log(`Sessions: ${sessions.size}`);
  console.log(`Messages: ${messages}`);
  console.log(`Links: ${links}`);
  return {
    ghostUsersCreated: 0,
    ghostUsersMatched: 0,
    sessionRootsCreated: 0,
    sessionRootsReused: 0,
    messagesInserted: 0,
    messagesSkipped: 0,
    galleryCardsInserted: 0,
    galleryCardsDeduped: 0,
    provenanceRows: 0,
  };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/writer/write-entries.ts
git commit -m "feat(bmad): writeEntries orchestrator for Meet chat ingest"
```

---

## Task 14: CLI entrypoint

**Files:**
- Create: `bmad/app/scripts/ingest/ingest-meet-chat.ts`

- [ ] **Step 1: Write the entrypoint**

Create `bmad/app/scripts/ingest/ingest-meet-chat.ts`:

```ts
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAdminClient } from './admin-supabase';
import { parseMeetEmail } from './parse-meet-email';
import { writeEntries } from './writer/write-entries';
import type { WriterConfig } from './types';

// Hardcoded inputs for the 2026-04-09 backfill. If you run this again for a
// different email, change these constants or extract them to CLI flags.
const INPUT_FILE = '2026-04-09-dan-meet-chat-email.txt';
const EMAIL_SENT_AT = new Date('2026-04-09T20:14:00-07:00');
const IMPORT_BATCH_ID = '2026-04-09-backfill';
const INSTRUCTOR_DISPLAY_NAMES = ['Danny Bauman', 'Dan Hahn'] as const;

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const inputPath = join(scriptDir, 'inputs', INPUT_FILE);
  const source = readFileSync(inputPath, 'utf8');
  const entries = parseMeetEmail(source, EMAIL_SENT_AT);

  console.log(`Parsed ${entries.length} entries from ${INPUT_FILE}`);

  const config: WriterConfig = {
    source: 'google-meet-email',
    importBatchId: IMPORT_BATCH_ID,
    instructorDisplayNames: INSTRUCTOR_DISPLAY_NAMES,
    dryRun,
  };

  const client = dryRun
    ? (null as unknown as ReturnType<typeof createAdminClient>)
    : createAdminClient();

  // In dry-run mode, writeEntries() does not touch the client — safe to pass null.
  const stats = await writeEntries(client, entries, config);

  console.log('\n=== Ingest Summary ===');
  console.log(`Batch id: ${IMPORT_BATCH_ID}${dryRun ? ' (DRY RUN — no rows written)' : ''}`);
  console.log(`Ghost users created: ${stats.ghostUsersCreated}`);
  console.log(`Ghost users matched: ${stats.ghostUsersMatched}`);
  console.log(`Session roots created: ${stats.sessionRootsCreated}`);
  console.log(`Session roots reused: ${stats.sessionRootsReused}`);
  console.log(`Messages inserted: ${stats.messagesInserted}`);
  console.log(`Messages skipped (fingerprint): ${stats.messagesSkipped}`);
  console.log(`Gallery cards inserted: ${stats.galleryCardsInserted}`);
  console.log(`Gallery cards deduped: ${stats.galleryCardsDeduped}`);
  console.log(`Provenance rows: ${stats.provenanceRows}`);
}

main().catch((err) => {
  console.error('Ingest failed:', err);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc -p tsconfig.node.json --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add bmad/app/scripts/ingest/ingest-meet-chat.ts
git commit -m "feat(bmad): CLI entrypoint for Meet chat ingest"
```

---

## Task 15: Dry-run against real input, then live import

**Files:**
- None (runtime verification only)

- [ ] **Step 1: Ensure Supabase is running locally**

Run from `bmad/app/`:

```bash
npx supabase status
```

Expected: all services show `Started`. If not, run `npx supabase start` first.

- [ ] **Step 2: Verify `.env.local` has required values**

Check that `bmad/app/.env.local` contains all three:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<value from `npx supabase status`>
SUPABASE_SERVICE_ROLE_KEY=<value from `npx supabase status`>
```

Grab the service role key from `npx supabase status` output (labeled `service_role key`). If missing, add the line.

- [ ] **Step 3: Run the dry-run**

```bash
npm run ingest:meet-chat:dry-run
```

Expected output:
- `Parsed N entries from 2026-04-09-dan-meet-chat-email.txt`
- `--- DRY RUN ---` followed by one line per entry
- `--- DRY RUN SUMMARY ---` with non-zero Authors, Sessions, Messages, Links counts
- `=== Ingest Summary ===` at the very end with `(DRY RUN — no rows written)` annotation

Eyeball the per-entry lines:
- Authors should be correctly extracted (no `(via Meet)` leaking into the display name)
- Dates should cover all 7 sessions (2026-03-24, 2026-03-26, 2026-03-31, 2026-04-01, 2026-04-02, 2026-04-07, 2026-04-09)
- Link entries should have URLs as content; message entries should have prose/commands

If anything looks wrong, stop and fix the parser before proceeding.

- [ ] **Step 4: Run the live import**

```bash
npm run ingest:meet-chat
```

Expected output: the same parsed count, followed by the real summary with:
- `Ghost users created: ~6-7` (Danny, Dan, Dillon, Damon, David, Melissa, wtswill, Meet Archive — minus any that already exist)
- `Session roots created: 7`
- `Messages inserted: N` (non-zero)
- `Gallery cards inserted: M` (non-zero)
- `Messages skipped (fingerprint): 0`
- `Gallery cards deduped: 0` on the first run; larger than 0 if any URLs repeat across sessions

- [ ] **Step 5: Sanity check by querying the DB**

Run from `bmad/app/`:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT session_date, COUNT(*)
FROM message_imports
WHERE import_batch_id = '2026-04-09-backfill'
GROUP BY session_date
ORDER BY session_date;
"
```

Expected: 7 rows, one per session date, with non-zero counts.

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
SELECT p.display_name, COUNT(*) AS messages
FROM messages m
JOIN profiles p ON p.id = m.user_id
JOIN message_imports mi ON mi.message_id = m.id
WHERE mi.import_batch_id = '2026-04-09-backfill'
GROUP BY p.display_name
ORDER BY messages DESC;
"
```

Expected: display names all end with `(imported)`, counts look reasonable.

- [ ] **Step 6: Verify in the running app**

Start the dev server in a separate terminal:

```bash
npm run dev
```

Open `http://localhost:5173`, log in as an instructor, and check:
- `#general` has 7 new root messages authored by `Meet Archive (imported)`, one per session date
- Clicking a root opens its thread with the per-session entries
- `#resources` shows gallery cards for each shared link
- Hovering/clicking an imported message shows the correct `(imported)` author

If the live app view is broken, run idempotency rollback (spec §8) and re-run after a fix:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "
DELETE FROM messages WHERE id IN (
  SELECT message_id FROM message_imports WHERE import_batch_id = '2026-04-09-backfill' AND message_id IS NOT NULL
);
DELETE FROM gallery_cards WHERE id IN (
  SELECT gallery_card_id FROM message_imports WHERE import_batch_id = '2026-04-09-backfill' AND gallery_card_id IS NOT NULL
);
"
```

- [ ] **Step 7: Re-run the ingest to prove idempotency**

```bash
npm run ingest:meet-chat
```

Expected summary:
- `Messages inserted: 0`
- `Gallery cards inserted: 0`
- `Messages skipped (fingerprint): N` (same N as the first run)
- `Session roots reused: 7`
- `Ghost users matched: ~7` (all existing now)

No duplicate rows created.

- [ ] **Step 8: Run the full test suite to make sure nothing broke**

```bash
npm run test && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 9: Commit any incidental fixes from verification**

If you fixed anything during verification, commit those fixes as small, focused commits before moving on.

---

## Task 16: Devlog entry

**Files:**
- Create: `devlog/bmad-010-meet-chat-backfill.md`
- Modify: `devlog/README.md`

**Note on numbering:** before writing the file, check existing `bmad-NNN` entries to pick the next number. The spec assumes `bmad-010` (the most recent `bmad-*` in the repo is `bmad-009-profile-image-and-architecture-fixes.md`). If a higher number has landed in the meantime, use it instead.

- [ ] **Step 1: Write the devlog entry**

Create `devlog/bmad-010-meet-chat-backfill.md`:

```markdown
# bmad-010: Meet Chat Backfill Ingest

**Date:** 2026-04-09

## What was completed

Ingested Dan Hahn's copy-pasted Google Meet chat history (Mar 24 → Apr 9 2026,
7 class sessions, 7 attendees) into Magic Brooms as real messages and gallery
cards. The import is attribution-preserving, timestamp-accurate, and re-runnable.

- New migration `00012_create_message_imports.sql` introduces a sidecar
  provenance table with a `source_fingerprint UNIQUE` constraint for idempotency.
- New reusable pipeline under `bmad/app/scripts/ingest/`:
  - `parse-meet-email.ts` — source-specific parser for Gmail-copy-paste chat dumps
  - `resolve-timestamp.ts` — resolves full-date, weekday-only, and bare-time formats to PT
  - `writer/` — reusable writer (ghost users, session roots, messages, gallery cards)
  - `ingest-meet-chat.ts` — CLI entrypoint with `--dry-run` support
- 7 "ghost" user accounts created for Meet attendees (display names suffixed with
  "(imported)"), one "Meet Archive" bot user to own session thread roots.
- 7 session root messages in `#general`, each with per-session entries threaded underneath.
- N gallery cards in `#resources` deduped by normalized URL.

## Key decisions

- **Parser / writer split.** Email-specific logic lives in `parse-meet-email.ts`;
  the writer consumes a neutral `ParsedEntry[]`. A future "better way" (Gmail API,
  Meet Side Panel extension) can swap in a new parser and reuse the writer unchanged.
- **Ghost users over single bot.** Imported messages keep real attribution (avatars,
  mentions, click-through) rather than being prefixed into one bot account.
- **Sidecar provenance table** over JSONB column on `messages`. Keeps the core
  schema clean; per-source metadata lives in one dedicated place.
- **Link extraction (L1 rule).** URL-only lines become gallery cards; URLs embedded
  in commands or prose stay in their message, routed to `#general`.
- **Idempotent via fingerprint.** sha256 over `source | session_date | author_raw |
  timestamp_raw | sha256(content)` gives a stable key; re-runs are a no-op.

## Time / effort observations

- Brainstorming phase: clarifying questions covered scope, channel routing, user
  attribution, timestamp rules, link extraction, and idempotency before any code.
- The clean parser / writer boundary was the highest-leverage design decision —
  testing, dry-run, and the future pipeline all depended on it.
- The dry-run mode paid for itself immediately — first real run needed no rollback.

## What's next

- The "better way" for future sessions: look into Gmail API or a Meet Side Panel
  extension that captures chat live during a session, feeding the existing writer.
- Consider adding an "Imported" filter or badge to the channel header so viewers
  can distinguish live class conversation from backfilled history at a glance.
```

- [ ] **Step 2: Update `devlog/README.md`**

Add a line under the BMAD section of `devlog/README.md` for the new entry. Read the file first to find the correct spot:

```bash
grep -n bmad- /Users/Danny/Source/magic-broom-chat/devlog/README.md
```

Append a new entry in the same format as `bmad-009`:

```markdown
- [bmad-010-meet-chat-backfill.md](bmad-010-meet-chat-backfill.md) — Ingested Google Meet chat history as messages/cards with ghost users and provenance
```

- [ ] **Step 3: Commit**

```bash
cd /Users/Danny/Source/magic-broom-chat
git add devlog/bmad-010-meet-chat-backfill.md devlog/README.md
git commit -m "docs(devlog): bmad-010 Meet chat backfill ingest"
```

---

## Final verification

- [ ] **Run the full test suite one more time**

```bash
cd /Users/Danny/Source/magic-broom-chat/bmad/app
npm run test && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Check git log for a clean history**

```bash
cd /Users/Danny/Source/magic-broom-chat
git log --oneline -20
```

Expected: one focused commit per task, no noise, no mixed concerns.

---

## Appendix: Running the ingest on a fresh machine

For anyone picking this up later:

1. `cd bmad/app && npm install`
2. `npx supabase start`
3. Add `SUPABASE_SERVICE_ROLE_KEY` to `bmad/app/.env.local` (get from `npx supabase status`).
4. `npm run ingest:meet-chat:dry-run` — eyeball output.
5. `npm run ingest:meet-chat` — live run.
6. Verify in `http://localhost:5173`.

Rollback a specific batch:

```sql
DELETE FROM messages
WHERE id IN (
  SELECT message_id FROM message_imports
  WHERE import_batch_id = '<batch-id>' AND message_id IS NOT NULL
);
DELETE FROM gallery_cards
WHERE id IN (
  SELECT gallery_card_id FROM message_imports
  WHERE import_batch_id = '<batch-id>' AND gallery_card_id IS NOT NULL
);
```

Ghost users are intentionally not removed by rollback.
