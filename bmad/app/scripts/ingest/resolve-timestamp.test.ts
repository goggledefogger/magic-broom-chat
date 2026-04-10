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

  it('resolves a weekday-only form matching the send day to 7 days prior (Thu 3:00 PM on a Thursday)', () => {
    // EMAIL_SENT is Thu 2026-04-09; "Thu" must go back 7 days to 2026-04-02, not today.
    const result = resolveTimestamp('Thu 3:00 PM', EMAIL_SENT);
    expect(result.sessionDate).toBe('2026-04-02');
    expect(result.iso).toBe('2026-04-02T15:00:00-07:00');
  });

  it('handles 12:00 PM (noon) correctly', () => {
    const result = resolveTimestamp('Mar 24, 12:00 PM', EMAIL_SENT);
    expect(result.iso).toBe('2026-03-24T12:00:00-07:00');
  });

  it('handles a PST (winter) date correctly', () => {
    const winterSent = new Date('2026-01-15T20:00:00-08:00');
    const result = resolveTimestamp('Jan 15, 3:00 PM', winterSent);
    expect(result.iso).toBe('2026-01-15T15:00:00-08:00');
    expect(result.sessionDate).toBe('2026-01-15');
  });
});
