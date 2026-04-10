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
