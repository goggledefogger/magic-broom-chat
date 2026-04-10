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
    expect((entries[0] as any).preview_title).toBeUndefined();
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
    expect((entries[0] as any).preview_title).toBe('Whisper Flow');
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
