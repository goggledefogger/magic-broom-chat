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
