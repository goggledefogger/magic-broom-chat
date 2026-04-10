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
 * Year is inferred from the email-send date.
 * Timezone is America/Los_Angeles (PT). Handles PST vs PDT for
 * unambiguous times; the ambiguous DST fall-back hour (1–2 AM on the
 * first Sunday of November) is NOT disambiguated — it resolves to PDT.
 * Not a concern for course sessions, which do not occur at that hour.
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
