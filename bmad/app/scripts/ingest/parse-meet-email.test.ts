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
