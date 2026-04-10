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
