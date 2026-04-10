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
