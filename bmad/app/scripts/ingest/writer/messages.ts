import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedEntry } from '../types';
import { computeSourceFingerprint } from './fingerprint';

export type MessageWriterConfig = {
  source: string;
  importBatchId: string;
  archiveChannelId: string;
};

export type MessageWriteResult = 'inserted' | 'skipped';

/**
 * Insert a threaded reply into #general under the given session root.
 * Also writes a provenance row. Idempotent via source_fingerprint.
 */
export async function insertMessageWithProvenance(
  client: SupabaseClient,
  entry: ParsedEntry,
  params: {
    userId: string;
    sessionRootId: string;
    config: MessageWriterConfig;
  },
): Promise<MessageWriteResult> {
  const fingerprint = computeSourceFingerprint({
    source: params.config.source,
    sessionDate: entry.session_date,
    authorRaw: entry.author_raw,
    timestampRaw: entry.timestamp_raw,
    content: entry.content,
  });

  // Short-circuit: if fingerprint already exists, skip.
  const { data: existing, error: lookupErr } = await client
    .from('message_imports')
    .select('id')
    .eq('source_fingerprint', fingerprint)
    .maybeSingle();
  if (lookupErr) throw new Error(`Provenance lookup failed: ${lookupErr.message}`);
  if (existing) return 'skipped';

  // Insert message.
  const { data: msgData, error: msgErr } = await client
    .from('messages')
    .insert({
      channel_id: params.config.archiveChannelId,
      user_id: params.userId,
      content: entry.content,
      created_at: entry.timestamp_resolved,
      parent_id: params.sessionRootId,
    })
    .select('id')
    .single();
  if (msgErr || !msgData) throw new Error(`Message insert failed: ${msgErr?.message}`);

  // Insert provenance.
  const { error: provErr } = await client.from('message_imports').insert({
    message_id: msgData.id,
    gallery_card_id: null,
    source: params.config.source,
    session_date: entry.session_date,
    original_author_raw: entry.author_raw,
    original_timestamp_raw: entry.timestamp_raw,
    source_fingerprint: fingerprint,
    import_batch_id: params.config.importBatchId,
  });
  if (provErr) throw new Error(`Provenance insert failed: ${provErr.message}`);

  return 'inserted';
}
