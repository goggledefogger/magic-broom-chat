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
