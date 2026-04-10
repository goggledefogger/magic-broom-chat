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
